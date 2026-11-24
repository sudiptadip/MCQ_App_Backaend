import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../../components/ui/DataTable';
import { getQuestionAnsList, deleteQuestionAns, type QuestionWithDetails } from '../api/mcq.api';
import Error from '../../../components/common/Error';
import { showToast } from '../../../utils/toast';
import { storage } from '../../../utils/storage';
import { STORAGE_KEYS, ROLES } from '../../../constants';
import type { User } from '../../auth/types';

export function ActionButton({
    children,
    title,
    onClick,
    variant = "default",
}: {
    children: React.ReactNode;
    title: string;
    onClick: (e: React.MouseEvent) => void;
    variant?: "default" | "danger";
}) {
    return (
        <button
            title={title}
            onClick={onClick}
            className={`flex items-center justify-center w-7 h-7 rounded transition-colors ${variant === "danger"
                ? "text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
        >
            {children}
        </button>
    );
}

const McqQuestionAnsTable = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const currentUser = storage.get<User>(STORAGE_KEYS.USER);
    const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;

    const deleteMutation = useMutation({
        mutationFn: deleteQuestionAns,
        onSuccess: (data) => {
            if (data.isSuccess) {
                showToast.success(data.message || 'Question deleted successfully');
                queryClient.invalidateQueries({ queryKey: ['questions'] });
            } else {
                showToast.error(data.message || 'Failed to delete question');
            }
        },
        onError: (error) => {
            showToast.apiErrorShow(error);
        }
    });

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            deleteMutation.mutate(id);
        }
    };

    const columns: ColumnDef<QuestionWithDetails>[] = [
        {
            accessorFn: (row: QuestionWithDetails) => row?.question?.id ?? row?.id,
            id: "id",
            header: "#",
            size: 60,
            enableSorting: false,
        },
        {
            accessorFn: (row: QuestionWithDetails) => row?.question?.question_text ?? row?.question_text,
            id: "question_text",
            header: "Question Text",
            cell: ({ getValue }) => {
                const text = getValue<string>() || "N/A";
                return (
                    <div className="max-w-xs truncate" title={text}>
                        {text}
                    </div>
                );
            }
        },
        {
            accessorFn: (row: QuestionWithDetails) => row?.question?.category_name ?? row?.category_name,
            id: "category_name",
            header: "Category",
            cell: ({ getValue }) => getValue<string>() || "N/A"
        },
        {
            accessorFn: (row: QuestionWithDetails) => row?.question?.difficulty_level ?? row?.difficulty_level,
            id: "difficulty_level",
            header: "Difficulty",
            cell: ({ getValue }) => {
                const level = getValue<string>() || "medium";
                const colorMap: Record<string, string> = {
                    easy: "bg-emerald-100 text-emerald-800",
                    medium: "bg-amber-100 text-amber-800",
                    hard: "bg-rose-100 text-rose-800"
                };
                console.log(getValue<string>());
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorMap[level.toLowerCase()] || colorMap.medium}`}>
                        {level}
                    </span>
                );
            }
        },
        {
            accessorFn: (row: QuestionWithDetails) => row?.question?.upload_lot_number ?? row?.upload_lot_number,
            id: "upload_lot_number",
            header: "Lot / Sheet",
            cell: ({ row }) => {
                const lot = row?.original?.question?.upload_lot_number ?? row?.original?.upload_lot_number;
                const sheet = row?.original?.question?.sheet_name ?? row?.original?.sheet_name;

                if (!lot && !sheet) {
                    return <span className="text-muted-foreground text-xs">—</span>;
                }

                return (
                    <div className="flex flex-col gap-0.5 max-w-[150px]">
                        {lot ? (
                            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                Lot #{lot}
                            </span>
                        ) : null}
                        {sheet ? (
                            <span 
                                className="text-[11px] text-muted-foreground truncate" 
                                title={sheet}
                            >
                                {sheet}
                            </span>
                        ) : null}
                    </div>
                );
            }
        },
        {
            id: "options",
            header: "Correct Answer",
            cell: ({ row }) => {
                const options = row?.original?.options || [];
                const correctOption = options.find(o => o.is_correct);
                return (
                    <span className="font-medium text-emerald-600">
                        {correctOption ? correctOption.option_text : "Not set"}
                    </span>
                );
            }
        },
        {
            id: "__actions__",
            header: "Actions",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => {
                const id = row.original?.question?.id ?? row.original?.id;
                return (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <ActionButton
                            title="Edit"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (id) {
                                    navigate(`/question-ans/edit/${id}`, { state: { questionData: row.original } });
                                }
                            }}
                        >
                            <Pencil size={14} />
                        </ActionButton>
                        <ActionButton
                            title="Delete"
                            variant="danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (id) {
                                    handleDelete(id);
                                }
                            }}
                        >
                            <Trash2 size={14} />
                        </ActionButton>
                    </div>
                );
            },
        },
    ];

    const [pageSize, setPageSize] = useState(10);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

    // Cursor-based pagination state
    const [cursor, setCursor] = useState<number | null>(null);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [currentPage, setCurrentPage] = useState(1);
    const [cachedTotalCount, setCachedTotalCount] = useState<number | undefined>(undefined);

    // Debounce search keyword changes to avoid excessive API requests
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchKeyword(searchKeyword);
            setCursor(null);
            setDirection('next');
            setCurrentPage(1);
            setCachedTotalCount(undefined); // Refresh total count when searching
        }, 500);

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        refetch
    } = useQuery({
        queryKey: ['questions', cursor, direction, pageSize, debouncedSearchKeyword],
        queryFn: () => getQuestionAnsList({
            cursor,
            direction,
            pageSize,
            searchKeyword: debouncedSearchKeyword,
            includeTotalCount: cachedTotalCount === undefined ? 1 : 0
        })
    });

    // Cache totalCount when returned by API
    useEffect(() => {
        if (data?.totalCount !== undefined && data.totalCount > 0) {
            setCachedTotalCount(data.totalCount);
        }
    }, [data?.totalCount]);

    const questions = data?.questions ?? [];
    const totalCount = cachedTotalCount ?? data?.totalCount ?? 0;

    const handleNextPage = () => {
        if (!data?.hasNextPage || !data?.endCursor) return;
        setCursor(data.endCursor);
        setDirection('next');
        setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (!data?.hasPrevPage || !data?.startCursor) return;
        setCursor(data.startCursor);
        setDirection('prev');
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleFirstPage = () => {
        setCursor(null);
        setDirection('next');
        setCurrentPage(1);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCursor(null);
        setDirection('next');
        setCurrentPage(1);
    };

    if (isError) {
        return (
            <div className="p-6">
                <Error
                    title="Questions not found"
                    message="There was an error fetching the question list."
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <DataTable
                data={questions}
                isLoading={isLoading || deleteMutation.isPending}
                columns={columns}
                title="MCQ Questions Management"
                description="All configured multiple choice questions."
                enableSorting={false}
                enableSearch
                searchPlaceholder="Search questions, sheet, lot #..."
                enablePagination
                cursorPagination={{
                    hasNextPage: Boolean(data?.hasNextPage),
                    hasPrevPage: Boolean(data?.hasPrevPage && currentPage > 1),
                    onNextPage: handleNextPage,
                    onPrevPage: handlePrevPage,
                    onFirstPage: handleFirstPage,
                    currentPage,
                    pageSize,
                    onPageSizeChange: handlePageSizeChange,
                    totalRows: totalCount,
                    currentRowsCount: questions.length,
                    isLoading: isLoading || isFetching,
                }}
                onSearchChange={(val) => {
                    setSearchKeyword(val);
                }}
                onRowClick={(row: any) => {
                    const id = row?.question?.id ?? row?.id ?? row?.original?.question?.id ?? row?.original?.id;
                    if (id) {
                        navigate(`/question-ans/edit/${id}`, { state: { questionData: row?.original ?? row } });
                    }
                }}
                toolbarActions={
                    <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-rose-500/30 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                                onClick={() => navigate("/question-ans/advanced-delete")}
                                title="Advanced delete: duplicate questions & sheet lot numbers (Super Admin only)"
                            >
                                <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
                                Advance Delete
                            </button>
                        )}
                        <button
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                            onClick={() => navigate("/question-ans/upload")}
                        >
                            Upload Excel
                        </button>
                        <button
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                            onClick={() => navigate("/question-ans/create")}
                        >
                            <Plus size={14} />
                            Add Question
                        </button>
                    </div>
                }
            />
        </div>
    );
};

export default McqQuestionAnsTable;
