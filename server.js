require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');
const { errorHandler } = require('./middlewares/apiResponse');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');
const authenticateToken = require('./middlewares/authenticate');
const bmiController = require('./controllers/bmiController');
const bloodSugarController = require('./controllers/bloodSugarController');
const vitalSignsController = require('./controllers/vitalSignsController');

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

const app = express();
app.use(cors());
app.use(express.json());
const clientDist = path.join(__dirname, 'client', 'dist');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-bmi-app-2024';
function secureTools(req, res, next) {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
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

app.use(express.static(clientDist));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bmi', apiLimiter, bmiRoutes);
app.use('/api/bloodsugar', apiLimiter, bloodSugarRoutes);
app.use('/api/identities', apiLimiter, identityRoutes);
app.use('/api/export', apiLimiter, reportRoutes);
app.use('/api/money', apiLimiter, moneyRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/patient-health', patientHealthRoutes);
app.use('/api/vital-signs', apiLimiter, vitalSignsRoutes);

app.get('/api/dashboard/summary', authenticateToken, bmiController.getSummary);
app.get('/api/history/:identityId/bmi', authenticateToken, bmiController.getHistoryBMI);
app.get('/api/history/:identityId/bloodsugar', authenticateToken, bloodSugarController.getHistoryBloodSugar);
app.get('/api/history/:identityId/vitalsigns', authenticateToken, vitalSignsController.getHistoryVitalSigns);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync({ force: false })
  .then(async () => {
    console.log('Database synced successfully!');

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bmi-app.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

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

    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = app;
