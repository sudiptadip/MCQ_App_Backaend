import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, FolderOpen, Plus } from 'lucide-react';
import {
  getParentCategories,
  getCategoriesByParentId,
  upsertCategory,
  deleteCategory,
} from '../../features/category/api/category.api';
import { CategoryTree } from '../../features/category/components/CategoryTree';
import { showToast } from '../../utils/toast';
import Loading from '../../components/common/Loading';
import Error from '../../components/common/Error';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import type { Category } from '../../types/database/Category';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters required'),
});
type FormData = z.infer<typeof schema>;

const UpsertCategoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = !!id;
  const editRootId = id ? Number(id) : null;

  const [selectedItem, setSelectedItem] = useState<Partial<Category> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: allRoots = [], isLoading: loadingRoots } = useQuery({
    queryKey: ['parentCategories'],
    queryFn: getParentCategories,
    enabled: isEditMode,
  });

  const { data: treeItems = [], isLoading: loadingTree } = useQuery({
    queryKey: ['childCategoriesTree', editRootId],
    queryFn: () => getCategoriesByParentId(editRootId!),
    enabled: !!editRootId,
  });

  const currentRoot = isEditMode
    ? (allRoots.find((r) => r.id === editRootId) || treeItems.find(item => item.id === editRootId))
    : null;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    reset({ name: selectedItem?.name || '' });
  }, [selectedItem, reset]);

  const upsertMutation = useMutation({
    mutationFn: upsertCategory,
    onSuccess: (res, variables) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Saved successfully');
        if (!variables.parent_id && !isEditMode && res.data) {
          const newId = res.data.id;
          queryClient.invalidateQueries({ queryKey: ['parentCategories'] });
          setTimeout(() => navigate(`/category/edit/${newId}`, { replace: true }), 100);
        } else {
          queryClient.invalidateQueries({ queryKey: ['childCategoriesTree', editRootId ?? res.data?.id] });
          queryClient.invalidateQueries({ queryKey: ['parentCategories'] });
          setSelectedItem(null);
        }
      } else {
        showToast.error(res.message || 'Save failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['childCategoriesTree', editRootId] });
        queryClient.invalidateQueries({ queryKey: ['parentCategories'] });
        setDeleteId(null);
        if (selectedItem?.id === deleteId) setSelectedItem(null);
      } else {
        showToast.error(res.message || 'Delete failed');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const handleMove = (dragId: number, parentId: number | null) => {
    const item = treeItems.find((v) => v.id === dragId);
    if (item) {
      upsertMutation.mutate({ ...item, parent_id: parentId });
    }
  };

  const handleFormSubmit = (data: FormData) => {
    upsertMutation.mutate({
      ...selectedItem,
      name: data.name,
      category_type: selectedItem?.category_type || 'category'
    });
  };

  const isDataLoading = loadingRoots || (isEditMode && loadingTree);

  if (isEditMode && isDataLoading && !currentRoot) {
    return <Loading message="Fetching category..." className="h-[600px]" />;
  }

  if (isEditMode && !isDataLoading && !currentRoot) {
    return (
      <div className="container mx-auto p-12">
        <Error
          title="Category not found"
          message="Could not load the requested root. It might have been deleted."
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: ['parentCategories'] });
            queryClient.invalidateQueries({ queryKey: ['childCategoriesTree', editRootId] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-in fade-in zoom-in-95 duration-700">
      <div className="mb-10 flex flex-col gap-6">
        <Button
          variant="ghost" size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground hover:bg-primary/5 gap-2 transition-all rounded-full px-4"
          onClick={() => navigate('/category')}
        >
          <ArrowLeft size={16} /> Back to Overview
        </Button>
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 hover:rotate-0 transition-transform duration-500">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
              {isEditMode ? `Edit: ${currentRoot?.name}` : 'Create Category'}
            </h1>
            <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
              {isEditMode ? 'Subject & Topic Hierarchy Management' : 'Initialize a new category hierarchy'}
            </p>
          </div>
        </div>
      </div>

      {!isEditMode ? (
        <div className="flex justify-center pt-10">
          <Card className="w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-primary/5 rounded-[2rem] overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-indigo-500" />
            <CardHeader className="pt-8 px-8">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                New Root Category
              </CardTitle>
              <CardDescription className="text-base">Define the foundation of your new question hierarchy.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleSubmit((d) => upsertMutation.mutate({ name: d.name, category_type: 'category', parent_id: null }))} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Category Name</Label>
                  <Input
                    placeholder="e.g. Science, Mathematics..."
                    className="h-14 text-xl font-medium focus-visible:ring-primary rounded-2xl border-primary/10 bg-muted/30"
                    autoFocus
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-destructive font-bold ml-1">{errors.name.message}</p>}
                </div>
                <Button type="submit" className="w-full h-14 text-lg font-black shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:scale-[1.02] active:scale-95" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? 'Processing...' : 'Generate Root Category'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Side Hierarchy Tree */}
          <div className="lg:col-span-5 h-[calc(100vh-250px)] min-h-[550px]">
            {loadingTree ? (
              <Loading message="Syncing Hierarchy..." className="h-full" />
            ) : (
              <CategoryTree
                categories={treeItems}
                onAdd={(parent) => setSelectedItem({ parent_id: parent.id, category_type: 'category', name: '' })}
                onEdit={setSelectedItem}
                onDelete={setDeleteId}
                disableAddRoot={true}
                onMove={handleMove}
              />
            )}
          </div>

          {/* Right Side Form Panel */}
          <div className="lg:col-span-7 sticky top-6">
            {selectedItem ? (
              <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-primary/5 overflow-hidden animate-in slide-in-from-right-8 duration-500 rounded-[2.5rem]">
                <div className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/5">
                      {selectedItem.id ? 'Modifier' : 'Generator'}
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-black flex items-center gap-3">
                    <FolderOpen className="h-8 w-8 text-primary" />
                    {selectedItem.id ? 'Edit Item' : 'New Child Item'}
                  </CardTitle>
                  <CardDescription className="text-base font-medium">
                    {selectedItem.id ? 'Refine the properties of this node.' : `Adding content under parent #${selectedItem.parent_id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                  <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Label Name</Label>
                      <Input
                        placeholder="e.g. Chapter 1, Algebra..."
                        className="h-16 text-2xl font-bold focus-visible:ring-primary rounded-2xl border-primary/10 bg-muted/30"
                        autoFocus
                        {...register('name')}
                      />
                      {errors.name && <p className="text-xs text-destructive font-bold ml-1">{errors.name.message}</p>}
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit" className="flex-1 font-black text-lg h-14 rounded-2xl shadow-xl shadow-primary/20" disabled={upsertMutation.isPending}>
                        {upsertMutation.isPending ? 'Syncing...' : selectedItem.id ? 'Update Node' : 'Create Node'}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 h-14 text-lg font-bold rounded-2xl border-muted-foreground/10" onClick={() => setSelectedItem(null)}>Discard</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] border-primary/10 bg-gradient-to-br from-primary/5 to-indigo-500/5 text-center p-12 transition-all duration-700 hover:border-primary/20 group">
                <div className="bg-card dark:bg-zinc-900 p-8 rounded-[2rem] mb-6 shadow-2xl dark:shadow-none shadow-primary/10 text-primary group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                  <Plus size={48} className="stroke-[3]" />
                </div>
                <h3 className="text-3xl font-black tracking-tight text-foreground/80 mb-3">Orchestrate Hierarchy</h3>
                <p className="text-muted-foreground max-w-[320px] text-lg font-medium leading-relaxed">
                  Select a node to refine its data or click <span className="text-primary font-bold">+</span> to expand the structure.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-0 shadow-2xl">
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black text-destructive">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-base font-medium pt-2">
              You are about to permanently purge this category node and all of its subcategories. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-8 pb-4">
            <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl font-black h-12 px-8 shadow-lg shadow-destructive/20" disabled={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {deleteMutation.isPending ? 'Purging...' : 'Purge Node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpsertCategoryPage;
