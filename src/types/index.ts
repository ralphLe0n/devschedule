/**
 * Core data types for the Developer Resource Scheduling Application
 * Designed to be easily migrated to Supabase database tables
 */

export type AllocationUnit = 'percentage' | 'hours';

/**
 * Developer entity
 * Maps to: developers table in Supabase
 */
export interface Developer {
  id: string;
  name: string;
  email?: string;
  defaultCapacity: number; // Default hours per day (e.g., 8)
  isActive: boolean; // Soft delete support
  createdAt: string;
  updatedAt: string;
}

/**
 * Project entity
 * Maps to: projects table in Supabase
 */
export interface Project {
  id: string;
  name: string;
  code: string; // Unique project code
  color: string; // Hex color for visual distinction
  description?: string;
  isActive: boolean; // Soft delete support
  createdAt: string;
  updatedAt: string;
}

/**
 * Assignment entity - links developers to projects for specific time periods
 * Maps to: assignments table in Supabase
 */
export interface Assignment {
  id: string;
  developerId: string;
  projectId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  allocationType: AllocationUnit;
  allocationValue: number; // Either percentage (0-100) or hours per day
  notes?: string;
  isActive: boolean; // Soft delete support
  createdAt: string;
  updatedAt: string;
}

/**
 * TimeOff entity - tracks developer time off periods
 * Maps to: time_off table in Supabase
 */
export interface TimeOff {
  id: string;
  developerId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  reason: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  isActive: boolean; // Soft delete support
  createdAt: string;
  updatedAt: string;
  // Store assignments that were replaced by this time off
  // This enables proper restoration when time off is deleted
  replacedAssignments?: Assignment[];
}

/**
 * View mode for the timeline
 */
export type ViewMode = 'year' | 'month' | 'week';

/**
 * Capacity calculation result for a developer on a specific date
 */
export interface DeveloperCapacity {
  developerId: string;
  date: string;
  totalAllocated: number; // Total hours or percentage allocated
  availableCapacity: number; // Developer's capacity for the day
  allocationType: AllocationUnit;
  isOverAllocated: boolean;
  assignments: Assignment[];
  timeOff?: TimeOff;
}

/**
 * Utility type for creating new entities (without generated fields)
 */
export type CreateDeveloper = Omit<Developer, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateAssignment = Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTimeOff = Omit<TimeOff, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Utility type for updating entities (partial updates)
 */
export type UpdateDeveloper = Partial<Omit<Developer, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateProject = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateAssignment = Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>>;
export type UpdateTimeOff = Partial<Omit<TimeOff, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Filter and query types for data retrieval
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AssignmentFilter {
  developerId?: string;
  projectId?: string;
  dateRange?: DateRange;
  isActive?: boolean;
}

export interface TimeOffFilter {
  developerId?: string;
  dateRange?: DateRange;
  isActive?: boolean;
}
