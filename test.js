const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');


file=fs.readFile('/Users/neeraj/Downloads/4315XXXXXXXX9011_261752_Retail_Amazon_NORM.pdf');
tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
const inputPath = path.join(tempDir, file.originalname);
const outputPath = path.join(tempDir, `decrypted-${file.originalname}`);
const password = 'neer1211';

fs.writeFileSync(inputPath, file.buffer);

execSync(`qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`);

const decryptedBuffer = fs.readFileSync(outputPath);
const data = await pdfParse(decryptedBuffer);
pdfText = data.text;

console.log(`PDF text extracted successfully from`, pdfText);