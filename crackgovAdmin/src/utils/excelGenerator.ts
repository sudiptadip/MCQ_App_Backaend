import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Category } from '../types/database/Category';

const TEMPLATE_HEADERS = [
    'Category Name',
    'Difficulty Level',
    'Question',
    'Option 1',
    'Option 2',
    'Option 3',
    'Option 4',
    'Correct Answer (1-4)',
    'Explanation',
    'Tags'
];

export const downloadMcqTemplate = async (categories: Category[]) => {
    const workbook = new ExcelJS.Workbook();
    
    // Create the main visible sheet
    const mainSheet = workbook.addWorksheet('Template');
    
    // Create a hidden sheet for category data (for the dropdown)
    const dataSheet = workbook.addWorksheet('HiddenData');
    dataSheet.state = 'hidden';

    // Populate HiddenData sheet with categories
    const categoryNames = categories.map(c => c.name).filter(Boolean) as string[];
    if (categoryNames.length > 0) {
        categoryNames.forEach((cat, index) => {
            dataSheet.getCell(`A${index + 1}`).value = cat;
        });
    }

    // Setup main sheet headers
    mainSheet.addRow(TEMPLATE_HEADERS);
    
    // Style headers
    const headerRow = mainSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo 600
    };
    
    // Adjust column widths
    mainSheet.columns = [
        { width: 25 }, // Category
        { width: 15 }, // Difficulty
        { width: 50 }, // Question
        { width: 20 }, // Opt 1
        { width: 20 }, // Opt 2
        { width: 20 }, // Opt 3
        { width: 20 }, // Opt 4
        { width: 20 }, // Correct Ans
        { width: 30 }, // Explanation
        { width: 20 }, // Tags
    ];

    // Add a sample row
    mainSheet.addRow([
        categoryNames.length > 0 ? categoryNames[0] : "Sample Category", 
        "Medium", 
        "What is the capital of France?", 
        "London", 
        "Berlin", 
        "Paris", 
        "Madrid", 
        3,
        "Paris is the capital of France.",
        "geography,capitals"
    ]);

    // Apply data validation to rows 2 to 1000
    for (let i = 2; i <= 1000; i++) {
        // Category Dropdown (Column A)
        if (categoryNames.length > 0) {
            mainSheet.getCell(`A${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`HiddenData!$A$1:$A$${categoryNames.length}`]
            };
        }

        // Difficulty Dropdown (Column B)
        mainSheet.getCell(`B${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Easy,Medium,Hard"']
        };

        // Correct Answer Dropdown (Column H)
        mainSheet.getCell(`H${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"1,2,3,4"']
        };
    }

    // Add Conditional Formatting for Options (Columns D, E, F, G)
    // Option 1 (D) green if H=1
    mainSheet.addConditionalFormatting({
        ref: 'D2:D1000',
        rules: [
            {
                type: 'expression',
                formulae: ['$H2=1'],
                priority: 1,
                style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' } } } // Emerald 100
            }
        ]
    });
    // Option 2 (E) green if H=2
    mainSheet.addConditionalFormatting({
        ref: 'E2:E1000',
        rules: [
            {
                type: 'expression',
                formulae: ['$H2=2'],
                priority: 2,
                style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' } } }
            }
        ]
    });
    // Option 3 (F) green if H=3
    mainSheet.addConditionalFormatting({
        ref: 'F2:F1000',
        rules: [
            {
                type: 'expression',
                formulae: ['$H2=3'],
                priority: 3,
                style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' } } }
            }
        ]
    });
    // Option 4 (G) green if H=4
    mainSheet.addConditionalFormatting({
        ref: 'G2:G1000',
        rules: [
            {
                type: 'expression',
                formulae: ['$H2=4'],
                priority: 4,
                style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD1FAE5' } } }
            }
        ]
    });

    // Generate blob and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'MCQ_Upload_Template.xlsx');
};
