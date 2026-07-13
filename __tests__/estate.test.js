const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
});

const Estate = sequelize.define('Estate', {
  width: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  length: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
}, { tableName: 'estates', timestamps: true });

const Tree = sequelize.define('Tree', {
  estate_id: { type: DataTypes.INTEGER, allowNull: false },
  x: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  y: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  height: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 30 } },
}, { tableName: 'trees', timestamps: true });

Estate.hasMany(Tree, { foreignKey: 'estate_id' });
Tree.belongsTo(Estate, { foreignKey: 'estate_id' });

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function computeDronePath(trees) {
  const sorted = [...trees].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  const path = [{ x: 0, y: 0 }];
  for (const tree of sorted) path.push({ x: tree.x, y: tree.y });
  return path;
}

const apiResponse = (res, { success, data = null, error = null, status = 200 }) => {
  const isError = error !== null || status >= 400;
  const body = { success: success !== undefined ? success : !isError };
  if (data !== null) body.data = data;
  if (error !== null) body.error = error;
  return res.status(status).json(body);
};

const estateController = {
  createEstate: async (req, res) => {
    try {
      const { width, length } = req.body;
      if (width == null || length == null) return apiResponse(res, { error: 'width and length are required', status: 400 });
      if (!Number.isInteger(width) || !Number.isInteger(length) || width < 1 || length < 1)
        return apiResponse(res, { error: 'width and length must be positive integers', status: 400 });
      const estate = await Estate.create({ width, length });
      return apiResponse(res, { status: 201, data: { id: estate.id, width: estate.width, length: estate.length } });
    } catch (err) { return apiResponse(res, { error: err.message, status: 500 }); }
  },

  createTree: async (req, res) => {
    try {
      const { id } = req.params;
      const estate = await Estate.findByPk(id);
      if (!estate) return apiResponse(res, { error: 'estate not found', status: 404 });
      const { x, y, height } = req.body;
      if (x == null || y == null || height == null) return apiResponse(res, { error: 'x, y, and height are required', status: 400 });
      if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(height))
        return apiResponse(res, { error: 'x, y, and height must be positive integers', status: 400 });
      if (x < 0 || y < 0) return apiResponse(res, { error: 'x and y must be non-negative integers', status: 400 });
      if (height < 1 || height > 30) return apiResponse(res, { error: 'height must be between 1 and 30 meters', status: 400 });
      if (x > estate.width || y > estate.length) return apiResponse(res, { error: 'x and y must be within estate bounds', status: 400 });
      const tree = await Tree.create({ estate_id: id, x, y, height });
      return apiResponse(res, { status: 201, data: { id: tree.id, x: tree.x, y: tree.y, height: tree.height } });
    } catch (err) { return apiResponse(res, { error: err.message, status: 500 }); }
  },

  getStats: async (req, res) => {
    try {
      const { id } = req.params;
      const estate = await Estate.findByPk(id);
      if (!estate) return apiResponse(res, { error: 'estate not found', status: 404 });
      const trees = await Tree.findAll({ where: { estate_id: id } });
      if (trees.length === 0) return apiResponse(res, { data: { count: 0, max: 0, min: 0, median: 0 } });
      const heights = trees.map(t => t.height).sort((a, b) => a - b);
      const count = heights.length;
      const max = heights[count - 1];
      const min = heights[0];
      const median = count % 2 === 0 ? (heights[count / 2 - 1] + heights[count / 2]) / 2 : heights[Math.floor(count / 2)];
      return apiResponse(res, { data: { count, max, min, median } });
    } catch (err) { return apiResponse(res, { error: err.message, status: 500 }); }
  },

  getDronePlan: async (req, res) => {
    try {
      const { id } = req.params;
      const estate = await Estate.findByPk(id);
      if (!estate) return apiResponse(res, { error: 'estate not found', status: 404 });
      const maxDistance = req.query.max_distance ? parseInt(req.query.max_distance, 10) : null;
      if (maxDistance != null && maxDistance < 0) {
        return apiResponse(res, { error: 'max_distance must be a positive integer', status: 400 });
      }
      const trees = await Tree.findAll({ where: { estate_id: id } });
      if (trees.length === 0) return apiResponse(res, { data: { sum_distance: 0 } });
      const path = computeDronePath(trees);
      let sumDistance = 0;
      for (let i = 1; i < path.length; i++) sumDistance += manhattanDistance(path[i - 1], path[i]);
      if (maxDistance != null) {
        if (maxDistance >= sumDistance) {
          const lastPoint = path[path.length - 1];
          return apiResponse(res, { data: { sum_distance: sumDistance, rest: { x: lastPoint.x, y: lastPoint.y } } });
        }
        let remaining = maxDistance;
        for (let i = 1; i < path.length; i++) {
          const dist = manhattanDistance(path[i - 1], path[i]);
          if (remaining <= dist) {
            const from = path[i - 1], to = path[i];
            const dx = to.x - from.x, dy = to.y - from.y;
            const absDx = Math.abs(dx), absDy = Math.abs(dy);
            let lx = from.x, ly = from.y;
            if (remaining <= absDx) { lx = from.x + Math.sign(dx) * remaining; }
            else { lx = to.x; ly = from.y + Math.sign(dy) * (remaining - absDx); }
            return apiResponse(res, { data: { sum_distance: sumDistance, rest: { x: Math.round(lx), y: Math.round(ly) } } });
          }
          remaining -= dist;
        }
      }
      return apiResponse(res, { data: { sum_distance: sumDistance } });
    } catch (err) { return apiResponse(res, { error: err.message, status: 500 }); }
  },
};

