import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useState, useCallback, useEffect } from "react";

interface TranslationHistoryPageProps {
  app: App;
  toolResult: CallToolResult | null;
}

interface HistoryItem {
  id: string;
  fileName: string;
  originalSize: string;
  sourceLang: string;
  targetLang: string;
  status: "completed" | "failed";
  translatedAt: string;
  downloadUrl?: string;
  wordCount: number;
  translationTime: string; // e.g., "2.3 minutes"
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

export default function TranslationHistoryPage({ app }: TranslationHistoryPageProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed">("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  // Mock data for demonstration
  const mockHistoryData: HistoryItem[] = [
    {
      id: "1",
      fileName: "Business_Contract_2024.pdf",
      originalSize: "2.4 MB",
      sourceLang: "en",
      targetLang: "es",
      status: "completed",
      translatedAt: "2024-12-31T10:30:00Z",
      downloadUrl: "#",
      wordCount: 1245,
      translationTime: "3.2 minutes"
    },
    {
      id: "2",
      fileName: "Technical_Manual.docx",
      originalSize: "5.1 MB",
      sourceLang: "en",
      targetLang: "fr",
      status: "completed",
      translatedAt: "2024-12-31T09:15:00Z",
      downloadUrl: "#",
      wordCount: 2890,
      translationTime: "7.8 minutes"
    },
    {
      id: "3",
      fileName: "Marketing_Brochure.pdf",
      originalSize: "1.2 MB",
      sourceLang: "es",
      targetLang: "en",
      status: "failed",
      translatedAt: "2024-12-30T16:45:00Z",
      wordCount: 654,
      translationTime: "N/A"
    },
    {
      id: "4",
      fileName: "User_Guide_v2.docx",
      originalSize: "3.8 MB",
      sourceLang: "de",
      targetLang: "en",
      status: "completed",
      translatedAt: "2024-12-30T14:20:00Z",
      downloadUrl: "#",
      wordCount: 1876,
      translationTime: "5.1 minutes"
    },
    {
      id: "5",
      fileName: "Annual_Report_2023.pdf",
      originalSize: "8.7 MB",
      sourceLang: "en",
      targetLang: "zh",
      status: "completed",
      translatedAt: "2024-12-29T11:00:00Z",
      downloadUrl: "#",
      wordCount: 4523,
      translationTime: "12.4 minutes"
    }
  ];

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would call the MCP server
        const result = await app.callServerTool({
          name: "get-translation-history",
          arguments: {}
        });

        console.log("Translation history result:", result);

        // For now, use mock data
        setTimeout(() => {
          setHistoryItems(mockHistoryData);
          setIsLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Failed to load translation history:", error);
        // Fallback to mock data
        setHistoryItems(mockHistoryData);
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [app]);

  const handleDownload = useCallback(async (item: HistoryItem) => {
    try {
      const result = await app.callServerTool({
        name: "download-translation",
        arguments: {
          translationId: item.id,
          fileName: item.fileName
        }
      });

      console.log("Download initiated:", result);

      // In a real implementation, this would handle the actual download
      alert(`Download started for: ${item.fileName}`);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    }
  }, [app]);

  const handleDelete = useCallback(async (item: HistoryItem) => {
    if (!confirm(`Are you sure you want to delete the translation of "${item.fileName}"?`)) {
      return;
    }

    try {
      await app.callServerTool({
        name: "delete-translation",
        arguments: {
          translationId: item.id
        }
      });

      setHistoryItems(prev => prev.filter(historyItem => historyItem.id !== item.id));
      console.log("Translation deleted:", item.id);

    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete translation. Please try again.");
    }
  }, [app]);

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesLanguage = languageFilter === "all" ||
      item.sourceLang === languageFilter ||
      item.targetLang === languageFilter;

    return matchesSearch && matchesStatus && matchesLanguage;
  });

  const getStatusBadgeClass = (status: HistoryItem['status']) => {
    switch (status) {
      case "completed": return "status-badge status-completed";
      case "failed": return "status-badge status-failed";
      default: return "status-badge status-pending";
    }
  };

  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <p>Loading translation history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Translation History</h1>
          <p className="page-description">
            View and manage all your completed document translations
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex mb-4">
          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="search" className="form-label">Search Files</label>
              <input
                id="search"
                type="text"
                className="form-input"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="status-filter" className="form-label">Status</label>
              <select
                id="status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="language-filter" className="form-label">Language</label>
              <select
                id="language-filter"
                className="form-select"
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <option value="all">All Languages</option>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h3>No translations found</h3>
            <p>
              {historyItems.length === 0
                ? "You haven't completed any translations yet."
                : "No translations match your current filters."}
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Languages</th>
                <th>Words</th>
                <th>Time</th>
                <th>Status</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.fileName}</strong>
                  </td>
                  <td>{item.originalSize}</td>
                  <td>
                    {getLanguageName(item.sourceLang)} → {getLanguageName(item.targetLang)}
                  </td>
                  <td>{item.wordCount.toLocaleString()}</td>
                  <td>{item.translationTime}</td>
                  <td>
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status}
                    </span>
                  </td>
                  <td>{formatDate(item.translatedAt)}</td>
                  <td>
                    <div className="flex">
                      {item.status === "completed" && item.downloadUrl && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleDownload(item)}
                          style={{ marginRight: "8px" }}
                        >
                          Download
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary Statistics */}
        <div className="mt-4" style={{ paddingTop: "16px", borderTop: "1px solid #eee" }}>
          <div className="flex">
            <div className="flex-1 text-center">
              <strong>{historyItems.length}</strong>
              <p>Total Translations</p>
            </div>
            <div className="flex-1 text-center">
              <strong>{historyItems.filter(item => item.status === "completed").length}</strong>
              <p>Completed</p>
            </div>
            <div className="flex-1 text-center">
              <strong>{historyItems.filter(item => item.status === "failed").length}</strong>
              <p>Failed</p>
            </div>
            <div className="flex-1 text-center">
              <strong>{historyItems.reduce((sum, item) => sum + item.wordCount, 0).toLocaleString()}</strong>
              <p>Words Translated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}