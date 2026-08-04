const fs = require('fs');
const path = require('path');

const PATTERNS_ROOT = path.join(__dirname, '..', 'patterns');

function read_component_patterns(componentType, framework) {
  const dir = path.join(PATTERNS_ROOT, framework);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((filename) => filename.toLowerCase().startsWith(componentType.toLowerCase()))
    .map((filename) => ({
      filename,
      source: fs.readFileSync(path.join(dir, filename), 'utf8'),
    }));
}

module.exports = { read_component_patterns };

if (require.main === module) {
  console.log("('Button', 'react')   -> count:", read_component_patterns('Button', 'react').length);
  console.log("('Alert', 'react')    -> count:", read_component_patterns('Alert', 'react').length);
  console.log("('Chip', 'react')     -> count:", read_component_patterns('Chip', 'react').length, '(was 0 before this pattern existed)');
  console.log("('Button', 'angular') -> count:", read_component_patterns('Button', 'angular').length, '(was 0 before this pattern existed)');
  console.log("('Modal', 'react')    -> count:", read_component_patterns('Modal', 'react').length, '(was 0 before this pattern existed)');
}
