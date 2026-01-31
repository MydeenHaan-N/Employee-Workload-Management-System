require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./models');

app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const workloadRoutes = require('./routes/workloadRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/tasks', taskRoutes);
app.use('/workload', workloadRoutes);

db.sequelize.sync({force:true}).then(() => {
    console.log("Table synced");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(err => console.log(err));