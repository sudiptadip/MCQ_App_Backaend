import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/ui/DataTable';
import { getStudyMaterialList, deleteStudyMaterial } from '../../features/study-material/api/studyMaterial.api';
import { showToast } from '../../utils/toast';
import type { StudyMaterial } from '../../types/database/StudyMaterial';
import Error from '../../components/common/Error';
import { ActionButton } from '../../features/mcq/components/McqQuestionAnsTable';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

const StudyMaterialListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

  const { data: studyMaterials = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['studyMaterials'],
    queryFn: getStudyMaterialList,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudyMaterial,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
        setDeleteId(null);
      } else {
        showToast.error(res.message || 'Delete failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const columns: ColumnDef<StudyMaterial>[] = [
    { accessorKey: 'id', header: '#', size: 60, enableSorting: false },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      size: 150,
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>() || '—'}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      size: 150,
      cell: ({ getValue }) => (
        <span className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
          {getValue<string>() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'url',
      header: 'Link',
      cell: ({ getValue }) => {
        const url = getValue<string>();
        return url ? (
           <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
             View <ExternalLink size={12} />
           </a>
        ) : '—';
      }
    },
    {
      id: '__actions__',
      header: 'Actions',
      size: 120,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.original?.id;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              title="Edit"
              onClick={(e) => { e.stopPropagation(); if (id) navigate(`/study-material/edit/${id}`); }}
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
        <Error title="Failed to load" message="Error fetching study material list." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6 animate-in fade-in zoom-in-95 duration-500">
      <DataTable
        data={studyMaterials}
        columns={columns}
        isLoading={isLoading || deleteMutation.isPending}
        title="Study Materials"
        description="Manage study materials like PDFs, videos, or external links."
        enableSorting
        enableSearch
        searchPlaceholder="Search materials..."
        enablePagination
        defaultPageSize={10}
        onRowClick={(row: any) => {
          const id = row?.original?.id;
          if (id) navigate(`/study-material/edit/${id}`);
        }}
        toolbarActions={
          <button
            id="btn-create-study-material"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-md"
            onClick={() => navigate('/study-material/create')}
          >
            <Plus size={14} /> Create Material
          </button>
        }
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive font-bold">Delete Study Material?</DialogTitle>
            <DialogDescription>
              This will permanently delete this study material. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="rounded-xl">Cancel</Button>
            <Button
              variant="destructive"
              className="rounded-xl shadow-lg shadow-destructive/20 font-semibold"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyMaterialListPage;
