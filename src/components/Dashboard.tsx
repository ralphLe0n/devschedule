import { useState, useEffect, useMemo } from 'react'
import { Users, Briefcase, Calendar, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { storageService } from '@/services/storage'
import {
  calculateDayAllocation,
  calculateUtilizationPercentage,
  getUtilizationColor,
} from '@/utils/capacityUtils'
import { formatDateISO, getDaysInRange, addDays } from '@/utils/dateUtils'
import type { Developer, Project, Assignment, TimeOff } from '@/types'

export function Dashboard() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([])

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

  // Calculate statistics for the next 30 days
  const stats = useMemo(() => {
    const today = new Date()
    const next30Days = getDaysInRange(today, addDays(today, 30))

    let totalOverallocatedDays = 0
    let totalUnderutilizedDays = 0
    let totalFullyAllocatedDays = 0
    const overallocatedDevelopers = new Set<string>()

    developers.forEach((developer) => {
      next30Days.forEach((day) => {
        const dayStr = formatDateISO(day)
        const capacity = calculateDayAllocation(
          developer,
          dayStr,
          assignments,
          timeOffs.find(
            (t) =>
              t.developerId === developer.id &&
              t.startDate <= dayStr &&
              t.endDate >= dayStr
          )
        )

        if (capacity.timeOff) return // Skip time off days

        const utilization = calculateUtilizationPercentage(
          capacity.totalAllocated,
          capacity.availableCapacity,
          capacity.allocationType
        )

        if (capacity.isOverAllocated) {
          totalOverallocatedDays++
          overallocatedDevelopers.add(developer.id)
        } else if (utilization < 50) {
          totalUnderutilizedDays++
        } else if (utilization >= 90 && utilization <= 100) {
          totalFullyAllocatedDays++
        }
      })
    })

    // Active projects (with assignments)
    const activeProjectIds = new Set(
      assignments.filter((a) => a.endDate >= formatDateISO(today)).map((a) => a.projectId)
    )

    return {
      totalDevelopers: developers.length,
      totalProjects: projects.length,
      activeProjects: activeProjectIds.size,
      totalAssignments: assignments.filter((a) => a.endDate >= formatDateISO(today))
        .length,
      overallocatedDays: totalOverallocatedDays,
      underutilizedDays: totalUnderutilizedDays,
      fullyAllocatedDays: totalFullyAllocatedDays,
      overallocatedDevelopers: overallocatedDevelopers.size,
    }
  }, [developers, projects, assignments, timeOffs])

  // Get project utilization
  const projectUtilization = useMemo(() => {
    const projectStats: Record<
      string,
      { project: Project; developerCount: number; totalHours: number }
    > = {}

    projects.forEach((project) => {
      const projectAssignments = assignments.filter(
        (a) => a.projectId === project.id && a.endDate >= formatDateISO(new Date())
      )

      const uniqueDevelopers = new Set(projectAssignments.map((a) => a.developerId))
      const totalHours = projectAssignments.reduce((sum, a) => {
        if (a.allocationType === 'hours') {
          return sum + a.allocationValue
        } else {
          const dev = developers.find((d) => d.id === a.developerId)
          return sum + (dev ? (a.allocationValue / 100) * dev.defaultCapacity : 0)
        }
      }, 0)

      projectStats[project.id] = {
        project,
        developerCount: uniqueDevelopers.size,
        totalHours,
      }
    })

    return Object.values(projectStats).sort((a, b) => b.totalHours - a.totalHours)
  }, [projects, assignments, developers])

  // Get developer utilization for the next week
  const developerUtilization = useMemo(() => {
    const today = new Date()
    const nextWeek = getDaysInRange(today, addDays(today, 7))

    return developers.map((developer) => {
      let totalUtilization = 0
      let daysCount = 0

      nextWeek.forEach((day) => {
        const dayStr = formatDateISO(day)
        const capacity = calculateDayAllocation(
          developer,
          dayStr,
          assignments,
          timeOffs.find(
            (t) =>
              t.developerId === developer.id &&
              t.startDate <= dayStr &&
              t.endDate >= dayStr
          )
        )

        if (!capacity.timeOff) {
          const utilization = calculateUtilizationPercentage(
            capacity.totalAllocated,
            capacity.availableCapacity,
            capacity.allocationType
          )
          totalUtilization += utilization
          daysCount++
        }
      })

      const avgUtilization = daysCount > 0 ? totalUtilization / daysCount : 0

      return {
        developer,
        avgUtilization,
        isOverallocated: avgUtilization > 100,
      }
    }).sort((a, b) => b.avgUtilization - a.avgUtilization)
  }, [developers, assignments, timeOffs])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of resource allocation and capacity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevelopers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeProjects} / {stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects with assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Active assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overallocations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.overallocatedDevelopers}
            </div>
            <p className="text-xs text-muted-foreground">
              Developers over capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Developer Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Utilization (Next 7 Days)</CardTitle>
          <CardDescription>
            Average capacity utilization for the upcoming week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {developerUtilization.map(({ developer, avgUtilization, isOverallocated }) => (
              <div key={developer.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{developer.name}</span>
                  <span
                    className={`font-semibold ${
                      isOverallocated ? 'text-destructive' : ''
                    }`}
                  >
                    {avgUtilization.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getUtilizationColor(avgUtilization)}`}
                    style={{ width: `${Math.min(avgUtilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {developerUtilization.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No developers available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            Current projects and resource allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectUtilization.map(({ project, developerCount, totalHours }) => (
              <div key={project.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {project.code}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {developerCount} developer{developerCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalHours.toFixed(1)}h allocated
                  </div>
                </div>
              </div>
            ))}
            {projectUtilization.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats.overallocatedDevelopers > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Capacity Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {stats.overallocatedDevelopers} developer{stats.overallocatedDevelopers !== 1 ? 's are' : ' is'} overallocated
              in the next 30 days. Review the schedule to balance workload.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
