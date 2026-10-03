import React, { useState, useEffect } from 'react';
import { LayoutList, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { getParentCategories, getCategoriesByParentId } from '../../features/category/api/category.api';
import { upsertQuestionAns, getQuestionAnsById } from '../../features/mcq/api/mcq.api';
import type { Category } from '../../types/database/Category';
import { showToast } from '../../utils/toast';

import { CategorySelectionCard } from './components/CategorySelectionCard';
import { QuestionDetailsCard } from './components/QuestionDetailsCard';
import { OptionsCard } from './components/OptionsCard';
import { QuestionSettingsCard } from './components/QuestionSettingsCard';
import { type FileUploadValue } from '../../components/ui/file-upload';

interface OptionData {
    id: string;
    text: string;
    isCorrect: boolean;
}

const UpsertMcqQuestionAnsPage = () => {
    const queryClient = useQueryClient();

    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const { data: fetchedData, isLoading: isLoadingQuestion } = useQuery({
        queryKey: ['questionDetails', id],
        queryFn: () => getQuestionAnsById(Number(id)),
        enabled: isEditMode
    });

    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [treeData, setTreeData] = useState<Category[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    const [questionText, setQuestionText] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [questionExplanation, setQuestionExplanation] = useState("");
    const [tag, setTag] = useState("");
    const [image, setImage] = useState<FileUploadValue | null>(null);
    const [options, setOptions] = useState<OptionData[]>([
        { id: '1', text: '', isCorrect: true },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
    ]);

    const fetchTreeData = async (parentId: number) => {
        setIsLoadingChildren(true);
        try {
            const childrenTree = await queryClient.fetchQuery({
                queryKey: ['childCategoriesTree', parentId],
                queryFn: () => getCategoriesByParentId(parentId),
                staleTime: 1000 * 60 * 5,
            });
            setTreeData(childrenTree || []);
        } catch (e) {
            console.error("Failed to fetch child categories", e);
            showToast.error("Failed to fetch subcategories");
            setTreeData([]);
        } finally {
            setIsLoadingChildren(false);
        }
    };

    useEffect(() => {
        if (isEditMode && fetchedData) {
            const qText = fetchedData.question?.question_text ?? fetchedData.question_text ?? "";
            const qDiff = fetchedData.question?.difficulty_level ?? fetchedData.difficulty_level ?? "medium";
            const qExplanation = fetchedData.question?.question_explanation ?? fetchedData.question_explanation ?? "";
            const qTag = fetchedData.question?.tag ?? fetchedData.tag ?? "";
            const qCategoryId = fetchedData.question?.category_id ?? fetchedData.category_id;

            const qParentId = fetchedData.question?.root_category_id ?? fetchedData.root_category_id ??
                fetchedData.question?.parent_category_id ?? fetchedData.parent_category_id ?? null;

            const qImageUrl = fetchedData.question?.image_url ?? fetchedData.image_url ?? null;
            const qImageDocId = fetchedData.question?.image_document_id ?? fetchedData.image_document_id ?? null;

            setQuestionText(qText);
            setDifficulty(qDiff);
            setQuestionExplanation(qExplanation);
            setTag(qTag);

            if (qImageUrl) {
                setImage({
                    id: qImageDocId || 0,
                    url: qImageUrl,
                    fileName: "Question Image"
                });
            } else {
                setImage(null);
            }

            if (qParentId) {
                const pId = Number(qParentId);
                const cId = qCategoryId ? Number(qCategoryId) : null;

                if (!isNaN(pId)) {
                    setSelectedParentId(pId);
                    fetchTreeData(pId);
                    if (cId && !isNaN(cId) && cId !== pId) {
                        setSelectedChildId(cId);
                    }
                }
            } else if (qCategoryId) {
                const pId = Number(qCategoryId);
                if (!isNaN(pId)) {
                    setSelectedParentId(pId);
                    fetchTreeData(pId);
                }
            }

            if (fetchedData.options && fetchedData.options.length > 0) {
                setOptions(fetchedData.options.map((o: any) => ({
                    id: o.id?.toString() || Math.random().toString(),
                    text: o.option_text,
                    isCorrect: o.is_correct
                })));
            }
        }
    }, [isEditMode, fetchedData]);

    const { data: rootCategories, isLoading: isLoadingRootCategories } = useQuery({
        queryKey: ['parentCategories'],
        queryFn: getParentCategories
    });

    const handleParentSelect = (categoryIdStr: string) => {
        const categoryId = parseInt(categoryIdStr);
        if (isNaN(categoryId) || categoryId === selectedParentId) return; // Prevent clearing if not changed or NaN
        setSelectedParentId(categoryId);
        setSelectedChildId(null);
        fetchTreeData(categoryId);
    };

    const handleChildSelect = (categoryIdStr: string) => {
        setSelectedChildId(parseInt(categoryIdStr));
    };

    const handleAddOption = () => {
        setOptions([...options, { id: Math.random().toString(), text: '', isCorrect: false }]);
    };

    const handleRemoveOption = (id: string) => {
        if (options.length <= 2) {
            showToast.error('A question must have at least 2 options.');
            return;
        }
        const newOptions = options.filter(o => o.id !== id);
        if (!newOptions.some(o => o.isCorrect)) {
            newOptions[0].isCorrect = true;
        }
        setOptions(newOptions);
    };

    const handleOptionChange = (id: string, text: string) => {
        setOptions(options.map(o => o.id === id ? { ...o, text } : o));
    };

    const handleSetCorrectOption = (id: string) => {
        setOptions(options.map(o => ({ ...o, isCorrect: o.id === id })));
    };

    const upsertMutation = useMutation({
        mutationFn: upsertQuestionAns,
        onSuccess: () => {
            showToast.success('Question saved successfully!');
            setQuestionText("");
            setOptions([
                { id: Math.random().toString(), text: '', isCorrect: true },
                { id: Math.random().toString(), text: '', isCorrect: false },
                { id: Math.random().toString(), text: '', isCorrect: false },
                { id: Math.random().toString(), text: '', isCorrect: false },
            ]);
            setDifficulty("medium");
            setQuestionExplanation("");
            setTag("");
            setImage(null);
            // Reset category selection
            setSelectedParentId(null);
            setSelectedChildId(null);
            setTreeData([]);
            if (isEditMode) {
                navigate('/question-ans');
            }
        },
        onError: (error: any) => {
            console.error(error);
            showToast.apiErrorShow(error);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim()) {
            return showToast.error('Question text is required');
        }
        if (options.some(o => !o.text.trim())) {
            return showToast.error('All options must have text');
        }

        let finalCategoryId = selectedChildId || selectedParentId || (fetchedData?.question?.category_id ?? fetchedData?.category_id ?? null);

        if (!finalCategoryId) {
            return showToast.error('Please select a category for the question');
        }

        const payload: any = {
            question: {
                question_text: questionText,
                category_id: finalCategoryId,
                difficulty_level: difficulty,
                question_explanation: questionExplanation || null,
                tag: tag || null,
                image_document_id: image?.id || null,
            },
            options: options.map(o => {
                const opt: any = {
                    option_text: o.text,
                    is_correct: o.isCorrect
                };
                const parsedId = parseInt(o.id, 10);
                if (!isNaN(parsedId) && String(parsedId) === o.id) {
                    opt.id = parsedId;
                }
                return opt;
            })
        };

        if (isEditMode) {
            payload.question.id = Number(id);
        }

        upsertMutation.mutate(payload);
    };

    return (
        <div className="container mx-auto max-w-6xl py-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <LayoutList size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">{isEditMode ? 'Edit MCQ Question' : 'Create MCQ Question'}</h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditMode ? 'Update your question details and options.' : 'Design your question, configure options, and select its category hierarchy.'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/question-ans')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft size={16} /> Back to List
                </button>
            </div>

            {isEditMode && isLoadingQuestion ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse">
                    <p>Loading question details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Category and Settings */}
                    <div className="lg:col-span-4 space-y-6">
                        <CategorySelectionCard
                            parentCategories={rootCategories || []}
                            selectedParentId={selectedParentId}
                            onParentSelect={handleParentSelect}
                            treeData={treeData}
                            selectedChildId={selectedChildId}
                            onChildSelect={handleChildSelect}
                            isLoadingCategories={isLoadingRootCategories || isLoadingChildren}
                        />
                        
                        <QuestionSettingsCard
                            difficulty={difficulty}
                            setDifficulty={setDifficulty}
                            tag={tag}
                            setTag={setTag}
                            image={image}
                            setImage={setImage}
                        />
                    </div>

                    {/* Right Column: Question Content and Options */}
                    <div className="lg:col-span-8 space-y-6">
                        <QuestionDetailsCard
                            questionText={questionText}
                            setQuestionText={setQuestionText}
                            questionExplanation={questionExplanation}
                            setQuestionExplanation={setQuestionExplanation}
                        />

                        <OptionsCard
                            options={options}
                            onAddOption={handleAddOption}
                            onRemoveOption={handleRemoveOption}
                            onOptionChange={handleOptionChange}
                            onSetCorrectOption={handleSetCorrectOption}
                            isSubmitting={upsertMutation.isPending}
                        />
                    </div>
                </form>
            )}
        </div>
    );
};

export default UpsertMcqQuestionAnsPage;