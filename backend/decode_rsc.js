const fs = require('fs');

const html = fs.readFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\ownverso_page.html', 'utf8');

// Find all matches for self.__next_f.push
const regex = /self\.__next_f\.push\(\[\d+,\s*"([\s\S]*?)"\]\)/g;
let match;
let fullPayload = "";
while ((match = regex.exec(html)) !== null) {
  let content = match[1];
  fullPayload += content;
}

// Decode unicode escape sequences like \u003c, \u003e, etc.
// Also unescape standard control characters
let decoded = fullPayload
  .replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)))
  .replace(/\\n/g, '\n')
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\5487a710-4833-48dc-8f7a-2cfc6fd8d96d\\scratch\\decoded_payload.txt', decoded);
console.log("Decoded payload length:", decoded.length);
console.log("Decoded payload saved to decoded_payload.txt");
console.log("Contains '<p>':", decoded.includes('<p>'));
console.log("Contains '</p>':", decoded.includes('</p>'));
