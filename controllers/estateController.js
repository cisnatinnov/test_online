const { Estate, Tree } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { parsePagination, paginateResponse } = require('../utils/pagination');

exports.listEstates = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await Estate.findAndCountAll({
      order: [['id', 'ASC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'estates' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getTrees = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.findByPk(id);
    if (!estate) {
      return apiResponse(res, { error: 'estate not found', status: 404 });
    }
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await Tree.findAndCountAll({
      where: { estate_id: id },
      order: [['id', 'ASC']],
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'trees' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createEstate = async (req, res) => {
  try {
    const { width, length } = req.body;
    if (width == null || length == null) {
      return apiResponse(res, { error: 'width and length are required', status: 400 });
    }
    if (!Number.isInteger(width) || !Number.isInteger(length) || width < 1 || length < 1) {
      return apiResponse(res, { error: 'width and length must be positive integers', status: 400 });
    }
    const estate = await Estate.create({ width, length });
    return apiResponse(res, { status: 201, data: { id: estate.id, width: estate.width, length: estate.length } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createTree = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.findByPk(id);
    if (!estate) {
      return apiResponse(res, { error: 'estate not found', status: 404 });
    }

    const { x, y, height } = req.body;
    if (x == null || y == null || height == null) {
      return apiResponse(res, { error: 'x, y, and height are required', status: 400 });
    }
    if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(height)) {
      return apiResponse(res, { error: 'x, y, and height must be positive integers', status: 400 });
    }
    if (x < 0 || y < 0) {
      return apiResponse(res, { error: 'x and y must be non-negative integers', status: 400 });
    }
    if (height < 1 || height > 30) {
      return apiResponse(res, { error: 'height must be between 1 and 30 meters', status: 400 });
    }
    if (x > estate.width || y > estate.length) {
      return apiResponse(res, { error: 'x and y must be within estate bounds', status: 400 });
    }

    const tree = await Tree.create({ estate_id: id, x, y, height });
    return apiResponse(res, { status: 201, data: { id: tree.id, x: tree.x, y: tree.y, height: tree.height } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.findByPk(id);
    if (!estate) {
      return apiResponse(res, { error: 'estate not found', status: 404 });
    }

    const trees = await Tree.findAll({ where: { estate_id: id } });
    if (trees.length === 0) {
      return apiResponse(res, { data: { count: 0, max: 0, min: 0, median: 0 } });
    }

    const heights = trees.map(t => t.height).sort((a, b) => a - b);
    const count = heights.length;
    const max = heights[count - 1];
    const min = heights[0];
    let median;
    if (count % 2 === 0) {
      median = (heights[count / 2 - 1] + heights[count / 2]) / 2;
    } else {
      median = heights[Math.floor(count / 2)];
    }

    return apiResponse(res, { data: { count, max, min, median } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function computeDronePath(trees) {
  const sorted = [...trees].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const path = [{ x: 0, y: 0 }];
  for (const tree of sorted) {
    path.push({ x: tree.x, y: tree.y });
  }
  return path;
}

exports.getDronePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const estate = await Estate.findByPk(id);
    if (!estate) {
      return apiResponse(res, { error: 'estate not found', status: 404 });
    }

    const maxDistance = req.query.max_distance ? parseInt(req.query.max_distance, 10) : null;

    if (maxDistance != null && maxDistance < 0) {
      return apiResponse(res, { error: 'max_distance must be a positive integer', status: 400 });
    }

    const trees = await Tree.findAll({ where: { estate_id: id } });
    if (trees.length === 0) {
      return apiResponse(res, { data: { sum_distance: 0 } });
    }

    const path = computeDronePath(trees);
    let sumDistance = 0;
    for (let i = 1; i < path.length; i++) {
      sumDistance += manhattanDistance(path[i - 1], path[i]);
    }

    if (maxDistance != null) {

      if (maxDistance >= sumDistance) {
        const lastPoint = path[path.length - 1];
        return apiResponse(res, { data: { sum_distance: sumDistance, rest: { x: lastPoint.x, y: lastPoint.y } } });
      }

      let remaining = maxDistance;
      for (let i = 1; i < path.length; i++) {
        const dist = manhattanDistance(path[i - 1], path[i]);
        if (remaining <= dist) {
          const from = path[i - 1];
          const to = path[i];
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          let landingX = from.x;
          let landingY = from.y;
          if (remaining <= absDx) {
            landingX = from.x + Math.sign(dx) * remaining;
          } else {
            landingX = to.x;
            landingY = from.y + Math.sign(dy) * (remaining - absDx);
          }

          return apiResponse(res, {
            data: { sum_distance: sumDistance, rest: { x: Math.round(landingX), y: Math.round(landingY) } },
          });
        }
        remaining -= dist;
      }
    }

    return apiResponse(res, { data: { sum_distance: sumDistance } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
