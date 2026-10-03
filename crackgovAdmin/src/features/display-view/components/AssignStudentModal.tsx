import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle2, Search, X, Loader2, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  getDisplayViewStudentList,
  assignDisplayView,
  type DisplayViewStudent,
} from '../api/displayView.api';
import { showToast } from '../../../utils/toast';
import type DisplayView from '../../../types/database/DisplayView';

interface AssignStudentModalProps {
  node: DisplayView | null; // the node we're assigning students to
  onClose: () => void;
}

const AssignStudentModal: React.FC<AssignStudentModalProps> = ({ node, onClose }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const isOpen = !!node;

  // Fetch students for this display view node
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['displayViewStudents', node?.id],
    queryFn: () => getDisplayViewStudentList(node!.id!),
    enabled: isOpen && !!node?.id,
  });

  // Assign / Unassign mutation (toggles mapping via the same ASSIGN_DISPLAY_VIEW API)
  const assignMutation = useMutation({
    mutationFn: assignDisplayView,
    onSuccess: (res) => {
      if (res.isSuccess) {
        showToast.success(res.message || 'Student assignment updated');
        queryClient.invalidateQueries({ queryKey: ['displayViewStudents', node?.id] });
      } else {
        showToast.error(res.message || 'Failed to update student assignment');
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const handleToggle = (student: DisplayViewStudent) => {
    if (!node?.id) return;
    assignMutation.mutate({
      display_view_id: node.id,
      student_user_id: student.student_user_id,
    });
  };

  // Filter students based on search term
  const searchLower = search.toLowerCase();
  const matchesSearch = (s: DisplayViewStudent) =>
    s.name.toLowerCase().includes(searchLower) ||
    s.email.toLowerCase().includes(searchLower);

  const unassignedStudents = students.filter((s) => !s.is_student && matchesSearch(s));
  const assignedStudents = students.filter((s) => !!s.is_student && matchesSearch(s));

  const totalAssigned = students.filter((s) => s.is_student).length;
  const isPending = assignMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-primary" />
            Assign Students to Display View
          </DialogTitle>
          <DialogDescription className="text-xs">
            Display View: <strong>{node?.display_name}</strong>
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
              placeholder="Search students by name or email across panels..."
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
          {/* Left Panel: Unassigned Students */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-2.5 border-b bg-muted/10 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Unassigned / Available ({unassignedStudents.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading available students...</span>
                </div>
              ) : unassignedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 text-center px-4">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No unassigned students match search</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {unassignedStudents.map((student) => {
                    const isCurrentMutating =
                      assignMutation.isPending &&
                      assignMutation.variables?.student_user_id === student.student_user_id;

                    return (
                      <li
                        key={student.student_user_id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail className="h-3 w-3 inline" />
                            {student.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 ml-4 h-7 text-xs font-semibold px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={isPending}
                          onClick={() => handleToggle(student)}
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

          {/* Right Panel: Assigned Students */}
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-2.5 border-b bg-muted/10 flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Assigned to View ({assignedStudents.length})
              </span>
            </div>
            <div className="flex-1 overflow-y-auto bg-green-500/[0.01]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading assigned students...</span>
                </div>
              ) : assignedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8 text-center px-4">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No assigned students match search</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {assignedStudents.map((student) => {
                    const isCurrentMutating =
                      assignMutation.isPending &&
                      assignMutation.variables?.student_user_id === student.student_user_id;

                    return (
                      <li
                        key={student.student_user_id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-green-500/[0.04] transition-colors bg-green-500/[0.02]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                            <Mail className="h-3 w-3 inline" />
                            {student.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 ml-4 h-7 text-xs font-semibold px-3 text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={isPending}
                          onClick={() => handleToggle(student)}
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
            Total Displayed: {unassignedStudents.length} available · {assignedStudents.length} assigned
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStudentModal;
