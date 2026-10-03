import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Building2, Search, X, Loader2, CheckSquare, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { saveFranchiseTest, getFranchiseTestMappings } from '../api/test.api';
import { showToast } from '../../../utils/toast';
import type Tests from '../../../types/database/Tests';

interface AssignFranchiseModalProps {
  test: Tests | null;    // the test we are assigning franchises to
  onClose: () => void;
}

const AssignFranchiseModal: React.FC<AssignFranchiseModalProps> = ({ test, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const isOpen = !!test;

  // Load franchise test mappings (Mode 2 of SpCommonDropDownList)
  const { data: franchises = [], isLoading, isError } = useQuery({
    queryKey: ['franchiseTestMappings', test?.id],
    queryFn: () => getFranchiseTestMappings(test?.id || 0),
    enabled: isOpen && !!test?.id,
  });

  // Reset selection when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearch('');
    }
  }, [isOpen, test]);

  // Set selected IDs when franchises query resolves
  useEffect(() => {
    if (isOpen && franchises.length > 0) {
      const selected = new Set<number>();
      franchises.forEach((f) => {
        if (f.is_selected === 1 || f.is_selected === true) {
          selected.add(f.value);
        }
      });
      setSelectedIds(selected);
    }
  }, [franchises, isOpen]);

  // Save mutation (Mode 7 of SpTest)
  const saveMutation = useMutation({
    mutationFn: saveFranchiseTest,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Franchise test mappings updated successfully');
        onClose();
      } else {
        showToast.error(res.message || 'Failed to save mappings');
      }
    },
    onError: (err) => {
      showToast.apiErrorShow(err);
    },
  });

  const handleToggle = (franchiseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(franchiseId)) {
        next.delete(franchiseId);
      } else {
        next.add(franchiseId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(f => f.value)));
    }
  };

  const handleSave = () => {
    if (!test?.id) return;
    if (selectedIds.size === 0) {
      showToast.warning('Please select at least one franchise to map.');
      return;
    }

    saveMutation.mutate({
      test_id: test.id,
      franchise_ids: Array.from(selectedIds),
    });
  };

  const filtered = franchises.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            Assign Franchises to Test
          </DialogTitle>
          <DialogDescription className="text-xs">
            Test: <strong className="text-foreground">{test?.name}</strong>
            {selectedIds.size > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-semibold">
                {selectedIds.size} selected
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search & Select All */}
        <div className="px-5 py-3 shrink-0 border-b bg-muted/20 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search franchises..."
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
          {filtered.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* List of Franchises */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading franchises...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-40 text-destructive text-sm font-medium">
              Failed to load franchises list.
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm italic">No franchises found</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((franchise) => {
                const isSelected = selectedIds.has(franchise.value);
                return (
                  <li
                    key={franchise.value}
                    onClick={() => handleToggle(franchise.value)}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors cursor-pointer select-none"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground opacity-65 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground">{franchise.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0 bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saveMutation.isPending}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending || selectedIds.size === 0}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              'Save Mappings'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignFranchiseModal;
