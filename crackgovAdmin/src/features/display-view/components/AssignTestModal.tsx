import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, BookOpen, CheckCircle2, Search, X, Loader2, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

import { getTestList } from '../../test/api/test.api';
import {
  assignDisplayViewTest,
  deleteDisplayViewTest,
  getDisplayViewTests,
} from '../api/displayViewTest.api';

import { getStudyMaterialList } from '../../study-material/api/studyMaterial.api';
import {
  assignDisplayViewStudyMaterial,
  deleteDisplayViewStudyMaterial,
  getDisplayViewStudyMaterials,
} from '../api/displayViewStudyMaterial.api';

import { showToast } from '../../../utils/toast';
import type Tests from '../../../types/database/Tests';
import type { StudyMaterial } from '../../../types/database/StudyMaterial';
import type DisplayView from '../../../types/database/DisplayView';
import { cn } from '../../../lib/utils';

interface AssignTestModalProps {
  node: DisplayView | null;
  onClose: () => void;
}

type TabType = 'test' | 'study-material';

const AssignTestModal: React.FC<AssignTestModalProps> = ({ node, onClose }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('test');

  const isOpen = !!node;

  // --- TESTS ---
  const { data: allTests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['testList'],
    queryFn: getTestList,
    enabled: isOpen && activeTab === 'test',
  });

  const { data: assignedTests = [], isLoading: loadingAssignedTests } = useQuery({
    queryKey: ['displayViewTests', node?.id],
    queryFn: () => getDisplayViewTests(node!.id!),
    enabled: isOpen && !!node?.id,
  });

  const assignedTestIds = new Set(assignedTests.map((t) => t.test_id));

  const assignTestMutation = useMutation({
    mutationFn: assignDisplayViewTest,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success('Test assigned successfully');
        queryClient.invalidateQueries({ queryKey: ['displayViewTests', node?.id] });
        queryClient.invalidateQueries({ queryKey: ['displayViewTree'] });
      } else {
        showToast.error(res.message || 'Failed to assign test');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const unassignTestMutation = useMutation({
    mutationFn: deleteDisplayViewTest,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success('Test unassigned');
        queryClient.invalidateQueries({ queryKey: ['displayViewTests', node?.id] });
        queryClient.invalidateQueries({ queryKey: ['displayViewTree'] });
      } else {
        showToast.error(res.message || 'Failed to unassign test');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  // --- STUDY MATERIALS ---
  const { data: allSM = [], isLoading: loadingSM } = useQuery({
    queryKey: ['studyMaterials'],
    queryFn: getStudyMaterialList,
    enabled: isOpen && activeTab === 'study-material',
  });

  const { data: assignedSM = [], isLoading: loadingAssignedSM } = useQuery({
    queryKey: ['displayViewSM', node?.id],
    queryFn: () => getDisplayViewStudyMaterials(node!.id!),
    enabled: isOpen && !!node?.id,
  });

  const assignedSMIds = new Set(assignedSM.map((sm) => sm.studyMaterial_id));

  const assignSMMutation = useMutation({
    mutationFn: assignDisplayViewStudyMaterial,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success('Study Material assigned');
        queryClient.invalidateQueries({ queryKey: ['displayViewSM', node?.id] });
        queryClient.invalidateQueries({ queryKey: ['displayViewTree'] });
      } else {
        showToast.error(res.message || 'Failed to assign study material');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const unassignSMMutation = useMutation({
    mutationFn: deleteDisplayViewStudyMaterial,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success('Study Material unassigned');
        queryClient.invalidateQueries({ queryKey: ['displayViewSM', node?.id] });
        queryClient.invalidateQueries({ queryKey: ['displayViewTree'] });
      } else {
        showToast.error(res.message || 'Failed to unassign study material');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  // --- HANDLERS ---
  const handleToggleTest = (test: Tests) => {
    if (!node?.id) return;
    if (assignedTestIds.has(test.id!)) {
      const record = assignedTests.find((t) => t.test_id === test.id);
      if (record?.id) unassignTestMutation.mutate(record.id);
    } else {
      assignTestMutation.mutate({ display_view_id: node.id, test_id: test.id! });
    }
  };

  const handleToggleSM = (sm: StudyMaterial) => {
    if (!node?.id) return;
    if (assignedSMIds.has(sm.id)) {
      const record = assignedSM.find((r) => r.studyMaterial_id === sm.id);
      if (record?.id) unassignSMMutation.mutate(record.id);
    } else {
      assignSMMutation.mutate({ display_view_id: node.id, studyMaterial_id: sm.id });
    }
  };

  const filteredTests = allTests.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredSM = allSM.filter((sm) =>
    sm.name.toLowerCase().includes(search.toLowerCase())
  );

  const isPendingTest = assignTestMutation.isPending || unassignTestMutation.isPending;
  const isPendingSM = assignSMMutation.isPending || unassignSMMutation.isPending;
  
  const isLoading = activeTab === 'test' 
    ? (loadingTests || loadingAssignedTests)
    : (loadingSM || loadingAssignedSM);

  const listData = activeTab === 'test' ? filteredTests : filteredSM;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Layers className="h-5 w-5 text-primary" />
            Assign Content
          </DialogTitle>
          <DialogDescription className="text-xs">
            Node: <strong>{node?.display_name}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex px-5 pt-3 border-b bg-muted/10 gap-4">
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'test' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('test')}
          >
            <ClipboardList className="h-4 w-4" />
            MCQ Tests
            {assignedTests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                {assignedTests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'study-material' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('study-material')}
          >
            <BookOpen className="h-4 w-4" />
            Study Material
            {assignedSM.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                {assignedSM.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 shrink-0 border-b bg-muted/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'test' ? 'tests' : 'study materials'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
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

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : listData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              {activeTab === 'test' ? <ClipboardList className="h-8 w-8 mb-2 opacity-20" /> : <BookOpen className="h-8 w-8 mb-2 opacity-20" />}
              <p className="text-sm italic">No {activeTab === 'test' ? 'tests' : 'study materials'} found</p>
            </div>
          ) : (
            <ul className="divide-y">
              {activeTab === 'test' && filteredTests.map((test) => {
                const isAssigned = assignedTestIds.has(test.id!);
                return (
                  <li key={test.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {isAssigned ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{test.name}</p>
                        <p className="text-xs text-muted-foreground">{test.total_questions} questions · {test.duration_minutes} min</p>
                      </div>
                    </div>
                    <Button size="sm" variant={isAssigned ? 'outline' : 'default'} className={`shrink-0 ml-4 h-7 text-xs font-semibold ${isAssigned ? 'text-destructive border-destructive/40 hover:bg-destructive/10' : ''}`} disabled={isPendingTest} onClick={() => handleToggleTest(test)}>
                      {isPendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAssigned ? 'Unassign' : 'Assign'}
                    </Button>
                  </li>
                );
              })}
              
              {activeTab === 'study-material' && filteredSM.map((sm) => {
                const isAssigned = assignedSMIds.has(sm.id);
                return (
                  <li key={sm.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {isAssigned ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{sm.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{sm.type}</p>
                      </div>
                    </div>
                    <Button size="sm" variant={isAssigned ? 'outline' : 'default'} className={`shrink-0 ml-4 h-7 text-xs font-semibold ${isAssigned ? 'text-destructive border-destructive/40 hover:bg-destructive/10' : ''}`} disabled={isPendingSM} onClick={() => handleToggleSM(sm)}>
                      {isPendingSM ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAssigned ? 'Unassign' : 'Assign'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t shrink-0 bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTestModal;
