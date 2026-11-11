const fs = require('fs');
const path = require('path');
const vm = require('vm');

const jsDir = path.resolve(__dirname, 'www', 'js');
if (!fs.existsSync(jsDir)) {
  console.error(`Directory not found: ${jsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
console.log(`Checking syntax for ${files.length} JS files in ${jsDir}...\n`);
let hasError = false;

for (const file of files) {
  const filePath = path.join(jsDir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  try {
    new vm.Script(code, { filename: file });
    console.log(`✅ [SYNTAX OK] ${file}`);
  } catch (err) {
    console.error(`❌ [SYNTAX ERROR] ${file}: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    hasError = true;
  }
}

if (hasError) {
  console.error('\n❌ Syntax validation failed!');
  process.exit(1);
} else {
  console.log(`\n✅ All ${files.length} JS files passed syntax validation successfully.`);
}
