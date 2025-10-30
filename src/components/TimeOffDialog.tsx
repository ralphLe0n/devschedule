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
import type { Developer, CreateTimeOff } from '@/types'

interface TimeOffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  developers: Developer[]
  selectedDeveloper?: Developer | null
  onSuccess: () => void
}

export function TimeOffDialog({
  open,
  onOpenChange,
  developers,
  selectedDeveloper,
  onSuccess,
}: TimeOffDialogProps) {
  const [formData, setFormData] = useState<CreateTimeOff & { developerId: string }>({
    developerId: '',
    startDate: formatDateISO(new Date()),
    endDate: formatDateISO(new Date()),
    reason: '',
    type: 'vacation',
    isActive: true,
  })
  const [validationError, setValidationError] = useState<string>('')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        developerId: selectedDeveloper?.id || '',
        startDate: formatDateISO(new Date()),
        endDate: formatDateISO(new Date()),
        reason: '',
        type: 'vacation',
        isActive: true,
      })
      setValidationError('')
    }
  }, [open, selectedDeveloper])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // Validation
    if (!formData.developerId) {
      setValidationError('Please select a developer')
      return
    }

    if (!formData.reason.trim()) {
      setValidationError('Please enter a reason for time off')
      return
    }

    if (formData.startDate > formData.endDate) {
      setValidationError('End date must be after start date')
      return
    }

    try {
      // Get assignments that overlap with this time off period
      const assignments = await storageService.getAssignments({
        developerId: formData.developerId,
        dateRange: {
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
      })

      // Store the replaced assignments for restoration later
      const timeOffData: CreateTimeOff = {
        ...formData,
        replacedAssignments: assignments.filter(a => a.isActive),
      }

      // Warn user about affected assignments
      if (assignments.length > 0) {
        const projectNames = await Promise.all(
          assignments.map(async (a) => {
            const project = await storageService.getProject(a.projectId)
            return project?.name || 'Unknown'
          })
        )
        const confirmed = confirm(
          `This time off will affect ${assignments.length} assignment(s):\n${[...new Set(projectNames)].join(', ')}\n\nThese assignments will be preserved and can be restored if the time off is deleted.\n\nContinue?`
        )
        if (!confirmed) return
      }

      await storageService.createTimeOff(timeOffData)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating time off:', error)
      setValidationError('Failed to create time off')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Time Off</DialogTitle>
            <DialogDescription>
              Schedule time off for a developer (vacation, sick days, etc.)
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
                    {dev.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CreateTimeOff['type'],
                  })
                }
                required
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
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
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="e.g., Summer vacation, Medical appointment..."
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <p className="text-blue-900">
                <strong>Note:</strong> Time off will override any project assignments
                during this period. If you delete the time off later, the original
                assignments will be preserved.
              </p>
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
            <Button type="submit">Add Time Off</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
