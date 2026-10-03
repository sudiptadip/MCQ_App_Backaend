import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ActionButton from '../../franchise/components/ActionButton';
import { Eye, Plus, Smartphone, BookOpen } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../../components/ui/DataTable';
import type { User as Student } from '../../../types/database/User';
import { getStudents, resetUserDevice } from '../api/student.api';
import AssignCategoryModal from './AssignCategoryModal';
import Error from '../../../components/common/Error';
import { showToast } from '../../../utils/toast';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

const StudentTable = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [resetDeviceUserId, setResetDeviceUserId] = useState<number | null>(null);
    const [assignCategoryStudent, setAssignCategoryStudent] = useState<{ id: number; name: string } | null>(null);

    const resetDeviceMutation = useMutation({
        mutationFn: resetUserDevice,
        onSuccess: (data) => {
            if (data.isSuccess) {
                showToast.success(data.message || 'Device reset successfully');
                queryClient.invalidateQueries({ queryKey: ['students'] });
            } else {
                showToast.error(data.message || 'Failed to reset device');
            }
            setResetDeviceUserId(null);
        },
        onError: (error) => {
            showToast.apiErrorShow(error);
            setResetDeviceUserId(null);
        }
    });

    const handleResetDevice = (userId: number) => {
        setResetDeviceUserId(userId);
    };

    const columns: ColumnDef<Student>[] = [
        {
            accessorKey: "id",
            header: "#",
            size: 60,
            enableSorting: false,
        },
        {
            accessorKey: "name",
            header: "Student Name",
        },
        {
            accessorKey: "email",
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
                    <ActionButton title="View Details & Fees" onClick={() => navigate(`/student/details/${row.original.id}`)}>
                        <Eye size={14} />
                    </ActionButton>
                    <ActionButton title="Edit Details" onClick={() => navigate(`/student/details/${row.original.id}`)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-pen"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
                    </ActionButton>
                    <ActionButton 
                        title="Reset Device" 
                        onClick={() => handleResetDevice(row.original.id)}
                    >
                        <Smartphone size={14} />
                    </ActionButton>
                    <ActionButton 
                        title="Assign Category" 
                        onClick={() => setAssignCategoryStudent({ id: row.original.id, name: row.original.name })}
                    >
                        <BookOpen size={14} />
                    </ActionButton>
                </div>
            ),
        },
    ];

    const { 
        data: students = [], 
        isLoading, 
        isError, 
        refetch 
    } = useQuery({
        queryKey: ['students'],
        queryFn: getStudents
    });

    if (isError) {
        return (
            <div className="p-6">
                <Error 
                    title="Students not found" 
                    message="There was an error fetching the student list." 
                    onRetry={() => refetch()} 
                />
            </div>
        );
    }

    return (
        <div className="p-6">
            <DataTable
                data={students}
                isLoading={isLoading || resetDeviceMutation.isPending}
                columns={columns}
                title="Student Management"
                description="List of all registered students."
                enableSorting
                enableSearch
                searchPlaceholder="Search student name or email..."
                enablePagination
                defaultPageSize={10}
                enableExcelExport
                exportFileName="student-list"
                enableColumnVisibility
                onRowClick={(row) => navigate(`/student/details/${row.id}`)}
                toolbarActions={
                    <button
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                        onClick={() => navigate("/student/create")}
                    >
                        <Plus size={14} />
                        Add Student
                    </button>
                }
            />

            <ConfirmDialog
                isOpen={resetDeviceUserId !== null}
                onClose={() => setResetDeviceUserId(null)}
                onConfirm={() => {
                    if (resetDeviceUserId) {
                        resetDeviceMutation.mutate(resetDeviceUserId);
                    }
                }}
                title="Reset Student Device"
                description="Are you sure you want to reset this student's device limit? They will be able to log in from a new device."
                confirmText="Reset Device"
                cancelText="Cancel"
                variant="danger"
                isLoading={resetDeviceMutation.isPending}
            />

            <AssignCategoryModal
                studentId={assignCategoryStudent?.id ?? null}
                studentName={assignCategoryStudent?.name ?? null}
                onClose={() => setAssignCategoryStudent(null)}
            />
        </div>
    );
}

export default StudentTable;