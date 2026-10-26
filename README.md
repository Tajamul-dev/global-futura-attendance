# Global Futura INC — Employee Attendance Portal

Complete VS Code workspace reconstructed and configured from exported source modules.

## Quick Start in Desktop VS Code

1. Download and extract `global-futura-attendance-vscode.zip`
2. Open the folder in VS Code (`File -> Open Folder...` or run `code .`)
3. Open the VS Code Integrated Terminal (`Ctrl + ``) and run:

```bash
npm install
npm run dev
```

## Demo Credentials

- **Administrator**: `admin@globalfutura.com` / `admin123`
- **Employee (Operations)**: `john@globalfutura.com` / `emp123`
- **Employee (Distribution)**: `sarah@globalfutura.com` / `emp123`

## Reconstructed Workspace Architecture

- `.vscode/` — Workspace settings, recommended extensions, Chrome debugger launch config, and npm tasks
- `src/App.tsx` — Root authentication & role router
- `src/main.tsx` — React 18 DOM entry point (fixed from `/src/main.jsx` reference)
- `src/index.css` — Tailwind CSS v4 entry stylesheet
- `src/types.ts` — Employee, AttendanceRecord, BreakRecord, StatusDeclaration, LeaveRequest, and CompanyHoliday models
- `src/store.ts` — LocalStorage persistence & attendance/break/leave business logic
- `src/components/Logo.tsx` — Resilient Global Futura brand logo with automatic SVG fallback
- `src/pages/LoginPage.tsx` — Portal login with demo account quick-fill
- `src/pages/EmployeeDashboard.tsx` — Live work clock, break tracking, status declaration, and history
- `src/pages/AdminDashboard.tsx` — Real-time team overview, records search, employee directory, and work day summaries
- `src/pages/LeaveRequestsPage.tsx` — Employee leave request submission & Admin approval workflow
