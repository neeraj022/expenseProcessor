const express = require('express');
const router = express.Router();
const multer = require('multer');
const emailController = require('../controllers/email.controller');

const upload = multer({ storage: multer.memoryStorage() });

// This route will be used by your email forwarding service (e.g., SendGrid, Mailgun)
router.post(
  '/inbound',
  upload.any(), // .any() is flexible for various multipart field names
  emailController.handleInboundEmail
);

module.exports = router;
