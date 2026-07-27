const { Op } = require('sequelize');
const { Expense, Saving } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { parsePagination, paginateResponse } = require('../utils/pagination');

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
    const { page, limit, offset } = parsePagination(req.query);
    const where = getUserIdFilter(req);
    const { count, rows } = await Expense.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'expenses' }) });
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
    const { page, limit, offset } = parsePagination(req.query);
    const where = getUserIdFilter(req);
    const { count, rows } = await Saving.findAndCountAll({
      where,
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'savings' }) });
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

exports.getExpenseCategories = async (req, res) => {
  try {
    const userFilter = getUserIdFilter(req);
    const expenses = await Expense.findAll({ where: userFilter, order: [['date', 'DESC']] });

    const categories = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Lainnya';
      if (!categories[cat]) categories[cat] = { total: 0, count: 0, items: [] };
      categories[cat].total += Number(e.amount);
      categories[cat].count += 1;
      categories[cat].items.push({ id: e.id, amount: Number(e.amount), description: e.description, date: e.date });
    });

    const result = Object.entries(categories).map(([name, data]) => ({
      name, total: data.total, count: data.count, items: data.items,
    })).sort((a, b) => b.total - a.total);

    return apiResponse(res, { data: result });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getSavingCategories = async (req, res) => {
  try {
    const userFilter = getUserIdFilter(req);
    const savings = await Saving.findAll({ where: userFilter, order: [['date', 'DESC']] });

    const categories = {};
    savings.forEach((s) => {
      const cat = s.category || 'Lainnya';
      if (!categories[cat]) categories[cat] = { total: 0, count: 0, items: [] };
      categories[cat].total += Number(s.amount);
      categories[cat].count += 1;
      categories[cat].items.push({ id: s.id, amount: Number(s.amount), description: s.description, date: s.date });
    });

    const result = Object.entries(categories).map(([name, data]) => ({
      name, total: data.total, count: data.count, items: data.items,
    })).sort((a, b) => b.total - a.total);

    return apiResponse(res, { data: result });
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

exports.exportMoneyPDF = async (req, res) => {
  const PDFDocument = require('pdfkit');
  try {
    const { period = 'monthly', date, year, month } = req.query;
    const userFilter = getUserIdFilter(req);
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) - 1 || new Date().getMonth();

    let startDate, endDate, periodLabel;

    if (period === 'daily') {
      const targetDate = date ? new Date(date) : new Date();
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      periodLabel = `Harian - ${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (period === 'weekly') {
      const targetDate = date ? new Date(date) : new Date();
      const dayOfWeek = targetDate.getDay();
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
      endDate = new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59);
      periodLabel = `Mingguan - ${startDate.toLocaleDateString('id-ID')} s/d ${endDate.toLocaleDateString('id-ID')}`;
    } else {
      startDate = new Date(targetYear, targetMonth, 1);
      endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodLabel = `Bulanan - ${months[targetMonth]} ${targetYear}`;
    }

    const expenses = await Expense.findAll({
      where: { ...userFilter, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });

    const savings = await Saving.findAll({
      where: { ...userFilter, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'ASC']],
    });

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalSaving = savings.reduce((sum, s) => sum + Number(s.amount), 0);

    const buildCategoryStats = (items) => {
      const cats = {};
      items.forEach((item) => {
        const cat = item.category || 'Lainnya';
        if (!cats[cat]) cats[cat] = { total: 0, count: 0 };
        cats[cat].total += Number(item.amount);
        cats[cat].count += 1;
      });
      return Object.entries(cats).map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        avg: data.count > 0 ? data.total / data.count : 0,
      })).sort((a, b) => b.avg - a.avg);
    };

    const expenseStats = buildCategoryStats(expenses);
    const savingStats = buildCategoryStats(savings);

    const RED = '#DC3545';
    const GREEN = '#28A745';
    const GRAY = '#666666';

    const formatRp = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-keuangan-${period}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text('Laporan Keuangan', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).text(periodLabel, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(14).text('Ringkasan', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Total Pengeluaran: ${formatRp(totalExpense)}`);
    doc.text(`Total Tabungan: ${formatRp(totalSaving)}`);
    doc.text(`Saldo: ${formatRp(totalSaving - totalExpense)}`);
    doc.moveDown(1);

    const drawCategoryBreakdown = (title, stats) => {
      if (stats.length === 0) return;
      doc.fontSize(14).text(title, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.font('Helvetica-Bold').text(`${'Kategori'.padEnd(25)}${'Jumlah'.padStart(15)}${'Rata-rata'.padStart(15)}${' Transaksi'.padStart(12)}`);
      doc.font('Helvetica');
      const highestAvg = stats[0].avg;
      const lowestAvg = stats[stats.length - 1].avg;
      const allSame = highestAvg === lowestAvg;

      for (const s of stats) {
        let color = GRAY;
        let tag = '';
        if (!allSame && stats.length > 1) {
          if (s.avg === highestAvg) { color = RED; tag = ' (Tertinggi)'; }
          else if (s.avg === lowestAvg) { color = GREEN; tag = ' (Terendah)'; }
        }
        const line = `${s.name.padEnd(25)}${formatRp(s.total).padStart(15)}${formatRp(Math.round(s.avg)).padStart(15)}${String(s.count).padStart(10)}`;
        doc.fillColor(color).text(line);
        if (tag) {
          doc.fontSize(8).text(`${''.padEnd(55)}${tag}`, { continued: false });
          doc.fontSize(10);
        }
        doc.fillColor('black');
      }
      doc.moveDown(1);
    };

    if (expenseStats.length > 0) {
      drawCategoryBreakdown('Ringkasan Pengeluaran per Kategori', expenseStats);
    }

    if (savingStats.length > 0) {
      drawCategoryBreakdown('Ringkasan Tabungan per Kategori', savingStats);
    }

    if (expenses.length > 0) {
      doc.fontSize(14).text('Daftar Pengeluaran', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const expHeader = `${'Tanggal'.padEnd(15)}${'Kategori'.padEnd(20)}${'Keterangan'.padEnd(30)}${'Jumlah'.padStart(15)}`;
      doc.font('Helvetica-Bold').text(expHeader);
      doc.font('Helvetica');
      for (const e of expenses) {
        const dateStr = new Date(e.date).toLocaleDateString('id-ID');
        const line = `${dateStr.padEnd(15)}${(e.category || '-').padEnd(20)}${(e.description || '-').substring(0, 28).padEnd(30)}${formatRp(e.amount).padStart(15)}`;
        doc.text(line);
      }
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`${''.padEnd(65)}TOTAL: ${formatRp(totalExpense).padStart(15)}`);
      doc.font('Helvetica');
      doc.moveDown(1);
    } else {
      doc.fontSize(12).text('Tidak ada pengeluaran pada periode ini.');
      doc.moveDown(1);
    }

    if (savings.length > 0) {
      doc.fontSize(14).text('Daftar Tabungan', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const savHeader = `${'Tanggal'.padEnd(15)}${'Kategori'.padEnd(20)}${'Keterangan'.padEnd(30)}${'Jumlah'.padStart(15)}`;
      doc.font('Helvetica-Bold').text(savHeader);
      doc.font('Helvetica');
      for (const s of savings) {
        const dateStr = new Date(s.date).toLocaleDateString('id-ID');
        const line = `${dateStr.padEnd(15)}${(s.category || '-').padEnd(20)}${(s.description || '-').substring(0, 28).padEnd(30)}${formatRp(s.amount).padStart(15)}`;
        doc.text(line);
      }
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`${''.padEnd(65)}TOTAL: ${formatRp(totalSaving).padStart(15)}`);
      doc.font('Helvetica');
    } else {
      doc.fontSize(12).text('Tidak ada tabungan pada periode ini.');
    }

    doc.end();
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
