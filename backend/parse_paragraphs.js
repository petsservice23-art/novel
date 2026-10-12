const fs = require('fs');

const payload = fs.readFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\decoded_payload.txt', 'utf8');

const paras = [];
const regex = /<p>([\s\S]*?)<\/p>/gi;
let match;
while ((match = regex.exec(payload)) !== null) {
  const pText = match[1].trim();
  if (pText) {
    paras.push(pText);
  }
}

paras.forEach((p, idx) => {
  console.log(`${idx + 1}: ${p.slice(0, 100)}${p.length > 100 ? '...' : ''}`);
});
