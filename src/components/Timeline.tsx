import { useMemo } from 'react'
import { Plus, Trash2, Umbrella } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  getViewDateRange,
  getDaysInRange,
  getWeeksInRange,
  getMonthsInRange,
  formatDateISO,
  format,
  isSameDayCheck,
} from '@/utils/dateUtils'
import {
  calculateDayAllocation,
  calculateUtilizationPercentage,
  getUtilizationColor,
} from '@/utils/capacityUtils'
import { getContrastTextColor } from '@/utils/colorUtils'
import { storageService } from '@/services/storage'
import type { Developer, Project, Assignment, TimeOff, ViewMode } from '@/types'

interface TimelineProps {
  currentDate: Date
  viewMode: ViewMode
  developers: Developer[]
  projects: Project[]
  assignments: Assignment[]
  timeOffs: TimeOff[]
  onAddAssignment: (developer: Developer) => void
  onAddTimeOff: (developer: Developer) => void
  onDataChange: () => void
}

export function Timeline({
  currentDate,
  viewMode,
  developers,
  projects,
  assignments,
  timeOffs,
  onAddAssignment,
  onAddTimeOff,
  onDataChange,
}: TimelineProps) {
  // Get date range for current view
  const { start, end } = getViewDateRange(currentDate, viewMode)

  // Get time periods to display
  const periods = useMemo(() => {
    switch (viewMode) {
      case 'week':
        return getDaysInRange(start, end)
      case 'month':
        // For month view, show weeks
        return getWeeksInRange(start, end)
      case 'year':
        // For year view, show months
        return getMonthsInRange(start, end)
    }
  }, [start, end, viewMode])

  // Format period label
  const formatPeriodLabel = (date: Date) => {
    switch (viewMode) {
      case 'week':
        return format(date, 'EEE d')
      case 'month':
        return format(date, 'MMM d')
      case 'year':
        return format(date, 'MMM')
    }
  }

  // Check if period is today
  const isToday = (date: Date) => {
    return isSameDayCheck(date, new Date())
  }

  // Get project info
  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  // Delete assignment
  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await storageService.deleteAssignment(assignment.id)
        onDataChange()
      } catch (error) {
        console.error('Error deleting assignment:', error)
        alert('Failed to delete assignment')
      }
    }
  }

  // Delete time off
  const handleDeleteTimeOff = async (timeOff: TimeOff) => {
    if (confirm('Are you sure you want to delete this time off?')) {
      try {
        await storageService.deleteTimeOff(timeOff.id)
        onDataChange()
      } catch (error) {
        console.error('Error deleting time off:', error)
        alert('Failed to delete time off')
      }
    }
  }

  // Get assignments for a developer on a specific period
  const getAssignmentsForPeriod = (developer: Developer, period: Date) => {
    const periodDateStr = formatDateISO(period)
    const capacity = calculateDayAllocation(
      developer,
      periodDateStr,
      assignments,
      timeOffs.find((t) =>
        t.developerId === developer.id &&
        t.startDate <= periodDateStr &&
        t.endDate >= periodDateStr
      )
    )
    return capacity
  }

  return (
    <div className="relative">
      <Card className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b bg-muted/50">
            <div className="w-48 flex-shrink-0 p-4 font-semibold border-r">
              Developer
            </div>
            {periods.map((period, index) => (
              <div
                key={index}
                className={`flex-1 min-w-[120px] p-2 text-center text-sm font-medium border-r ${
                  isToday(period) ? 'bg-primary/10' : ''
                }`}
              >
                {formatPeriodLabel(period)}
              </div>
            ))}
            <div className="w-32 flex-shrink-0 p-4 text-center font-semibold">
              Actions
            </div>
          </div>

          {/* Developer Rows */}
          {developers.map((developer) => (
            <div key={developer.id} className="flex border-b hover:bg-muted/30">
              {/* Developer Name */}
              <div className="w-48 flex-shrink-0 p-4 border-r flex items-center">
                <div>
                  <div className="font-medium">{developer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {developer.defaultCapacity}h/day
                  </div>
                </div>
              </div>

              {/* Period Cells */}
              {periods.map((period, index) => {
                const capacity = getAssignmentsForPeriod(developer, period)
                const utilization = calculateUtilizationPercentage(
                  capacity.totalAllocated,
                  capacity.availableCapacity,
                  capacity.allocationType
                )

                return (
                  <div
                    key={index}
                    className={`flex-1 min-w-[120px] p-1 border-r ${
                      isToday(period) ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Time Off */}
                    {capacity.timeOff && (
                      <div
                        className="relative group bg-gray-300 rounded p-1 mb-1 text-xs flex items-center justify-between"
                        title={`Time Off: ${capacity.timeOff.reason}`}
                      >
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Umbrella className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{capacity.timeOff.reason}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTimeOff(capacity.timeOff!)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    )}

                    {/* Assignments */}
                    {!capacity.timeOff && capacity.assignments.length > 0 && (
                      <div className="space-y-1">
                        {capacity.assignments.map((assignment) => {
                          const project = getProject(assignment.projectId)
                          if (!project) return null

                          return (
                            <div
                              key={assignment.id}
                              className="relative group rounded p-1 text-xs flex items-center justify-between"
                              style={{
                                backgroundColor: project.color,
                                color: getContrastTextColor(project.color),
                              }}
                              title={`${project.name}: ${assignment.allocationValue}${
                                assignment.allocationType === 'percentage' ? '%' : 'h'
                              }`}
                            >
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate font-medium">
                                  {project.code}
                                </span>
                                <span className="text-[10px] opacity-90">
                                  {assignment.allocationValue}
                                  {assignment.allocationType === 'percentage' ? '%' : 'h'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteAssignment(assignment)}
                                className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })}

                        {/* Utilization bar */}
                        {capacity.assignments.length > 0 && (
                          <div className="mt-1">
                            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getUtilizationColor(utilization)}`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                            {capacity.isOverAllocated && (
                              <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                                Overallocated!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Actions */}
              <div className="w-32 flex-shrink-0 p-2 flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddAssignment(developer)}
                  title="Add Assignment"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTimeOff(developer)}
                  title="Add Time Off"
                >
                  <Umbrella className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
