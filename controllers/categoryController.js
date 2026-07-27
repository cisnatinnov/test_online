const { Category } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { parsePagination, paginateResponse } = require('../utils/pagination');

exports.getCategories = async (req, res) => {
  const { type } = req.query;
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = type ? { type } : {};
    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'categories' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createCategory = async (req, res) => {
  const { name, type } = req.body;
  try {
    if (!name || !type) {
      return apiResponse(res, { error: 'name and type are required', status: 400 });
    }
    if (!['spending', 'saving'].includes(type)) {
      return apiResponse(res, { error: 'type must be spending or saving', status: 400 });
    }
    const existing = await Category.findOne({ where: { name: name.trim(), type } });
    if (existing) {
      return apiResponse(res, { error: 'Category already exists', status: 409 });
    }
    const category = await Category.create({ name: name.trim(), type });
    return apiResponse(res, { data: category });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return apiResponse(res, { error: 'Category already exists', status: 409 });
    }
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    if (!name) {
      return apiResponse(res, { error: 'name is required', status: 400 });
    }
    const category = await Category.findByPk(id);
    if (!category) {
      return apiResponse(res, { error: 'Category not found', status: 404 });
    }
    const existing = await Category.findOne({ where: { name: name.trim(), type: category.type } });
    if (existing && existing.id !== Number(id)) {
      return apiResponse(res, { error: 'Category name already exists', status: 409 });
    }
    await category.update({ name: name.trim() });
    return apiResponse(res, { data: category });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return apiResponse(res, { error: 'Category name already exists', status: 409 });
    }
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return apiResponse(res, { error: 'Category not found', status: 404 });
    }
    await category.destroy();
    return apiResponse(res, { data: { message: 'Category deleted' } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
