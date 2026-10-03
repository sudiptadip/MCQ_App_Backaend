import UploadMcqQuestionAns from '../../features/mcq/components/UploadMcqQuestionAns';

const UploadMcqQuestionAnsPage = () => {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Upload Questions</h1>
                <p className="text-muted-foreground">
                    Upload multiple choice questions in bulk using an Excel file.
                </p>
            </div>
            
            <UploadMcqQuestionAns />
        </div>
    );
};

export default UploadMcqQuestionAnsPage;
