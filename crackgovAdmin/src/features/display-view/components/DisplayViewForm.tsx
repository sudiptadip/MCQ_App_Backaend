import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Layers, ChevronDown } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type DisplayView from '../../../types/database/DisplayView';

// ── Schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  parent_id: z.number().nullable(),
});

type FormData = z.infer<typeof schema>;

// ── Props ───────────────────────────────────────────────────────────────────
interface DisplayViewFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  roots: DisplayView[];
  /** True when a root has already been created this page session */
  rootCreatedThisSession: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
const DisplayViewForm: React.FC<DisplayViewFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  roots,
  rootCreatedThisSession,
}) => {
  // If a root was already created, default to child mode; otherwise root mode.
  const defaultMode: 'root' | 'child' = rootCreatedThisSession ? 'child' : 'root';
  const [mode, setMode] = React.useState<'root' | 'child'>(defaultMode);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      display_name: '',
      parent_id: null,
    },
  });

  // Switch mode to child and lock if root was created this session
  useEffect(() => {
    if (rootCreatedThisSession) {
      setMode('child');
      setValue('parent_id', roots[0]?.id ?? null);
    }
  }, [rootCreatedThisSession, roots, setValue]);

  // Keep parent_id in sync with mode
  useEffect(() => {
    if (mode === 'root') {
      setValue('parent_id', null);
    } else {
      // Select first root by default when switching to child
      if (roots.length > 0) {
        setValue('parent_id', roots[0].id);
      }
    }
  }, [mode, roots, setValue]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
    reset({ display_name: '', parent_id: mode === 'root' ? null : (roots[0]?.id ?? null) });
  };

  const selectedParentId = watch('parent_id');
  const isRootTabDisabled = rootCreatedThisSession;

  return (
    <Card className="shadow-lg border-primary/10 bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Create Display View
        </CardTitle>
        <CardDescription>
          Add a root display view or a child under an existing root.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Session locked banner ─── */}
        {rootCreatedThisSession && (
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              A root was already created this session. To create another root,
              go back to the list and re-enter the create page.
            </p>
          </div>
        )}

        {/* ── Mode tabs ─── */}
        <div className="flex rounded-lg border border-border overflow-hidden bg-muted/30">
          <button
            type="button"
            id="tab-root"
            disabled={isRootTabDisabled}
            onClick={() => !isRootTabDisabled && setMode('root')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'root'
                ? 'bg-primary text-primary-foreground'
                : isRootTabDisabled
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Root
          </button>
          <button
            type="button"
            id="tab-child"
            disabled={roots.length === 0}
            onClick={() => roots.length > 0 && setMode('child')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'child'
                ? 'bg-primary text-primary-foreground'
                : roots.length === 0
                ? 'text-muted-foreground/40 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Child
            {roots.length === 0 && (
              <span className="ml-1 text-[10px] opacity-60">(no roots yet)</span>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* ── Parent selector (child mode only) ─── */}
          {mode === 'child' && (
            <div className="space-y-2">
              <Label htmlFor="parent_id" className="text-sm font-semibold">
                Parent Root
              </Label>
              <div className="relative">
                <select
                  id="parent_id"
                  className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none pr-9 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  value={selectedParentId ?? ''}
                  onChange={(e) =>
                    setValue('parent_id', e.target.value ? Number(e.target.value) : null)
                  }
                >
                  {roots.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* ── Display name ─── */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-semibold">
              Display Name
            </Label>
            <Input
              id="display_name"
              placeholder={
                mode === 'root'
                  ? 'e.g. Science, Mathematics...'
                  : 'e.g. Algebra, Organic Chemistry...'
              }
              className="h-11 text-base focus-visible:ring-primary"
              autoFocus
              {...register('display_name')}
            />
            {errors.display_name && (
              <p className="text-xs text-destructive font-medium">
                {errors.display_name.message}
              </p>
            )}
          </div>

          {/* ── Actions ─── */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            <Button
              type="submit"
              className="flex-1 font-bold h-11 shadow-md"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : mode === 'root' ? 'Create Root' : 'Create Child'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DisplayViewForm;
