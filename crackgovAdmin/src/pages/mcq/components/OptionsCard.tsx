
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Trash2, PlusCircle, CheckCircle2, Save } from 'lucide-react';

interface OptionData {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Props {
    options: OptionData[];
    onAddOption: () => void;
    onRemoveOption: (id: string) => void;
    onOptionChange: (id: string, text: string) => void;
    onSetCorrectOption: (id: string) => void;
    isSubmitting: boolean;
}

export const OptionsCard = ({ 
    options, 
    onAddOption, 
    onRemoveOption, 
    onOptionChange, 
    onSetCorrectOption, 
    isSubmitting 
}: Props) => {
    return (
        <Card className="shadow-md border-primary/10 overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl">3. Multiple Choice Options</CardTitle>
                    <CardDescription>Provide options and mark the correct one.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onAddOption} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                    <PlusCircle className="w-4 h-4" /> Add Option
                </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {options.map((option, index) => (
                    <div
                        key={option.id}
                        className={`flex gap-3 items-start p-4 rounded-xl border-2 transition-all duration-200 group ${option.isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-transparent bg-muted/40 hover:bg-muted/60'
                            }`}
                    >
                        <div className="pt-2 w-8 text-center font-bold text-muted-foreground">
                            {String.fromCharCode(65 + index)}.
                        </div>

                        <div className="flex-1 space-y-1">
                            <Input
                                value={option.text}
                                onChange={(e) => onOptionChange(option.id, e.target.value)}
                                placeholder={`Enter option ${index + 1}...`}
                                className={`h-12 text-base ${option.isCorrect ? 'border-emerald-200 focus-visible:ring-emerald-500' : 'bg-background'}`}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                type="button"
                                variant={option.isCorrect ? "default" : "secondary"}
                                className={`gap-2 h-10 px-4 transition-all ${option.isCorrect
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md text-white'
                                    : 'bg-background hover:bg-muted-foreground/10 text-muted-foreground'
                                    }`}
                                onClick={() => onSetCorrectOption(option.id)}
                            >
                                {option.isCorrect && <CheckCircle2 className="w-4 h-4" />}
                                {option.isCorrect ? "Correct" : "Mark Correct"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
                                onClick={() => onRemoveOption(option.id)}
                                title="Remove Option"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-4 px-6 flex justify-end">
                <Button
                    type="submit"
                    className="h-12 px-8 font-bold text-base shadow-lg hover:shadow-xl transition-all w-full sm:w-auto gap-2"
                    disabled={isSubmitting}
                >
                    <Save className="w-5 h-5" />
                    {isSubmitting ? 'Saving Question...' : 'Save Question'}
                </Button>
            </CardFooter>
        </Card>
    );
};
