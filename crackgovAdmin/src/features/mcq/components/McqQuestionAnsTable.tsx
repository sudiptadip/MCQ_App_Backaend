import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../../components/ui/DataTable';
import { getQuestionAnsList, deleteQuestionAns, type QuestionWithDetails } from '../api/mcq.api';
import Error from '../../../components/common/Error';
import { showToast } from '../../../utils/toast';

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

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');

    // Debounce search keyword changes to avoid excessive API requests
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchKeyword(searchKeyword);
            setPageIndex(0); // Reset to first page when search query changes
        }, 500);

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    const {
        data,
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ['questions', pageIndex + 1, pageSize, debouncedSearchKeyword],
        queryFn: () => getQuestionAnsList({
            pageNumber: pageIndex + 1,
            pageSize,
            searchKeyword: debouncedSearchKeyword
        })
    });

    const questions = data?.questions ?? [];
    const totalCount = data?.totalCount ?? 0;

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
                enableSorting
                enableSearch
                searchPlaceholder="Search questions..."
                enablePagination
                defaultPageSize={10}
                manualPagination={true}
                totalRows={totalCount}
                paginationState={{ pageIndex, pageSize }}
                onPaginationChange={(page, size) => {
                    setPageIndex(page);
                    setPageSize(size);
                }}
                onSearchChange={(val) => {
                    setSearchKeyword(val);
                }}
                onRowClick={(row: any) => {
                    const id = row?.original?.question?.id ?? row?.original?.id;
                    if (id) {
                        navigate(`/question-ans/edit/${id}`, { state: { questionData: row.original } });
                    }
                }}
                toolbarActions={
                    <div className="flex items-center gap-2">
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
