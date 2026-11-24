import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserPlus, FileSpreadsheet, ArrowLeft } from "lucide-react";
import StudentForm from "../../features/student/components/StudentForm";
import BulkUploadStudents from "../../features/student/components/BulkUploadStudents";
import { Button } from "../../components/ui/button";

const StudentFormPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get("mode");

  const [activeTab, setActiveTab] = useState<"single" | "bulk">(
    modeParam === "bulk" ? "bulk" : "single"
  );

  useEffect(() => {
    if (modeParam === "bulk") {
      setActiveTab("bulk");
    } else {
      setActiveTab("single");
    }
  }, [modeParam]);

  const handleTabChange = (tab: "single" | "bulk") => {
    setActiveTab(tab);
    setSearchParams(tab === "bulk" ? { mode: "bulk" } : {});
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/student")}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Students List
          </Button>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {activeTab === "single" ? "Register Student" : "Bulk Student Upload"}
          </h1>
        </div>

        {/* Segmented Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange("single")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "single"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus size={14} />
            Single Student
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("bulk")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "bulk"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet size={14} />
            Upload Excel
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "single" ? (
        <StudentForm />
      ) : (
        <BulkUploadStudents onCancel={() => handleTabChange("single")} />
      )}
    </div>
  );
};

export default StudentFormPage;