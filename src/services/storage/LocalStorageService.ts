/**
 * LocalStorage Implementation of IStorageService
 * This implementation stores all data in browser localStorage.
 * The data structure is designed to easily migrate to Supabase tables.
 */

import type { IStorageService } from './IStorageService';
import type {
  Developer,
  Project,
  Assignment,
  TimeOff,
  CreateDeveloper,
  CreateProject,
  CreateAssignment,
  CreateTimeOff,
  UpdateDeveloper,
  UpdateProject,
  UpdateAssignment,
  UpdateTimeOff,
  AssignmentFilter,
  TimeOffFilter,
} from '@/types';

// Storage keys
const STORAGE_KEYS = {
  DEVELOPERS: 'devschedule_developers',
  PROJECTS: 'devschedule_projects',
  ASSIGNMENTS: 'devschedule_assignments',
  TIME_OFFS: 'devschedule_time_offs',
} as const;

// Helper to generate UUID (will be replaced by database-generated IDs in Supabase)
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper to get current ISO timestamp
const getCurrentTimestamp = () => new Date().toISOString();

export class LocalStorageService implements IStorageService {
  // Generic storage helpers
  private getItems<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return [];
    }
  }

  private setItems<T>(key: string, items: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      throw new Error('Failed to save data');
    }
  }

  // Developer operations
  async getDevelopers(): Promise<Developer[]> {
    return this.getItems<Developer>(STORAGE_KEYS.DEVELOPERS).filter(d => d.isActive);
  }

  async getDeveloper(id: string): Promise<Developer | null> {
    const developers = this.getItems<Developer>(STORAGE_KEYS.DEVELOPERS);
    return developers.find(d => d.id === id && d.isActive) || null;
  }

  async createDeveloper(data: CreateDeveloper): Promise<Developer> {
    const developers = this.getItems<Developer>(STORAGE_KEYS.DEVELOPERS);
    const newDeveloper: Developer = {
      ...data,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    developers.push(newDeveloper);
    this.setItems(STORAGE_KEYS.DEVELOPERS, developers);
    return newDeveloper;
  }

  async updateDeveloper(id: string, data: UpdateDeveloper): Promise<Developer> {
    const developers = this.getItems<Developer>(STORAGE_KEYS.DEVELOPERS);
    const index = developers.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Developer not found');
    }
    const updatedDeveloper: Developer = {
      ...developers[index],
      ...data,
      updatedAt: getCurrentTimestamp(),
    };
    developers[index] = updatedDeveloper;
    this.setItems(STORAGE_KEYS.DEVELOPERS, developers);
    return updatedDeveloper;
  }

  async deleteDeveloper(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await this.updateDeveloper(id, { isActive: false });
  }

  // Project operations
  async getProjects(): Promise<Project[]> {
    return this.getItems<Project>(STORAGE_KEYS.PROJECTS).filter(p => p.isActive);
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS);
    return projects.find(p => p.id === id && p.isActive) || null;
  }

  async createProject(data: CreateProject): Promise<Project> {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS);
    const newProject: Project = {
      ...data,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    projects.push(newProject);
    this.setItems(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  }

  async updateProject(id: string, data: UpdateProject): Promise<Project> {
    const projects = this.getItems<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Project not found');
    }
    const updatedProject: Project = {
      ...projects[index],
      ...data,
      updatedAt: getCurrentTimestamp(),
    };
    projects[index] = updatedProject;
    this.setItems(STORAGE_KEYS.PROJECTS, projects);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await this.updateProject(id, { isActive: false });
  }

  // Assignment operations
  async getAssignments(filter?: AssignmentFilter): Promise<Assignment[]> {
    let assignments = this.getItems<Assignment>(STORAGE_KEYS.ASSIGNMENTS);

    // Apply filters
    if (filter?.isActive !== undefined) {
      assignments = assignments.filter(a => a.isActive === filter.isActive);
    } else {
      assignments = assignments.filter(a => a.isActive);
    }

    if (filter?.developerId) {
      assignments = assignments.filter(a => a.developerId === filter.developerId);
    }

    if (filter?.projectId) {
      assignments = assignments.filter(a => a.projectId === filter.projectId);
    }

    if (filter?.dateRange) {
      const { startDate, endDate } = filter.dateRange;
      assignments = assignments.filter(a => {
        // Check if assignment overlaps with the date range
        return a.startDate <= endDate && a.endDate >= startDate;
      });
    }

    return assignments;
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    const assignments = this.getItems<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    return assignments.find(a => a.id === id && a.isActive) || null;
  }

  async createAssignment(data: CreateAssignment): Promise<Assignment> {
    const assignments = this.getItems<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const newAssignment: Assignment = {
      ...data,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    assignments.push(newAssignment);
    this.setItems(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return newAssignment;
  }

  async updateAssignment(id: string, data: UpdateAssignment): Promise<Assignment> {
    const assignments = this.getItems<Assignment>(STORAGE_KEYS.ASSIGNMENTS);
    const index = assignments.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Assignment not found');
    }
    const updatedAssignment: Assignment = {
      ...assignments[index],
      ...data,
      updatedAt: getCurrentTimestamp(),
    };
    assignments[index] = updatedAssignment;
    this.setItems(STORAGE_KEYS.ASSIGNMENTS, assignments);
    return updatedAssignment;
  }

  async deleteAssignment(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await this.updateAssignment(id, { isActive: false });
  }

  // TimeOff operations
  async getTimeOffs(filter?: TimeOffFilter): Promise<TimeOff[]> {
    let timeOffs = this.getItems<TimeOff>(STORAGE_KEYS.TIME_OFFS);

    // Apply filters
    if (filter?.isActive !== undefined) {
      timeOffs = timeOffs.filter(t => t.isActive === filter.isActive);
    } else {
      timeOffs = timeOffs.filter(t => t.isActive);
    }

    if (filter?.developerId) {
      timeOffs = timeOffs.filter(t => t.developerId === filter.developerId);
    }

    if (filter?.dateRange) {
      const { startDate, endDate } = filter.dateRange;
      timeOffs = timeOffs.filter(t => {
        // Check if time off overlaps with the date range
        return t.startDate <= endDate && t.endDate >= startDate;
      });
    }

    return timeOffs;
  }

  async getTimeOff(id: string): Promise<TimeOff | null> {
    const timeOffs = this.getItems<TimeOff>(STORAGE_KEYS.TIME_OFFS);
    return timeOffs.find(t => t.id === id && t.isActive) || null;
  }

  async createTimeOff(data: CreateTimeOff): Promise<TimeOff> {
    const timeOffs = this.getItems<TimeOff>(STORAGE_KEYS.TIME_OFFS);
    const newTimeOff: TimeOff = {
      ...data,
      id: generateId(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    timeOffs.push(newTimeOff);
    this.setItems(STORAGE_KEYS.TIME_OFFS, timeOffs);
    return newTimeOff;
  }

  async updateTimeOff(id: string, data: UpdateTimeOff): Promise<TimeOff> {
    const timeOffs = this.getItems<TimeOff>(STORAGE_KEYS.TIME_OFFS);
    const index = timeOffs.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('TimeOff not found');
    }
    const updatedTimeOff: TimeOff = {
      ...timeOffs[index],
      ...data,
      updatedAt: getCurrentTimestamp(),
    };
    timeOffs[index] = updatedTimeOff;
    this.setItems(STORAGE_KEYS.TIME_OFFS, timeOffs);
    return updatedTimeOff;
  }

  async deleteTimeOff(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await this.updateTimeOff(id, { isActive: false });
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.DEVELOPERS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.TIME_OFFS);
  }
}
