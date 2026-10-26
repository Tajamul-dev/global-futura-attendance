export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'admin';
  department: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breaks: BreakRecord[];
  status: 'active' | 'completed' | 'on-break';
}

export interface BreakRecord {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  reason: string;
}

export interface StatusDeclaration {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'working' | 'leave' | 'holiday' | 'week-off' | 'sick-leave' | 'personal-leave';
  reason: string;
  declaredAt: string;
  declaredBy: 'employee' | 'admin';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  description: string;
  isRecurring: boolean;
  createdBy: string;
  createdAt: string;
}
