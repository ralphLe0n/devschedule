/**
 * Storage Service Interface
 * This interface defines the contract for data persistence.
 * Implementations can use localStorage, Supabase, or any other storage backend.
 * This abstraction makes it easy to swap storage implementations.
 */

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

export interface IStorageService {
  // Developer operations
  getDevelopers(): Promise<Developer[]>;
  getDeveloper(id: string): Promise<Developer | null>;
  createDeveloper(data: CreateDeveloper): Promise<Developer>;
  updateDeveloper(id: string, data: UpdateDeveloper): Promise<Developer>;
  deleteDeveloper(id: string): Promise<void>; // Soft delete

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(data: CreateProject): Promise<Project>;
  updateProject(id: string, data: UpdateProject): Promise<Project>;
  deleteProject(id: string): Promise<void>; // Soft delete

  // Assignment operations
  getAssignments(filter?: AssignmentFilter): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | null>;
  createAssignment(data: CreateAssignment): Promise<Assignment>;
  updateAssignment(id: string, data: UpdateAssignment): Promise<Assignment>;
  deleteAssignment(id: string): Promise<void>; // Soft delete

  // TimeOff operations
  getTimeOffs(filter?: TimeOffFilter): Promise<TimeOff[]>;
  getTimeOff(id: string): Promise<TimeOff | null>;
  createTimeOff(data: CreateTimeOff): Promise<TimeOff>;
  updateTimeOff(id: string, data: UpdateTimeOff): Promise<TimeOff>;
  deleteTimeOff(id: string): Promise<void>; // Soft delete

  // Utility operations
  clearAllData(): Promise<void>;
}
