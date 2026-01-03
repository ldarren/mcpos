import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useState, useCallback, useRef } from "react";

interface UploadDocumentPageProps {
  app: App;
  toolResult: CallToolResult | null;
}

interface TranslationJob {
  id: string;
  fileName: string;
  sourceLang: string;
  targetLang: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  createdAt: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const SUPPORTED_FILE_TYPES = [
  ".pdf", ".docx", ".txt", ".rtf", ".odt", ".xlsx", ".pptx"
];

export default function UploadDocumentPage({ app }: UploadDocumentPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [currentJobs, setCurrentJobs] = useState<TranslationJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      alert(`Unsupported file type. Please select one of: ${SUPPORTED_FILE_TYPES.join(', ')}`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUploadAndTranslate = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Create a new translation job
      const jobId = Date.now().toString();
      const newJob: TranslationJob = {
        id: jobId,
        fileName: selectedFile.name,
        sourceLang,
        targetLang,
        status: "pending",
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      setCurrentJobs(prev => [newJob, ...prev]);

      // Simulate file upload and translation process
      console.log("Starting translation for file:", selectedFile.name);

      // Call MCP server tool to handle document translation
      const result = await app.callServerTool({
        name: "translate-document",
        arguments: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          sourceLang,
          targetLang,
          jobId,
        },
      });

      console.log("Translation job started:", result);

      // Update job status
      setCurrentJobs(prev =>
        prev.map(job =>
          job.id === jobId
            ? { ...job, status: "processing", progress: 25 }
            : job
        )
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCurrentJobs(prev =>
          prev.map(job => {
            if (job.id === jobId && job.status === "processing") {
              const newProgress = Math.min(job.progress + 15, 100);
              const newStatus = newProgress === 100 ? "completed" : "processing";
              return { ...job, progress: newProgress, status: newStatus };
            }
            return job;
          })
        );
      }, 1500);

      // Clear interval when job completes
      setTimeout(() => {
        clearInterval(progressInterval);
      }, 8000);

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (error) {
      console.error("Translation failed:", error);

      // Update job to failed status
      setCurrentJobs(prev =>
        prev.map(job =>
          job.id === Date.now().toString()
            ? { ...job, status: "failed" }
            : job
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, sourceLang, targetLang, app]);

  const getStatusBadgeClass = (status: TranslationJob['status']) => {
    switch (status) {
      case "completed": return "status-badge status-completed";
      case "failed": return "status-badge status-failed";
      case "pending":
      case "processing":
      default: return "status-badge status-pending";
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Upload Document</h1>
          <p className="page-description">
            Upload your documents for translation. Supported formats: PDF, DOCX, TXT, RTF, ODT, XLSX, PPTX
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Select Document</label>
          <div
            className={`file-upload-area ${dragOver ? 'dragover' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FILE_TYPES.join(',')}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            {selectedFile ? (
              <div>
                <p><strong>{selectedFile.name}</strong></p>
                <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p className="mt-4">Click to select a different file or drag and drop</p>
              </div>
            ) : (
              <div>
                <p><strong>Drag and drop your document here</strong></p>
                <p>or click to select a file</p>
                <p className="mt-4">Max file size: 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex">
          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="source-lang" className="form-label">Source Language</label>
              <select
                id="source-lang"
                className="form-select"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="target-lang" className="form-label">Target Language</label>
              <select
                id="target-lang"
                className="form-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <button
            className="btn btn-primary"
            onClick={handleUploadAndTranslate}
            disabled={!selectedFile || isUploading || sourceLang === targetLang}
          >
            {isUploading ? "Processing..." : "Upload & Translate"}
          </button>
          {sourceLang === targetLang && (
            <p style={{ color: "#dc3545", marginTop: "8px", fontSize: "14px" }}>
              Source and target languages must be different
            </p>
          )}
        </div>
      </div>

      {currentJobs.length > 0 && (
        <div className="card">
          <div className="page-header">
            <h2 className="page-title">Current Translation Jobs</h2>
            <p className="page-description">
              Track the progress of your ongoing translations
            </p>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Languages</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.fileName}</td>
                  <td>
                    {SUPPORTED_LANGUAGES.find(l => l.code === job.sourceLang)?.name} →{' '}
                    {SUPPORTED_LANGUAGES.find(l => l.code === job.targetLang)?.name}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(job.status)}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <small>{job.progress}%</small>
                  </td>
                  <td>{new Date(job.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}