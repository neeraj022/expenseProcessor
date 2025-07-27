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
    next();
  },
  emailController.handleInboundEmail
);

module.exports = router;
