// Real routes, controllers, middleware, models, and transactions; disposable database.
jest.mock('../config/database', () => {
  const { Sequelize } = require('sequelize');
  return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
});
process.env.JWT_SECRET = 'isolated-feature-test-secret';
process.env.JWT_TEMP_SECRET = 'isolated-temporary-test-secret';
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const models = require('../models');
const { sequelize, User, Identity, Borrowing, Book, BMI, VitalSigns, TwoFactorCode, BloodSugar } = models;
const app = express();
app.use(express.json());
for (const [prefix, file] of Object.entries({ auth: 'auth', money: 'money', library: 'library', estate: 'estate', categories: 'category', bmi: 'bmi', bloodsugar: 'bloodSugar', 'vital-signs': 'vitalSigns', chat: 'chat' })) {
  app.use(`/api/${prefix}`, require(`../routes/${file}Routes`));
}
let token, otherToken, adminToken, identity;
const call = (method, path, body, auth = token) => {
  const req = request(app)[method](`/api${path}`).set('Authorization', `Bearer ${auth}`);
  return body === undefined ? req : req.send(body);
};
beforeAll(async () => {
  await sequelize.sync({ force: true });
  const users = await User.bulkCreate([
    { username: 'flow-user', email: 'flow@example.test', password: 'unused', role: 'user' },
    { username: 'other-user', email: 'other@example.test', password: 'unused', role: 'user' },
    { username: 'flow-admin', email: 'admin@example.test', password: 'unused', role: 'admin' },
  ]);
  [token, otherToken, adminToken] = users.map(u => jwt.sign({ id: u.id, username: u.username, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1h' }));
  identity = await Identity.create({ id_user: users[0].id, name: 'Test patient', height: 170, birthdate: '1995-05-15', gender: 'male' });
});
afterAll(() => sequelize.close());

describe.each(['expense', 'saving'])('Money %s', type => {
  let id;
  test('create, edit, list, and isolate data by user', async () => {
    const created = await call('post', `/money/${type}`, { amount: 100, category: 'Test' });
    expect(created.status).toBe(201); id = created.body.data.id;
    expect((await call('put', `/money/${type}/${id}`, { amount: 150 })).status).toBe(200);
    const own = await call('get', `/money/${type}`);
    expect(own.body.data.total).toBe(1);
    expect((await call('get', `/money/${type}`, undefined, otherToken)).body.data.total).toBe(0);
    expect((await call('put', `/money/${type}/${id}`, { amount: 200 }, otherToken)).status).toBe(404);
  });
  test.each([-1, 0, 'invalid', 'Infinity', ''])('reject invalid amount %p on create and update', async amount => {
    expect((await call('post', `/money/${type}`, { amount, category: 'Test' })).status).toBe(400);
    expect((await call('put', `/money/${type}/${id}`, { amount })).status).toBe(400);
  });
  test('delete the record', async () => { expect((await call('delete', `/money/${type}/${id}`)).status).toBe(200); });
});

test('health recording keeps only the latest BMI and vitals current and isolates patients', async () => {
  for (const weight of [65, 68]) expect((await call('post', '/bmi', { identity_id: identity.id, weight })).status).toBe(200);
  expect(await BMI.count({ where: { id_identity: identity.id, status: 'current' } })).toBe(1);
  expect(await BMI.count({ where: { id_identity: identity.id, status: 'past' } })).toBe(1);
  expect((await call('post', '/bmi', { identity_id: identity.id, weight: 70 }, otherToken)).status).toBe(404);
  for (const heart_rate of [70, 72]) expect((await call('post', '/vital-signs', { identity_id: identity.id, heart_rate, systolic: 120, diastolic: 80, temperature: 36.8, spo2: 98, respiratory_rate: 16 })).status).toBe(200);
  expect(await VitalSigns.count({ where: { id_identity: identity.id, status: 'current' } })).toBe(1);
  for (const sugar of [90, 95]) expect((await call('post', '/bloodsugar', { identity_id: identity.id, sugar })).status).toBe(200);
  expect(await BloodSugar.count({ where: { id_identity: identity.id, status: 'current' } })).toBe(1);
});

test('library supports zero stock, borrow, overdue, authorised return, and stock integrity', async () => {
  const empty = await call('post', '/library', { title: 'Empty', author: 'Test', quantity: 0 });
  expect(empty.status).toBe(201); expect(empty.body.data.available).toBe(0);
  expect((await call('post', `/library/${empty.body.data.id}/borrow`, { due_date: '2099-01-01' })).status).toBe(400);
  const created = await call('post', '/library', { title: 'Test book', author: 'Test', quantity: 1 });
  const id = created.body.data.id;
  const loan = await call('post', `/library/${id}/borrow`, { due_date: '2099-01-01' });
  expect(loan.status).toBe(201);
  expect((await call('post', `/library/${id}/borrow`, { due_date: '2099-01-01' })).status).toBe(400);
  expect((await call('put', `/library/${id}`, { quantity: 0 })).status).toBe(400);
  await Borrowing.update({ due_date: '2020-01-01' }, { where: { id: loan.body.data.id } });
  expect((await call('post', '/library/overdue/update', {})).status).toBe(200);
  expect((await call('delete', `/library/${id}`, undefined, adminToken)).status).toBe(400);
  expect((await call('post', `/library/${id}/return/${loan.body.data.id}`, {}, otherToken)).status).toBe(403);
  const returned = await call('post', `/library/${id}/return/${loan.body.data.id}`, {});
  expect(returned.status).toBe(200); expect(returned.body.data.fine).toBeGreaterThan(0);
  expect((await Book.findByPk(id)).available).toBe(1);
  expect((await call('post', `/library/${id}/return/${loan.body.data.id}`, {})).status).toBe(404);
});

test('category lifecycle and duplicate detection', async () => {
  const created = await call('post', '/categories', { name: 'Food', type: 'spending' });
  expect(created.status).toBe(201);
  expect((await call('post', '/categories', { name: 'Food', type: 'spending' })).status).toBe(409);
  expect((await call('get', '/categories?type=spending')).body.data.total).toBe(1);
  expect((await call('put', `/categories/${created.body.data.id}`, { name: 'Groceries' })).status).toBe(201);
  expect((await call('delete', `/categories/${created.body.data.id}`)).status).toBe(200);
});

test('real estate routes create trees, calculate stats, and plan drone paths', async () => {
  const created = await call('post', '/estate', { width: 10, length: 10 });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  expect((await call('post', `/estate/${id}/tree`, { x: 3, y: 4, height: 5 })).status).toBe(201);
  expect((await call('get', `/estate/${id}/stats`)).status).toBe(200);
  const plan = await call('get', `/estate/${id}/drone-plan`);
  expect(plan.status).toBe(200); expect(plan.body.data.sum_distance).toBe(7);
});

test('protected routes reject unauthenticated requests', async () => {
  for (const path of ['/money/expense', '/library', '/estate', '/chat/rooms', '/categories']) {
    expect((await request(app).get(`/api${path}`)).status).toBe(401);
  }
});

test('registration, password validation, login, 2FA verification, and code replay prevention', async () => {
  const credentials = { username: 'registered', email: 'registered@example.test', password: 'Example@123', phone: '+6281234567890' };
  const registered = await call('post', '/auth/register', { ...credentials, name: 'Registered patient', height: 175 });
  expect(registered.status).toBe(200); expect(registered.body.data.user.password).toBeUndefined();
  expect(registered.body.data.user.phone).toBe('+6281234567890');
  expect((await call('post', '/auth/login', { ...credentials, password: 'wrong' })).status).toBe(401);
  const loggedIn = await call('post', '/auth/login', credentials);
  expect(loggedIn.body.data.require2fa).toBe(true);
  expect(loggedIn.body.data.channels).toContain('whatsapp');
  await TwoFactorCode.create({ user_id: registered.body.data.user.id, code: '123456', expires_at: new Date(Date.now() + 300000) });
  const verification = { tempToken: loggedIn.body.data.tempToken, code: '123456' };
  const verified = await call('post', '/auth/verify-2fa', verification);
  expect(verified.status).toBe(200); expect(verified.body.data.token).toBeTruthy();
  expect((await call('post', '/auth/verify-2fa', verification)).status).toBe(401);
});

test.each(['081234567890', '+62abc12345', '+123', '+1234567890123456', 6281234567890])('registration rejects malformed international phone %p', async phone => {
  const result = await call('post', '/auth/register', { username: 'bad-phone', email: 'bad-phone@example.test', password: 'Example@123', phone });
  expect(result.status).toBe(400);
  expect(await User.count({ where: { username: 'bad-phone' } })).toBe(0);
});

test('chat room creation, room listing, and message access control', async () => {
  const created = await call('post', '/chat/rooms', { name: 'Private group', type: 'group', participantIds: [] });
  expect(created.status).toBe(200);
  const id = created.body.data.id;
  expect((await call('get', `/chat/rooms/${id}/messages`)).status).toBe(200);
  expect((await call('get', `/chat/rooms/${id}/messages`, undefined, otherToken)).status).toBe(403);
  const rooms = await call('get', '/chat/rooms');
  expect(rooms.status).toBe(200); expect(rooms.body.data.rooms.some(room => room.id === id)).toBe(true);
});
