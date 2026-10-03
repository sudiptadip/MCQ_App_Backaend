import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { FileUpload, type FileUploadValue } from '../../../components/ui/file-upload';
import { Settings } from 'lucide-react';

interface Props {
    difficulty: string;
    setDifficulty: (val: string) => void;
    tag: string;
    setTag: (val: string) => void;
    image: FileUploadValue | null;
    setImage: (val: FileUploadValue | null) => void;
}

export const QuestionSettingsCard: React.FC<Props> = ({
    difficulty,
    setDifficulty,
    tag,
    setTag,
    image,
    setImage
}) => {
    return (
        <Card className="shadow-md border-primary/10 overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    2. Question Parameters
                </CardTitle>
                <CardDescription>Configure metadata and optional diagrams/images.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                {/* Difficulty */}
                <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-semibold text-foreground/80">Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger id="difficulty" className="h-11 bg-background">
                            <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-semibold text-foreground/80">Tags (Optional)</Label>
                    <input
                        id="tags"
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="geography, capitals (comma separated)"
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    />
                </div>

                {/* Optional Image */}
                <div className="space-y-2 border-t pt-4 border-border/60">
                    <Label className="text-sm font-semibold text-foreground/80 mb-2 block">
                        Question Image (Optional)
                    </Label>
                    <FileUpload
                        value={image}
                        onChange={setImage}
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB limit
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Upload an image or diagram to display with this question.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestionSettingsCard;
