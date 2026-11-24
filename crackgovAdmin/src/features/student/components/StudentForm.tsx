import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Eye, EyeOff, ArrowLeft, BookOpen, Search, X, Check, Loader2, Tag } from "lucide-react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { registerStudent, getAvailableCategories } from "../api/student.api";
import { showToast } from "../../../utils/toast";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNo: z
    .string()
    .trim()
    .min(10, "Mobile number must be at least 10 digits")
    .max(20, "Mobile number must not exceed 20 characters")
    .regex(/^[0-9+\-\s()]+$/, "Invalid mobile number"),
  parentName: z
    .string()
    .trim()
    .min(2, "Parent's name must be at least 2 characters")
    .max(255, "Parent's name must not exceed 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentFormData = z.infer<typeof studentSchema>;

const StudentForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch available categories for student assignment
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["available-categories-for-student"],
    queryFn: getAvailableCategories,
    staleTime: 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNo: "",
      parentName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: StudentFormData & { categoryIds: number[] }) => {
      const { confirmPassword, ...payload } = data;
      return registerStudent(payload);
    },
    onSuccess: (data) => {
      if (data.isSuccess) {
        showToast.success(data.message || "Student registered successfully");
        queryClient.invalidateQueries({ queryKey: ["students"] });
        navigate("/student");
      } else {
        showToast.error(data.message || "Something went wrong");
      }
    },
    onError: (error) => {
      showToast.apiErrorShow(error);
    }
  });

  const onSubmit = (data: StudentFormData) => {
    registerMutation.mutate({
      ...data,
      categoryIds: selectedCategoryIds,
    });
  };

  // Toggle single category selection
  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category_type || "").toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  // Bulk actions for categories
  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredCategories.map((c) => c.id);
    setSelectedCategoryIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearAllCategories = () => {
    setSelectedCategoryIds([]);
  };

  const selectedCategoriesList = useMemo(() => {
    return categories.filter((c) => selectedCategoryIds.includes(c.id));
  }, [categories, selectedCategoryIds]);

  return (
    <Card className="max-w-2xl mx-auto mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-bold">Register Student</CardTitle>
          <CardDescription>
            Fill in the details to create a new student account.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/student")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Name */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Student Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobileNo">Mobile Number</Label>
              <Input
                id="mobileNo"
                type="tel"
                placeholder="Enter mobile number"
                {...register("mobileNo")}
              />
              {errors.mobileNo && (
                <p className="text-sm text-red-500">{errors.mobileNo.message}</p>
              )}
            </div>

            {/* Parent's Name */}
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent&apos;s Name</Label>
              <Input
                id="parentName"
                placeholder="Enter parent's name"
                {...register("parentName")}
              />
              {errors.parentName && (
                <p className="text-sm text-red-500">{errors.parentName.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Category Assignment Section */}
            <div className="space-y-3 md:col-span-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">
                    Assign Categories (Multiple)
                  </Label>
                  <span className="text-xs text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCategoryIds.length > 0 && (
                    <>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {selectedCategoryIds.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllCategories}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </>
                  )}
                  {filteredCategories.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-xs text-primary hover:underline transition-colors cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Categories Pills */}
              {selectedCategoriesList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/40 border border-border/50 max-h-24 overflow-y-auto">
                  {selectedCategoriesList.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground shadow-xs animate-in fade-in"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors cursor-pointer"
                        title="Remove category"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search input for categories */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search categories by name or type..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-8 pr-8 h-8 text-xs"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Categories List */}
              <div className="border border-border rounded-lg bg-background/50 max-h-48 overflow-y-auto divide-y divide-border/60">
                {isCategoriesLoading ? (
                  <div className="flex items-center justify-center p-6 gap-2 text-muted-foreground text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading available categories...</span>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    {categorySearch ? `No categories found matching "${categorySearch}"` : "No categories available to assign."}
                  </div>
                ) : (
                  filteredCategories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-colors ${
                          isSelected
                            ? "bg-primary/10 hover:bg-primary/15 font-medium"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input bg-background"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className={`truncate ${isSelected ? "text-foreground font-semibold" : "text-foreground/90"}`}>
                            {cat.name}
                          </span>
                        </div>
                        {cat.category_type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider bg-muted text-muted-foreground shrink-0">
                            {cat.category_type}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Assigned categories grant the student access to practice tests, study materials, and exams linked to those categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Registering..." : "Register Student"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/student")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentForm;