/**
 * Capacity calculation utilities
 * Handles developer capacity calculations, over-allocation detection, etc.
 */

import type {
  Developer,
  Assignment,
  TimeOff,
  DeveloperCapacity,
  AllocationUnit,
} from '@/types';
import { isDateInRange } from './dateUtils';

/**
 * Calculate total allocation for a developer on a specific date
 */
export const calculateDayAllocation = (
  developer: Developer,
  date: string,
  assignments: Assignment[],
  timeOff?: TimeOff
): DeveloperCapacity => {
  // If developer has time off on this date, return that
  if (timeOff && isDateInRange(date, timeOff.startDate, timeOff.endDate)) {
    return {
      developerId: developer.id,
      date,
      totalAllocated: 0,
      availableCapacity: developer.defaultCapacity,
      allocationType: 'hours',
      isOverAllocated: false,
      assignments: [],
      timeOff,
    };
  }

  // Filter assignments that are active on this date
  const activeAssignments = assignments.filter(
    (a) => a.developerId === developer.id && isDateInRange(date, a.startDate, a.endDate)
  );

  if (activeAssignments.length === 0) {
    return {
      developerId: developer.id,
      date,
      totalAllocated: 0,
      availableCapacity: developer.defaultCapacity,
      allocationType: 'hours',
      isOverAllocated: false,
      assignments: [],
    };
  }

  // Determine allocation type (use the first assignment's type)
  const allocationType = activeAssignments[0].allocationType;

  // Calculate total allocation
  let totalAllocated = 0;
  let availableCapacity = developer.defaultCapacity;

  if (allocationType === 'hours') {
    totalAllocated = activeAssignments.reduce((sum, a) => sum + a.allocationValue, 0);
  } else {
    // Percentage-based
    totalAllocated = activeAssignments.reduce((sum, a) => sum + a.allocationValue, 0);
    availableCapacity = 100; // 100% capacity
  }

  const isOverAllocated = totalAllocated > availableCapacity;

  return {
    developerId: developer.id,
    date,
    totalAllocated,
    availableCapacity,
    allocationType,
    isOverAllocated,
    assignments: activeAssignments,
    timeOff: undefined,
  };
};

/**
 * Calculate capacity utilization percentage
 */
export const calculateUtilizationPercentage = (
  totalAllocated: number,
  availableCapacity: number,
  allocationType: AllocationUnit
): number => {
  if (availableCapacity === 0) return 0;

  if (allocationType === 'percentage') {
    return totalAllocated; // Already a percentage
  }

  return (totalAllocated / availableCapacity) * 100;
};

/**
 * Get color class based on utilization percentage
 */
export const getUtilizationColor = (utilizationPercentage: number): string => {
  if (utilizationPercentage === 0) return 'bg-gray-200';
  if (utilizationPercentage <= 50) return 'bg-green-500';
  if (utilizationPercentage <= 75) return 'bg-yellow-500';
  if (utilizationPercentage <= 100) return 'bg-orange-500';
  return 'bg-red-500'; // Over-allocated
};

/**
 * Get text color class based on utilization percentage
 */
export const getUtilizationTextColor = (utilizationPercentage: number): string => {
  if (utilizationPercentage === 0) return 'text-gray-600';
  if (utilizationPercentage <= 50) return 'text-green-700';
  if (utilizationPercentage <= 75) return 'text-yellow-700';
  if (utilizationPercentage <= 100) return 'text-orange-700';
  return 'text-red-700'; // Over-allocated
};

/**
 * Convert between allocation units
 */
export const convertAllocation = (
  value: number,
  fromUnit: AllocationUnit,
  toUnit: AllocationUnit,
  dailyCapacity: number
): number => {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'percentage' && toUnit === 'hours') {
    return (value / 100) * dailyCapacity;
  }

  if (fromUnit === 'hours' && toUnit === 'percentage') {
    return (value / dailyCapacity) * 100;
  }

  return value;
};

/**
 * Validate assignment allocation
 */
export const validateAllocation = (
  value: number,
  allocationType: AllocationUnit,
  dailyCapacity: number
): { isValid: boolean; message?: string } => {
  if (value < 0) {
    return { isValid: false, message: 'Allocation cannot be negative' };
  }

  if (allocationType === 'percentage') {
    if (value > 100) {
      return { isValid: false, message: 'Percentage cannot exceed 100%' };
    }
  } else {
    if (value > dailyCapacity) {
      return {
        isValid: false,
        message: `Hours cannot exceed daily capacity (${dailyCapacity}h)`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Check for assignment conflicts
 */
export const checkAssignmentConflicts = (
  developerId: string,
  startDate: string,
  endDate: string,
  assignments: Assignment[],
  excludeAssignmentId?: string
): Assignment[] => {
  return assignments.filter(
    (a) =>
      a.id !== excludeAssignmentId &&
      a.developerId === developerId &&
      a.isActive &&
      // Check if date ranges overlap
      a.startDate <= endDate &&
      a.endDate >= startDate
  );
};
