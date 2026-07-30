const ALLOWED_LIMITS = [5, 10, 25, 50, 100];
const DEFAULT_LIMIT = 10;

function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!ALLOWED_LIMITS.includes(limit)) limit = DEFAULT_LIMIT;
  if (limit < 1) limit = 1;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginateResponse({ total, page, limit, items, itemName }) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    [itemName]: items,
  };
}

module.exports = { parsePagination, paginateResponse, ALLOWED_LIMITS, DEFAULT_LIMIT };
