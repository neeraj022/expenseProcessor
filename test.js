const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdfParse = require('pdf-parse');

// Custom PDF text renderer to handle multi-column layouts
function render_page_with_layout(pageData) {
    const round = (val, precision = 2) => parseFloat(val.toFixed(precision));

    // Group text items by y-coordinate to reconstruct lines
    const lines = pageData.getTextContent().items.reduce((acc, item) => {
        const y = round(item.transform[5]);
        if (!acc[y]) acc[y] = [];
        acc[y].push(item);
        return acc;
    }, {});

    // Sort y-coordinates from top to bottom (descending order)
    const sortedYCoords = Object.keys(lines).sort((a, b) => b - a);

    // For each line, sort items by x-coordinate (left to right) and join them
    return sortedYCoords.map(y => {
        const lineItems = lines[y];
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        return lineItems.map(item => item.str).join(' ');
    }).join('\n');
}

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
    try {
        // Try qpdf decryption, even if it emits warnings
        execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);
    } catch (error) {
        const stderr = error.stderr?.toString() || '';
        if (error.status === 3 && stderr.includes('WARNING')) {
        console.warn(`qpdf succeeded with warning: ${stderr}`);
        if (!fs.existsSync(outputPath)) {
            console.error(`Decrypted output file not found despite qpdf warning.`);
            return;
        }
        } else {
        throw error; // Re-throw real errors
        }
    }

    const decryptedBuffer = fs.readFileSync(outputPath);
    const options = {
        pagerender: render_page_with_layout
    };
    const data = await pdfParse(decryptedBuffer, options);
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
