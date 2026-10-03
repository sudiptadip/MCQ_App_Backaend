const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) {
    console.log("File not found:", filePath);
    return;
  }
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

const src = path.join(__dirname, 'src');

replaceInFile(path.join(src, 'pages/display-view/UpsertDisplayViewPage.tsx'), [
  { from: /, isError: rootsError /g, to: ' ' },
  { from: /, isError: treeError /g, to: ' ' }
]);

replaceInFile(path.join(src, 'pages/mcq/UpsertMcqQuestionAnsPage.tsx'), [
  { from: /useLocation, /g, to: '' }
]);

replaceInFile(path.join(src, 'pages/practice/PracticeBrowsePage.tsx'), [
  { from: /\bClipboardList,\n?\s*/g, to: '' }
]);

replaceInFile(path.join(src, 'pages/practice/PracticeResultPage.tsx'), [
  { from: /\bAward,\n?\s*/g, to: '' },
  { from: /import \{\s*\} from '\.\.\/\.\.\/components\/ui\/card';/g, to: "import { Card } from '../../components/ui/card';" }
]);

replaceInFile(path.join(src, 'pages/practice/PracticeReviewPage.tsx'), [
  { from: /\buseLocation,\n?\s*/g, to: '' },
  { from: /\bChevronLeft,\n?\s*/g, to: '' }
]);

replaceInFile(path.join(src, 'pages/practice/PracticeTestPage.tsx'), [
  { from: /\bAlertCircle,\n?\s*/g, to: '' },
  { from: /\bHelpCircle,\n?\s*/g, to: '' },
  { from: /import \{ useState, useEffect, useCallback \} from 'react';/g, to: "import React, { useState, useEffect, useCallback } from 'react';" }
]);

replaceInFile(path.join(src, 'pages/test/UpsertTestPage.tsx'), [
  { from: /const \[filters, setFilters\] = useState<QuestionFilterParams>\(\{ page: 1, page_size: DEFAULT_PAGE_SIZE \}\);\s*/g, to: "const [filters, setFilters] = useState<QuestionFilterParams>({ page: 1, page_size: DEFAULT_PAGE_SIZE });\n  const [, setParentCategoryId] = useState<number | undefined>();\n" }
]);

console.log("Done fixing remaining TS errors");