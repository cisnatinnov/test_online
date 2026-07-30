require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const { sequelize, User } = require('./models');
const { errorHandler } = require('./middlewares/apiResponse');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');
const authenticateToken = require('./middlewares/authenticate');
const bmiController = require('./controllers/bmiController');
const bloodSugarController = require('./controllers/bloodSugarController');
const vitalSignsController = require('./controllers/vitalSignsController');
const chatController = require('./controllers/chatController');

const authRoutes = require('./routes/authRoutes');
const bmiRoutes = require('./routes/bmiRoutes');
const bloodSugarRoutes = require('./routes/bloodSugarRoutes');
const identityRoutes = require('./routes/identityRoutes');
const reportRoutes = require('./routes/reportRoutes');
const moneyRoutes = require('./routes/moneyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');
const patientHealthRoutes = require('./routes/patientHealthRoutes');
const vitalSignsRoutes = require('./routes/vitalSignsRoutes');
const estateRoutes = require('./routes/estateRoutes');
const chatRoutes = require('./routes/chatRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const healthTrafficRoutes = require('./routes/healthTrafficRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const healthTrafficMiddleware = require('./middlewares/healthTraffic');

const app = express();
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN;
const allowedCorsOrigins = corsOrigin === '*' ? [] : (corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : []);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedCorsOrigins.length === 0) return callback(null, true);
    if (!allowedCorsOrigins.includes(origin)) return callback(new Error('CORS origin not allowed'), false);
    callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
const clientDist = path.join(__dirname, 'client', 'dist');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET;
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_TEMP_SECRET', 'DB_NAME', 'DB_USER', 'DB_PASS', 'ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
function secureTools(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');
  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) return res.status(403).send('Invalid token');
    next();
  });
}

const securePrefixes = ['/games/', '/math/', '/ner/'];
app.use((req, res, next) => {
  if (securePrefixes.some((p) => req.path.startsWith(p))) return secureTools(req, res, next);
  next();
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

app.use('/api', healthTrafficMiddleware);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bmi', apiLimiter, bmiRoutes);
app.use('/api/bloodsugar', apiLimiter, bloodSugarRoutes);
app.use('/api/identities', apiLimiter, identityRoutes);
app.use('/api/export', apiLimiter, reportRoutes);
app.use('/api/money', apiLimiter, moneyRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/health', apiLimiter, healthRoutes);
app.use('/api/patient-health', apiLimiter, patientHealthRoutes);
app.use('/api/health-traffic', apiLimiter, healthTrafficRoutes);
app.use('/api/vital-signs', apiLimiter, vitalSignsRoutes);
app.use('/api/estate', apiLimiter, estateRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/library', apiLimiter, libraryRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);

app.get('/api/history/:identityId/bmi', authenticateToken, bmiController.getHistoryBMI);
app.get('/api/history/:identityId/bloodsugar', authenticateToken, bloodSugarController.getHistoryBloodSugar);
app.get('/api/history/:identityId/vitalsigns', authenticateToken, vitalSignsController.getHistoryVitalSigns);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (fs.existsSync(clientDist)) {
    return res.sendFile(path.join(clientDist, 'index.html'));
  }
  return res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err.message);
});

const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io',
});

chatController.initSocket(io);

sequelize.sync({ alter: true, force: false })
  .then(async () => {
    console.log('Database synced successfully!');

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`Admin account created: ${adminUsername}`);
    }

    server.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);

    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = { app, server, io };
