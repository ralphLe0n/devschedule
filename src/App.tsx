import { useState } from 'react'
import { Calendar, Users, Briefcase, LayoutDashboard } from 'lucide-react'
import { Button } from './components/ui/button'
import { DeveloperManagement } from './components/DeveloperManagement'
import { ProjectManagement } from './components/ProjectManagement'
import { ScheduleView } from './components/ScheduleView'
import { Dashboard } from './components/Dashboard'

type View = 'dashboard' | 'schedule' | 'developers' | 'projects'

function App() {
  const [currentView, setCurrentView] = useState<View>('schedule')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Developer Resource Scheduler</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'schedule' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('schedule')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
            <Button
              variant={currentView === 'developers' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('developers')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Developers
            </Button>
            <Button
              variant={currentView === 'projects' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('projects')}
              className="gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Projects
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'schedule' && <ScheduleView />}
        {currentView === 'developers' && <DeveloperManagement />}
        {currentView === 'projects' && <ProjectManagement />}
      </main>
    </div>
  )
}

export default App
