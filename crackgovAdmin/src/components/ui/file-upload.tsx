import * as React from "react";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Archive, 
  Trash2, 
  Loader2, 
  Eye, 
  Download, 
  AlertCircle, 
  X, 
  FileCode, 
  FileAudio, 
  FileVideo
} from "lucide-react";
import api from "../../lib/axios";
import { cn } from "../../lib/utils";
import { showToast } from "../../utils/toast";

export interface FileUploadValue {
  id: number;
  url: string;
  fileName?: string;
}

export interface FileUploadProps {
  value?: FileUploadValue | null;
  onChange?: (value: FileUploadValue | null) => void;
  accept?: string; // e.g. "image/*,application/pdf"
  maxSize?: number; // In Bytes, default 10MB (10 * 1024 * 1024)
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "any";
}

// Helper to check if a file/URL is an image
const isImageFile = (fileNameOrUrl?: string): boolean => {
  if (!fileNameOrUrl) return false;
  const cleanUrl = fileNameOrUrl.split("?")[0].toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(cleanUrl);
};

// Helper to format file size beautifully
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper to get extension
const getFileExtension = (fileNameOrUrl?: string): string => {
  if (!fileNameOrUrl) return "";
  const cleanUrl = fileNameOrUrl.split("?")[0];
  return cleanUrl.substring(cleanUrl.lastIndexOf(".") + 1).toUpperCase();
};

