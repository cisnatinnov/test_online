const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, TwoFactorCode, Identity } = require('../models');
const { getMailTransporter } = require('../middlewares/mailTransporter');
const { apiResponse } = require('../middlewares/apiResponse');
const { sendWhatsApp } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-bmi-app-2024';
const JWT_TEMP_SECRET = process.env.JWT_TEMP_SECRET || 'temp-secret-key-2fa-2024';
const SALT_ROUNDS = 10;

const userSafeFields = ['id', 'username', 'email', 'phone', 'role'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  const { username, email, password, phone, nik, name, birthplace, birthdate, height, address } = req.body;
  try {
    if (!username || !email || !password) {
      return apiResponse(res, { error: 'Username, email, dan password harus diisi', status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return apiResponse(res, { error: 'Format email tidak valid', status: 400 });
    }
    if (password.length < 8) {
      return apiResponse(res, { error: 'Password minimal 8 karakter', status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return apiResponse(res, { error: 'Password harus memiliki minimal 1 huruf kapital', status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return apiResponse(res, { error: 'Password harus memiliki minimal 1 huruf kecil', status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return apiResponse(res, { error: 'Password harus memiliki minimal 1 angka', status: 400 });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return apiResponse(res, { error: 'Password harus memiliki minimal 1 simbol', status: 400 });
    }

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      return apiResponse(res, { error: 'Username atau email sudah terdaftar', status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, password: hashedPassword, phone: phone || null, role: 'user' });

    if (name) {
      await Identity.create({
        id_user: user.id,
        nik: nik || null,
        name,
        height: height ? Number(height) : null,
        birthplace: birthplace || null,
        birthdate: birthdate || null,
        address: address || null,
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const userData = {};
    userSafeFields.forEach((f) => { userData[f] = user[f]; });
    return apiResponse(res, { data: { token, user: userData } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return apiResponse(res, { error: 'Username dan password harus diisi', status: 400 });
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
    });
    if (!user) {
      return apiResponse(res, { error: 'Username/email atau password salah', status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return apiResponse(res, { error: 'Username/email atau password salah', status: 401 });
    }

    const tempToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role },
      JWT_TEMP_SECRET,
      { expiresIn: '15m' }
    );

    const channels = ['email'];
    if (user.phone) channels.push('whatsapp');

    return apiResponse(res, { data: { require2fa: true, tempToken, channels } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.send2FA = async (req, res) => {
  const { tempToken, channel = 'email' } = req.body;
  try {
    const decoded = jwt.verify(tempToken, JWT_TEMP_SECRET);
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await TwoFactorCode.create({
      user_id: decoded.id,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
      channel,
    });

    if (channel === 'whatsapp') {
      const phone = decoded.phone;
      if (!phone) {
        return apiResponse(res, { error: 'Nomor telepon tidak tersedia', status: 400 });
      }
      const sent = await sendWhatsApp(phone, code);
      if (sent) {
        return apiResponse(res, { data: { sentTo: phone, channel: 'whatsapp' } });
      }
      console.log(`[2FA] WhatsApp code for ${phone}: ${code}`);
      return apiResponse(res, { data: { sentTo: phone, channel: 'console', code } });
    }

    const mt = await getMailTransporter();
    if (mt && decoded.email && decoded.email.includes('@')) {
      await mt.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@bmi-app.com',
        to: decoded.email,
        subject: 'Kode Verifikasi 2FA - BMI App',
        html: `<h2>Kode Verifikasi 2FA</h2><p>Gunakan kode berikut untuk masuk:</p><h1 style="letter-spacing:5px;font-size:32px;">${code}</h1><p>Kode berlaku 5 menit.</p>`,
      });
      return apiResponse(res, { data: { sentTo: decoded.email, channel: 'email' } });
    }

    console.log(`[2FA] Code for ${decoded.email}: ${code}`);
    return apiResponse(res, { data: { sentTo: decoded.email, channel: 'console', code } });
  } catch (err) {
    console.error('[2FA send-2fa] Error:', err.message);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return apiResponse(res, { error: 'Token tidak valid', status: 400 });
    }
    return apiResponse(res, { error: 'Gagal mengirim kode: ' + err.message, status: 500 });
  }
};

exports.verify2FA = async (req, res) => {
  const { tempToken, code } = req.body;
  try {
    const decoded = jwt.verify(tempToken, JWT_TEMP_SECRET);

    const codeRecord = await TwoFactorCode.findOne({
      where: {
        user_id: decoded.id,
        code,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      order: [['id', 'DESC']],
    });

    if (!codeRecord) {
      return apiResponse(res, { error: 'Kode 2FA tidak valid atau sudah kadaluarsa', status: 401 });
    }

    await codeRecord.update({ used: true });

    const user = await User.findByPk(decoded.id, {
      attributes: userSafeFields,
    });
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const userData = {};
    userSafeFields.forEach((f) => { userData[f] = user[f]; });
    return apiResponse(res, { data: { token, user: userData } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
