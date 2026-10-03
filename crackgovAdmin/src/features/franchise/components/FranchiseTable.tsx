import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ActionButton from './ActionButton';
import { Eye, Pencil, Plus, Trash2, BookOpen } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../../components/ui/DataTable';
import type Franchise from '../../../types/database/Franchise';
import { STATUS_STYLES } from '../../../constants/cssStyles';
import { getFranchises } from '../api/franchise.api';
import Error from '../../../components/common/Error';
import AssignFranchiseCategoryModal from './AssignFranchiseCategoryModal';

const FranchiseTable = () => {
    const navigate = useNavigate();
    const [assignCategoryFranchise, setAssignCategoryFranchise] = useState<{ id: number; name: string } | null>(null);

    const columns: ColumnDef<Franchise>[] = [
        {
            accessorKey: "id",
            header: "#",
            size: 60,
            enableSorting: false,
        },
        {
            accessorKey: "name",
            header: "Franchise Name",
        },
        {
            accessorKey: "owner_name",
            header: "Owner",
        },
        {
            accessorKey: "contact_email",
            header: "Email",
            cell: ({ getValue }) => (
                <a
                    href={`mailto:${getValue<string>()}`}
                    className="text-primary underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {getValue<string>()}
                </a>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ getValue }) => {
                const status = getValue<boolean>();
                const statusLabel = status ? "Active" : "Inactive";
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[statusLabel as keyof typeof STATUS_STYLES]}`}>
                        {statusLabel}
                    </span>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Joined",
            cell: ({ getValue }) =>
                getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }) : "N/A",
        },
        {
            id: "__actions__",
            header: "Actions",
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <ActionButton title="View" onClick={() => alert(`View: ${row.original.name}`)}>
                        <Eye size={14} />
                    </ActionButton>
                    <ActionButton title="Edit" onClick={() => navigate(`/franchise/edit/${row.original.id}`)}>
                        <Pencil size={14} />
                    </ActionButton>
                    <ActionButton title="Delete" variant="danger" onClick={() => alert(`Delete: ${row.original.name}`)}>
                        <Trash2 size={14} />
                    </ActionButton>
                    <ActionButton 
                        title="Assign Category" 
                        onClick={() => setAssignCategoryFranchise({ id: row.original.id, name: row.original.name })}
                    >
                        <BookOpen size={14} />
                    </ActionButton>
                </div>
            ),
        },
    ];

    const { 
        data: franchises = [], 
        isLoading, 
        isError, 
        refetch 
    } = useQuery({
        queryKey: ['franchises'],
        queryFn: getFranchises
    });

    if (isError) {
        return (
            <div className="p-6">
                <Error 
                    title="Franchises not found" 
                    message="There was an error fetching the franchise list." 
                    onRetry={() => refetch()} 
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <DataTable
                data={franchises}
                isLoading={isLoading}
                columns={columns}
                title="Franchise Management"
                description="All registered franchises — click a row to view details."
                enableSorting
                enableSearch
                searchPlaceholder="Search franchise, owner, city..."
                enablePagination
                defaultPageSize={10}
                enableExcelExport
                exportFileName="franchise-list"
                enableColumnVisibility
                onRowClick={(row) => console.log("Row clicked:", row)}
                toolbarActions={
                    <button
                        id="franchise-add-btn"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                        onClick={() => navigate("/franchise/create")}
                    >
                        <Plus size={14} />
                        Add Franchise
                    </button>
                }
            />

            <AssignFranchiseCategoryModal
                franchiseId={assignCategoryFranchise?.id ?? null}
                franchiseName={assignCategoryFranchise?.name ?? null}
                onClose={() => setAssignCategoryFranchise(null)}
            />
        </div>
    );
}

export default FranchiseTable;