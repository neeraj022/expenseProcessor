const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailController = require('../controllers/email.controller');

const upload = multer({ storage: multer.memoryStorage() });

// router.post(
//   '/inbound',
//   (req, res, next) => {
//     console.log('[ROUTE] /inbound hit!');
//     next();
//   },
//   upload.any(),
//   (req, res, next) => {
//     console.log(`[UPLOAD] Files received: ${req.files?.length}`);
//     console.log(`[BODY] Raw body:`, req.body);
//     next();
//   },
//   emailController.handleInboundEmail
// );

// TEMP: Do not use multer yet
router.post('/inbound', (req, res) => {
  console.log('[INBOUND HIT]');
  console.log('Headers:', req.headers);

  // Try to manually read the body (for now, if it's multipart this may be empty)
  let rawData = '';
  req.on('data', (chunk) => {
    rawData += chunk;
  });

  req.on('end', () => {
    console.log('Raw body (truncated):', rawData.slice(0, 500));
    res.status(200).send('Received');
  });

  req.on('error', (err) => {
    console.error('Error receiving data:', err);
    res.status(500).send('Server error');
  });
});

module.exports = router;
