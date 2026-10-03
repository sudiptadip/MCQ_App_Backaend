import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { getParentCategories, getCategoriesByParentId, getCategories } from '../../features/category/api/category.api';
import { getStudyMaterialList, upsertStudyMaterial } from '../../features/study-material/api/studyMaterial.api';
import type { Category } from '../../types/database/Category';
import { showToast } from '../../utils/toast';

import { CategorySelectionCard } from '../mcq/components/CategorySelectionCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';

const UpsertStudyMaterialPage = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const { data: studyMaterials, isLoading: isLoadingMaterial } = useQuery({
        queryKey: ['studyMaterials'],
        queryFn: getStudyMaterialList,
        enabled: isEditMode
    });
    
    const fetchedData = studyMaterials?.find(m => m.id === Number(id));

    const { data: allCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        enabled: isEditMode && !!fetchedData?.category_id
    });

    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [treeData, setTreeData] = useState<Category[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("pdf");
    const [url, setUrl] = useState("");

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
            setName(fetchedData.name || "");
            setDescription(fetchedData.description || "");
            setType(fetchedData.type || "pdf");
            setUrl(fetchedData.url || "");

            if (fetchedData.category_id && allCategories) {
                const cat = allCategories.find(c => c.id === fetchedData.category_id);
                if (cat) {
                    if (cat.parent_id) {
                        if (selectedParentId !== cat.parent_id) {
                            setSelectedParentId(cat.parent_id);
                            setSelectedChildId(cat.id);
                            fetchTreeData(cat.parent_id);
                        }
                    } else {
                        if (selectedParentId !== cat.id) {
                            setSelectedParentId(cat.id);
                            fetchTreeData(cat.id);
                        }
                    }
                } else {
                     if (!selectedParentId) {
                         setSelectedParentId(fetchedData.category_id);
                         fetchTreeData(fetchedData.category_id);
                     }
                }
            }
        }
    }, [isEditMode, fetchedData, allCategories]);

    const { data: rootCategories, isLoading: isLoadingRootCategories } = useQuery({
        queryKey: ['parentCategories'],
        queryFn: getParentCategories
    });

    const handleParentSelect = (categoryIdStr: string) => {
        const categoryId = parseInt(categoryIdStr);
        if (isNaN(categoryId) || categoryId === selectedParentId) return;
        setSelectedParentId(categoryId);
        setSelectedChildId(null);
        fetchTreeData(categoryId);
    };

    const handleChildSelect = (categoryIdStr: string) => {
        setSelectedChildId(parseInt(categoryIdStr));
    };

    const upsertMutation = useMutation({
        mutationFn: upsertStudyMaterial,
        onSuccess: () => {
            showToast.success(isEditMode ? 'Study material updated successfully!' : 'Study material created successfully!');
            queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
            navigate('/study-material');
        },
        onError: (error: any) => {
            console.error(error);
            showToast.apiErrorShow(error);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return showToast.error('Name is required');
        }
        if (!url.trim()) {
            return showToast.error('URL is required');
        }

        const finalCategoryId = selectedChildId || selectedParentId || fetchedData?.category_id || null;

        if (!finalCategoryId) {
            return showToast.error('Please select a category');
        }

        const payload: any = {
            name,
            description,
            type,
            url,
            category_id: finalCategoryId,
        };

        if (isEditMode) {
            payload.id = Number(id);
        }

        upsertMutation.mutate(payload);
    };

    return (
        <div className="container mx-auto max-w-5xl py-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">{isEditMode ? 'Edit Study Material' : 'Create Study Material'}</h1>
                        <p className="text-muted-foreground mt-1">
                            {isEditMode ? 'Update your study material details.' : 'Add new study material like PDF, Video, or Links.'}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/study-material')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft size={16} /> Back to List
                </button>
            </div>

            {isEditMode && isLoadingMaterial ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse">
                    <p>Loading details...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    <div className="lg:col-span-12 space-y-6">
                        <CategorySelectionCard
                            parentCategories={rootCategories || []}
                            selectedParentId={selectedParentId}
                            onParentSelect={handleParentSelect}
                            treeData={treeData}
                            selectedChildId={selectedChildId}
                            onChildSelect={handleChildSelect}
                            isLoadingCategories={isLoadingRootCategories || isLoadingChildren}
                        />

                        <Card className="shadow-md border-primary/10">
                            <div className="h-1 bg-primary w-full" />
                            <CardHeader className="bg-muted/30 pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">2. Material Details</CardTitle>
                                <CardDescription>Enter the details for this study material.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Name <span className="text-destructive">*</span></label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. Physics Chapter 1"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Type <span className="text-destructive">*</span></label>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="w-full bg-background border-muted-foreground/20 hover:border-primary/50 transition-colors h-11">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF Document</SelectItem>
                                                <SelectItem value="youtube">Youtube Video</SelectItem>
                                                <SelectItem value="document">Document</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">URL / Link <span className="text-destructive">*</span></label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Enter details about this material..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-12 flex justify-end gap-4 mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/study-material')}
                            className="w-32"
                            disabled={upsertMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-32"
                            disabled={upsertMutation.isPending}
                        >
                            {upsertMutation.isPending ? 'Saving...' : 'Save Material'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default UpsertStudyMaterialPage;