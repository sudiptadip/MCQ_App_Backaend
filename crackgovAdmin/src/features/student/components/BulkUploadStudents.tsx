import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Users,
  AlertTriangle,
  RotateCcw,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Plus
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { getAvailableCategories, bulkRegisterStudents, checkExistingEmails } from '../api/student.api';
import { downloadStudentTemplate } from '../../../utils/excelGenerator';
import { showToast } from '../../../utils/toast';
import type RegisterStudentDto from '../types/RegisterStudentDto';

export interface ParsedStudentRow {
  rowNumber: number;
  name: string;
  email: string;
  mobileNo: string;
  parentName: string;
  password: string;
  rawCategories: string;
  matchedCategories: { id: number; name: string }[];
  invalidCategories: string[];
  categoryIds: number[];
  isValid: boolean;
  errors: string[];
}

interface BulkUploadStudentsProps {
  onCancel?: () => void;
}

const BulkUploadStudents = ({ onCancel }: BulkUploadStudentsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'errors' | 'valid'>('all');

  // Track emails verified as existing in the database
  const [dbExistingEmails, setDbExistingEmails] = useState<Set<string>>(new Set());

  // Edit Row Dialog State
  const [editingRow, setEditingRow] = useState<ParsedStudentRow | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    mobileNo: '',
    parentName: '',
    password: '',
    rawCategories: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isCheckingEmailInEdit, setIsCheckingEmailInEdit] = useState(false);

  // Fetch available franchise categories
  const { data: categories = [] } = useQuery({
    queryKey: ['available-categories-for-student'],
    queryFn: getAvailableCategories,
    staleTime: 60 * 1000,
  });

  // Map of normalized category name -> Category info
  const categoryMap = useMemo(() => {
    const map = new Map<string, { id: number; name: string }>();
    categories.forEach((c) => {
      if (c.name) {
        const key = c.name.replace(/\s+/g, ' ').trim().toLowerCase();
        map.set(key, { id: c.id, name: c.name.trim() });
      }
    });
    return map;
  }, [categories]);

  // Download sample template
  const handleDownloadTemplate = async () => {
    try {
      await downloadStudentTemplate(categories);
      showToast.success('Sample template downloaded successfully');
    } catch (error) {
      console.error('Template generation error:', error);
      showToast.error('Failed to generate Excel template');
    }
  };

  // Re-validation function: verifies formatting, intra-sheet duplicates, and DB existence
  const revalidateRows = (
    rawRowsList: {
      rowNumber: number;
      name: string;
      email: string;
      mobileNo: string;
      parentName: string;
      password: string;
      rawCategories: string;
    }[],
    dbEmails: Set<string>
  ): ParsedStudentRow[] => {
    // 1. Calculate email frequency in this sheet
    const sheetEmailCounts = new Map<string, number>();
    rawRowsList.forEach((r) => {
      const e = (r.email || '').trim().toLowerCase();
      if (e) {
        sheetEmailCounts.set(e, (sheetEmailCounts.get(e) || 0) + 1);
      }
    });

    // 2. Validate each row
    return rawRowsList.map((r) => {
      const errors: string[] = [];
      const name = (r.name || '').trim();
      const email = (r.email || '').trim();
      const mobileNo = (r.mobileNo || '').trim();
      const parentName = (r.parentName || '').trim();
      const password = (r.password || '').trim();
      const rawCategories = (r.rawCategories || '').trim();

      // Name validation
      if (!name) {
        errors.push('Student Name is required');
      } else if (name.length < 2) {
        errors.push('Student Name must be at least 2 characters');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        errors.push('Email Address is required');
      } else if (!emailRegex.test(email)) {
        errors.push(`Invalid email format: "${email}"`);
      } else {
        const lowerEmail = email.toLowerCase();
        if ((sheetEmailCounts.get(lowerEmail) || 0) > 1) {
          errors.push(`Duplicate email found in this sheet: "${email}"`);
        }
        if (dbEmails.has(lowerEmail)) {
          errors.push(`Email already exists in database: "${email}"`);
        }
      }

      // Mobile validation
      if (!mobileNo) {
        errors.push('Mobile Number is required');
      } else {
        const cleanDigits = mobileNo.replace(/\D/g, '');
        if (cleanDigits.length < 10) {
          errors.push(`Mobile number must be at least 10 digits (got "${mobileNo}")`);
        }
      }

      // Parent Name validation
      if (!parentName) {
        errors.push("Parent's Name is required");
      } else if (parentName.length < 2) {
        errors.push("Parent's Name must be at least 2 characters");
      }

      // Password validation
      if (!password) {
        errors.push('Password is required');
      } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }

      // Categories validation (comma-separated names)
      const matchedCategories: { id: number; name: string }[] = [];
      const invalidCategories: string[] = [];
      const categoryIds: number[] = [];

      if (rawCategories) {
        const catTokens = rawCategories
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        catTokens.forEach((token) => {
          const normalized = token.replace(/\s+/g, ' ').toLowerCase();
          const found = categoryMap.get(normalized);

          if (found) {
            if (!categoryIds.includes(found.id)) {
              categoryIds.push(found.id);
              matchedCategories.push(found);
            }
          } else {
            invalidCategories.push(token);
            errors.push(`Category "${token}" not found in available franchise categories`);
          }
        });
      }

      return {
        rowNumber: r.rowNumber,
        name,
        email,
        mobileNo,
        parentName,
        password,
        rawCategories,
        matchedCategories,
        invalidCategories,
        categoryIds,
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  // File parsing handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          showToast.error('The selected Excel sheet contains no rows.');
          setRows([]);
          setIsParsing(false);
          return;
        }

        // 1. Extract raw values
        const rawRows = jsonData.map((rowRaw: any, idx: number) => {
          const findValue = (...possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              for (const rawKey of Object.keys(rowRaw)) {
                if (rawKey.trim().toLowerCase() === key.toLowerCase()) {
                  return rowRaw[rawKey];
                }
              }
            }
            return '';
          };

          return {
            rowNumber: idx + 2,
            name: String(findValue('Student Name', 'name', 'StudentName', 'Full Name') || '').trim(),
            email: String(findValue('Email Address', 'email', 'EmailAddress', 'Email') || '').trim(),
            mobileNo: String(findValue('Mobile Number', 'mobile', 'MobileNo', 'Phone', 'Contact') || '').trim(),
            parentName: String(findValue('Parent Name', 'parent', 'ParentName', 'Father Name', 'FatherName') || '').trim(),
            password: String(findValue('Password', 'pass') || '').trim(),
            rawCategories: String(
              findValue('Categories (Comma Separated)', 'categories', 'category', 'Categories', 'Category Names') || ''
            ).trim(),
          };
        });

        // 2. Query DB to check which emails already exist in database
        const distinctEmails = rawRows
          .map((r) => r.email.toLowerCase())
          .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        let dbEmailsSet = new Set<string>();
        if (distinctEmails.length > 0) {
          try {
            const existingInDb = await checkExistingEmails(distinctEmails);
            dbEmailsSet = new Set(existingInDb.map((em) => em.toLowerCase()));
          } catch (dbErr) {
            console.error('Failed to check database emails:', dbErr);
          }
        }
        setDbExistingEmails(dbEmailsSet);

        // 3. Validate rows with DB email check
        const validated = revalidateRows(rawRows, dbEmailsSet);
        setRows(validated);

        const errorCount = validated.filter((r) => !r.isValid).length;
        if (errorCount === 0) {
          showToast.success(`Successfully parsed ${validated.length} valid students!`);
        } else {
          const dbDupCount = validated.filter((r) =>
            r.errors.some((err) => err.includes('already exists in database'))
          ).length;
          const dbMsg = dbDupCount > 0 ? ` (${dbDupCount} already in database)` : '';
          showToast.warning(
            `Parsed ${validated.length} rows. ${errorCount} row(s) contain errors${dbMsg}. You can edit or delete them below.`
          );
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        showToast.error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setRows([]);
    setFileName('');
    setFileSize('');
    setDbExistingEmails(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // ROW ACTIONS: DELETE & EDIT
  // ---------------------------------------------------------------------------
  const handleDeleteRow = (rowNumber: number) => {
    const updatedRaw = rows
      .filter((r) => r.rowNumber !== rowNumber)
      .map((r) => ({
        rowNumber: r.rowNumber,
        name: r.name,
        email: r.email,
        mobileNo: r.mobileNo,
        parentName: r.parentName,
        password: r.password,
        rawCategories: r.rawCategories,
      }));

    const revalidated = revalidateRows(updatedRaw, dbExistingEmails);
    setRows(revalidated);
    showToast.success(`Row #${rowNumber} deleted`);
  };

  const handleOpenEdit = (row: ParsedStudentRow) => {
    setEditingRow(row);
    setEditFormData({
      name: row.name,
      email: row.email,
      mobileNo: row.mobileNo,
      parentName: row.parentName,
      password: row.password,
      rawCategories: row.rawCategories,
    });
    setShowEditPassword(false);
  };

  const toggleCategoryInEdit = (categoryName: string) => {
    const currentTokens = editFormData.rawCategories
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const exists = currentTokens.some((t) => t.toLowerCase() === categoryName.toLowerCase());
    let newTokens: string[];
    if (exists) {
      newTokens = currentTokens.filter((t) => t.toLowerCase() !== categoryName.toLowerCase());
    } else {
      newTokens = [...currentTokens, categoryName];
    }

    setEditFormData((prev) => ({
      ...prev,
      rawCategories: newTokens.join(', '),
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;

    const newEmail = editFormData.email.trim().toLowerCase();
    const updatedDbEmails = new Set(dbExistingEmails);

    // If email changed and is formatted, check if it exists in DB
    if (newEmail && newEmail !== editingRow.email.toLowerCase()) {
      setIsCheckingEmailInEdit(true);
      try {
        const foundInDb = await checkExistingEmails([newEmail]);
        if (foundInDb.length > 0) {
          updatedDbEmails.add(newEmail);
        } else {
          updatedDbEmails.delete(newEmail);
        }
        setDbExistingEmails(updatedDbEmails);
      } catch (err) {
        console.error('Email check error in edit:', err);
      } finally {
        setIsCheckingEmailInEdit(false);
      }
    }

    // Map updated values
    const updatedRaw = rows.map((r) => {
      if (r.rowNumber === editingRow.rowNumber) {
        return {
          rowNumber: r.rowNumber,
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          mobileNo: editFormData.mobileNo.trim(),
          parentName: editFormData.parentName.trim(),
          password: editFormData.password.trim(),
          rawCategories: editFormData.rawCategories.trim(),
        };
      }
      return {
        rowNumber: r.rowNumber,
        name: r.name,
        email: r.email,
        mobileNo: r.mobileNo,
        parentName: r.parentName,
        password: r.password,
        rawCategories: r.rawCategories,
      };
    });

    const revalidated = revalidateRows(updatedRaw, updatedDbEmails);
    setRows(revalidated);
    setEditingRow(null);
    showToast.success(`Row #${editingRow.rowNumber} updated successfully`);
  };

  // Bulk Register Mutation
  const bulkMutation = useMutation({
    mutationFn: bulkRegisterStudents,
    onSuccess: (data) => {
      if (data.isSuccess) {
        const res = data.data;
        const msg = res
          ? `${res.successCount} of ${res.totalProcessed} students registered successfully!`
          : data.message || 'Students registered successfully!';
        showToast.success(msg);
        queryClient.invalidateQueries({ queryKey: ['students'] });
        navigate('/student');
      } else {
        showToast.error(data.message || 'Failed to bulk register students');
      }
    },
    onError: (error) => {
      showToast.apiErrorShow(error);
    },
  });

  // Filtered rows for the preview table
  const validRows = useMemo(() => rows.filter((r) => r.isValid), [rows]);
  const errorRows = useMemo(() => rows.filter((r) => !r.isValid), [rows]);

  const displayedRows = useMemo(() => {
    if (filterTab === 'valid') return validRows;
    if (filterTab === 'errors') return errorRows;
    return rows;
  }, [rows, filterTab, validRows, errorRows]);

  const totalAssignedCategoriesCount = useMemo(() => {
    return rows.reduce((acc, r) => acc + r.matchedCategories.length, 0);
  }, [rows]);

  const handleRegisterValid = () => {
    if (validRows.length === 0) {
      showToast.error('No valid students to register.');
      return;
    }

    const payload: RegisterStudentDto[] = validRows.map((r) => ({
      name: r.name,
      email: r.email,
      mobileNo: r.mobileNo,
      parentName: r.parentName,
      password: r.password,
      categoryIds: r.categoryIds,
    }));

    bulkMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & INSTRUCTIONS */}
      {/* ========================================================================= */}
      <Card className="border border-border/70 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Bulk Student Excel Upload
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload multiple students using an Excel sheet. Validate row data, check existing emails in database, and edit or delete rows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample Template
              </Button>
              {onCancel && (
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs">
                  Back
                </Button>
              )}
            </div>
          </div>

          {/* Guidelines Banner */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1.5">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Spreadsheet Column Guidelines:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
              <div>
                • <strong className="text-foreground">Student Name:</strong> Full name of student (min 2 chars)
              </div>
              <div>
                • <strong className="text-foreground">Email Address:</strong> Unique email (automatically checked against database)
              </div>
              <div>
                • <strong className="text-foreground">Mobile Number:</strong> At least 10 digits
              </div>
              <div>
                • <strong className="text-foreground">Parent Name:</strong> Full name of parent/guardian
              </div>
              <div>
                • <strong className="text-foreground">Password:</strong> Initial student login password (min 6 chars)
              </div>
              <div>
                • <strong className="text-foreground">Categories:</strong> Comma-separated category names (e.g.{' '}
                <em>Algebra, Chemistry</em>)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 2. FILE UPLOAD DROPZONE */}
      {/* ========================================================================= */}
      {rows.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-card'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            {isParsing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isParsing ? 'Verifying sheet & checking database emails...' : 'Click to select or drag and drop your Excel sheet here'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports Microsoft Excel files (.xlsx, .xls) and CSV (.csv)
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
              Max recommended: 500 rows per file
            </span>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. PARSED RESULTS, VERIFICATION METRICS & PREVIEW TABLE */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* File summary and reset bar */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-card border border-border flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{fileName}</p>
                <p className="text-[11px] text-muted-foreground">{fileSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFile}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Upload Different File
              </Button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Total Rows Parsed</span>
              <p className="text-xl font-bold text-foreground">{rows.length}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Valid Students
              </span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{validRows.length}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1">
              <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Rows with Errors
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{errorRows.length}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Categories Matched</span>
              <p className="text-xl font-bold text-primary">{totalAssignedCategoriesCount}</p>
            </div>
          </div>

          {/* Filter Tab bar */}
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All Rows ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('errors')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTab === 'errors'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                Errors Only ({errorRows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('valid')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  filterTab === 'valid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Valid Only ({validRows.length})
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {displayedRows.length} of {rows.length} rows
            </div>
          </div>

          {/* Verification Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider z-10">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 w-20 text-center">Status</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Parent Name</th>
                    <th className="p-3 min-w-[180px]">Categories</th>
                    <th className="p-3 min-w-[220px]">Verification / Issues</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        No rows found in this tab.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`transition-colors hover:bg-muted/30 ${
                          !row.isValid ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        {/* Row # in Excel */}
                        <td className="p-3 font-mono text-center text-muted-foreground text-[11px]">
                          {row.rowNumber}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3" /> Error
                            </span>
                          )}
                        </td>

                        {/* Name */}
                        <td className="p-3 font-medium text-foreground">
                          {row.name || <span className="text-rose-500 italic">Missing</span>}
                        </td>

                        {/* Email */}
                        <td className="p-3 font-mono text-[11px] text-foreground/90">
                          {row.email || <span className="text-rose-500 italic">Missing</span>}
                        </td>

                        {/* Mobile */}
                        <td className="p-3 text-foreground/90">
                          {row.mobileNo || <span className="text-rose-500 italic">Missing</span>}
                        </td>

                        {/* Parent Name */}
                        <td className="p-3 text-foreground/90">
                          {row.parentName || <span className="text-rose-500 italic">Missing</span>}
                        </td>

                        {/* Categories breakdown */}
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {/* Matched valid categories */}
                            {row.matchedCategories.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20"
                                title={`Category ID: ${c.id}`}
                              >
                                <Tag className="h-2.5 w-2.5" />
                                {c.name}
                              </span>
                            ))}

                            {/* Invalid / Unmatched categories */}
                            {row.invalidCategories.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                title="Not found in franchise categories"
                              >
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {c} (Not found)
                              </span>
                            ))}

                            {row.matchedCategories.length === 0 && row.invalidCategories.length === 0 && (
                              <span className="text-muted-foreground text-[11px] italic">
                                No categories
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Verification & Error details */}
                        <td className="p-3">
                          {row.isValid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ready to register
                            </span>
                          ) : (
                            <ul className="space-y-1">
                              {row.errors.map((err, i) => (
                                <li
                                  key={i}
                                  className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-start gap-1"
                                >
                                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{err}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>

                        {/* Action buttons: Edit & Delete */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              title="Edit this row"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.rowNumber)}
                              title="Delete this row from import"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. SUBMISSION ACTION BAR */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="text-xs">
              {errorRows.length > 0 ? (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {errorRows.length} row(s) contain errors. You can edit them using the ✏️ icon, delete them using the 🗑️ icon, or register only the {validRows.length} valid student(s).
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>All {rows.length} rows verified successfully with zero errors!</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFile}
                disabled={bulkMutation.isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRegisterValid}
                disabled={validRows.length === 0 || bulkMutation.isPending}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                {bulkMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Registering {validRows.length} Students...
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5" />
                    Register {validRows.length} Valid Student{validRows.length === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EDIT ROW MODAL */}
      {/* ========================================================================= */}
      {editingRow && (
        <Dialog open={true} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Pencil className="h-4 w-4 text-primary" />
                Edit Row #{editingRow.rowNumber} Data
              </DialogTitle>
              <DialogDescription className="text-xs">
                Correct values or categories directly. The row will be automatically re-verified upon saving.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Student Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Student Name *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Enter full name"
                  className="h-8 text-xs"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Email Address *</Label>
                  {isCheckingEmailInEdit && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Checking database...
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mobile Number *</Label>
                  <Input
                    type="tel"
                    value={editFormData.mobileNo}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNo: e.target.value })}
                    placeholder="9876543210"
                    className="h-8 text-xs"
                  />
                </div>

                {/* Parent Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Parent&apos;s Name *</Label>
                  <Input
                    value={editFormData.parentName}
                    onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                    placeholder="Parent or Guardian Name"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Password * (min 6 characters)</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-8 text-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Assigned Categories (Comma-separated)
                </Label>
                <Input
                  value={editFormData.rawCategories}
                  onChange={(e) => setEditFormData({ ...editFormData, rawCategories: e.target.value })}
                  placeholder="e.g. Algebra, Chemistry, Physics"
                  className="h-8 text-xs"
                />

                {/* Quick Toggle Available Category Pills */}
                {categories.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Click to toggle franchise categories:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-md border border-border/60 bg-muted/20">
                      {categories.map((c) => {
                        const isSelected = editFormData.rawCategories
                          .split(',')
                          .map((t) => t.trim().toLowerCase())
                          .includes(c.name.trim().toLowerCase());

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCategoryInEdit(c.name)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {isSelected ? <X className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setEditingRow(null)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="text-xs font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BulkUploadStudents;