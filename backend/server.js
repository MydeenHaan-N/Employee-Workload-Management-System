import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import db from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import workloadRoutes from './routes/workloadRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import { seedInitialUsers } from './services/seedInitialUsers.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/tasks', taskRoutes);
app.use('/workload', workloadRoutes);
app.use('/queries', queryRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running!',
    time: new Date().toISOString(),
    routes: ['/auth', '/users', '/roles', '/tasks', '/workload', '/queries'],
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
};

db.sequelize.sync({ alter: true })
  .then(() => seedRoles())
  .then(() => seedInitialUsers())
  .then(() => {
    console.log('Database tables synced successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Frontend should be at http://localhost:5173');
      console.log(`Test root: http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error('Database sync failed:', err);
  });
