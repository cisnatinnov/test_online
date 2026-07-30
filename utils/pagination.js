const ALLOWED_LIMITS = [5, 10, 25, 50, 100];
const DEFAULT_LIMIT = 10;

function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  if (page < 1) page = 1;
  if (!ALLOWED_LIMITS.includes(limit)) limit = DEFAULT_LIMIT;
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
