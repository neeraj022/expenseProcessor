const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailController = require('../controllers/email.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/inbound',
  (req, res, next) => {
    console.log('[ROUTE] /inbound hit!');
    next();
  },
  upload.any(),
  (req, res, next) => {
    console.log(`[UPLOAD] Files received: ${req.files?.length}`);
    console.log(`[BODY] Raw body:`, req.body);
    const incomingKey = req.body?.securityKey;

    if (!incomingKey || incomingKey !== process.env.SECURITY_KEY) {
      console.warn('[SECURITY] Invalid or missing security key');
      return res.status(403).json({ error: 'Forbidden: Invalid security key' });
    }
    next();
  },
  emailController.handleInboundEmail
);

module.exports = router;
