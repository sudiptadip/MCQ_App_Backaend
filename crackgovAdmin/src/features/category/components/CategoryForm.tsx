import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import type { Category } from '../../../types/database/Category';

const categoryFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  category_type: z.string().default("category"),
  parent_id: z.number().nullable().default(null),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CategoryForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema as any),
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || "",
      category_type: initialData?.category_type || "category",
      parent_id: initialData?.parent_id ?? null,
    },
  });

  useEffect(() => {
    reset({
      id: initialData?.id,
      name: initialData?.name || "",
      category_type: initialData?.category_type || "category",
      parent_id: initialData?.parent_id ?? null,
    });
  }, [initialData, reset]);

  return (
    <Card className="h-full bg-card shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          {initialData?.id ? "Edit Item" : "Create New Item"}
        </CardTitle>
        <CardDescription>
          Provide a descriptive name for this hierarchy element.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Display Name</Label>
            <Input
              id="name"
              placeholder="e.g. Quantum Physics, Basic Math..."
              className="focus-visible:ring-primary h-12 text-lg"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-border/50">
            <Button
              type="submit"
              className="flex-1 font-bold shadow-md h-11"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : initialData?.id ? "Update Name" : "Create Item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};