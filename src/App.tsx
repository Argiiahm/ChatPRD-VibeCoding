import { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Download,
  FileText,
  Layout,
  Settings,
  Check,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  RotateCcw,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import Mermaid from './components/Mermaid';
import Documentation from './components/Documentation';
import { GeminiService } from './services/gemini';
import { getProjects, saveProject, deleteProject, createProject, addRevision, canRevise, type PRDProject } from './services/storage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TEMPLATES = [
  { id: 'saas', name: 'SaaS', icon: Layout },
  { id: 'mobile', name: 'Mobile App', icon: Settings },
  { id: 'ai', name: 'AI Product', icon: Sparkles },
  { id: 'marketplace', name: 'Marketplace', icon: Send },
];

const MOCK_RESULT = {
  prd: `## 🚀 Product Requirement Document (PRD): AI-Powered E-Commerce Recommendation Engine

### 1. Objective
To build a highly scalable, real-time AI recommendation engine that increases average order value (AOV) by 15% within the first quarter of deployment. The system will leverage collaborative filtering, natural language processing on product descriptions, and real-time user session tracking.

### 2. Problem Statement
Current product recommendations are static, rule-based, and do not adapt to user behavior in real-time. This leads to poor conversion rates on cross-sell and up-sell opportunities (currently below 2.5%). Users often abandon carts because they cannot find complementary items quickly.

### 3. Solution Overview
We will implement a hybrid recommendation system integrating:
- **Real-time Session Context:** Tracks clicks, time spent on page, and cart additions using Redis.
- **Deep Learning Embeddings:** Uses a vector database (Pinecone/Milvus) to match semantic similarities between products.
- **Collaborative Filtering:** Batch processing via Apache Spark to analyze historical purchase patterns.

### 4. Features List
#### Phase 1 (MVP)
- **"Customers who bought this also bought"** widget (Collaborative Filtering).
- **"Similar items"** widget (Vector Embeddings).
- **Basic A/B Testing Infrastructure** to measure recommendation effectiveness.

#### Phase 2
- **Real-time Personalization:** Adapts to anonymous users within 3 clicks.
- **Email Integration:** Personalized weekly digests.
- **Dynamic Pricing:** Slight discounts on recommended bundles to increase conversion.

### 5. User Flow
1. User lands on a Product Details Page (PDP).
2. The frontend triggers an asynchronous call to the Recommendation API, passing the \`product_id\` and \`session_id\`.
3. The API queries the Cache for pre-computed collaborative filtering results.
4. Concurrently, the API queries the Vector DB for semantically similar items.
5. A ranking algorithm scores the combined results and returns the top 5 items.
6. The user clicks a recommended item, sending a telemetry event for model reinforcement.
7. User adds the item to the cart (Conversion!).

### 6. Technical Suggestions
- Use **FastAPI (Python)** for the recommendation microservice due to its async nature and ML ecosystem compatibility.
- Utilize **Kafka** for event streaming (clicks, views) to feed the ML training pipeline.
- Implement a **Circuit Breaker** pattern so the PDP still loads fast even if the recommendation engine times out.
- **Latency Budget:** Must return recommendations in < 150ms.
### 7. Database Schema Recommendation
For a high-performance recommendation engine, we suggest a polyglot persistence architecture. Below is the relational schema for the core application (PostgreSQL).

#### Table: \`users\`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| \`id\` | UUID | PRIMARY KEY | Unique user identifier |
| \`email\` | VARCHAR(255) | UNIQUE, NOT NULL | User contact email |
| \`segment_id\` | INT | FOREIGN KEY | Maps to user behavior segment |
| \`created_at\` | TIMESTAMPTZ | DEFAULT NOW() | Account creation time |

#### Table: \`products\`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| \`id\` | UUID | PRIMARY KEY | Product identifier |
| \`sku\` | VARCHAR(50) | UNIQUE, NOT NULL | Stock Keeping Unit |
| \`category_id\` | INT | FOREIGN KEY | Product category |
| \`embedding_id\` | UUID | NULLABLE | Ref to Vector DB (Pinecone) |
| \`price\` | DECIMAL(10,2) | NOT NULL | Current price |

#### Table: \`user_interactions\` (Partitioned)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| \`event_id\` | BIGSERIAL | PRIMARY KEY | Event identifier |
| \`user_id\` | UUID | INDEXED | Foreign key to users |
| \`product_id\` | UUID | INDEXED | Foreign key to products |
| \`action_type\`| ENUM | NOT NULL | 'VIEW', 'CART', 'PURCHASE' |
| \`timestamp\` | TIMESTAMPTZ | DEFAULT NOW() | Time of interaction |

*Note: Session state will be stored in **Redis** with a 24-hour TTL. Deep learning embeddings (1536-dimensional vectors) will be managed via **Pinecone/Milvus**.*
`,
  mermaid: `flowchart TD
    A[Web Client] --> C[API Gateway]
    B[Analytics SDK] --> J[Kafka Bus]
    C --> D[Auth Service]
    D --> E[FastAPI Backend]
    E --> F{Cache Hit}
    F -->|Yes| G[Redis Cache]
    F -->|No| I[Vector Search]
    I --> H[Ranking Engine]
    G --> H
    H --> E
    E --> C
    J --> K[Spark Processing]
    K --> M[Model Training]
    M --> I
    K --> G

    style A fill:#6366f1,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#a855f7,stroke:#333,stroke-width:2px,color:#fff
    style J fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style H fill:#f59e0b,stroke:#333,stroke-width:2px,color:#fff`
};

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const storedModel = localStorage.getItem('gemini_model_name') || '';
  const defaultModel = (storedModel && !storedModel.includes('deepseek')) ? storedModel : 'gemini-1.5-flash';
  const [modelName, setModelName] = useState(defaultModel);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!apiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Project & Version state
  const [projects, setProjects] = useState<PRDProject[]>(getProjects());
  const [activeProject, setActiveProject] = useState<PRDProject | null>(() => {
    const savedId = localStorage.getItem('active_project_id');
    if (savedId) {
      const found = getProjects().find(p => p.id === savedId);
      return found || null;
    }
    return null;
  });
  const [activeVersionIndex, setActiveVersionIndex] = useState(() => {
    const savedIdx = localStorage.getItem('active_version_index');
    return savedIdx ? parseInt(savedIdx, 10) : 0;
  });

  // Derived: current result from active project + version
  const result = activeProject
    ? { prd: activeProject.versions[activeVersionIndex].prd, mermaid: activeProject.versions[activeVersionIndex].mermaid }
    : null;

  // Persist active project ID and index to localStorage
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('active_project_id', activeProject.id);
      localStorage.setItem('active_version_index', String(activeVersionIndex));
    } else {
      localStorage.removeItem('active_project_id');
      localStorage.removeItem('active_version_index');
    }
  }, [activeProject, activeVersionIndex]);

  const refreshProjects = () => setProjects(getProjects());

  const handleNew = () => {
    setActiveProject(null);
    setActiveVersionIndex(0);
    setPrompt('');
    setErrorMsg(null);
    setIsMockMode(false);
    setActiveTemplate(null);
    localStorage.removeItem('active_project_id');
    localStorage.removeItem('active_version_index');
  };

  const handleGenerate = async () => {
    if (!prompt || !apiKey) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsMockMode(false);

    // If there's an active project and it can be revised → revision mode
    if (activeProject && canRevise(activeProject)) {
      try {
        const currentVersion = activeProject.versions[activeProject.versions.length - 1];
        const service = new GeminiService(apiKey, modelName);
        const reviseFullPrompt = `Original PRD:\n${currentVersion.prd}\n\nRevision request: ${prompt}\n\nIMPORTANT: ONLY revise the PRD text based on the request. Keep the same format. Do NOT generate or include the ## FLOW_DIAGRAM or mermaid code block.`;
        const data = await service.generatePRD(reviseFullPrompt, activeProject.template || undefined);

        if (!data) throw new Error("No data returned from AI service");

        // Reuse original mermaid diagram for revisions as requested ("cuma 1 kali")
        const updated = addRevision(activeProject, data.prd, currentVersion.mermaid, prompt);

        saveProject(updated);
        setActiveProject(updated);
        setActiveVersionIndex(updated.versions.length - 1);
        setPrompt('');
        refreshProjects();
      } catch (error: any) {
        setErrorMsg(`Revision failed: ${error?.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Otherwise → generate new project
    try {
      const service = new GeminiService(apiKey, modelName);
      const data = await service.generatePRD(prompt, activeTemplate || undefined);
      if (!data) throw new Error("No data returned from AI service");
      const project = createProject(prompt, activeTemplate, data.prd, data.mermaid);
      saveProject(project);
      setActiveProject(project);
      setActiveVersionIndex(0);
      setPrompt('');
      refreshProjects();
    } catch (error: any) {
      const errorMessage = error?.message || 'Please check your API key and connection.';
      setErrorMsg(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = (project: PRDProject) => {
    setActiveProject(project);
    setActiveVersionIndex(project.versions.length - 1);
    setPrompt('');
    setErrorMsg(null);
    setIsMockMode(false);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    refreshProjects();
    if (activeProject?.id === id) handleNew();
  };

  const saveSettings = (key: string, model: string) => {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model_name', model);
    setApiKey(key);
    setModelName(model);
    setIsSettingsOpen(false);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prd + '\n\n' + result.mermaid);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result.prd + '\n\n## Diagram\n\n```mermaid\n' + result.mermaid + '\n```'], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = "product_requirement_document.md";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#1E1D1B] border-r border-[#3A3834]/50 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#3A3834]/50 flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 pt-2">
            <span className="text-[15px] font-medium tracking-tight text-foreground/90">
              ChatPRD
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-[#88857F] hover:text-foreground md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => { handleNew(); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 bg-[#2B2A27] border border-[#3A3834] rounded-xl text-[13px] font-medium text-foreground hover:bg-[#3A3834] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#D4A373]" />
            New Project
          </button>
        </div>

        {/* Sidebar History */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[11px] font-bold text-[#88857F] uppercase tracking-widest px-3 mb-3 mt-2">
            Recent Projects
          </p>
          <div className="space-y-1">
            {projects.length === 0 && (
              <p className="text-[12px] text-[#88857F]/50 px-3 py-4 text-center">No projects yet</p>
            )}
            {projects.map((proj) => (
              <div
                key={proj.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-left group cursor-pointer",
                  activeProject?.id === proj.id
                    ? "bg-[#2B2A27] text-[#EBEBE6]"
                    : "hover:bg-[#2B2A27] text-[#88857F] hover:text-[#EBEBE6]"
                )}
                onClick={() => handleLoadProject(proj)}
              >
                <MessageSquare className="w-4 h-4 text-[#88857F] group-hover:text-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] truncate block">{proj.title}</span>
                  <span className="text-[10px] text-[#88857F]/60">
                    {proj.versions.length > 1 ? `v${proj.versions.length}` : ''} {new Date(proj.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#3A3834]/50">
          <button
            onClick={() => setIsDocsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2B2A27] text-[#88857F] hover:text-foreground transition-colors text-left mb-1"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[13px] font-medium">Docs</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#2B2A27] text-[#88857F] hover:text-foreground transition-colors text-left"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[13px] font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background relative w-full">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#3A3834]/50 bg-[#1E1D1B]/50 backdrop-blur-md sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[#88857F] hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-[14px] font-medium text-foreground/90">ChatPRD</span>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-[#88857F] hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Output Area */}
        <div className="flex-1 overflow-y-auto w-full" id="output-area">
          {!result && !isLoading ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
              <div className="max-w-md">
                <div className="w-14 h-14 bg-[#2B2A27] rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-[#3A3834]">
                  <Sparkles className="w-6 h-6 text-[#D4A373]" />
                </div>
                <h1 className="text-3xl font-semibold  mb-3 text-foreground">What are we building?</h1>
                <p className="text-[15px] text-[#88857F] leading-relaxed mb-4">
                  Describe your product idea below, and I'll draft a comprehensive PRD with database schemas and a user flow diagram.
                </p>
                <button 
                  onClick={() => setIsDocsOpen(true)}
                  className="text-[13px] text-[#D4A373] hover:underline mb-8 inline-flex items-center gap-1"
                >
                  Learn how it works <BookOpen className="w-3 h-3" />
                </button>

                {/* Template chips in empty state */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setActiveTemplate(tpl.id === activeTemplate ? null : tpl.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] border transition-all",
                        activeTemplate === tpl.id
                          ? "bg-[#2B2A27] border-[#D4A373]/50 text-[#D4A373]"
                          : "bg-transparent border-[#3A3834] hover:bg-[#2B2A27] text-[#88857F]"
                      )}
                    >
                      <tpl.icon className="w-3.5 h-3.5" />
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Result Area */
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
              {/* Action Bar */}
              {result && !isLoading && (
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-[#D4A373] flex-shrink-0" />
                      <span className="text-[12px] sm:text-[13px] font-mono text-foreground/70 truncate">
                        product_requirement_document.md
                      </span>
                      {isMockMode && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-widest">
                          Mock
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 text-[#88857F] hover:text-foreground transition-colors rounded-lg hover:bg-[#2B2A27]"
                        title="Copy Markdown"
                      >
                        {copying ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={downloadMarkdown}
                        className="p-2 text-[#88857F] hover:text-foreground transition-colors rounded-lg hover:bg-[#2B2A27]"
                        title="Download .md"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Version Tabs */}
                  {activeProject && activeProject.versions.length > 1 && (
                    <div className="flex gap-1 items-center pb-2 overflow-x-auto no-scrollbar">
                      {activeProject.versions.map((_ver, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveVersionIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                            activeVersionIndex === idx
                              ? "bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/30"
                              : "text-[#88857F] hover:text-foreground hover:bg-[#2B2A27] border border-transparent"
                          )}
                        >
                          {idx === 0 ? 'Original' : `Revision ${idx}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-8 bg-[#2B2A27] rounded-md w-2/3 mb-6" />
                  <div className="space-y-3">
                    <div className="h-3 bg-[#2B2A27] rounded w-full" />
                    <div className="h-3 bg-[#2B2A27] rounded w-5/6" />
                    <div className="h-3 bg-[#2B2A27] rounded w-4/6" />
                    <div className="h-3 bg-[#2B2A27] rounded w-full" />
                    <div className="h-3 bg-[#2B2A27] rounded w-3/4" />
                  </div>
                  <div className="h-40 bg-[#2B2A27] rounded-xl w-full mt-6" />
                  <div className="space-y-3 mt-6">
                    <div className="h-3 bg-[#2B2A27] rounded w-full" />
                    <div className="h-3 bg-[#2B2A27] rounded w-5/6" />
                  </div>
                  <div className="h-64 bg-[#2B2A27] rounded-xl w-full mt-6" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12 pb-8"
                >
                  {/* PRD Content */}
                  <div className="prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result?.prd || ''}</ReactMarkdown>
                  </div>

                  {/* Mermaid Diagram */}
                  {result?.mermaid && (
                    <div className="space-y-4">
                      <h2 className="text-2xl  font-semibold text-foreground border-b border-[#3A3834] pb-2">
                        User Flow Diagram
                      </h2>
                      <div className="p-6 bg-[#151413] border border-[#3A3834] rounded-2xl overflow-hidden shadow-inner">
                        <Mermaid chart={result.mermaid} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="w-full bg-gradient-to-t from-background via-background to-transparent pt-6 pb-4 sm:pb-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Template chips in chat state */}
            {!result && !isLoading && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveTemplate(tpl.id === activeTemplate ? null : tpl.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-all",
                      activeTemplate === tpl.id
                        ? "bg-[#2B2A27] border-[#D4A373]/50 text-[#D4A373]"
                        : "bg-transparent border-[#3A3834] hover:bg-[#2B2A27] text-[#88857F]"
                    )}
                  >
                    <tpl.icon className="w-3.5 h-3.5" />
                    {tpl.name}
                  </button>
                ))}
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[12px] flex items-center gap-2">
                <span className="flex-1">{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Box */}
            <div className="relative">
              {activeProject && !canRevise(activeProject) && (
                <div className="absolute -top-10 left-0 right-0 flex justify-center">
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] sm:text-[12px] text-amber-400 flex items-center gap-1.5 backdrop-blur-sm mx-4 text-center">
                    <RotateCcw className="w-3 h-3 flex-shrink-0" />
                    Max revisions (2) reached for this project.
                  </div>
                </div>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && (!activeProject || canRevise(activeProject))) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={activeProject !== null && !canRevise(activeProject)}
                placeholder={activeProject && !canRevise(activeProject) ? "Max revisions reached..." : "Message ChatPRD..."}
                rows={1}
                className={cn(
                  "w-full bg-[#2B2A27] border border-[#3A3834] rounded-[24px] pl-5 pr-14 py-3.5 sm:py-4 focus:outline-none focus:ring-1 focus:ring-[#D4A373]/50 transition-all text-foreground placeholder:text-[#88857F] text-[14px] sm:text-[15px] shadow-sm resize-none max-h-[160px] overflow-y-auto",
                  activeProject && !canRevise(activeProject) && "opacity-50 cursor-not-allowed bg-[#1E1D1B]"
                )}
                style={{ minHeight: '52px' }}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt || (activeProject !== null && !canRevise(activeProject))}
                className="absolute right-3 bottom-2.5 sm:bottom-3 p-2 bg-foreground text-background rounded-full hover:bg-white transition-all disabled:opacity-30 disabled:bg-[#3A3834] disabled:text-[#88857F]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] sm:text-[11px] text-[#88857F] mt-2">
              Using {modelName} · ChatPRD can make mistakes.
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E1D1B] border border-[#3A3834] rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
              <p className="text-[13px] text-[#88857F] mb-5">
                Get a free key at <a href="https://aistudio.google.com/" target="_blank" className="text-[#D4A373] hover:underline">Google AI Studio</a>
              </p>

              <div className="space-y-3">
                <input
                  type="password"
                  defaultValue={apiKey}
                  id="api-key-input"
                  className="w-full bg-[#2B2A27] border border-[#3A3834] rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-[#88857F] focus:outline-none focus:ring-1 focus:ring-[#D4A373]/50"
                  placeholder="Gemini API Key"
                  autoFocus
                />
                <input
                  type="text"
                  defaultValue={modelName}
                  id="model-name-input"
                  className="w-full bg-[#2B2A27] border border-[#3A3834] rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-[#88857F] focus:outline-none focus:ring-1 focus:ring-[#D4A373]/50"
                  placeholder="Model (e.g. gemini-2.5-flash)"
                />
                <button
                  onClick={() => {
                    const keyVal = (document.getElementById('api-key-input') as HTMLInputElement).value;
                    const modelVal = (document.getElementById('model-name-input') as HTMLInputElement).value;
                    saveSettings(keyVal, modelVal);
                  }}
                  className="w-full py-3 bg-foreground text-background rounded-xl font-medium text-[14px] hover:bg-white transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <AnimatePresence>
        <Documentation isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
