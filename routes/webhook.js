const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// Somente o n8n chama essa rota
router.post('/video', videoController.webhookN8n);

module.exports = router;
