require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // For production, replace '*' with your frontend domain and n8n webhook caller IP.
}));
app.use(express.json());
app.use(express.static('public')); // Serve the frontend SPA

// Load Routes
const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const videoRoutes = require('./routes/videos');

// API Endpoints
app.use('/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/videos', videoRoutes);

// Database Sync and Server Init
const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database connection established and models synced.');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error('Error syncing database:', err));
