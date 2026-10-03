import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { getDisplayViews, deleteDisplayView } from '../../features/display-view/api/displayView.api';
import { showToast } from '../../utils/toast';
import type DisplayView from '../../types/database/DisplayView';
import Error from '../../components/common/Error';
import { ActionButton } from '../../features/mcq/components/McqQuestionAnsTable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import AssignStudentModal from '../../features/display-view/components/AssignStudentModal';

const DisplayViewListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [assignStudentNode, setAssignStudentNode] = React.useState<DisplayView | null>(null);

  const { data: roots = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['displayViews'],
    queryFn: getDisplayViews,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDisplayView,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['displayViews'] });
        setDeleteId(null);
      } else {
        showToast.error(res.message || 'Delete failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const columns: ColumnDef<DisplayView>[] = [
    { accessorKey: 'id', header: '#', size: 60, enableSorting: false },
    {
      accessorKey: 'display_name',
      header: 'Display Name',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      id: '__actions__',
      header: 'Actions',
      size: 150,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.original?.id;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              title="Assign Students"
              onClick={(e) => { e.stopPropagation(); if (row.original) setAssignStudentNode(row.original); }}
            >
              <Users size={14} />
            </ActionButton>
            <ActionButton
              title="Edit"
              onClick={(e) => { e.stopPropagation(); if (id) navigate(`/display-view/edit/${id}`); }}
            >
              <Pencil size={14} />
            </ActionButton>
            <ActionButton
              title="Delete"
              variant="danger"
              onClick={(e) => { e.stopPropagation(); if (id) setDeleteId(id); }}
            >
              <Trash2 size={14} />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <Error title="Failed to load" message="Error fetching display view list." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <DataTable
        data={roots}
        columns={columns}
        isLoading={isLoading || deleteMutation.isPending}
        title="Display Views"
        description="Manage root display views. Click Edit to manage a root and its children."
        enableSorting
        enableSearch
        searchPlaceholder="Search display views..."
        enablePagination
        defaultPageSize={10}
        onRowClick={(row: any) => {
          const id = row?.original?.id;
          if (id) navigate(`/display-view/edit/${id}`);
        }}
        toolbarActions={
          <button
            id="btn-create-display-view"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            onClick={() => navigate('/display-view/create')}
          >
            <Plus size={14} /> Create Display View
          </button>
        }
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Display View?</DialogTitle>
            <DialogDescription>
              This will permanently delete the root and all its children. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AssignStudentModal
        node={assignStudentNode}
        onClose={() => setAssignStudentNode(null)}
      />
    </div>
  );
};

export default DisplayViewListPage;
