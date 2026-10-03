import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import FranchiseForm from "../../features/franchise/components/FranchiseForm";


import { getFranchiseById } from "../../features/franchise/api/franchise.api";

const FranchiseFormPage = () => {
  const { id } = useParams();
  const isEditMode = !!id;

  // Fetch franchise data if in edit mode
  const { data: franchise, isLoading, isError } = useQuery({
    queryKey: ["franchises", id],
    queryFn: () => getFranchiseById(Number(id)),
    enabled: isEditMode,
  });

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditMode && isError) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-500">Error</h2>
        <p className="text-muted-foreground">Could not load franchise details.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <FranchiseForm initialData={franchise || undefined} />
    </div>
  );
};

export default FranchiseFormPage;
