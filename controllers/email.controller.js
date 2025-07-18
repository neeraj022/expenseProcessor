const { processPdfAttachment } = require('../services/emailProcessor.service');

exports.handleInboundEmail = async (req, res) => {
  console.log("Inbound email received.");

  if (!req.files || req.files.length === 0) {
    console.log("No attachments found.");
    return res.status(400).send("No attachments found.");
  }

  const pdfFiles = req.files.filter(
    (file) => file.mimetype === 'application/pdf'
  );

  if (pdfFiles.length === 0) {
    console.log("No PDF attachments found.");
    return res.status(200).send("No PDF attachments to process.");
  }
  
  res.status(200).send("Processing attachments."); // Respond immediately

  // Process each PDF asynchronously
  for (const file of pdfFiles) {
    await processPdfAttachment(file);
  }
};
