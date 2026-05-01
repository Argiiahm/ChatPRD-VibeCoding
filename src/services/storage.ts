// Types
export interface PRDVersion {
  prd: string;
  mermaid: string;
  revisionPrompt?: string;
  createdAt: number;
}

export interface PRDProject {
  id: string;
  title: string;
  prompt: string;
  template: string | null;
  versions: PRDVersion[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'prd_projects';
const MAX_PROJECTS = 20;

// Generate a short unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Extract a title from the user prompt (first 40 chars)
export function extractTitle(prompt: string): string {
  const clean = prompt.replace(/\n/g, ' ').trim();
  return clean.length > 40 ? clean.substring(0, 40) + '...' : clean;
}

// Get all projects from localStorage, sorted by updatedAt desc
export function getProjects(): PRDProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const projects: PRDProject[] = JSON.parse(raw);
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

// Save or update a project
export function saveProject(project: PRDProject): void {
  const projects = getProjects();
  const existingIndex = projects.findIndex((p) => p.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.unshift(project);
  }

  // Keep only MAX_PROJECTS
  const trimmed = projects.slice(0, MAX_PROJECTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Delete a project by ID
export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// Create a new project from a generation result
export function createProject(
  prompt: string,
  template: string | null,
  prd: string,
  mermaid: string
): PRDProject {
  const now = Date.now();
  return {
    id: generateId(),
    title: extractTitle(prompt),
    prompt,
    template,
    versions: [
      {
        prd,
        mermaid,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

// Add a revision to an existing project (max 2 revisions = 3 versions total)
export function addRevision(
  project: PRDProject,
  prd: string,
  mermaid: string,
  revisionPrompt: string
): PRDProject {
  const now = Date.now();
  const updated = { ...project };
  updated.versions = [
    ...project.versions,
    {
      prd,
      mermaid,
      revisionPrompt,
      createdAt: now,
    },
  ];
  updated.updatedAt = now;
  return updated;
}

// Check if a project can be revised (max 2 revisions)
export function canRevise(project: PRDProject): boolean {
  return project.versions.length < 3;
}
