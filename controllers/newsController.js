const { News } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { fetchAllNews, fetchNewsByCategory } = require('../utils/newsFetcher');
const { Op } = require('sequelize');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const RETENTION_DAYS = 3;

exports.getNews = async (req, res) => {
  try {
    const { category } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const where = category ? { category } : {};

    const { count, rows } = await News.findAndCountAll({
      where,
      order: [['published_at', 'DESC']],
      limit,
      offset,
    });

    return apiResponse(res, {
      data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'news' }),
    });
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return apiResponse(res, { error: 'News not found', status: 404 });
    return apiResponse(res, { data: news });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getLatestNews = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    where.published_at = { [Op.gte]: cutoffDate };

    const { count, rows } = await News.findAndCountAll({
      where,
      order: [['published_at', 'DESC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'news' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.refreshNews = async (req, res) => {
  try {
    const results = await fetchAllNews();
    let inserted = 0;
    let skipped = 0;

    for (const [category, items] of Object.entries(results)) {
      for (const item of items) {
        const existing = await News.findOne({ where: { title: item.title, category } });
        if (!existing) {
          await News.create({
            title: item.title,
            content: item.content,
            category,
            source: item.source,
            url: item.url,
            image_url: item.image_url,
            published_at: item.published_at,
          });
          inserted++;
        } else {
          skipped++;
        }
      }
    }

    return apiResponse(res, {
      data: {
        message: 'News refreshed',
        inserted,
        skipped,
        total: inserted + skipped,
      },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.cleanupOldNews = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const deleted = await News.destroy({
      where: {
        published_at: { [Op.lt]: cutoff },
      },
    });

    console.log(`[NewsCleanup] Deleted ${deleted} news older than ${RETENTION_DAYS} days`);
    return deleted;
  } catch (err) {
    console.error(`[NewsCleanup] Error: ${err.message}`);
    return 0;
  }
};

exports.getNewsStats = async (req, res) => {
  try {
    const total = await News.count();
    const sports = await News.count({ where: { category: 'sports' } });
    const politics = await News.count({ where: { category: 'politics' } });
    const criminal = await News.count({ where: { category: 'criminal' } });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    const recent = await News.count({ where: { published_at: { [Op.gte]: cutoff } } });

    return apiResponse(res, {
      data: { total, sports, politics, criminal, recent, retention_days: RETENTION_DAYS },
    });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.autoRefreshAndCleanup = async () => {
  console.log('[NewsScheduler] Starting auto refresh...');
  try {
    const results = await fetchAllNews();
    let inserted = 0;

    for (const [category, items] of Object.entries(results)) {
      for (const item of items) {
        const existing = await News.findOne({ where: { title: item.title, category } });
        if (!existing) {
          await News.create({
            title: item.title,
            content: item.content,
            category,
            source: item.source,
            url: item.url,
            image_url: item.image_url,
            published_at: item.published_at,
          });
          inserted++;
        }
      }
    }

    console.log(`[NewsScheduler] Inserted ${inserted} new articles`);
    await exports.cleanupOldNews();
    console.log('[NewsScheduler] Auto refresh complete');
  } catch (err) {
    console.error(`[NewsScheduler] Error: ${err.message}`);
  }
};
