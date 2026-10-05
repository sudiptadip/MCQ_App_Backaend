import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getTestimonialById, saveTestimonial } from "../../features/testimonials/api";
import { showToast } from "../../utils/toast";

export default function UpsertTestimonialPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const testimonialId = id ? parseInt(id, 10) : undefined;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [studentName, setStudentName] = React.useState("");
  const [examName, setExamName] = React.useState("");
  const [rankOrScore, setRankOrScore] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [content, setContent] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [displayOrder, setDisplayOrder] = React.useState(0);
  const [isActive, setIsActive] = React.useState(true);

  const testimonialQuery = useQuery({
    queryKey: ["testimonial", testimonialId],
    queryFn: () => getTestimonialById(testimonialId!),
    enabled: isEditing && !isNaN(testimonialId!),
  });

  React.useEffect(() => {
    if (testimonialQuery.data) {
      setStudentName(testimonialQuery.data.studentName || "");
      setExamName(testimonialQuery.data.examName || "");
      setRankOrScore(testimonialQuery.data.rankOrScore || "");
      setAvatarUrl(testimonialQuery.data.avatarUrl || "");
      setContent(testimonialQuery.data.content || "");
      setRating(testimonialQuery.data.rating ?? 5);
      setDisplayOrder(testimonialQuery.data.displayOrder ?? 0);
      setIsActive(testimonialQuery.data.isActive ?? true);
    }
  }, [testimonialQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveTestimonial({
        id: testimonialId,
        studentName,
        examName,
        rankOrScore,
        avatarUrl,
        content,
        rating,
        displayOrder,
        isActive,
      }),
    onSuccess: () => {
      showToast.success(isEditing ? "Testimonial updated successfully" : "Testimonial created successfully");
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      navigate("/testimonials");
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !content.trim()) {
      showToast.error("Student Name and Testimonial Content are required");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/testimonials")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Testimonial" : "Add New Testimonial"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update student testimonial entry" : "Create a new student success story"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="studentName">
              Student Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examName">Exam Name</Label>
            <Input
              id="examName"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. SSC CGL 2025, RRB NTPC"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="rankOrScore">Rank / Score / Selection</Label>
            <Input
              id="rankOrScore"
              value={rankOrScore}
              onChange={(e) => setRankOrScore(e.target.value)}
              placeholder="e.g. AIR 42, Score 94/100, Selected - Inspector"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar / Photo URL (Optional)</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">
            Testimonial Quote / Review <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="content"
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share the student's review or experience with CrackGov..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="rating">Star Rating (1 to 5)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value, 10) || 5)}
              />
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < rating ? "currentColor" : "none"}
                    className={i < rating ? "" : "text-gray-300"}
                  />
                ))}
              </div>
            </div>
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
            Active (Visible on homepage)
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate("/testimonials")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save size={16} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : isEditing ? "Update Testimonial" : "Save Testimonial"}
          </Button>
        </div>
      </form>
    </div>
  );
}
