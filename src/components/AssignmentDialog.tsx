import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog'
import { storageService } from '@/services/storage'
import { formatDateISO } from '@/utils/dateUtils'
import { validateAllocation, checkAssignmentConflicts } from '@/utils/capacityUtils'
import type { Developer, Project, CreateAssignment, AllocationUnit } from '@/types'

interface AssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  developers: Developer[]
  projects: Project[]
  selectedDeveloper?: Developer | null
  onSuccess: () => void
}

export function AssignmentDialog({
  open,
  onOpenChange,
  developers,
  projects,
  selectedDeveloper,
  onSuccess,
}: AssignmentDialogProps) {
  const [formData, setFormData] = useState<CreateAssignment & { developerId: string }>({
    developerId: '',
    projectId: '',
    startDate: formatDateISO(new Date()),
    endDate: formatDateISO(new Date()),
    allocationType: 'hours',
    allocationValue: 8,
    notes: '',
    isActive: true,
  })
  const [validationError, setValidationError] = useState<string>('')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        developerId: selectedDeveloper?.id || '',
        projectId: projects[0]?.id || '',
        startDate: formatDateISO(new Date()),
        endDate: formatDateISO(new Date()),
        allocationType: 'hours',
        allocationValue: selectedDeveloper?.defaultCapacity || 8,
        notes: '',
        isActive: true,
      })
      setValidationError('')
    }
  }, [open, selectedDeveloper, projects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Validation
    if (!formData.developerId || !formData.projectId) {
      setValidationError('Please select both developer and project')
      return
    }

    if (formData.startDate > formData.endDate) {
      setValidationError('End date must be after start date')
      return
    }

    const developer = developers.find((d) => d.id === formData.developerId)
    if (!developer) {
      setValidationError('Developer not found')
      return
    }

    // Validate allocation value
    const allocationValidation = validateAllocation(
      formData.allocationValue,
      formData.allocationType,
      developer.defaultCapacity
    )

    if (!allocationValidation.isValid) {
      setValidationError(allocationValidation.message || 'Invalid allocation')
      return
    }

    // Check for conflicts (warning only)
    const assignments = await storageService.getAssignments()
    const conflicts = checkAssignmentConflicts(
      formData.developerId,
      formData.startDate,
      formData.endDate,
      assignments
    )

    if (conflicts.length > 0) {
      const projectNames = await Promise.all(
        conflicts.map(async (c) => {
          const project = await storageService.getProject(c.projectId)
          return project?.name || 'Unknown'
        })
      )
      const confirmed = confirm(
        `This developer already has ${conflicts.length} assignment(s) during this period:\n${projectNames.join(', ')}\n\nDo you want to continue?`
      )
      if (!confirmed) return
    }

    try {
      await storageService.createAssignment(formData)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating assignment:', error)
      setValidationError('Failed to create assignment')
    }
  }

  const handleAllocationTypeChange = (newType: AllocationUnit) => {
    const developer = developers.find((d) => d.id === formData.developerId)
    if (!developer) return

    // Convert the current value to the new type
    let newValue = formData.allocationValue
    if (newType === 'percentage' && formData.allocationType === 'hours') {
      newValue = (formData.allocationValue / developer.defaultCapacity) * 100
    } else if (newType === 'hours' && formData.allocationType === 'percentage') {
      newValue = (formData.allocationValue / 100) * developer.defaultCapacity
    }

    setFormData({
      ...formData,
      allocationType: newType,
      allocationValue: Math.round(newValue * 100) / 100,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Assignment</DialogTitle>
            <DialogDescription>
              Assign a developer to a project for a specific time period
            </DialogDescription>
            <DialogClose onClick={() => onOpenChange(false)} />
          </DialogHeader>

          <div className="space-y-4 py-4">
            {validationError && (
              <div className="bg-destructive/10 text-destructive px-3 py-2 rounded text-sm">
                {validationError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="developer">Developer *</Label>
              <Select
                id="developer"
                value={formData.developerId}
                onChange={(e) =>
                  setFormData({ ...formData, developerId: e.target.value })
                }
                required
                disabled={!!selectedDeveloper}
              >
                <option value="">Select developer...</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} ({dev.defaultCapacity}h/day)
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                id="project"
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                required
              >
                <option value="">Select project...</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationType">Allocation Type *</Label>
              <Select
                id="allocationType"
                value={formData.allocationType}
                onChange={(e) =>
                  handleAllocationTypeChange(e.target.value as AllocationUnit)
                }
                required
              >
                <option value="hours">Hours per day</option>
                <option value="percentage">Percentage of capacity</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allocationValue">
                Allocation{' '}
                {formData.allocationType === 'percentage' ? '(%)' : '(hours/day)'} *
              </Label>
              <Input
                id="allocationValue"
                type="number"
                min="0"
                max={formData.allocationType === 'percentage' ? 100 : 24}
                step={formData.allocationType === 'percentage' ? 1 : 0.5}
                value={formData.allocationValue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allocationValue: parseFloat(e.target.value),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.allocationType === 'percentage'
                  ? 'Percentage of developer capacity (0-100%)'
                  : 'Number of hours per day'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes about this assignment..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Assignment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
