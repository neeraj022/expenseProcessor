const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfParse = require('pdf-parse');

async function runTest() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  let inputPath;
  let outputPath;

  try {
    const filePath = '/Users/neeraj/Downloads/4315XXXXXXXX9011_261752_Retail_Amazon_NORM.pdf';
    const password = 'neer1211';

    const file = {
      originalname: path.basename(filePath),
      buffer: fs.readFileSync(filePath),
    };

    inputPath = path.join(tempDir, file.originalname);
    outputPath = path.join(tempDir, `decrypted-${file.originalname}`);

    fs.writeFileSync(inputPath, file.buffer);

    // Decrypt the PDF using qpdf
    execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);

    const decryptedBuffer = fs.readFileSync(outputPath);
    const data = await pdfParse(decryptedBuffer);
    const pdfText = data.text;

    console.log(`PDF text extracted successfully from ${file.originalname}:`);
    console.log('--- START OF EXTRACTED TEXT ---');
    console.log(pdfText);
    console.log('--- END OF EXTRACTED TEXT ---');

  } catch (error) {
    console.error('Test script failed:', error.message);
    if (error.stderr) {
      console.error('qpdf error:', error.stderr.toString());
    }
  } finally {
    // Cleanup temporary files
    try {
      if (inputPath) fs.unlinkSync(inputPath);
      if (outputPath) fs.unlinkSync(outputPath);
      fs.rmdirSync(tempDir);
      console.log('Cleaned up temporary files.');
    } catch (cleanupError) {
      console.error('Failed to cleanup temporary files:', cleanupError);
    }
  }
}

runTest();
