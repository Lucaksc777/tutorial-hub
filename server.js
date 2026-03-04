require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, User } = require('./models');
const bcrypt = require('bcrypt');

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
  .then(async () => {
    console.log('Database connection established and models synced.');

    // Auto-criar admin se não houver usuários
    try {
      const userCount = await User.count();
      if (userCount === 0) {
        console.log('Banco de dados vazio. Criando usuário admin inicial...');
        const hashedPassword = await bcrypt.hash('8090', 10);
        await User.create({
          nome: 'Administrador',
          email: 'admin@email.com',
          password_hash: hashedPassword
        });
        console.log('✅ Usuário admin criado: admin@email.com / 8090');
      }
    } catch (e) {
      console.error('Erro ao criar admin inicial:', e.message);
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('Error syncing database:', err));
