const { Identity, User } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { getMailTransporter } = require('../middlewares/mailTransporter');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.getIdentities = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = getUserIdFilter(req);
    const { count, rows } = await Identity.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'identities' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createIdentity = async (req, res) => {
  const { nik, name, height, gender, birthplace, birthdate, address, id_user } = req.body;
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
      gender: gender || null,
      birthplace: birthplace || null,
      birthdate: birthdate || null,
      address: address || null,
    });

    const mt = await getMailTransporter();
    if (mt && targetUser.email && targetUser.email.includes('@')) {
      try {
        await mt.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@vitasuite.com',
          to: targetUser.email,
          subject: 'Pasien Baru Terdaftar - VitaSuite',
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

    return apiResponse(res, { status: 201, data: identity });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateIdentity = async (req, res) => {
  const { id } = req.params;
  const { nik, name, height, gender, birthplace, birthdate, address } = req.body;
  try {
    if (name !== undefined && !String(name).trim()) {
      return apiResponse(res, { error: 'Nama wajib diisi', status: 400 });
    }
    if (nik && !/^\d{1,20}$/.test(nik)) {
      return apiResponse(res, { error: 'NIK harus berisi 1-20 digit angka', status: 400 });
    }
    if (height !== undefined && height !== null && height !== '') {
      const h = Number(height);
      if (!Number.isFinite(h) || h < 1 || h > 300) {
        return apiResponse(res, { error: 'Tinggi harus antara 1 dan 300 cm', status: 400 });
      }
    }
    if (gender && !['Male', 'Female'].includes(gender)) {
      return apiResponse(res, { error: 'Jenis kelamin tidak valid', status: 400 });
    }
    if (birthdate) {
      const d = new Date(birthdate);
      if (isNaN(d.getTime()) || d > new Date()) {
        return apiResponse(res, { error: 'Tanggal lahir tidak valid', status: 400 });
      }
    }

    const where = { id, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }

    const updateData = {};
    if (nik !== undefined) updateData.nik = nik || null;
    if (name !== undefined) updateData.name = name;
    if (height !== undefined) updateData.height = height ? Number(height) : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (birthplace !== undefined) updateData.birthplace = birthplace || null;
    if (birthdate !== undefined) updateData.birthdate = birthdate || null;
    if (address !== undefined) updateData.address = address || null;
    await identity.update(updateData);
    return apiResponse(res, { data: identity });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
