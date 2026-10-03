
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Clock, BookOpen, Building2, Eye } from "lucide-react";
import { DataTable, type ColumnDef } from "../../components/ui/DataTable";
import { getTestList, deleteTest } from "../../features/test/api/test.api";
import { showToast } from "../../utils/toast";
import type Tests from "../../types/database/Tests";
import Error from "../../components/common/Error";
import { ActionButton } from "../../features/mcq/components/McqQuestionAnsTable";
import AssignFranchiseModal from "../../features/test/components/AssignFranchiseModal";
import { ROLES, STORAGE_KEYS } from "../../constants";
import { storage } from "../../utils/storage";
import type { User } from "../../features/auth/types";

const TestListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTestForFranchise, setSelectedTestForFranchise] = useState<Tests | null>(null);
  const [assignedFilter, setAssignedFilter] = useState<"all" | "assigned" | "not_assigned">("all");

  const user = storage.get<User>(STORAGE_KEYS.USER);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data: tests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["testList"],
    queryFn: getTestList,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTest,
    onSuccess: (data) => {
      if (data.isSuccess) {
        showToast.success(data.message || "Test deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["testList"] });
      } else {
        showToast.error(data.message || "Failed to delete test");
      }
    },
    onError: (err) => showToast.apiErrorShow(err),
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this test?")) {
      deleteMutation.mutate(id);
    }
  };

  const columns: ColumnDef<Tests>[] = [
    {
      accessorKey: "id",
      header: "#",
      size: 60,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Test Name",
      cell: ({ getValue }) => (
        <span className="font-semibold text-foreground">{getValue<string>() || "—"}</span>
      ),
    },
    {
      accessorKey: "duration_minutes",
      header: "Duration",
      size: 120,
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Clock size={13} /> {getValue<number>()} min
        </span>
      ),
    },
    {
      accessorKey: "total_questions",
      header: "Questions",
      size: 120,
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <BookOpen size={13} /> {getValue<number>()}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => {
        const text = getValue<string>() || "—";
        return (
          <div className="max-w-xs truncate text-sm text-muted-foreground" title={text}>
            {text}
          </div>
        );
      },
    },
    {
      id: "__actions__",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const testId = row.original?.id;
        const isAssigned = row.original?.is_assigned_by_franchise;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <ActionButton
              title="View Details"
              onClick={(e) => {
                e.stopPropagation();
                if (testId) navigate(`/test/details/${testId}`);
              }}
            >
              <Eye size={14} />
            </ActionButton>
            {!isAssigned && (
              <>
                {isSuperAdmin && (
                  <ActionButton
                    title="Assign Franchises"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTestForFranchise(row.original);
                    }}
                  >
                    <Building2 size={14} />
                  </ActionButton>
                )}
                <ActionButton
                  title="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (testId) navigate(`/test/edit/${testId}`);
                  }}
                >
                  <Pencil size={14} />
                </ActionButton>
                <ActionButton
                  title="Delete"
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (testId) handleDelete(testId);
                  }}
                >
                  <Trash2 size={14} />
                </ActionButton>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <Error
          title="Tests not found"
          message="There was an error fetching the test list."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Filter tests based on is_assigned_by_franchise status
  const filteredTests = tests.filter((t) => {
    if (assignedFilter === "assigned") {
      return t.is_assigned_by_franchise === true;
    }
    if (assignedFilter === "not_assigned") {
      return !t.is_assigned_by_franchise;
    }
    return true;
  });

  return (
    <div className="p-6">
      <DataTable
        data={filteredTests}
        columns={columns}
        isLoading={isLoading || deleteMutation.isPending}
        title="Tests Management"
        description="View, create and manage all tests."
        enableSorting
        enableSearch
        searchPlaceholder="Search tests..."
        enablePagination
        defaultPageSize={10}
        onRowClick={(row: any) => {
          const testId = row?.original?.id;
          const isAssigned = row?.original?.is_assigned_by_franchise;
          if (testId) {
            if (isAssigned) {
              navigate(`/test/details/${testId}`);
            } else {
              navigate(`/test/edit/${testId}`);
            }
          }
        }}
        toolbarActions={
          <div className="flex items-center gap-3">
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value as any)}
              className="h-9 px-3 text-sm font-medium rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Mappings</option>
              <option value="assigned">Assigned by Franchise</option>
              <option value="not_assigned">Not Assigned</option>
            </select>

            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              onClick={() => navigate("/test/create")}
            >
              <Plus size={14} />
              Create Test
            </button>
          </div>
        }
      />
      {isSuperAdmin && (
        <AssignFranchiseModal
          test={selectedTestForFranchise}
          onClose={() => setSelectedTestForFranchise(null)}
        />
      )}
    </div>
  );
};

export default TestListPage;