const fs = require('fs');
const path = require('path');

const directory = './frontend';

const replacements = [
  { from: /ðŸ”’/g, to: '🔐' },
  { from: /ðŸ””/g, to: '🔔' },
  { from: /ðŸš—/g, to: '🚗' },
  { from: /ðŸ”§/g, to: '🔧' },
  { from: /ðŸš¨/g, to: '🚨' },
  { from: /Â₹/g, to: '₹' },
  { from: /âœ…/g, to: '✅' },
  { from: /ðŸ“±/g, to: '📱' },
  { from: /ðŸ“/g, to: '📍' },
  { from: /ðŸ’³/g, to: '💳' },
  { from: /ðŸš•/g, to: '🚕' },
  { from: /ðŸ›/g, to: '🛠️' },
  { from: /â•/g, to: '—' },
  { from: /Aeuro\$/g, to: '₹' },
  { from: /â’/g, to: "'" },
  { from: /â€¢/g, to: '•' },
  { from: /ðŸ¤–/g, to: '🤖' },
  { from: /ðŸ‘¨â€/g, to: '👨' },
  { from: /ðŸš»/g, to: '🚻' },
  { from: /ðŸš²/g, to: '🚲' }
];

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  replacements.forEach(r => {
    if (r.from.test(content)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.html')) {
      cleanFile(filePath);
    }
  });
}

processDirectory(directory);
console.log('Final Mojibake Cleanup Complete.');
