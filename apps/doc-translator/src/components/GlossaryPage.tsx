import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useState, useCallback, useEffect } from "react";

interface GlossaryPageProps {
  app: App;
  toolResult: CallToolResult | null;
}

interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  sourceLang: string;
  targetLang: string;
  context?: string;
  category: string;
  confidence: number; // 0-100
  usage_count: number;
  lastUsed: string;
  createdAt: string;
}

interface TranslationMemorySegment {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  confidence: number;
  context: string;
  lastUsed: string;
  usageCount: number;
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

const CATEGORIES = [
  "Technical", "Legal", "Medical", "Business", "Marketing", "Academic", "General"
];

export default function GlossaryPage({ app }: GlossaryPageProps) {
  const [activeTab, setActiveTab] = useState<"glossary" | "memory">("glossary");
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [memorySegments, setMemorySegments] = useState<TranslationMemorySegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for new entries
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    sourceTerm: "",
    targetTerm: "",
    sourceLang: "en",
    targetLang: "es",
    context: "",
    category: "General"
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  // Mock data for demonstration
  const mockGlossaryData: GlossaryEntry[] = [
    {
      id: "1",
      sourceTerm: "machine learning",
      targetTerm: "aprendizaje automático",
      sourceLang: "en",
      targetLang: "es",
      context: "AI and technology context",
      category: "Technical",
      confidence: 95,
      usage_count: 23,
      lastUsed: "2024-12-31T10:30:00Z",
      createdAt: "2024-12-01T09:00:00Z"
    },
    {
      id: "2",
      sourceTerm: "contract",
      targetTerm: "contrato",
      sourceLang: "en",
      targetLang: "es",
      context: "Legal documents",
      category: "Legal",
      confidence: 98,
      usage_count: 45,
      lastUsed: "2024-12-30T14:20:00Z",
      createdAt: "2024-11-15T10:00:00Z"
    },
    {
      id: "3",
      sourceTerm: "Schnittstelle",
      targetTerm: "interface",
      sourceLang: "de",
      targetLang: "en",
      context: "Software development",
      category: "Technical",
      confidence: 92,
      usage_count: 12,
      lastUsed: "2024-12-29T16:45:00Z",
      createdAt: "2024-12-10T11:30:00Z"
    }
  ];

  const mockMemoryData: TranslationMemorySegment[] = [
    {
      id: "tm1",
      sourceText: "Please review the attached document carefully before signing.",
      targetText: "Por favor, revise cuidadosamente el documento adjunto antes de firmar.",
      sourceLang: "en",
      targetLang: "es",
      confidence: 94,
      context: "Legal document review",
      lastUsed: "2024-12-31T10:30:00Z",
      usageCount: 8
    },
    {
      id: "tm2",
      sourceText: "This software requires administrative privileges to install.",
      targetText: "Este software requiere privilegios administrativos para instalarse.",
      sourceLang: "en",
      targetLang: "es",
      confidence: 96,
      context: "Software installation",
      lastUsed: "2024-12-30T09:15:00Z",
      usageCount: 5
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In a real app, these would call the MCP server
        const glossaryResult = await app.callServerTool({
          name: "get-glossary",
          arguments: {}
        });

        const memoryResult = await app.callServerTool({
          name: "get-translation-memory",
          arguments: {}
        });

        console.log("Glossary result:", glossaryResult);
        console.log("Translation memory result:", memoryResult);

        // For now, use mock data
        setTimeout(() => {
          setGlossaryEntries(mockGlossaryData);
          setMemorySegments(mockMemoryData);
          setIsLoading(false);
        }, 1000);

      } catch (error) {
        console.error("Failed to load glossary data:", error);
        // Fallback to mock data
        setGlossaryEntries(mockGlossaryData);
        setMemorySegments(mockMemoryData);
        setIsLoading(false);
      }
    };

    loadData();
  }, [app]);

  const handleAddEntry = useCallback(async () => {
    if (!newEntry.sourceTerm || !newEntry.targetTerm) {
      alert("Please fill in both source and target terms.");
      return;
    }

    try {
      const result = await app.callServerTool({
        name: "add-glossary-entry",
        arguments: {
          sourceTerm: newEntry.sourceTerm,
          targetTerm: newEntry.targetTerm,
          sourceLang: newEntry.sourceLang,
          targetLang: newEntry.targetLang,
          context: newEntry.context,
          category: newEntry.category
        }
      });

      console.log("Added glossary entry:", result);

      // Add to local state
      const entry: GlossaryEntry = {
        id: Date.now().toString(),
        ...newEntry,
        confidence: 85, // Default confidence for user-added entries
        usage_count: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      setGlossaryEntries(prev => [entry, ...prev]);

      // Reset form
      setNewEntry({
        sourceTerm: "",
        targetTerm: "",
        sourceLang: "en",
        targetLang: "es",
        context: "",
        category: "General"
      });
      setShowAddForm(false);

    } catch (error) {
      console.error("Failed to add glossary entry:", error);
      alert("Failed to add entry. Please try again.");
    }
  }, [newEntry, app]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this glossary entry?")) {
      return;
    }

    try {
      await app.callServerTool({
        name: "delete-glossary-entry",
        arguments: { entryId }
      });

      setGlossaryEntries(prev => prev.filter(entry => entry.id !== entryId));
      console.log("Deleted glossary entry:", entryId);

    } catch (error) {
      console.error("Failed to delete glossary entry:", error);
      alert("Failed to delete entry. Please try again.");
    }
  }, [app]);

  const filteredGlossaryEntries = glossaryEntries.filter(entry => {
    const matchesSearch =
      entry.sourceTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.targetTerm.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesLanguage = languageFilter === "all" ||
      entry.sourceLang === languageFilter ||
      entry.targetLang === languageFilter;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const filteredMemorySegments = memorySegments.filter(segment => {
    const matchesSearch =
      segment.sourceText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.targetText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" ||
      segment.sourceLang === languageFilter ||
      segment.targetLang === languageFilter;

    return matchesSearch && matchesLanguage;
  });

  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "#28a745"; // Green
    if (confidence >= 70) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center" style={{ padding: "60px 20px" }}>
            <p>Loading glossary and translation memory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Glossary & Translation Memory</h1>
          <p className="page-description">
            Manage your terminology database and translation memory to improve consistency
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderBottom: "1px solid #eee", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <button
              onClick={() => setActiveTab("glossary")}
              style={{
                padding: "12px 0",
                border: "none",
                background: "none",
                fontSize: "16px",
                fontWeight: "500",
                color: activeTab === "glossary" ? "#007acc" : "#666",
                borderBottom: activeTab === "glossary" ? "2px solid #007acc" : "none",
                cursor: "pointer"
              }}
            >
              Glossary ({glossaryEntries.length})
            </button>
            <button
              onClick={() => setActiveTab("memory")}
              style={{
                padding: "12px 0",
                border: "none",
                background: "none",
                fontSize: "16px",
                fontWeight: "500",
                color: activeTab === "memory" ? "#007acc" : "#666",
                borderBottom: activeTab === "memory" ? "2px solid #007acc" : "none",
                cursor: "pointer"
              }}
            >
              Translation Memory ({memorySegments.length})
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex mb-4">
          <div className="flex-1">
            <div className="form-group">
              <label htmlFor="search" className="form-label">Search</label>
              <input
                id="search"
                type="text"
                className="form-input"
                placeholder={activeTab === "glossary" ? "Search terms..." : "Search segments..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTab === "glossary" && (
            <div className="flex-1">
              <div className="form-group">
                <label htmlFor="category-filter" className="form-label">Category</label>
                <select
                  id="category-filter"
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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

        {/* Add Entry Button for Glossary */}
        {activeTab === "glossary" && (
          <div className="mb-4">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : "Add New Entry"}
            </button>
          </div>
        )}

        {/* Add Entry Form */}
        {showAddForm && (
          <div className="card" style={{ marginBottom: "20px", background: "#f8f9fa" }}>
            <h3 style={{ marginBottom: "16px" }}>Add New Glossary Entry</h3>

            <div className="flex">
              <div className="flex-1">
                <div className="form-group">
                  <label className="form-label">Source Term</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEntry.sourceTerm}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, sourceTerm: e.target.value }))}
                    placeholder="Enter source term"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="form-group">
                  <label className="form-label">Target Term</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newEntry.targetTerm}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, targetTerm: e.target.value }))}
                    placeholder="Enter target term"
                  />
                </div>
              </div>
            </div>

            <div className="flex">
              <div className="flex-1">
                <div className="form-group">
                  <label className="form-label">Source Language</label>
                  <select
                    className="form-select"
                    value={newEntry.sourceLang}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, sourceLang: e.target.value }))}
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
                  <label className="form-label">Target Language</label>
                  <select
                    className="form-select"
                    value={newEntry.targetLang}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, targetLang: e.target.value }))}
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
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newEntry.category}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Context (Optional)</label>
              <textarea
                className="form-textarea"
                value={newEntry.context}
                onChange={(e) => setNewEntry(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Provide context or usage notes for this term"
                style={{ minHeight: "80px" }}
              />
            </div>

            <div className="flex">
              <button className="btn btn-primary" onClick={handleAddEntry}>
                Add Entry
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
                style={{ marginLeft: "12px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Glossary Tab Content */}
        {activeTab === "glossary" && (
          <>
            {filteredGlossaryEntries.length === 0 ? (
              <div className="empty-state">
                <h3>No glossary entries found</h3>
                <p>
                  {glossaryEntries.length === 0
                    ? "Start building your glossary by adding terminology entries."
                    : "No entries match your current filters."}
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Source Term</th>
                    <th>Target Term</th>
                    <th>Languages</th>
                    <th>Category</th>
                    <th>Confidence</th>
                    <th>Usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlossaryEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.sourceTerm}</strong>
                        {entry.context && (
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            {entry.context}
                          </div>
                        )}
                      </td>
                      <td><strong>{entry.targetTerm}</strong></td>
                      <td>
                        {getLanguageName(entry.sourceLang)} → {getLanguageName(entry.targetLang)}
                      </td>
                      <td>
                        <span className="status-badge status-completed">
                          {entry.category}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: getConfidenceColor(entry.confidence), fontWeight: "500" }}>
                          {entry.confidence}%
                        </span>
                      </td>
                      <td>
                        {entry.usage_count} times
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          Last: {new Date(entry.lastUsed).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Translation Memory Tab Content */}
        {activeTab === "memory" && (
          <>
            {filteredMemorySegments.length === 0 ? (
              <div className="empty-state">
                <h3>No translation memory segments found</h3>
                <p>
                  {memorySegments.length === 0
                    ? "Translation memory segments are automatically created from your translations."
                    : "No segments match your current filters."}
                </p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Source Text</th>
                    <th>Target Text</th>
                    <th>Languages</th>
                    <th>Confidence</th>
                    <th>Usage</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemorySegments.map((segment) => (
                    <tr key={segment.id}>
                      <td>
                        <div style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                          {segment.sourceText}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                          {segment.targetText}
                        </div>
                      </td>
                      <td>
                        {getLanguageName(segment.sourceLang)} → {getLanguageName(segment.targetLang)}
                      </td>
                      <td>
                        <span style={{ color: getConfidenceColor(segment.confidence), fontWeight: "500" }}>
                          {segment.confidence}%
                        </span>
                      </td>
                      <td>
                        {segment.usageCount} times
                        <div style={{ fontSize: "11px", color: "#666" }}>
                          Last: {new Date(segment.lastUsed).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {segment.context}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}