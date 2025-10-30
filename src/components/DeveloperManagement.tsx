import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Mail, Clock, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
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
import type { Developer, CreateDeveloper } from '@/types'

export function DeveloperManagement() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null)
  const [formData, setFormData] = useState<CreateDeveloper>({
    name: '',
    email: '',
    defaultCapacity: 8,
    isActive: true,
  })

  // Load developers
  useEffect(() => {
    loadDevelopers()
  }, [])

  const loadDevelopers = async () => {
    const devs = await storageService.getDevelopers()
    setDevelopers(devs)
  }

  const handleOpenDialog = (developer?: Developer) => {
    if (developer) {
      setEditingDeveloper(developer)
      setFormData({
        name: developer.name,
        email: developer.email,
        defaultCapacity: developer.defaultCapacity,
        isActive: developer.isActive,
      })
    } else {
      setEditingDeveloper(null)
      setFormData({
        name: '',
        email: '',
        defaultCapacity: 8,
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingDeveloper(null)
    setFormData({
      name: '',
      email: '',
      defaultCapacity: 8,
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter a developer name')
      return
    }

    try {
      if (editingDeveloper) {
        await storageService.updateDeveloper(editingDeveloper.id, formData)
      } else {
        await storageService.createDeveloper(formData)
      }
      await loadDevelopers()
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving developer:', error)
      alert('Failed to save developer')
    }
  }

  const handleDelete = async (developer: Developer) => {
    if (confirm(`Are you sure you want to delete ${developer.name}?`)) {
      try {
        await storageService.deleteDeveloper(developer.id)
        await loadDevelopers()
      } catch (error) {
        console.error('Error deleting developer:', error)
        alert('Failed to delete developer')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Developers</h2>
          <p className="text-muted-foreground">
            Manage your development team members
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Developer
        </Button>
      </div>

      {/* Developer List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {developers.map((developer) => (
          <Card key={developer.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{developer.name}</CardTitle>
                  {developer.email && (
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {developer.email}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(developer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(developer)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Default capacity: <strong>{developer.defaultCapacity}h/day</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {developers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No developers yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by adding your first developer
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Developer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingDeveloper ? 'Edit Developer' : 'Add Developer'}
              </DialogTitle>
              <DialogDescription>
                {editingDeveloper
                  ? 'Update the developer information'
                  : 'Add a new developer to your team'}
              </DialogDescription>
              <DialogClose onClick={handleCloseDialog} />
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Default Capacity (hours/day) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={formData.defaultCapacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultCapacity: parseFloat(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Typical working hours per day (e.g., 8 hours)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDeveloper ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
