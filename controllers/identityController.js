const { Identity, User } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { getMailTransporter } = require('../middlewares/mailTransporter');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.getIdentities = async (req, res) => {
  try {
    const identities = await Identity.findAll({ where: getUserIdFilter(req), order: [['id', 'ASC']] });
    return apiResponse(res, { data: identities });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createIdentity = async (req, res) => {
  const { nik, name, height, birthplace, birthdate, address, id_user } = req.body;
  try {
    if (!name) {
      return apiResponse(res, { error: 'Nama wajib diisi', status: 400 });
    }

    const targetUserId = req.user.role === 'admin' && id_user ? id_user : req.user.id;

    const targetUser = await User.findByPk(targetUserId);
    if (!targetUser) {
      return apiResponse(res, { error: 'User tidak ditemukan', status: 404 });
    }

    if (req.user.role !== 'admin' && targetUserId !== req.user.id) {
      return apiResponse(res, { error: 'Tidak memiliki akses', status: 403 });
    }

    const identity = await Identity.create({
      id_user: targetUserId,
      nik: nik || null,
      name,
      height: height ? Number(height) : null,
      birthplace: birthplace || null,
      birthdate: birthdate || null,
      address: address || null,
    });

    const mt = await getMailTransporter();
    if (mt && targetUser.email && targetUser.email.includes('@')) {
      try {
        await mt.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@bmi-app.com',
          to: targetUser.email,
          subject: 'Pasien Baru Terdaftar - BMI App',
          html: `
            <h2>Pasien Baru Terdaftar</h2>
            <p>Halo <b>${targetUser.username}</b>,</p>
            <p>Data pasien baru telah ditambahkan ke akun Anda:</p>
            <ul>
              <li><b>Nama:</b> ${name}</li>
              ${nik ? `<li><b>NIK:</b> ${nik}</li>` : ''}
              ${height ? `<li><b>Tinggi:</b> ${height} cm</li>` : ''}
              ${birthdate ? `<li><b>Tanggal Lahir:</b> ${birthdate}</li>` : ''}
            </ul>
            <p>Silakan login untuk melihat detail data pasien.</p>
          `,
        });
        console.log(`[Mail] Patient registration notification sent to ${targetUser.email}`);
      } catch (mailErr) {
        console.error('[Mail] Failed to send notification:', mailErr.message);
      }
    }

    return apiResponse(res, { data: identity });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateIdentity = async (req, res) => {
  const { id } = req.params;
  const { nik, name, height, birthplace, birthdate, address } = req.body;
  try {
    const where = { id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }

    await identity.update({
      nik: nik || null,
      name,
      height: Number(height),
      birthplace: birthplace || null,
      birthdate: birthdate || null,
      address: address || null,
    });
    return apiResponse(res, { data: identity });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
