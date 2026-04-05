require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const db = require('./models');

// ──────────────────────────────────────────────
// IMPORTANT: Add this BEFORE routes
// Allows OPTIONS preflight for PUT/DELETE/PATCH
// Many people miss this → causes 404 on CORS preflight
// ──────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',           // your Vite frontend port
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],   // ← explicitly allow PUT & DELETE
  allowedHeaders: ['Content-Type', 'Authorization'],      // ← needed for Bearer token
}));

// Handle preflight OPTIONS requests globally
app.options('*', cors());

// ──────────────────────────────────────────────

app.use(express.json());

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/roles', require('./routes/roleRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/workload', require('./routes/workloadRoutes'));

// ──────────────────────────────────────────────
// Optional: Debug route to confirm server is alive
// Visit http://localhost:5000/ in browser → should show message
// ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running!',
    time: new Date().toISOString(),
    routes: ['/auth', '/users', '/roles', '/tasks', '/workload']
  });
});

const seedRoles = async () => {
  const defaultRoles = [
    { name: 'admin', description: 'Full access to manage roles, users, and system data.' },
    { name: 'manager', description: 'Can manage tasks for team members assigned by an admin.' },
    { name: 'employee', description: 'Can view and update personal assigned tasks.' },
  ];

  for (const role of defaultRoles) {
    await db.Role.findOrCreate({
      where: { name: role.name },
      defaults: role,
    });
  }

  const users = await db.User.findAll({ where: { roleId: null } });
  for (const user of users) {
    const matchingRole = await db.Role.findOne({ where: { name: user.role } });
    if (matchingRole) {
      await user.update({ roleId: matchingRole.id });
    }
  }
};

db.sequelize.sync({ alter: true })
  .then(() => {
    return seedRoles();
  })
  .then(() => {
    console.log("Database tables synced successfully");
    const PORT = process.env.PORT || 5000; // fallback if .env missing
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend should be at http://localhost:5173`);
      console.log(`Test root: http://localhost:${PORT}/`);
    });
  })
  .catch(err => {
    console.error("Database sync failed:", err);
  });
