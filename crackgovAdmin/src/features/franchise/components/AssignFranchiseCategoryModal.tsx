import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, CheckCircle2, Search, X, Loader2, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getFranchiseCategories, toggleFranchiseCategory, type FranchiseCategory } from '../api/franchise.api';
import { showToast } from '../../../utils/toast';

interface AssignFranchiseCategoryModalProps {
  franchiseId: number | null;
  franchiseName: string | null;
  onClose: () => void;
}

const AssignFranchiseCategoryModal: React.FC<AssignFranchiseCategoryModalProps> = ({
  franchiseId,
  franchiseName,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const isOpen = franchiseId !== null;

  // Fetch categories mapped to this franchise
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['franchiseCategories', franchiseId],
    queryFn: () => getFranchiseCategories(franchiseId!),
    enabled: isOpen && franchiseId !== null,
  });

  // Assign / Unassign toggle mutation
  const toggleMutation = useMutation({
    mutationFn: toggleFranchiseCategory,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Category assignment updated');
        queryClient.invalidateQueries({ queryKey: ['franchiseCategories', franchiseId] });
      } else {
        showToast.error(res.message || 'Failed to update assignment');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const handleToggle = (category: FranchiseCategory) => {
    if (franchiseId === null) return;
    toggleMutation.mutate({
      franchise_id: franchiseId,
      category_id: category.id,
    });
  };

  // Filter categories based on search term
  const searchLower = search.toLowerCase();
  const matchesSearch = (c: FranchiseCategory) =>
    c.name.toLowerCase().includes(searchLower) ||
    (c.category_type || '').toLowerCase().includes(searchLower);

  const availableCategories = categories.filter((c) => !c.is_assigned && matchesSearch(c));
  const assignedCategories = categories.filter((c) => !!c.is_assigned && matchesSearch(c));

  const totalAssigned = categories.filter((c) => c.is_assigned).length;
  const isPending = toggleMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-primary" />
            Assign Categories to Franchise
          </DialogTitle>
          <DialogDescription className="text-xs">
            Franchise Name: <strong>{franchiseName}</strong>
            {totalAssigned > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-semibold">
                {totalAssigned} assigned
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Shared Search Bar */}
        <div className="px-5 py-3 shrink-0 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories by name or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Split Panels Container */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x overflow-hidden min-h-[350px]">
          {/* Left Panel: Available Categories */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-2.5 border-b bg-muted/10 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Available Categories ({availableCategories.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading available categories...</span>
                </div>
              ) : availableCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 text-center px-4">
                  <Tag className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No available categories match search</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {availableCategories.map((category) => {
                    const isCurrentMutating =
                      toggleMutation.isPending &&
                      toggleMutation.variables?.category_id === category.id;

                    return (
                      <li
                        key={category.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {category.name}
                          </p>
                          {category.category_type && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-medium text-muted-foreground">
                              {category.category_type}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 ml-4 h-7 text-xs font-semibold px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={isPending}
                          onClick={() => handleToggle(category)}
                        >
                          {isCurrentMutating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Assign'
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right Panel: Assigned Categories */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-2.5 border-b bg-muted/10 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Assigned Categories ({assignedCategories.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto bg-green-500/[0.01]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading assigned categories...</span>
                </div>
              ) : assignedCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 text-center px-4">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No assigned categories match search</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {assignedCategories.map((category) => {
                    const isCurrentMutating =
                      toggleMutation.isPending &&
                      toggleMutation.variables?.category_id === category.id;

                    return (
                      <li
                        key={category.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-green-500/[0.04] transition-colors bg-green-500/[0.02]"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            {category.name}
                          </p>
                          {category.category_type && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-green-500/10 text-[10px] uppercase font-medium text-green-600">
                              {category.category_type}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 ml-4 h-7 text-xs font-semibold px-3 text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => handleToggle(category)}
                        >
                          {isCurrentMutating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Unassign'
                          )}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0 bg-muted/20 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Total: {availableCategories.length} available · {assignedCategories.length} assigned
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignFranchiseCategoryModal;
