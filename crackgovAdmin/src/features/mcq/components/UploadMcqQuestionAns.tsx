import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Save, Trash2 } from 'lucide-react';
import { getCategories } from '../../category/api/category.api';
import { bulkUpsertQuestionAns, type UpsertQuestionPayload } from '../api/mcq.api';
import { downloadMcqTemplate } from '../../../utils/excelGenerator';
import { showToast } from '../../../utils/toast';

interface UploadRow {
    id: string;
    category_name: string;
    category_id?: number;
    difficulty_level: string;
    question_text: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    correct_answer: number | string;
    question_explanation?: string;
    tag?: string;
    isValid: boolean;
    errors: string[];
}



const UploadMcqQuestionAns = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<UploadRow[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories
    });

    const categoryMap = useMemo(() => {
        const map = new Map<string, number>();
        categories.forEach(c => {
            if (c.name) {
                map.set(c.name.replace(/\s+/g, ' ').trim().toLowerCase(), c.id);
            }
        });
        return map;
    }, [categories]);

    const bulkMutation = useMutation({
        mutationFn: bulkUpsertQuestionAns,
        onSuccess: (data) => {
            if (data.isSuccess) {
                showToast.success('Questions uploaded successfully');
                queryClient.invalidateQueries({ queryKey: ['questions'] });
                navigate('/question-ans');
            } else {
                showToast.error(data.message || 'Failed to upload questions');
            }
        },
        onError: (error) => {
            showToast.apiErrorShow(error);
        }
    });

    const handleDownloadTemplate = async () => {
        try {
            await downloadMcqTemplate(categories);
        } catch (error) {
            console.error("Template generation error:", error);
            showToast.error("Failed to generate Excel template");
        }
    };

    const validateRow = (row: Partial<UploadRow>): UploadRow => {
        const errors: string[] = [];
        let category_id: number | undefined;

        // Category validation
        const catName = (row.category_name || '').toString().replace(/\s+/g, ' ').trim();
        if (!catName) {
            errors.push('Category name is required');
        } else {
            const mappedId = categoryMap.get(catName.toLowerCase());
            if (!mappedId) {
                errors.push(`Category '${catName}' not found`);
            } else {
                category_id = mappedId;
            }
        }

        // Difficulty validation
        const rawDiff = (row.difficulty_level || '').toString();
        const diff = rawDiff.replace(/\s+/g, '').toLowerCase();
        if (!diff) {
            errors.push('Difficulty level is required');
        } else if (!['easy', 'medium', 'hard'].includes(diff)) {
            errors.push(`Difficulty must be Easy, Medium, or Hard (Got: "${rawDiff}")`);
        }

        // Question validation
        if (!(row.question_text || '').toString().trim()) {
            errors.push('Question is required');
        }

        // Options validation
        if (!(row.option1 || '').toString().trim()) errors.push('Option 1 is required');
        if (!(row.option2 || '').toString().trim()) errors.push('Option 2 is required');
        if (!(row.option3 || '').toString().trim()) errors.push('Option 3 is required');
        if (!(row.option4 || '').toString().trim()) errors.push('Option 4 is required');

        // Correct Answer validation
        const correctAns = parseInt((row.correct_answer || '0').toString());
        if (isNaN(correctAns) || correctAns < 1 || correctAns > 4) {
            errors.push('Correct Answer must be a number between 1 and 4');
        }

        return {
            id: row.id || Math.random().toString(36).substr(2, 9),
            category_name: row.category_name || '',
            category_id,
            difficulty_level: diff || 'medium',
            question_text: row.question_text || '',
            option1: row.option1 || '',
            option2: row.option2 || '',
            option3: row.option3 || '',
            option4: row.option4 || '',
            correct_answer: correctAns || '',
            question_explanation: row.question_explanation || '',
            tag: row.tag || '',
            isValid: errors.length === 0,
            errors
        };
    };

    useEffect(() => {
        setRows(prevRows => {
            if (prevRows.length === 0) return prevRows;
            let hasChanges = false;
            const updatedRows = prevRows.map(row => {
                const validated = validateRow(row);
                if (validated.isValid !== row.isValid || validated.errors.length !== row.errors.length) {
                    hasChanges = true;
                }
                return validated;
            });
            return hasChanges ? updatedRows : prevRows;
        });
    }, [categoryMap]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

                // Skip header row and empty rows
                const dataRows = data.slice(1).filter((r: any[]) => r.length > 0 && r.some(c => c !== undefined && c !== null && c !== ''));
                
                const parsedRows = dataRows.map(row => {
                    return validateRow({
                        category_name: row[0]?.toString() || '',
                        difficulty_level: row[1]?.toString() || '',
                        question_text: row[2]?.toString() || '',
                        option1: row[3]?.toString() || '',
                        option2: row[4]?.toString() || '',
                        option3: row[5]?.toString() || '',
                        option4: row[6]?.toString() || '',
                        correct_answer: row[7]?.toString() || '',
                        question_explanation: row[8]?.toString() || '',
                        tag: row[9]?.toString() || '',
                    });
                });

                setRows(parsedRows);
            } catch (error) {
                showToast.error("Failed to parse Excel file. Please ensure it matches the template.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleRowChange = (id: string, field: keyof UploadRow, value: string) => {
        setRows(prev => prev.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                return validateRow(updated);
            }
            return r;
        }));
    };

    const removeRow = (id: string) => {
        setRows(prev => prev.filter(r => r.id !== id));
    };

    const handleSave = () => {
        if (rows.length === 0) return;

        const payload: UpsertQuestionPayload[] = rows.map(r => {
            const correctIndex = parseInt(r.correct_answer.toString()) - 1;
            
            return {
                question: {
                    category_id: r.category_id!,
                    difficulty_level: r.difficulty_level.toLowerCase(),
                    question_text: r.question_text,
                    question_explanation: r.question_explanation || undefined,
                    tag: r.tag || undefined,
                    is_active: true
                },
                options: [
                    { option_text: r.option1, is_correct: correctIndex === 0 },
                    { option_text: r.option2, is_correct: correctIndex === 1 },
                    { option_text: r.option3, is_correct: correctIndex === 2 },
                    { option_text: r.option4, is_correct: correctIndex === 3 },
                ]
            };
        });

        bulkMutation.mutate(payload);
    };

    const allValid = rows.length > 0 && rows.every(r => r.isValid);
    const validCount = rows.filter(r => r.isValid).length;
    const invalidCount = rows.length - validCount;

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center gap-4 text-center">
                <div 
                    className={`border-2 border-dashed rounded-lg p-12 w-full max-w-2xl transition-colors ${
                        isDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                            processFile(file);
                        } else {
                            showToast.error("Please upload a valid Excel file (.xlsx or .xls)");
                        }
                    }}
                >
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Drag and drop your Excel file here, or click to browse.
                    </p>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                            <Upload size={16} />
                            Browse File
                        </button>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 border bg-background hover:bg-accent text-accent-foreground rounded-md transition-colors"
                        >
                            <Download size={16} />
                            Download Template
                        </button>
                    </div>
                </div>
            </div>

            {rows.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                <Check size={14} /> {validCount} Valid
                            </div>
                            {invalidCount > 0 && (
                                <div className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <AlertCircle size={14} /> {invalidCount} Invalid
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRows([])}
                                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!allValid || bulkMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {bulkMutation.isPending ? 'Saving...' : <><Save size={16} /> Save Valid Questions</>}
                            </button>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-x-auto bg-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 font-semibold w-10">St</th>
                                    <th className="p-3 font-semibold min-w-[150px]">Category</th>
                                    <th className="p-3 font-semibold w-24">Difficulty</th>
                                    <th className="p-3 font-semibold min-w-[200px]">Question</th>
                                    <th className="p-3 font-semibold min-w-[120px]">Option 1</th>
                                    <th className="p-3 font-semibold min-w-[120px]">Option 2</th>
                                    <th className="p-3 font-semibold min-w-[120px]">Option 3</th>
                                    <th className="p-3 font-semibold min-w-[120px]">Option 4</th>
                                    <th className="p-3 font-semibold w-24">Answer</th>
                                    <th className="p-3 font-semibold min-w-[150px]">Explanation</th>
                                    <th className="p-3 font-semibold min-w-[120px]">Tags</th>
                                    <th className="p-3 font-semibold w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <React.Fragment key={row.id}>
                                    <tr className={`group ${!row.isValid ? 'bg-rose-50/50' : ''}`}>
                                        <td className="p-2 align-top">
                                            <div className="mt-2 flex justify-center" title={row.errors.join('\n')}>
                                                {row.isValid ? (
                                                    <Check className="text-emerald-500 w-5 h-5" />
                                                ) : (
                                                    <AlertCircle className="text-rose-500 w-5 h-5 cursor-help" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.category_name}
                                                onChange={(e) => handleRowChange(row.id, 'category_name', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm ${row.errors.some(e => e.includes('Category')) ? 'border-rose-300 bg-rose-50 focus:ring-rose-200' : 'focus:ring-primary/20'}`}
                                            />
                                            {row.errors.filter(e => e.includes('Category')).map(err => (
                                                <div key={err} className="text-xs text-rose-500 mt-1">{err}</div>
                                            ))}
                                        </td>
                                        <td className="p-2 align-top">
                                            <select 
                                                value={['easy', 'medium', 'hard'].includes((row.difficulty_level || '').toLowerCase()) ? (row.difficulty_level || '').toLowerCase() : ''}
                                                onChange={(e) => handleRowChange(row.id, 'difficulty_level', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm capitalize ${row.errors.some(e => e.includes('Difficulty')) ? 'border-rose-300 bg-rose-50 text-rose-700' : ''}`}
                                            >
                                                {!['easy', 'medium', 'hard'].includes((row.difficulty_level || '').toLowerCase()) && (
                                                    <option value="">Invalid...</option>
                                                )}
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </td>
                                        <td className="p-2 align-top">
                                            <textarea 
                                                value={row.question_text}
                                                onChange={(e) => handleRowChange(row.id, 'question_text', e.target.value)}
                                                rows={2}
                                                className={`w-full p-1.5 border rounded text-sm resize-none ${row.errors.some(e => e.includes('Question')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.option1}
                                                onChange={(e) => handleRowChange(row.id, 'option1', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm ${row.errors.some(e => e.includes('Option 1')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.option2}
                                                onChange={(e) => handleRowChange(row.id, 'option2', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm ${row.errors.some(e => e.includes('Option 2')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.option3}
                                                onChange={(e) => handleRowChange(row.id, 'option3', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm ${row.errors.some(e => e.includes('Option 3')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.option4}
                                                onChange={(e) => handleRowChange(row.id, 'option4', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm ${row.errors.some(e => e.includes('Option 4')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                type="number"
                                                min={1}
                                                max={4}
                                                value={row.correct_answer}
                                                onChange={(e) => handleRowChange(row.id, 'correct_answer', e.target.value)}
                                                className={`w-full p-1.5 border rounded text-sm text-center ${row.errors.some(e => e.includes('Correct Answer')) ? 'border-rose-300 bg-rose-50' : ''}`}
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <textarea 
                                                value={row.question_explanation}
                                                onChange={(e) => handleRowChange(row.id, 'question_explanation', e.target.value)}
                                                rows={2}
                                                className="w-full p-1.5 border rounded text-sm resize-none"
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <input 
                                                value={row.tag}
                                                onChange={(e) => handleRowChange(row.id, 'tag', e.target.value)}
                                                className="w-full p-1.5 border rounded text-sm"
                                            />
                                        </td>
                                        <td className="p-2 align-top">
                                            <button 
                                                onClick={() => removeRow(row.id)}
                                                className="mt-1.5 p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                title="Remove row"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    {!row.isValid && row.errors.length > 0 && (
                                        <tr>
                                            <td colSpan={12} className="p-2 text-rose-600 text-sm bg-rose-50/50 border-b border-rose-100">
                                                <div className="flex gap-2 font-medium">
                                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <div>
                                                        <strong>Errors:</strong>
                                                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                                                            {row.errors.map((err, i) => (
                                                                <li key={i}>{err}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadMcqQuestionAns;