const app = express();
app.use(express.json());
app.post('/api/estate', estateController.createEstate);
app.get('/api/estate', async (req, res) => {
  const estates = await Estate.findAll({ order: [['id', 'ASC']] });
  return apiResponse(res, { data: estates });
});
app.get('/api/estate/:id/stats', estateController.getStats);
app.get('/api/estate/:id/drone-plan', estateController.getDronePlan);
app.post('/api/estate/:id/tree', estateController.createTree);
app.get('/api/estate/:id/trees', async (req, res) => {
  const { id } = req.params;
  const estate = await Estate.findByPk(id);
  if (!estate) return apiResponse(res, { error: 'estate not found', status: 404 });
  const trees = await Tree.findAll({ where: { estate_id: id }, order: [['id', 'ASC']] });
  return apiResponse(res, { data: trees });
});

let estateId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Estate API', () => {
  describe('POST /api/estate', () => {
    test('creates an estate with valid width and length', async () => {
      const res = await request(app).post('/api/estate').send({ width: 10, length: 20 });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.width).toBe(10);
      expect(res.body.data.length).toBe(20);
      estateId = res.body.data.id;
    });

    test('returns 400 if width is missing', async () => {
      const res = await request(app).post('/api/estate').send({ length: 20 });
      expect(res.status).toBe(400);
    });

    test('returns 400 if length is missing', async () => {
      const res = await request(app).post('/api/estate').send({ width: 10 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for non-integer values', async () => {
      const res = await request(app).post('/api/estate').send({ width: 10.5, length: 20 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for zero values', async () => {
      const res = await request(app).post('/api/estate').send({ width: 0, length: 20 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/estate/:id/tree', () => {
    test('creates a tree with valid data', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: 2, y: 3, height: 15 });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.x).toBe(2);
      expect(res.body.data.y).toBe(3);
      expect(res.body.data.height).toBe(15);
    });

    test('returns 404 for non-existent estate', async () => {
      const res = await request(app).post('/api/estate/9999/tree').send({ x: 1, y: 1, height: 10 });
      expect(res.status).toBe(404);
    });

    test('returns 400 for height > 30', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: 1, y: 1, height: 31 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for height < 1', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: 1, y: 1, height: 0 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for negative x', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: -1, y: 1, height: 10 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for x out of estate bounds', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: 11, y: 1, height: 10 });
      expect(res.status).toBe(400);
    });

    test('returns 400 for missing fields', async () => {
      const res = await request(app).post(`/api/estate/${estateId}/tree`).send({ x: 1, y: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/estate/:id/stats', () => {
    test('returns stats with correct values', async () => {
      const res = await request(app).get(`/api/estate/${estateId}/stats`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
      expect(res.body.data.max).toBeGreaterThan(0);
      expect(res.body.data.min).toBeGreaterThan(0);
      expect(res.body.data.median).toBeGreaterThan(0);
    });

    test('returns 404 for non-existent estate', async () => {
      const res = await request(app).get('/api/estate/9999/stats');
      expect(res.status).toBe(404);
    });

    test('returns zeros for estate with no trees', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 5, length: 5 });
      const emptyEstateId = createRes.body.data.id;
      const res = await request(app).get(`/api/estate/${emptyEstateId}/stats`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ count: 0, max: 0, min: 0, median: 0 });
    });

    test('calculates median correctly for even number of trees', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 1, y: 1, height: 10 });
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 2, y: 2, height: 20 });
      const res = await request(app).get(`/api/estate/${eid}/stats`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
      expect(res.body.data.max).toBe(20);
      expect(res.body.data.min).toBe(10);
      expect(res.body.data.median).toBe(15);
    });

    test('calculates median correctly for odd number of trees', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 1, y: 1, height: 10 });
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 2, y: 2, height: 20 });
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 3, y: 3, height: 30 });
      const res = await request(app).get(`/api/estate/${eid}/stats`);
      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(3);
      expect(res.body.data.median).toBe(20);
    });
  });

  describe('GET /api/estate/:id/drone-plan', () => {
    test('returns sum_distance for estate with trees', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 10, length: 10 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 3, y: 4, height: 10 });
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 7, y: 8, height: 15 });
      const res = await request(app).get(`/api/estate/${eid}/drone-plan`);
      expect(res.status).toBe(200);
      expect(res.body.data.sum_distance).toBeGreaterThan(0);
    });

    test('returns sum_distance 0 for estate with no trees', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 5, length: 5 });
      const eid = createRes.body.data.id;
      const res = await request(app).get(`/api/estate/${eid}/drone-plan`);
      expect(res.status).toBe(200);
      expect(res.body.data.sum_distance).toBe(0);
    });

    test('returns 404 for non-existent estate', async () => {
      const res = await request(app).get('/api/estate/9999/drone-plan');
      expect(res.status).toBe(404);
    });

    test('calculates correct Manhattan distance', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 5, y: 5, height: 10 });
      const res = await request(app).get(`/api/estate/${eid}/drone-plan`);
      expect(res.status).toBe(200);
      expect(res.body.data.sum_distance).toBe(10);
    });
  });

  describe('GET /api/estate/:id/drone-plan?max_distance=N', () => {
    test('returns last point if max_distance >= sum_distance', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 3, y: 4, height: 10 });
      const res = await request(app).get(`/api/estate/${eid}/drone-plan?max_distance=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.rest).toEqual({ x: 3, y: 4 });
    });

    test('returns forced landing point when max_distance exceeded mid-segment', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      await request(app).post(`/api/estate/${eid}/tree`).send({ x: 10, y: 0, height: 10 });
      const res = await request(app).get(`/api/estate/${eid}/drone-plan?max_distance=5`);
      expect(res.status).toBe(200);
      expect(res.body.data.rest).toEqual({ x: 5, y: 0 });
    });

    test('returns 400 for negative max_distance', async () => {
      const createRes = await request(app).post('/api/estate').send({ width: 100, length: 100 });
      const eid = createRes.body.data.id;
      const res = await request(app).get(`/api/estate/${eid}/drone-plan?max_distance=-1`);
      expect(res.status).toBe(400);
    });
  });
});
