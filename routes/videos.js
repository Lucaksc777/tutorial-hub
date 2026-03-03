const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');

// Rotas protegidas (Requer JWT)
router.get('/', authMiddleware, videoController.getVideos);

module.exports = router;
