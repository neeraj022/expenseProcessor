const { processPdfAttachment } = require('../services/emailProcessor.service');

exports.handleInboundEmail = async (req, res) => {
  console.log("[CONTROLLER] Inbound email received.");

  try {
  if (!req.files || req.files.length === 0) {
    console.log("No attachments found.");
    return res.status(400).send("No attachments found.");
  }

 const pdfFiles = req.files.filter(
  (file) =>
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf')
);

  if (pdfFiles.length === 0) {
    console.log("No PDF attachments found.");
    return res.status(200).send("No PDF attachments to process.");
  }
  
  console.log('[CONTROLLER] Processing complete. Sending 200 OK.');
  res.status(200).send("Processing attachments."); // Respond immediately

  // Process each PDF asynchronously
  for (const file of pdfFiles) {
    await processPdfAttachment(file);
  }
} catch (error) {
    console.error("[CONTROLLER] Error processing inbound email:", error);
    res.status(500).send("Internal server error while processing email.");
}};
