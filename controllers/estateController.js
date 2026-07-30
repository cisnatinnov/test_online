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

async function seedEstates() {
  const count = await Estate.count();
  if (count > 0) return;
  const data = [
    { width: 40, length: 60, trees: [{ x: 5, y: 8, height: 12 }, { x: 15, y: 25, height: 8 }, { x: 30, y: 10, height: 15 }, { x: 10, y: 40, height: 6 }, { x: 25, y: 50, height: 20 }] },
    { width: 25, length: 25, trees: [{ x: 5, y: 5, height: 10 }, { x: 12, y: 18, height: 14 }, { x: 20, y: 8, height: 7 }] },
    { width: 50, length: 30, trees: [{ x: 10, y: 10, height: 18 }, { x: 30, y: 5, height: 25 }, { x: 40, y: 20, height: 9 }, { x: 20, y: 22, height: 11 }] },
    { width: 60, length: 40, trees: [{ x: 8, y: 12, height: 16 }, { x: 25, y: 30, height: 22 }, { x: 45, y: 8, height: 13 }, { x: 50, y: 35, height: 19 }, { x: 15, y: 20, height: 10 }, { x: 35, y: 15, height: 28 }] },
    { width: 30, length: 50, trees: [{ x: 10, y: 15, height: 11 }, { x: 20, y: 35, height: 17 }, { x: 5, y: 42, height: 6 }, { x: 15, y: 28, height: 21 }] },
  ];
  for (const d of data) {
    const estate = await Estate.create({ width: d.width, length: d.length });
    for (const t of d.trees) {
      await Tree.create({ estate_id: estate.id, x: t.x, y: t.y, height: t.height });
    }
  }
  console.log('5 dummy estates seeded with trees');
}

exports.seedEstates = seedEstates;
