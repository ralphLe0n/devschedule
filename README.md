# Developer Resource Scheduler

A comprehensive React + TypeScript application for managing developer resource allocation across projects with timeline visualization and capacity management.

## Features

### Core Functionality

#### Developer Management
- ✅ Add, edit, and delete developers
- ✅ Store developer information (name, email, default capacity)
- ✅ Set default working hours per day
- ✅ Soft delete support for data preservation

#### Project Management
- ✅ Create and manage projects with unique project codes
- ✅ Assign colors to projects for visual distinction
- ✅ Color picker with predefined palette
- ✅ Project descriptions and metadata

#### Timeline Views
- ✅ **Year View**: Monthly overview of the entire year
- ✅ **Month View**: Weekly breakdown of the selected month
- ✅ **Week View**: Daily view of the selected week
- ✅ Visual calendar/Gantt-style interface
- ✅ Easy navigation between time periods
- ✅ "Today" quick navigation

#### Scheduling System
- ✅ Assign developers to projects with date ranges
- ✅ **Dual allocation modes**:
  - Hours per day (e.g., 4 hours on Project A)
  - Percentage of capacity (e.g., 50% on Project A)
- ✅ Support for multiple concurrent project assignments
- ✅ Visual capacity utilization indicators
- ✅ Over-allocation warnings and detection
- ✅ Conflict detection for overlapping assignments
- ✅ Click-to-add assignments directly from timeline

#### Time Off Management
- ✅ Schedule time off (vacation, sick days, personal, etc.)
- ✅ Time off overrides project assignments
- ✅ **History preservation**: Assignments are saved and can be restored when time off is deleted
- ✅ Visual distinction for time off periods
- ✅ Support for different time off types

#### Dashboard & Analytics
- ✅ Overview statistics (developers, projects, assignments)
- ✅ Capacity utilization charts
- ✅ Over-allocation alerts
- ✅ Developer utilization for next 7 days
- ✅ Project overview with resource allocation
- ✅ Visual progress bars with color-coded capacity levels

## Tech Stack

### Frontend
- **React 18** with **TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **shadcn/ui** components for consistent UI
- **date-fns** for date manipulation
- **Lucide React** for icons

### Data Storage
- **localStorage** implementation with abstraction layer
- Designed for **easy migration to Supabase**
- Service pattern for clean separation of concerns
- All data models map directly to future database tables

### Code Quality
- ✅ Full TypeScript coverage
- ✅ Clean architecture with separation of concerns:
  - `/components` - React components
  - `/services` - Data access layer
  - `/types` - TypeScript interfaces
  - `/utils` - Utility functions
  - `/lib` - Shared libraries
- ✅ Component composition and reusability
- ✅ Soft deletes for data integrity
- ✅ Comprehensive type definitions

## Project Structure

```
src/
├── components/
│   ├── ui/                    # UI component library (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── badge.tsx
│   ├── App.tsx                # Main application component
│   ├── Dashboard.tsx          # Dashboard with analytics
│   ├── DeveloperManagement.tsx
│   ├── ProjectManagement.tsx
│   ├── ScheduleView.tsx       # Main scheduling interface
│   ├── Timeline.tsx           # Timeline grid component
│   ├── AssignmentDialog.tsx   # Assignment creation dialog
│   └── TimeOffDialog.tsx      # Time off creation dialog
├── services/
│   └── storage/
│       ├── IStorageService.ts      # Storage interface
│       ├── LocalStorageService.ts  # localStorage implementation
│       └── index.ts                # Service exports
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   ├── dateUtils.ts           # Date manipulation utilities
│   ├── capacityUtils.ts       # Capacity calculation utilities
│   └── colorUtils.ts          # Color utilities
├── lib/
│   └── utils.ts               # Shared utilities
├── index.css                  # Global styles
└── main.tsx                   # Application entry point
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd devschedule
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage Guide

### 1. Add Developers
Navigate to the **Developers** tab and click "Add Developer". Enter:
- Developer name
- Email (optional)
- Default capacity (hours per day, typically 8)

### 2. Create Projects
Go to the **Projects** tab and click "Add Project". Provide:
- Project name
- Unique project code
- Description (optional)
- Color for visual identification

### 3. Schedule Resources
In the **Schedule** view:
- Select your preferred view (Week/Month/Year)
- Click the "+" button next to a developer to create an assignment
- Choose the project, date range, and allocation
- Allocation can be in hours or percentage

### 4. Add Time Off
From the Schedule view:
- Click the umbrella icon next to a developer
- Select dates and time off type
- Existing assignments are preserved for restoration

### 5. Monitor Capacity
Check the **Dashboard** for:
- Overall statistics
- Developer utilization trends
- Over-allocation warnings
- Project resource distribution

## Data Model

### Developer
```typescript
{
  id: string
  name: string
  email?: string
  defaultCapacity: number    // Hours per day
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### Project
```typescript
{
  id: string
  name: string
  code: string               // Unique identifier
  color: string             // Hex color
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### Assignment
```typescript
{
  id: string
  developerId: string
  projectId: string
  startDate: string         // YYYY-MM-DD
  endDate: string           // YYYY-MM-DD
  allocationType: 'hours' | 'percentage'
  allocationValue: number
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### TimeOff
```typescript
{
  id: string
  developerId: string
  startDate: string
  endDate: string
  reason: string
  type: 'vacation' | 'sick' | 'personal' | 'other'
  isActive: boolean
  replacedAssignments?: Assignment[]  // For restoration
  createdAt: string
  updatedAt: string
}
```

## Migrating to Supabase

The application is designed for easy migration to Supabase:

1. Create Supabase tables matching the data models
2. Implement `SupabaseStorageService` following the `IStorageService` interface
3. Update `/src/services/storage/index.ts`:

```typescript
import { SupabaseStorageService } from './SupabaseStorageService';
export const storageService: IStorageService = new SupabaseStorageService();
```

All components will automatically use the new backend without any changes!

## Future Enhancements

Potential features for future development:
- 🔄 Drag-and-drop assignment editing
- 📊 Export to Excel/PDF
- 🔍 Advanced search and filtering
- 📅 Recurring assignments
- 👥 Team grouping
- 📈 Historical analytics
- 🔔 Notifications for over-allocation
- 🌐 Multi-user support with Supabase
- 📱 Mobile responsive improvements

## License

MIT

## Author

Built with Claude Code