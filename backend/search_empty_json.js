const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(__dirname);

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('.json({})') || content.includes('.send({})')) {
    console.log(`Found empty JSON response in: ${file}`);
  }
});
console.log("Done checking files.");
