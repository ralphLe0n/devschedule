import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
} from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Select } from './ui/select'
import { Timeline } from './Timeline'
import { AssignmentDialog } from './AssignmentDialog'
import { TimeOffDialog } from './TimeOffDialog'
import { storageService } from '@/services/storage'
import {
  navigateNext,
  navigatePrevious,
  formatDisplayDate,
  getViewDateRange,
} from '@/utils/dateUtils'
import type { Developer, Project, Assignment, TimeOff, ViewMode } from '@/types'

export function ScheduleView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('year')
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([])
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [isTimeOffDialogOpen, setIsTimeOffDialogOpen] = useState(false)
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Load all data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [devs, projs, assigns, timeoffs] = await Promise.all([
      storageService.getDevelopers(),
      storageService.getProjects(),
      storageService.getAssignments(),
      storageService.getTimeOffs(),
    ])
    setDevelopers(devs)
    setProjects(projs)
    setAssignments(assigns)
    setTimeOffs(timeoffs)
  }

  const handlePrevious = () => {
    setCurrentDate(navigatePrevious(currentDate, viewMode))
  }

  const handleNext = () => {
    setCurrentDate(navigateNext(currentDate, viewMode))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleAddAssignment = (developer?: Developer, date?: string) => {
    setSelectedDeveloper(developer || null)
    setSelectedDate(date || null)
    setIsAssignmentDialogOpen(true)
  }

  const handleAddTimeOff = (developer?: Developer) => {
    setSelectedDeveloper(developer || null)
    setIsTimeOffDialogOpen(true)
  }

  const getViewLabel = () => {
    const { start, end } = getViewDateRange(currentDate, viewMode)

    switch (viewMode) {
      case 'week':
        return `${formatDisplayDate(start, 'MMM d')} - ${formatDisplayDate(end, 'MMM d, yyyy')}`
      case 'month':
        return formatDisplayDate(currentDate, 'MMMM yyyy')
      case 'year':
        return formatDisplayDate(currentDate, 'yyyy')
    }
  }

  // Check if there are any developers and projects
  const hasData = developers.length > 0 && projects.length > 0

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday} className="min-w-[100px]">
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold text-lg">{getViewLabel()}</span>
            </div>
          </div>

          {/* View Mode Selection */}
          <div className="flex items-center gap-2">
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Timeline or Empty State */}
      {hasData ? (
        <Timeline
          currentDate={currentDate}
          viewMode={viewMode}
          developers={developers}
          projects={projects}
          assignments={assignments}
          timeOffs={timeOffs}
          onAddAssignment={handleAddAssignment}
          onAddTimeOff={handleAddTimeOff}
          onDataChange={loadData}
        />
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              To get started with scheduling, you need to create at least one developer
              and one project. Use the navigation tabs above to add them.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.hash = '#developers'}>
                Add Developers
              </Button>
              <Button variant="outline" onClick={() => window.location.hash = '#projects'}>
                Add Projects
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AssignmentDialog
        open={isAssignmentDialogOpen}
        onOpenChange={setIsAssignmentDialogOpen}
        developers={developers}
        projects={projects}
        selectedDeveloper={selectedDeveloper}
        selectedDate={selectedDate}
        onSuccess={loadData}
      />

      <TimeOffDialog
        open={isTimeOffDialogOpen}
        onOpenChange={setIsTimeOffDialogOpen}
        developers={developers}
        selectedDeveloper={selectedDeveloper}
        onSuccess={loadData}
      />
    </div>
  )
}
