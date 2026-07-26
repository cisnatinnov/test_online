const { Op } = require('sequelize');
const { Book, Borrowing, User, LibrarySetting } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const sequelize = require('../config/database');

async function getSettings() {
  let setting = await LibrarySetting.findByPk(1);
  if (!setting) {
    setting = await LibrarySetting.create({ id: 1, borrow_duration_days: 7, fine_per_day: 500, overdue_tolerance_days: 1 });
  }
  return setting;
}

function calculateOverdueFine(dueDate, returnDate, settings) {
  const due = new Date(dueDate);
  const returned = returnDate ? new Date(returnDate) : new Date();
  const diffTime = returned.getTime() - due.getTime();
  if (diffTime <= 0) return 0;
  const overdueDays = Math.ceil(diffTime / 86400000);
  const tolerance = settings?.overdue_tolerance_days ?? 1;
  const billableDays = Math.max(0, overdueDays - tolerance);
  if (billableDays <= 0) return 0;
  const finePerDay = settings?.fine_per_day ?? 500;
  return billableDays * finePerDay;
}

exports.getSettings = async (req, res) => {
  try {
    const setting = await getSettings();
    return apiResponse(res, { data: setting });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const setting = await getSettings();
    const { borrow_duration_days, fine_per_day, overdue_tolerance_days } = req.body;
    if (borrow_duration_days != null) {
      if (!Number.isInteger(borrow_duration_days) || borrow_duration_days < 1) {
        return apiResponse(res, { error: 'Durasi peminjaman harus bilangan bulat positif', status: 400 });
      }
    }
    if (fine_per_day != null) {
      if (!Number.isInteger(fine_per_day) || fine_per_day < 0) {
        return apiResponse(res, { error: 'Denda per hari harus bilangan bulat non-negatif', status: 400 });
      }
    }
    if (overdue_tolerance_days != null) {
      if (!Number.isInteger(overdue_tolerance_days) || overdue_tolerance_days < 0) {
        return apiResponse(res, { error: 'Toleransi hari harus bilangan bulat non-negatif', status: 400 });
      }
    }
    await setting.update({
      ...(borrow_duration_days != null && { borrow_duration_days }),
      ...(fine_per_day != null && { fine_per_day }),
      ...(overdue_tolerance_days != null && { overdue_tolerance_days }),
    });
    return apiResponse(res, { data: setting });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.listBooks = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } },
        { isbn: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (category) {
      where.category = category;
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Book.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit: parseInt(limit),
      offset,
    });
    return apiResponse(res, { data: { total: count, page: parseInt(page), limit: parseInt(limit), books: rows } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return apiResponse(res, { error: 'Buku tidak ditemukan', status: 404 });
    return apiResponse(res, { data: book });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, author, isbn, publisher, year, category, description, quantity, shelf } = req.body;
    if (!title || !author) {
      return apiResponse(res, { error: 'Judul dan penulis wajib diisi', status: 400 });
    }
    if (quantity != null && (!Number.isInteger(quantity) || quantity < 0)) {
      return apiResponse(res, { error: 'Jumlah harus bilangan bulat non-negatif', status: 400 });
    }
    const qty = quantity || 1;
    const book = await Book.create({
      title, author, isbn, publisher, year, category, description,
      quantity: qty, available: qty, shelf,
    });
    return apiResponse(res, { status: 201, data: book });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return apiResponse(res, { error: 'ISBN sudah terdaftar', status: 400 });
    }
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return apiResponse(res, { error: 'Buku tidak ditemukan', status: 404 });
    const { title, author, isbn, publisher, year, category, description, quantity, shelf } = req.body;
    if (quantity != null && (!Number.isInteger(quantity) || quantity < 0)) {
      return apiResponse(res, { error: 'Jumlah harus bilangan bulat non-negatif', status: 400 });
    }
    const diff = quantity != null ? quantity - book.quantity : 0;
    await book.update({
      ...(title != null && { title }),
      ...(author != null && { author }),
      ...(isbn != null && { isbn }),
      ...(publisher != null && { publisher }),
      ...(year != null && { year }),
      ...(category != null && { category }),
      ...(description != null && { description }),
      ...(quantity != null && { quantity, available: book.available + diff }),
      ...(shelf != null && { shelf }),
    });
    return apiResponse(res, { data: book });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return apiResponse(res, { error: 'ISBN sudah terdaftar', status: 400 });
    }
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return apiResponse(res, { error: 'Buku tidak ditemukan', status: 404 });
    const activeBorrowing = await Borrowing.findOne({ where: { book_id: book.id, status: 'borrowed' } });
    if (activeBorrowing) {
      return apiResponse(res, { error: 'Buku sedang dipinjam dan tidak bisa dihapus', status: 400 });
    }
    await Borrowing.destroy({ where: { book_id: book.id } });
    await book.destroy();
    return apiResponse(res, { data: { message: 'Buku berhasil dihapus' } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.borrowBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return apiResponse(res, { error: 'Buku tidak ditemukan', status: 404 });
    if (book.available <= 0) {
      return apiResponse(res, { error: 'Buku tidak tersedia untuk dipinjam', status: 400 });
    }
    const settings = await getSettings();
    const { due_date, notes } = req.body;
    if (!due_date) {
      return apiResponse(res, { error: 'Tanggal pengembalian wajib diisi', status: 400 });
    }
    const today = new Date().toISOString().split('T')[0];
    if (due_date <= today) {
      return apiResponse(res, { error: 'Tanggal pengembalian harus setelah hari ini', status: 400 });
    }
    const user_id = req.user.role === 'admin' && req.body.user_id ? req.body.user_id : req.user.id;
    const result = await sequelize.transaction(async (t) => {
      const borrowing = await Borrowing.create({
        user_id, book_id: id, borrow_date: today, due_date, notes,
      }, { transaction: t });
      await book.update({ available: book.available - 1 }, { transaction: t });
      return borrowing;
    });
    return apiResponse(res, { status: 201, data: result });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { id, borrowId } = req.params;
    const borrowing = await Borrowing.findOne({ where: { id: borrowId, book_id: id, status: 'borrowed' } });
    if (!borrowing) return apiResponse(res, { error: 'Peminjaman tidak ditemukan atau sudah dikembalikan', status: 404 });
    if (req.user.role !== 'admin' && borrowing.user_id !== req.user.id) {
      return apiResponse(res, { error: 'Tidak memiliki akses', status: 403 });
    }
    const settings = await getSettings();
    const today = new Date().toISOString().split('T')[0];
    const fine = calculateOverdueFine(borrowing.due_date, today, settings);
    await sequelize.transaction(async (t) => {
      await borrowing.update({ return_date: today, status: 'returned', fine }, { transaction: t });
      const book = await Book.findByPk(id, { transaction: t });
      await book.update({ available: book.available + 1 }, { transaction: t });
    });
    return apiResponse(res, { data: borrowing });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.listBorrowings = async (req, res) => {
  try {
    const { status, user_id, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    } else if (user_id) {
      where.user_id = user_id;
    }
    const settings = await getSettings();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Borrowing.findAndCountAll({
      where,
      include: [
        { model: Book, attributes: ['id', 'title', 'author', 'isbn'] },
        { model: User, attributes: ['id', 'username', 'email'] },
      ],
      order: [['id', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    const today = new Date().toISOString().split('T')[0];
    const enriched = rows.map(b => {
      const obj = b.toJSON();
      if ((obj.status === 'borrowed' || obj.status === 'overdue') && obj.due_date < today) {
        obj.liveFine = calculateOverdueFine(obj.due_date, today, settings);
      }
      return obj;
    });
    return apiResponse(res, { data: { total: count, page: parseInt(page), limit: parseInt(limit), borrowings: enriched } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const books = await Book.findAll({
      attributes: ['category'],
      group: ['category'],
      where: { category: { [Op.ne]: null } },
    });
    const categories = books.map(b => b.category).filter(Boolean).sort();
    return apiResponse(res, { data: categories });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getStats = async (req, res) => {
  try {
    const settings = await getSettings();
    const totalBooks = await Book.sum('quantity') || 0;
    const totalAvailable = await Book.sum('available') || 0;
    const totalBorrowed = totalBooks - totalAvailable;
    const totalTitles = await Book.count();
    const activeBorrowings = await Borrowing.count({ where: { status: 'borrowed' } });
    const overdueBorrowings = await Borrowing.count({
      where: { status: 'borrowed', due_date: { [Op.lt]: new Date().toISOString().split('T')[0] } },
    });
    const categoryStats = await Book.findAll({
      attributes: ['category', [require('sequelize').fn('SUM', require('sequelize').col('quantity')), 'total']],
      group: ['category'],
      raw: true,
    });
    const totalFines = await Borrowing.sum('fine') || 0;
    const unpaidFines = await Borrowing.sum('fine', {
      where: { fine: { [Op.gt]: 0 }, status: { [Op.in]: ['borrowed', 'overdue'] } },
    }) || 0;
    return apiResponse(res, {
      data: {
        totalBooks, totalAvailable, totalBorrowed, totalTitles,
        activeBorrowings, overdueBorrowings, categoryStats,
        totalFines, unpaidFines,
        finePerDay: settings.fine_per_day,
        borrowDurationDays: settings.borrow_duration_days,
        overdueToleranceDays: settings.overdue_tolerance_days,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.updateOverdueBorrowings = async (req, res) => {
  try {
    const settings = await getSettings();
    const today = new Date().toISOString().split('T')[0];
    const overdueBooks = await Borrowing.findAll({
      where: { status: 'borrowed', due_date: { [Op.lt]: today } },
    });
    let updated = 0;
    for (const b of overdueBooks) {
      const fine = calculateOverdueFine(b.due_date, today, settings);
      await b.update({ status: 'overdue', fine });
      updated++;
    }
    return apiResponse(res, { data: { updated } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
