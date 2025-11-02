import { db } from './config';
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    setDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from 'firebase/firestore';
import { ProjectData, ProjectListItem } from '../types';

const projectsCollection = collection(db, 'projects');

export const saveProject = async (userId: string, projectData: ProjectData, projectId?: string | null): Promise<string> => {
    const dataToSave = {
        userId,
        ...projectData,
        updatedAt: serverTimestamp(),
    };

    if (projectId) {
        const projectRef = doc(db, 'projects', projectId);
        await setDoc(projectRef, dataToSave, { merge: true });
        return projectId;
    } else {
        const docRef = await addDoc(projectsCollection, {
            ...dataToSave,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    }
};

export const getUserProjects = async (userId: string): Promise<ProjectListItem[]> => {
    if (!db.app) return []; // Retorna vazio se o Firebase não foi inicializado
    const q = query(projectsCollection, where("userId", "==", userId), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Projeto sem nome',
            thumbnail: data.thumbnail || '',
            updatedAt: data.updatedAt,
        };
    });
};

export const getProjectDetails = async (projectId: string): Promise<ProjectData | null> => {
    const projectRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(projectRef);
    if (docSnap.exists()) {
        return docSnap.data() as ProjectData;
    } else {
        console.error("Projeto não encontrado!");
        return null;
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
};
