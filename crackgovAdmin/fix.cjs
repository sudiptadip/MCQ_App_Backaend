const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
};

const componentsDir = path.join(__dirname, 'src', 'components', 'ui');
const filesToFix = ['badge.tsx', 'dialog.tsx', 'dropdown-menu.tsx', 'popover.tsx', 'progress.tsx', 'scroll-area.tsx', 'select.tsx', 'textarea.tsx'];

filesToFix.forEach(file => {
  const filePath = path.join(componentsDir, file);
  replaceInFile(filePath, [
    { from: /@\/lib\/utils/g, to: '../../lib/utils' },
    { from: /@\/components\/ui\/button/g, to: './button' }
  ]);
});

console.log("Done fixing UI imports");