// Helper to resolve relative URL using VITE_API_URL
const getAbsoluteUrl = (url?: string | null): string => {
  if (!url) return "";
  const cleanUrl = url.trim().replace(/\\/g, "/");
  if (/^(https?:|data:)/i.test(cleanUrl)) {
    return cleanUrl;
  }
  let apiBase = (import.meta.env.VITE_API_URL || "").trim();
  // Remove trailing /api or /api/
  apiBase = apiBase.replace(/\/api\/?$/, "");
  // Ensure apiBase doesn't have a trailing slash
  apiBase = apiBase.replace(/\/$/, "");
  // Ensure cleanUrl has a leading slash if not present
  const slash = cleanUrl.startsWith("/") ? "" : "/";
  return `${apiBase}${slash}${cleanUrl}`;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  value = null,
  onChange,
  accept = "*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  label,
  error,
  disabled = false,
  className,
  aspectRatio = "any"
}) => {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [showLightbox, setShowLightbox] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const cancelSourceRef = React.useRef<AbortController | null>(null);

  // Clean up abort controller on unmount
  React.useEffect(() => {
    return () => {
      if (cancelSourceRef.current) {
        cancelSourceRef.current.abort();
      }
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || isUploading) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndUploadFile(file);
    }
  };

  const validateAndUploadFile = async (file: File) => {
    setLocalError(null);

    // Validate size
    if (file.size > maxSize) {
      const errorMsg = `File size exceeds the limit of ${formatFileSize(maxSize)}.`;
      setLocalError(errorMsg);
      showToast.error(errorMsg);
      return;
    }

    // Validate type/accept attribute if specified and not wildcard
    if (accept && accept !== "*" && accept !== "") {
      const acceptedTypes = accept.split(",").map(t => t.trim());
      const fileType = file.type;
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          // Extension match
          return type.toLowerCase() === fileExtension;
        } else if (type.endsWith("/*")) {
          // Mime category match (e.g. image/*)
          const category = type.replace("/*", "");
          return fileType.startsWith(category);
        } else {
          // Exact mime type match
          return type === fileType;
        }
      });

      if (!isAccepted) {
        const errorMsg = `Invalid file type. Only ${accept} files are allowed.`;
        setLocalError(errorMsg);
        showToast.error(errorMsg);
        return;
      }
    }

    // Start upload
    setIsUploading(true);
    setUploadProgress(0);
    cancelSourceRef.current = new AbortController();

    const formData = new FormData();
    formData.append("File", file);

    try {
      const response = await api.post("/Document/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: cancelSourceRef.current.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      // Parse output cleanly supporting both casing conventions
      const responseData = response.data;
      if (responseData && responseData.isSuccess) {
        const docData = responseData.data;
        const uploadedValue: FileUploadValue = {
          id: docData?.documentId ?? docData?.DocumentId,
          url: docData?.url ?? docData?.Url,
          fileName: docData?.fileName ?? docData?.FileName ?? file.name
        };

        if (uploadedValue.id && uploadedValue.url) {
          onChange?.(uploadedValue);
          showToast.success(responseData.message || "File uploaded successfully!");
        } else {
          throw new Error("Invalid response format from backend.");
        }
      } else {
        throw new Error(responseData?.message || "Upload failed.");
      }
    } catch (error: any) {
      if (error.name === "CanceledError" || error.name === "AbortError") {
        showToast.info("Upload cancelled.");
      } else {
        const errorMsg = error?.response?.data?.message || error?.message || "Failed to upload file.";
        setLocalError(errorMsg);
        showToast.error(errorMsg);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      cancelSourceRef.current = null;
      if (inputRef.current) {
        inputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handleCancelUpload = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.abort();
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value || disabled || isDeleting) return;

    const fileId = value.id;
    setIsDeleting(true);

    try {
      const response = await api.delete(`/Document/${fileId}`);
      if (response.data && response.data.isSuccess) {
        onChange?.(null);
        showToast.success(response.data.message || "File removed successfully.");
        setLocalError(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete file.");
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete file from server.";
      showToast.error(errorMsg);
      // Even if delete fails on server, sometimes we want to allow removing from frontend
      // But it is safer to keep the item and display the error
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIconComponent = (fileNameOrUrl?: string) => {
    const ext = getFileExtension(fileNameOrUrl).toLowerCase();
    
    const iconClass = "size-8 stroke-[1.5]";

    switch (ext) {
      case "pdf":
        return <FileText className={cn(iconClass, "text-rose-500")} />;
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className={cn(iconClass, "text-emerald-500")} />;
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
        return <Archive className={cn(iconClass, "text-amber-500")} />;
      case "doc":
      case "docx":
      case "rtf":
      case "txt":
        return <FileText className={cn(iconClass, "text-blue-500")} />;
      case "html":
      case "css":
      case "js":
      case "ts":
      case "tsx":
      case "json":
        return <FileCode className={cn(iconClass, "text-indigo-500")} />;
      case "mp3":
      case "wav":
      case "ogg":
        return <FileAudio className={cn(iconClass, "text-cyan-500")} />;
      case "mp4":
      case "mkv":
      case "avi":
      case "mov":
        return <FileVideo className={cn(iconClass, "text-purple-500")} />;
      default:
        return <FileText className={cn(iconClass, "text-slate-400")} />;
    }
  };

  const triggerSelect = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const hasError = !!(error || localError);
  const displayError = error || localError;

  // Determine Aspect Ratio Tailwind styles
  const ratioClasses = {
    square: "aspect-square max-w-[240px]",
    video: "aspect-video w-full max-w-[480px]",
    any: "min-h-[140px] w-full"
  }[aspectRatio];

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {label && (
        <span className="text-sm font-semibold text-foreground tracking-wide flex items-center gap-1.5">
          {label}
        </span>
      )}

      {/* Main Upload / View Area */}
      <div className="relative group/uploader">
        {/* Input element (hidden) */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* 1. UPLOADING STATE */}
        {isUploading && (
          <div className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/40 bg-primary/[0.02] rounded-xl transition-all duration-300 animate-pulse",
            ratioClasses
          )}>
            <div className="relative flex items-center justify-center mb-4">
              <Loader2 className="size-10 text-primary animate-spin" />
              <span className="absolute text-[11px] font-bold text-primary select-none">
                {uploadProgress}%
              </span>
            </div>
            
            <p className="text-sm font-medium text-foreground text-center max-w-[250px] truncate mb-2">
              Uploading your file...
            </p>

            {/* Progress Bar Container */}
            <div className="w-full max-w-[260px] bg-muted/60 h-1.5 rounded-full overflow-hidden mb-4 relative">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <button
              type="button"
              onClick={handleCancelUpload}
              className="text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/10 rounded-md px-3 py-1.5 transition-all inline-flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <X className="size-3.5" />
              Cancel Upload
            </button>
          </div>
        )}

        {/* 2. UPLOADED STATE (PREVIEW / EDIT) */}
        {!isUploading && value && (
          <div className={cn(
            "relative border border-border/80 bg-card rounded-xl overflow-hidden shadow-sm group/preview transition-all duration-300 hover:shadow-md hover:border-border/100",
            ratioClasses
          )}>
            {isImageFile(value.url) ? (
              // IMAGE PREVIEW
              <div className="relative w-full h-full flex items-center justify-center bg-muted/30 aspect-video rounded-xl min-h-[160px] overflow-hidden">
                <img
                  src={getAbsoluteUrl(value.url)}
                  alt={value.fileName || "Uploaded document"}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/preview:scale-105"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                
                {/* Dark blur-glassmorphic overlay on hover */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setShowLightbox(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white rounded-lg transition-all scale-90 group-hover/preview:scale-100 hover:scale-110 active:scale-95 cursor-pointer"
                    title="View Image"
                  >
                    <Eye className="size-4.5" />
                  </button>
                  <a
                    href={getAbsoluteUrl(value.url)}
                    download={value.fileName || "download"}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/20 hover:bg-white/30 border border-white/20 text-white rounded-lg transition-all scale-90 group-hover/preview:scale-100 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Download"
                  >
                    <Download className="size-4.5" />
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleDeleteFile}
                      disabled={isDeleting}
                      className="p-2 bg-destructive/80 hover:bg-destructive text-white rounded-lg border border-destructive/50 transition-all scale-90 group-hover/preview:scale-100 hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Delete"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-4.5" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Floating file tag */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-semibold text-white bg-black/55 backdrop-blur-md rounded-md tracking-wider flex items-center gap-1 uppercase select-none">
                  <ImageIcon className="size-3" />
                  Image
                </div>
              </div>
            ) : (
              // DOCUMENT / FILE PREVIEW
              <div className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-all duration-300 rounded-xl min-h-[80px]">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-card border border-border/80 rounded-xl flex items-center justify-center shadow-xs shrink-0">
                    {getFileIconComponent(value.fileName || value.url)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                      {value.fileName || "Uploaded File"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground select-none">
                      <span className="font-semibold px-1.5 py-0.2 bg-muted border border-border/60 rounded text-[9px] text-muted-foreground tracking-wider">
                        {getFileExtension(value.fileName || value.url) || "FILE"}
                      </span>
                      <span>•</span>
                      <a 
                        href={getAbsoluteUrl(value.url)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:underline hover:text-primary transition-all flex items-center gap-0.5"
                      >
                        Download file <Download className="size-3 inline" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleDeleteFile}
                      disabled={isDeleting}
                      className="p-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/10 text-destructive rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Delete File"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. IDLE / DROP STATE */}
        {!isUploading && !value && (
          <div
            onClick={triggerSelect}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer select-none transition-all duration-300",
              "bg-gradient-to-br from-muted/5 via-card/80 to-muted/10",
              isDragActive 
                ? "border-primary bg-primary/[0.03] scale-[0.99] shadow-inner ring-4 ring-primary/10" 
                : hasError 
                  ? "border-destructive/60 hover:border-destructive bg-destructive/[0.01] hover:bg-destructive/[0.02]" 
                  : "border-border hover:border-primary/50 hover:shadow-xs",
              disabled && "pointer-events-none opacity-40",
              ratioClasses
            )}
          >
            {/* Glowing Icon Base */}
            <div className={cn(
              "p-4 bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-center transition-all duration-300 mb-4 shadow-xs",
              "group-hover/uploader:scale-110 group-hover/uploader:bg-primary/5 group-hover/uploader:border-primary/20 group-hover/uploader:text-primary",
              isDragActive && "scale-110 bg-primary/5 border-primary/20 text-primary",
              hasError && "group-hover/uploader:bg-destructive/5 group-hover/uploader:border-destructive/20 group-hover/uploader:text-destructive"
            )}>
              {hasError ? (
                <AlertCircle className="size-7 stroke-[1.5] text-destructive animate-bounce" />
              ) : (
                <UploadCloud className="size-7 stroke-[1.5] text-muted-foreground group-hover/uploader:text-primary transition-colors duration-300" />
              )}
            </div>

            <div className="text-center max-w-[260px]">
              <p className="text-sm font-medium text-foreground tracking-tight">
                {isDragActive ? (
                  <span className="text-primary font-semibold">Drop file to upload!</span>
                ) : (
                  <>
                    <span className="text-primary font-semibold hover:underline">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1 tracking-tight select-none">
                Allowed formats: {accept === "*" ? "Any File" : accept.replace(/image\/\*/g, "Images").replace(/application\//g, "")}
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 tracking-tight select-none">
                Max file size: {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <p className="text-xs font-medium text-destructive mt-0.5 flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="size-3.5 shrink-0" />
          {displayError}
        </p>
      )}

      {/* 4. LIGHTBOX PREVIEW MODAL */}
      {showLightbox && value && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowLightbox(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] bg-card/85 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border/80 select-none">
              <span className="text-sm font-medium text-foreground truncate max-w-[280px] sm:max-w-md">
                {value.fileName || "Image Preview"}
              </span>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-all text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            
            {/* Image Body */}
            <div className="p-2 overflow-auto flex items-center justify-center bg-muted/20">
              <img
                src={getAbsoluteUrl(value.url)}
                alt={value.fileName || "Preview"}
                className="max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 p-3 border-t border-border/80 select-none">
              <a
                href={getAbsoluteUrl(value.url)}
                download={value.fileName || "download"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                <Download className="size-3.5" />
                Download Original
              </a>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="inline-flex items-center px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/95 transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
