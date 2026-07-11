const { Identity } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');

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
  const { nik, name, height, birthplace, birthdate, address } = req.body;
  try {
    const identity = await Identity.create({
      id_user: req.user.id,
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
