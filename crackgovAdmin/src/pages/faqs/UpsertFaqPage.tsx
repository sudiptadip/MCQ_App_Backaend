import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getFaqById, saveFaq } from "../../features/faqs/api";
import { showToast } from "../../utils/toast";

export default function UpsertFaqPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const faqId = id ? parseInt(id, 10) : undefined;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [category, setCategory] = React.useState("General");
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  const faqQuery = useQuery({
    queryKey: ["faq", faqId],
    queryFn: () => getFaqById(faqId!),
    enabled: isEditing && !isNaN(faqId!),
  });

  React.useEffect(() => {
    if (faqQuery.data) {
      setQuestion(faqQuery.data.question || "");
      setAnswer(faqQuery.data.answer || "");
      setCategory(faqQuery.data.category || "General");
      setDisplayOrder(faqQuery.data.displayOrder ?? 0);
      setIsActive(faqQuery.data.isActive ?? true);
    }
  }, [faqQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFaq({
        id: faqId,
        question,
        answer,
        category,
        displayOrder,
        isActive,
      }),
    onSuccess: () => {
      showToast.success(isEditing ? "FAQ updated successfully" : "FAQ created successfully");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      navigate("/faqs");
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      showToast.error("Question and Answer are required");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/faqs")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit FAQ" : "Add New FAQ"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update existing FAQ details" : "Create a new question and answer entry"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border shadow-xs">
        <div className="space-y-2">
          <Label htmlFor="question">
            Question <span className="text-destructive">*</span>
          </Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I access practice modules on CrackGov?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">
            Answer <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="answer"
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Provide a clear and concise answer..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. General, Exams, Account, Practice"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="isActive" className="cursor-pointer font-medium">
            Active (Visible to users)
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/faqs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save size={16} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : isEditing ? "Update FAQ" : "Save FAQ"}
          </Button>
        </div>
      </form>
    </div>
  );
}
