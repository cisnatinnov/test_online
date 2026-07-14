const http = require('http');
const { execSync } = require('child_process');
require('dotenv').config();
const { sequelize, TwoFactorCode, User, Book, Borrowing, LibrarySetting, HealthTraffic } = require('./models');

const BASE = 'http://localhost:3000/api';
let pass = 0, fail = 0, total = 0;

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(url, { method, headers }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    r.on('error', e => reject(e));
    if (data) r.write(data);
    r.end();
  });
}

function ok(label, cond) {
  total++;
  if (cond) { pass++; console.log(`  \u2713 ${label}`); }
  else { fail++; console.log(`  \u2717 ${label}`); }
}

async function getCode(userId) {
  await new Promise(r => setTimeout(r, 500));
  const c = await TwoFactorCode.findOne({ where: { user_id: userId }, order: [['id', 'DESC']] });
  return c ? c.code : '000000';
}

async function main() {
  await sequelize.sync({ force: false });
  // Clean up old test data
  await Borrowing.destroy({ where: {} });
  await Book.destroy({ where: {} });
  await LibrarySetting.destroy({ where: { id: 1 } });
  await User.destroy({ where: { username: { [require('sequelize').Op.in]: ['testnodeA'] } } });

  console.log('\n=== 1. SYSTEM HEALTH (no auth) ===');
  let r = await req('GET', '/health');
  ok('GET /health - status=healthy', r.data.data?.status === 'healthy');
  ok('GET /health - db=up', r.data.data?.checks?.database?.status === 'up');
  r = await req('GET', '/health/ready');
  ok('GET /health/ready', r.data.data?.status === 'ready');
  r = await req('GET', '/health/live');
  ok('GET /health/live', r.data.data?.status === 'alive');
  r = await req('GET', '/health/stats');
  ok('GET /health/stats', r.data.data?.users !== undefined);

  console.log('\n=== 2. AUTH FLOW ===');
  // Register
  r = await req('POST', '/auth/register', { username: 'testnodeA', email: 'tnA@test.com', password: 'Test@1234', name: 'Node A', height: 170, birthdate: '1995-05-15' });
  ok('Register new user', r.status === 201 || r.status === 200);
  const testUser = await User.findOne({ where: { username: 'testnodeA' } });
  const testUserId = testUser?.id;

  // Admin login
  r = await req('POST', '/auth/login', { username: 'admin', password: 'Admin@123' });
  ok('Admin login', r.data.data?.tempToken?.length > 10);
  const adminTempToken = r.data.data.tempToken;
  await req('POST', '/auth/send-2fa', { tempToken: adminTempToken, channel: 'email' });
  const adminUser = await User.findOne({ where: { username: 'admin' } });
  const adminCode = await getCode(adminUser.id);
  r = await req('POST', '/auth/verify-2fa', { tempToken: adminTempToken, code: adminCode });
  if (!r.data.data?.token) { console.log('    verify-2fa response:', JSON.stringify(r.data).substring(0, 300)); process.exit(1); }
  ok('Admin verify 2FA', r.data.data?.token?.length > 50);
  const adminToken = r.data.data.token;

  // User login
  r = await req('POST', '/auth/login', { username: 'testnodeA', password: 'Test@1234' });
  ok('User login', r.data.data?.tempToken?.length > 10);
  const userTempToken = r.data.data.tempToken;
  await req('POST', '/auth/send-2fa', { tempToken: userTempToken, channel: 'email' });
  const testCode = await getCode(testUserId);
  r = await req('POST', '/auth/verify-2fa', { tempToken: userTempToken, code: testCode });
  ok('User verify 2FA', r.data.data?.token?.length > 50);
  const userToken = r.data.data.token;

  // Wrong password
  r = await req('POST', '/auth/login', { username: 'admin', password: 'wrong' });
  ok('Login wrong password rejected', r.status === 401);
  // Duplicate register
  r = await req('POST', '/auth/register', { username: 'admin', email: 'x@x.com', password: 'Test@1234' });
  ok('Register duplicate rejected', r.status === 400);

  console.log('\n=== 3. IDENTITIES ===');
  r = await req('POST', '/identities', { nik: '3201001234560001', name: 'Pasien Satu', height: 175, birthplace: 'Jakarta', birthdate: '1988-06-15', address: 'Jl. Test No.1' }, adminToken);
  ok('Admin create identity', r.status === 201);
  const patId = r.data.data?.id;
  r = await req('POST', '/identities', { nik: '3201001234560002', name: 'Pasien Dua', height: 160, birthdate: '1995-03-10' }, adminToken);
  const patId2 = r.data.data?.id;
  ok('Admin create identity 2', r.status === 201);
  r = await req('GET', '/identities', null, adminToken);
  ok('Admin list identities', r.data.data?.length >= 1);
  r = await req('PUT', `/identities/${patId}`, { height: 180 }, adminToken);
  ok('Update identity', r.status === 200);

  console.log('\n=== 4. BMI ===');
  r = await req('POST', '/bmi', { identity_id: patId, weight: 75 }, adminToken);
  ok('Create BMI record', r.status === 201 || r.status === 200);
  r = await req('GET', `/bmi/history/${patId}`, null, adminToken);
  ok('BMI history', Array.isArray(r.data.data));
  r = await req('GET', '/bmi/list', null, adminToken);
  ok('BMI list', r.data.data !== undefined);
  r = await req('GET', '/bmi/summary', null, adminToken);
  ok('BMI summary', r.data.data !== undefined);

  console.log('\n=== 5. BLOOD SUGAR ===');
  r = await req('POST', '/bloodsugar', { identity_id: patId, sugar: 95 }, adminToken);
  ok('Create blood sugar', r.status === 201 || r.status === 200);
  r = await req('GET', `/bloodsugar/history/${patId}`, null, adminToken);
  ok('Blood sugar history', r.data.data !== undefined);

  console.log('\n=== 6. VITAL SIGNS ===');
  r = await req('POST', '/vital-signs', { identity_id: patId, systolic: 120, diastolic: 80, heart_rate: 72, temperature: 36.5, spo2: 98, respiratory_rate: 16 }, adminToken);
  ok('Create vital signs', r.status === 201 || r.status === 200);
  r = await req('GET', `/vital-signs/latest/${patId}`, null, adminToken);
  ok('Latest vital signs', r.data.data?.vitalSigns?.systolic != null);
  r = await req('GET', `/vital-signs/history/${patId}`, null, adminToken);
  ok('Vital signs history', r.data.data !== undefined);
  r = await req('GET', '/vital-signs/list', null, adminToken);
  ok('Vital signs list', r.data.data !== undefined);

  console.log('\n=== 7. PATIENT HEALTH ===');
  r = await req('GET', `/patient-health/risk/${patId}`, null, adminToken);
  ok('Health risk score', r.data.data?.riskLevel !== undefined);
  r = await req('GET', `/patient-health/trend/${patId}`, null, adminToken);
  ok('Health trend', r.data.data !== undefined);
  r = await req('GET', '/patient-health/alerts', null, adminToken);
  ok('Health alerts', Array.isArray(r.data.data));
  r = await req('GET', '/patient-health/population', null, adminToken);
  ok('Population stats', r.data.data !== undefined);

  console.log('\n=== 8. MONEY MANAGEMENT ===');
  r = await req('POST', '/money/expense', { amount: 50000, category: 'Makanan', description: 'Test lunch' }, userToken);
  ok('Create expense', r.status === 201);
  const expId = r.data.data?.id;
  r = await req('POST', '/money/saving', { amount: 200000, category: 'Gaji', description: 'Salary' }, userToken);
  ok('Create saving', r.status === 201);
  const savId = r.data.data?.id;
  r = await req('GET', '/money/expense', null, userToken);
  ok('List expenses', Array.isArray(r.data.data));
  r = await req('GET', '/money/saving', null, userToken);
  ok('List savings', Array.isArray(r.data.data));
  r = await req('PUT', `/money/expense/${expId}`, { amount: 60000 }, userToken);
  ok('Update expense', r.status === 200);
  r = await req('GET', '/money/summary', null, userToken);
  ok('Money summary', r.data.data?.totalExpense !== undefined);
  r = await req('GET', '/money/expense/categories', null, userToken);
  ok('Expense categories', r.data.data !== undefined);
  r = await req('GET', '/money/saving/categories', null, userToken);
  ok('Saving categories', r.data.data !== undefined);
  r = await req('GET', '/money/chart?period=monthly&year=2026', null, userToken);
  ok('Money chart', r.data.data !== undefined);
  r = await req('DELETE', `/money/expense/${expId}`, null, userToken);
  ok('Delete expense', r.status === 200);
  r = await req('DELETE', `/money/saving/${savId}`, null, userToken);
  ok('Delete saving', r.status === 200);

  console.log('\n=== 9. ESTATE MANAGEMENT ===');
  r = await req('POST', '/estate', { width: 5, length: 5 });
  ok('Create estate', r.status === 201);
  const estateId = r.data.data?.id;
  r = await req('POST', `/estate/${estateId}/tree`, { x: 1, y: 1, height: 10 });
  ok('Plant tree', r.status === 201);
  r = await req('POST', `/estate/${estateId}/tree`, { x: 3, y: 3, height: 20 });
  ok('Plant tree 2', r.status === 201);
  r = await req('GET', `/estate/${estateId}/trees`);
  ok('List trees', r.data.data?.length === 2);
  r = await req('GET', `/estate/${estateId}/stats`);
  ok('Estate stats', r.data.data?.treeCount === 2 && r.data.data?.maxHeight === 20);
  r = await req('GET', `/estate/${estateId}/drone-plan`);
  ok('Drone plan', r.data.data?.sum_distance > 0);
  r = await req('GET', '/estate');
  ok('List estates', Array.isArray(r.data.data) && r.data.data.length >= 1);
  // Validation
  r = await req('POST', '/estate', { width: -1, length: 5 });
  ok('Estate validation (negative)', r.status === 400);
  r = await req('POST', `/estate/${estateId}/tree`, { x: 99, y: 99, height: 10 });
  ok('Tree out of bounds rejected', r.status === 400);

  console.log('\n=== 10. LIBRARY MANAGEMENT ===');
  // Settings
  r = await req('GET', '/library/settings', null, adminToken);
  ok('Get library settings (default)', r.data.data?.borrow_duration_days === 7);
  r = await req('PUT', '/library/settings', { borrow_duration_days: 14, fine_per_day: 1000, overdue_tolerance_days: 2 }, adminToken);
  ok('Update settings (admin)', r.data.data?.borrow_duration_days === 14 && r.data.data?.fine_per_day === 1000);
  r = await req('PUT', '/library/settings', { fine_per_day: 1000 }, userToken);
  ok('Non-admin settings update rejected', r.status === 403);

  // Books
  r = await req('POST', '/library', { title: 'Laskar Pelangi', author: 'Andrea Hirata', isbn: '978-602-001-001', category: 'Fiksi', quantity: 3, shelf: 'A1' }, adminToken);
  ok('Create book', r.status === 201);
  const bookId = r.data.data?.id;
  r = await req('POST', '/library', { title: 'Sang Pemimpi', author: 'Andrea Hirata', isbn: '978-602-001-002', category: 'Fiksi', quantity: 2 }, adminToken);
  ok('Create book 2', r.status === 201);
  const bookId2 = r.data.data?.id;
  r = await req('POST', '/library', { title: 'Bumi', author: 'Tere Liye', isbn: '978-602-001-003', category: 'Fiksi', quantity: 1 }, adminToken);
  const bookId3 = r.data.data?.id;

  r = await req('GET', '/library', null, userToken);
  ok('List books', r.data.data?.books?.length >= 3);
  r = await req('GET', '/library/categories', null, userToken);
  ok('Get categories', r.data.data?.includes('Fiksi'));
  r = await req('GET', `/library/${bookId}`, null, userToken);
  ok('Get book detail', r.data.data?.title === 'Laskar Pelangi');
  r = await req('PUT', `/library/${bookId}`, { shelf: 'B2', description: 'Novel' }, adminToken);
  ok('Update book', r.data.data?.shelf === 'B2');
  // Empty body
  r = await req('POST', '/library', {}, adminToken);
  ok('Create book validation (empty)', r.status === 400);
  // Not found
  r = await req('GET', '/library/99999', null, userToken);
  ok('Get book not found', r.status === 404);

  // Borrow
  const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  r = await req('POST', `/library/${bookId}/borrow`, { due_date: dueDate, notes: 'Test pinjam' }, userToken);
  ok('Borrow book', r.status === 201);
  const borrowId = r.data.data?.id;
  r = await req('GET', '/library/borrowings', null, userToken);
  ok('List borrowings', r.data.data?.borrowings?.length >= 1);
  r = await req('GET', '/library/stats', null, userToken);
  ok('Library stats', r.data.data?.totalBooks >= 3);
  // Return
  r = await req('POST', `/library/${bookId}/return/${borrowId}`, null, userToken);
  ok('Return book', r.data.data?.status === 'returned' && r.data.data?.fine >= 0);

  // Admin borrow on behalf
  r = await req('POST', `/library/${bookId2}/borrow`, { due_date: dueDate, user_id: 2 }, adminToken);
  ok('Admin borrow on behalf', r.status === 201);
  const borrowId2 = r.data.data?.id;
  r = await req('POST', '/library/overdue/update', null, adminToken);
  ok('Overdue update', r.data.data?.updated !== undefined);

  // Delete book with no active borrowings
  r = await req('DELETE', `/library/${bookId}`, null, adminToken);
  ok('Delete book', r.data.data?.message?.includes('hapus'));
  // Delete book with active borrowing
  r = await req('DELETE', `/library/${bookId2}`, null, adminToken);
  ok('Delete book with active borrowing rejected', r.status === 400);

  // Fine tolerance check
  const sett = await LibrarySetting.findByPk(1);
  ok('Tolerance settings saved', sett?.overdue_tolerance_days === 2);
  // Reset settings
  await req('PUT', '/library/settings', { borrow_duration_days: 7, fine_per_day: 500, overdue_tolerance_days: 1 }, adminToken);

  console.log('\n=== 11. CHAT ===');
  r = await req('GET', '/chat/rooms', null, adminToken);
  ok('List chat rooms', Array.isArray(r.data.data));
  r = await req('POST', '/chat/rooms', { name: 'Test Room', type: 'group' }, adminToken);
  ok('Create chat room', r.status === 201);
  const roomId = r.data.data?.id;
  r = await req('GET', `/chat/${roomId}/messages`, null, adminToken);
  ok('Get chat messages', Array.isArray(r.data.data));
  r = await req('GET', '/chat/online', null, adminToken);
  ok('Online users', Array.isArray(r.data.data));

  console.log('\n=== 12. ADMIN ENDPOINTS ===');
  r = await req('GET', '/admin/users', null, adminToken);
  ok('Admin list users', Array.isArray(r.data.data));
  r = await req('GET', '/admin/users', null, userToken);
  ok('Non-admin blocked from admin/users', r.status === 403);

  console.log('\n=== 13. HEALTH TRAFFIC ===');
  // Generate some traffic first
  await req('GET', '/health');
  await req('GET', '/health/ready');
  await new Promise(res => setTimeout(res, 1000));
  r = await req('GET', '/health-traffic/stats?period=24h', null, adminToken);
  ok('Traffic stats (admin)', r.data.data?.totalRequests >= 0);
  r = await req('GET', '/health-traffic/stats?period=1h', null, adminToken);
  ok('Traffic stats 1h period', r.data.data?.totalRequests !== undefined);
  r = await req('GET', '/health-traffic/stats', null, userToken);
  ok('Non-admin blocked from traffic', r.status === 403);

  console.log('\n=== 14. DASHBOARD ===');
  r = await req('GET', '/api/dashboard/summary', null, adminToken);
  ok('Dashboard summary', r.data?.data !== undefined || r.status === 200);

  console.log('\n=== 15. FRONTEND BUILD ===');
  const { execSync: ex } = require('child_process');
  try {
    const buildOut = ex('npm run build:fe', { cwd: __dirname, timeout: 60000 }).toString();
    ok('Frontend build succeeds', buildOut.includes('built in'));
  } catch (e) {
    ok('Frontend build succeeds', false);
    console.log('    Build error:', e.message?.substring(0, 200));
  }

  console.log('\n=== 16. UNIT TESTS ===');
  try {
    const testOut = ex('npm test', { cwd: __dirname, timeout: 60000 }).toString();
    const allPass = testOut.includes('62 passed');
    ok('Backend unit tests (62 passed)', allPass);
    if (!allPass) console.log('    ', testOut.substring(testOut.indexOf('Tests:'), testOut.indexOf('Tests:') + 60));
  } catch (e) {
    ok('Backend unit tests', false);
    console.log('    ', e.message?.substring(0, 200));
  }
  try {
    const feOut = ex('npx vitest run', { cwd: __dirname + '/client', timeout: 60000 }).toString();
    const fePass = feOut.includes('6 passed');
    ok('Frontend unit tests (6 passed)', fePass);
    if (!fePass) console.log('    ', feOut.substring(feOut.indexOf('Tests'), feOut.indexOf('Tests') + 40));
  } catch (e) {
    ok('Frontend unit tests', false);
    console.log('    ', e.message?.substring(0, 200));
  }

  console.log(`\n${'='.repeat(55)}`);
  console.log(`  TOTAL: ${total} | PASSED: ${pass} | FAILED: ${fail}`);
  console.log(`${'='.repeat(55)}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
