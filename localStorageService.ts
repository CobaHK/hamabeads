import { ProjectData, ProjectListItem } from './types';

const PROJECTS_KEY = 'hamabeads_projects';
const PROJECTS_LIST_KEY = 'hamabeads_projects_list';

interface StoredProject {
    id: string;
    userId: string;
    data: ProjectData;
    createdAt: string;
    updatedAt: string;
}

export const saveProject = (userId: string, projectData: ProjectData, projectId?: string | null): string => {
    const projects = getAllProjects();
    const now = new Date().toISOString();

    if (projectId) {
        // Atualizar projeto existente
        const existingProject = projects.find(p => p.id === projectId);
        if (existingProject) {
            existingProject.data = projectData;
            existingProject.updatedAt = now;
            existingProject.userId = userId;
        }
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        return projectId;
    } else {
        // Criar novo projeto
        const newId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newProject: StoredProject = {
            id: newId,
            userId,
            data: projectData,
            createdAt: now,
            updatedAt: now,
        };
        projects.push(newProject);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        return newId;
    }
};

export const getUserProjects = (userId: string): ProjectListItem[] => {
    const projects = getAllProjects();
    return projects
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map(p => ({
            id: p.id,
            name: p.data.name || 'Projeto sem nome',
            thumbnail: p.data.thumbnail || '',
            updatedAt: { toDate: () => new Date(p.updatedAt) } as any, // Mock Firestore Timestamp
        }));
};

export const getProjectDetails = (projectId: string): ProjectData | null => {
    const projects = getAllProjects();
    const project = projects.find(p => p.id === projectId);
    return project ? project.data : null;
};

export const deleteProject = (projectId: string): void => {
    const projects = getAllProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
};

const getAllProjects = (): StoredProject[] => {
    try {
        const stored = localStorage.getItem(PROJECTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erro ao ler projetos do localStorage:', error);
        return [];
    }
};
