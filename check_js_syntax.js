const fs = require('fs');

// Check all JS files in www/js
const files = fs.readdirSync('d:/anti/APP/www/js').filter(f => f.endsWith('.js'));
console.log('Found JS files:', files);

for (const file of files) {
  const content = fs.readFileSync('d:/anti/APP/www/js/' + file, 'utf8');
  try {
    new Function(content);
    console.log('✅ ' + file + ' syntax OK');
  } catch (err) {
    console.error('❌ Error in ' + file + ':', err.message);
  }
}
