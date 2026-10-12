const fs = require('fs');

const data = JSON.parse(fs.readFileSync('novelsData.json', 'utf8'));
console.log("Total novels in novelsData.json:", data.length);
data.forEach((n, i) => {
  console.log(`${i+1}: ${n.title} (${n.chaptersCount} chapters)`);
});
