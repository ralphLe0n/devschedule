import { useMemo } from 'react'
import { Plus, Trash2, Umbrella, GripVertical } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import {
  getViewDateRange,
  getDaysInRange,
  getWeeksInRange,
  getMonthsInRange,
  formatDateISO,
  format,
  isSameDayCheck,
  getDaysBetween,
} from '@/utils/dateUtils'
import {
  calculateDayAllocation,
  calculateUtilizationPercentage,
  getUtilizationColor,
} from '@/utils/capacityUtils'
import { getContrastTextColor } from '@/utils/colorUtils'
import { storageService } from '@/services/storage'
import type { Developer, Project, Assignment, TimeOff, ViewMode } from '@/types'

// Draggable Assignment Component
function DraggableAssignment({
  assignment,
  project,
  onDelete,
  isDragging,
}: {
  assignment: Assignment
  project: Project
  onDelete: () => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: assignment.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    backgroundColor: project.color,
    color: getContrastTextColor(project.color),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded p-1 text-xs flex items-center justify-between cursor-grab active:cursor-grabbing"
      title={`${project.name}: ${assignment.allocationValue}${
        assignment.allocationType === 'percentage' ? '%' : 'h'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="truncate font-medium">{project.code}</span>
          <span className="text-[10px] opacity-90">
            {assignment.allocationValue}
            {assignment.allocationType === 'percentage' ? '%' : 'h'}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

// Droppable Cell Component
function DroppableCell({
  id,
  children,
  isEmpty,
  isToday,
  onClick,
}: {
  id: string
  children: React.ReactNode
  isEmpty: boolean
  isToday: boolean
  onClick?: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[120px] p-1 border-r ${
        isToday ? 'bg-primary/5' : ''
      } ${isEmpty ? 'cursor-pointer hover:bg-muted/50' : ''} ${
        isOver ? 'bg-blue-100 ring-2 ring-blue-400' : ''
      }`}
      onClick={onClick}
      title={isEmpty ? 'Click to add assignment' : ''}
    >
      {children}
    </div>
  )
}

interface TimelineProps {
  currentDate: Date
  viewMode: ViewMode
  developers: Developer[]
  projects: Project[]
  assignments: Assignment[]
  timeOffs: TimeOff[]
  onAddAssignment: (developer: Developer, date?: string) => void
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
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null)

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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const assignmentId = event.active.id as string
    const assignment = assignments.find((a) => a.id === assignmentId)
    setActiveId(assignmentId)
    setActiveAssignment(assignment || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event
    setActiveId(null)
    setActiveAssignment(null)

    if (!over || !activeAssignment) return

    // Parse the droppable ID (format: "cell-developerId-date")
    const dropId = over.id as string
    if (!dropId.startsWith('cell-')) return

    const [, newDeveloperId, newDateStr] = dropId.split('-')

    if (!newDeveloperId || !newDateStr) return

    // Check if assignment was moved
    if (
      activeAssignment.developerId === newDeveloperId &&
      activeAssignment.startDate === newDateStr
    ) {
      return // No change
    }

    // Calculate duration to maintain it
    const originalDuration = getDaysBetween(
      activeAssignment.startDate,
      activeAssignment.endDate
    )

    // Calculate new end date
    const newStartDate = new Date(newDateStr)
    const newEndDate = new Date(newStartDate)
    newEndDate.setDate(newEndDate.getDate() + originalDuration - 1)

    try {
      await storageService.updateAssignment(activeAssignment.id, {
        developerId: newDeveloperId,
        startDate: newDateStr,
        endDate: formatDateISO(newEndDate),
      })
      onDataChange()
    } catch (error) {
      console.error('Error updating assignment:', error)
      alert('Failed to move assignment')
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                const periodDateStr = formatDateISO(period)
                const isEmpty = !capacity.timeOff && capacity.assignments.length === 0

                return (
                  <DroppableCell
                    key={index}
                    id={`cell-${developer.id}-${periodDateStr}`}
                    isEmpty={isEmpty}
                    isToday={isToday(period)}
                    onClick={() => {
                      if (isEmpty) {
                        onAddAssignment(developer, periodDateStr)
                      }
                    }}
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
                            <DraggableAssignment
                              key={assignment.id}
                              assignment={assignment}
                              project={project}
                              onDelete={() => handleDeleteAssignment(assignment)}
                              isDragging={activeId === assignment.id}
                            />
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
                  </DroppableCell>
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
    </DndContext>
  )
}
