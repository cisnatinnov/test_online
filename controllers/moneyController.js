const { Op } = require('sequelize');
const { Expense, Saving } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { user_id: req.user.id };

exports.createExpense = async (req, res) => {
  const { amount, category, description, date } = req.body;
  try {
    if (amount == null || !category) {
      return apiResponse(res, { error: 'amount dan category wajib diisi', status: 400 });
    }
    const expense = await Expense.create({
      user_id: req.user.id,
      amount: Number(amount),
      category,
      description: description || null,
      date: date || new Date(),
    });
    return apiResponse(res, { data: expense });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: getUserIdFilter(req),
      order: [['date', 'DESC'], ['id', 'DESC']],
    });
    return apiResponse(res, { data: expenses });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;
  try {
    const where = { id, ...getUserIdFilter(req) };
    const expense = await Expense.findOne({ where });
    if (!expense) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    await expense.update({
      amount: amount != null ? Number(amount) : expense.amount,
      category: category || expense.category,
      description: description !== undefined ? description : expense.description,
      date: date || expense.date,
    });
    return apiResponse(res, { data: expense });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const where = { id, ...getUserIdFilter(req) };
    const expense = await Expense.findOne({ where });
    if (!expense) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    await expense.destroy();
    return apiResponse(res, { data: { message: 'Berhasil dihapus' } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createSaving = async (req, res) => {
  const { amount, category, description, date } = req.body;
  try {
    if (amount == null || !category) {
      return apiResponse(res, { error: 'amount dan category wajib diisi', status: 400 });
    }
    const saving = await Saving.create({
      user_id: req.user.id,
      amount: Number(amount),
      category,
      description: description || null,
      date: date || new Date(),
    });
    return apiResponse(res, { data: saving });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getSavings = async (req, res) => {
  try {
    const savings = await Saving.findAll({
      where: getUserIdFilter(req),
      order: [['date', 'DESC'], ['id', 'DESC']],
    });
    return apiResponse(res, { data: savings });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateSaving = async (req, res) => {
  const { id } = req.params;
  const { amount, category, description, date } = req.body;
  try {
    const where = { id, ...getUserIdFilter(req) };
    const saving = await Saving.findOne({ where });
    if (!saving) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    await saving.update({
      amount: amount != null ? Number(amount) : saving.amount,
      category: category || saving.category,
      description: description !== undefined ? description : saving.description,
      date: date || saving.date,
    });
    return apiResponse(res, { data: saving });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.deleteSaving = async (req, res) => {
  const { id } = req.params;
  try {
    const where = { id, ...getUserIdFilter(req) };
    const saving = await Saving.findOne({ where });
    if (!saving) {
      return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });
    }
    await saving.destroy();
    return apiResponse(res, { data: { message: 'Berhasil dihapus' } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getChart = async (req, res) => {
  const { period = 'monthly', year } = req.query;
  try {
    const targetYear = year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;
    const userFilter = getUserIdFilter(req);

    const expenses = await Expense.findAll({
      where: { ...userFilter, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });

    const savings = await Saving.findAll({
      where: { ...userFilter, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });

    if (period === 'weekly') {
      const weeks = {};
      expenses.forEach((e) => {
        const d = new Date(e.date);
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
        const key = `Minggu ${weekNum}`;
        if (!weeks[key]) weeks[key] = { label: key, expense: 0, saving: 0 };
        weeks[key].expense += Number(e.amount);
      });
      savings.forEach((s) => {
        const d = new Date(s.date);
        const oneJan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
        const key = `Minggu ${weekNum}`;
        if (!weeks[key]) weeks[key] = { label: key, expense: 0, saving: 0 };
        weeks[key].saving += Number(s.amount);
      });
      return apiResponse(res, { data: Object.values(weeks) });
    }

    if (period === 'yearly') {
      const yearlyData = { expense: 0, saving: 0 };
      expenses.forEach((e) => { yearlyData.expense += Number(e.amount); });
      savings.forEach((s) => { yearlyData.saving += Number(s.amount); });
      return apiResponse(res, { data: [{ label: String(targetYear), ...yearlyData }] });
    }

    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const monthly = months.map((m) => ({ label: m, expense: 0, saving: 0 }));
    expenses.forEach((e) => {
      const monthIdx = new Date(e.date).getMonth();
      monthly[monthIdx].expense += Number(e.amount);
    });
    savings.forEach((s) => {
      const monthIdx = new Date(s.date).getMonth();
      monthly[monthIdx].saving += Number(s.amount);
    });
    return apiResponse(res, { data: monthly });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const userFilter = getUserIdFilter(req);
    const totalExpense = await Expense.sum('amount', { where: userFilter }) || 0;
    const totalSaving = await Saving.sum('amount', { where: userFilter }) || 0;
    const expenseCount = await Expense.count({ where: userFilter });
    const savingCount = await Saving.count({ where: userFilter });

    return apiResponse(res, {
      data: {
        totalExpense: Number(totalExpense),
        totalSaving: Number(totalSaving),
        balance: Number(totalSaving) - Number(totalExpense),
        expenseCount,
        savingCount,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
