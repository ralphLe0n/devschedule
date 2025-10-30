import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Hash, Briefcase } from 'lucide-react'
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
import { PROJECT_COLORS, getContrastTextColor } from '@/utils/colorUtils'
import type { Project, CreateProject } from '@/types'

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<CreateProject>({
    name: '',
    code: '',
    color: PROJECT_COLORS[0],
    description: '',
    isActive: true,
  })

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const projs = await storageService.getProjects()
    setProjects(projs)
  }

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData({
        name: project.name,
        code: project.code,
        color: project.color,
        description: project.description,
        isActive: project.isActive,
      })
    } else {
      setEditingProject(null)
      // Pick a random color for new projects
      const usedColors = projects.map((p) => p.color)
      const availableColors = PROJECT_COLORS.filter((c) => !usedColors.includes(c))
      const randomColor =
        availableColors.length > 0
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]

      setFormData({
        name: '',
        code: '',
        color: randomColor,
        description: '',
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProject(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Please enter both project name and code')
      return
    }

    // Check for duplicate project codes
    const existingProject = projects.find(
      (p) => p.code === formData.code && p.id !== editingProject?.id
    )
    if (existingProject) {
      alert('Project code already exists. Please use a unique code.')
      return
    }

    try {
      if (editingProject) {
        await storageService.updateProject(editingProject.id, formData)
      } else {
        await storageService.createProject(formData)
      }
      await loadProjects()
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save project')
    }
  }

  const handleDelete = async (project: Project) => {
    if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        await storageService.deleteProject(project.id)
        await loadProjects()
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Failed to delete project')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your projects and their visual identifiers
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Project List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {project.code}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {project.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </CardContent>
            )}
          </Card>
        ))}

        {projects.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No projects yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first project to start scheduling
              </p>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Project
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
                {editingProject ? 'Edit Project' : 'Add Project'}
              </DialogTitle>
              <DialogDescription>
                {editingProject
                  ? 'Update the project information'
                  : 'Create a new project for resource scheduling'}
              </DialogDescription>
              <DialogClose onClick={handleCloseDialog} />
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Mobile App Development"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Project Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="MOBILE"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for the project (e.g., MOBILE, WEB, API)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief project description..."
                />
              </div>

              <div className="space-y-2">
                <Label>Project Color *</Label>
                <div className="grid grid-cols-8 gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      } transition-transform hover:scale-110`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor="custom-color">Custom Color:</Label>
                  <input
                    id="custom-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">
                    {formData.color}
                  </span>
                </div>
              </div>

              {/* Color Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="p-4 rounded-lg text-center font-semibold"
                  style={{
                    backgroundColor: formData.color,
                    color: getContrastTextColor(formData.color),
                  }}
                >
                  {formData.name || 'Project Name'}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProject ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
