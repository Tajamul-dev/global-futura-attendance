import { Employee, AttendanceRecord, BreakRecord, StatusDeclaration, LeaveRequest, CompanyHoliday } from './types';
import { v4 as uuidv4 } from 'uuid';

const EMPLOYEES_KEY = 'attendance_employees';
const RECORDS_KEY = 'attendance_records';
const CURRENT_USER_KEY = 'attendance_current_user';
const STATUS_DECLARATIONS_KEY = 'attendance_status_declarations';
const LEAVE_REQUESTS_KEY = 'attendance_leave_requests';
const HOLIDAYS_KEY = 'attendance_holidays';

function notifyStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('attendance-store-updated'));
  }
}

// Initialize store with demo accounts
export function initializeStore() {
  const employees = getEmployees();
  if (employees.length === 0) {
    const admin: Employee = {
      id: uuidv4(),
      name: 'Global Futura Admin',
      email: 'admin@globalfutura.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      createdAt: new Date().toISOString(),
    };
    const emp1: Employee = {
      id: uuidv4(),
      name: 'John Smith',
      email: 'john@globalfutura.com',
      password: 'emp123',
      role: 'employee',
      department: 'Operations',
      createdAt: new Date().toISOString(),
    };
    const emp2: Employee = {
      id: uuidv4(),
      name: 'Sarah Johnson',
      email: 'sarah@globalfutura.com',
      password: 'emp123',
      role: 'employee',
      department: 'Distribution',
      createdAt: new Date().toISOString(),
    };
    saveEmployees([admin, emp1, emp2]);
  }
}

export function resetDemoStore() {
  localStorage.removeItem(EMPLOYEES_KEY);
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(STATUS_DECLARATIONS_KEY);
  localStorage.removeItem(LEAVE_REQUESTS_KEY);
  localStorage.removeItem(HOLIDAYS_KEY);
  initializeStore();
  notifyStoreUpdate();
}

// Employees
export function getEmployees(): Employee[] {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveEmployees(employees: Employee[]) {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  notifyStoreUpdate();
}

export function addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Employee {
  const employees = getEmployees();
  const newEmployee: Employee = {
    ...employee,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  employees.push(newEmployee);
  saveEmployees(employees);
  return newEmployee;
}

export function deleteEmployee(id: string) {
  const employees = getEmployees().filter(e => e.id !== id);
  saveEmployees(employees);
}

// Authentication
export function login(email: string, password: string): Employee | null {
  const employees = getEmployees();
  const employee = employees.find(e => e.email === email && e.password === password);
  if (employee) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(employee));
    notifyStoreUpdate();
    return employee;
  }
  return null;
}

export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  notifyStoreUpdate();
}

export function getCurrentUser(): Employee | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

// Attendance Records
export function getRecords(): AttendanceRecord[] {
  const data = localStorage.getItem(RECORDS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveRecords(records: AttendanceRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  notifyStoreUpdate();
}

export function getTodayRecord(employeeId: string): AttendanceRecord | null {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  return records.find(r => r.employeeId === employeeId && r.date === today) || null;
}

export function clockIn(employeeId: string, employeeName: string): AttendanceRecord {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const record: AttendanceRecord = {
    id: uuidv4(),
    employeeId,
    employeeName,
    date: today,
    clockIn: now,
    clockOut: null,
    breaks: [],
    status: 'active',
  };

  records.push(record);
  saveRecords(records);
  return record;
}

export function clockOut(employeeId: string): AttendanceRecord | null {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const index = records.findIndex(r => r.employeeId === employeeId && r.date === today && r.status !== 'completed');
  const fallbackIndex = index !== -1 ? index : records.findIndex(r => r.employeeId === employeeId && r.date === today);

  if (fallbackIndex === -1) return null;

  records[fallbackIndex].clockOut = now;
  records[fallbackIndex].status = 'completed';
  saveRecords(records);
  return records[fallbackIndex];
}

export function startBreak(employeeId: string, reason: string): AttendanceRecord | null {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const index = records.findIndex(r => r.employeeId === employeeId && r.date === today && r.status === 'active');

  if (index === -1) return null;

  const breakRecord: BreakRecord = {
    id: uuidv4(),
    startTime: now,
    endTime: null,
    duration: null,
    reason: reason || 'Break',
  };

  records[index].breaks.push(breakRecord);
  records[index].status = 'on-break';
  saveRecords(records);
  return records[index];
}

export function endBreak(employeeId: string): AttendanceRecord | null {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  const index = records.findIndex(r => r.employeeId === employeeId && r.date === today && r.status === 'on-break');

  if (index === -1) return null;

  const breaks = records[index].breaks;
  const lastBreakIndex = breaks.length - 1;

  if (lastBreakIndex >= 0 && !breaks[lastBreakIndex].endTime) {
    const startTime = new Date(breaks[lastBreakIndex].startTime).getTime();
    const endTime = new Date(now).getTime();
    const duration = Math.round((endTime - startTime) / 60000);

    breaks[lastBreakIndex].endTime = now;
    breaks[lastBreakIndex].duration = duration;
  }

  records[index].status = 'active';
  saveRecords(records);
  return records[index];
}

export function getEmployeeRecords(employeeId: string): AttendanceRecord[] {
  return getRecords().filter(r => r.employeeId === employeeId);
}

// Status Declarations
export function getStatusDeclarations(): StatusDeclaration[] {
  const data = localStorage.getItem(STATUS_DECLARATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveStatusDeclarations(declarations: StatusDeclaration[]) {
  localStorage.setItem(STATUS_DECLARATIONS_KEY, JSON.stringify(declarations));
  notifyStoreUpdate();
}

export function addStatusDeclaration(
  employeeId: string,
  employeeName: string,
  date: string,
  status: StatusDeclaration['status'],
  reason: string,
  declaredBy: 'employee' | 'admin'
): StatusDeclaration {
  const declarations = getStatusDeclarations();
  const newDeclaration: StatusDeclaration = {
    id: uuidv4(),
    employeeId,
    employeeName,
    date,
    status,
    reason,
    declaredAt: new Date().toISOString(),
    declaredBy,
  };
  declarations.push(newDeclaration);
  saveStatusDeclarations(declarations);
  return newDeclaration;
}

export function getStatusForDate(employeeId: string, date: string): StatusDeclaration | null {
  const declarations = getStatusDeclarations();
  return declarations.find(d => d.employeeId === employeeId && d.date === date) || null;
}

export function getAllStatusForDate(date: string): StatusDeclaration[] {
  return getStatusDeclarations().filter(d => d.date === date);
}

export function deleteStatusDeclaration(id: string) {
  const declarations = getStatusDeclarations().filter(d => d.id !== id);
  saveStatusDeclarations(declarations);
}

// Work Days Counter
export function getEmployeeWorkDays(employeeId: string): {
  totalDays: number;
  presentDays: number;
  leaveDays: number;
  holidayDays: number;
  weekOffDays: number;
  sickLeaveDays: number;
  personalLeaveDays: number;
  workingDays: number;
} {
  const records = getRecords().filter(r => r.employeeId === employeeId);
  const declarations = getStatusDeclarations().filter(d => d.employeeId === employeeId);

  const presentDays = records.filter(r => r.status === 'completed' || r.status === 'active').length;
  const leaveDays = declarations.filter(d => d.status === 'leave').length;
  const holidayDays = declarations.filter(d => d.status === 'holiday').length;
  const weekOffDays = declarations.filter(d => d.status === 'week-off').length;
  const sickLeaveDays = declarations.filter(d => d.status === 'sick-leave').length;
  const personalLeaveDays = declarations.filter(d => d.status === 'personal-leave').length;

  const totalDays = presentDays + leaveDays + holidayDays + weekOffDays + sickLeaveDays + personalLeaveDays;

  return {
    totalDays,
    presentDays,
    leaveDays,
    holidayDays,
    weekOffDays,
    sickLeaveDays,
    personalLeaveDays,
    workingDays: presentDays,
  };
}

// Leave Requests
export function getLeaveRequests(): LeaveRequest[] {
  const data = localStorage.getItem(LEAVE_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLeaveRequests(requests: LeaveRequest[]) {
  localStorage.setItem(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  notifyStoreUpdate();
}

export function addLeaveRequest(
  employeeId: string,
  employeeName: string,
  startDate: string,
  endDate: string,
  leaveType: LeaveRequest['leaveType'],
  reason: string
): LeaveRequest {
  const requests = getLeaveRequests();
  const newRequest: LeaveRequest = {
    id: uuidv4(),
    employeeId,
    employeeName,
    startDate,
    endDate,
    leaveType,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: null,
  };
  requests.push(newRequest);
  saveLeaveRequests(requests);
  return newRequest;
}

export function updateLeaveRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  reviewNotes: string | null
): LeaveRequest | null {
  const requests = getLeaveRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index === -1) return null;

  requests[index].status = status;
  requests[index].reviewedAt = new Date().toISOString();
  requests[index].reviewedBy = reviewedBy;
  requests[index].reviewNotes = reviewNotes;
  saveLeaveRequests(requests);
  return requests[index];
}

export function getEmployeeLeaveRequests(employeeId: string): LeaveRequest[] {
  return getLeaveRequests().filter(r => r.employeeId === employeeId);
}

// Company Holidays
export function getHolidays(): CompanyHoliday[] {
  const data = localStorage.getItem(HOLIDAYS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveHolidays(holidays: CompanyHoliday[]) {
  localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(holidays));
  notifyStoreUpdate();
}

export function addHoliday(
  name: string,
  date: string,
  description: string,
  isRecurring: boolean,
  createdBy: string
): CompanyHoliday {
  const holidays = getHolidays();
  const newHoliday: CompanyHoliday = {
    id: uuidv4(),
    name,
    date,
    description,
    isRecurring,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  holidays.push(newHoliday);
  saveHolidays(holidays);
  return newHoliday;
}

export function deleteHoliday(id: string) {
  const holidays = getHolidays().filter(h => h.id !== id);
  saveHolidays(holidays);
}

// Overtime Calculation
export function calculateOvertime(employeeId: string, date: string): number {
  const records = getRecords().filter(r => r.employeeId === employeeId && r.date === date);
  if (records.length === 0) return 0;

  const record = records[0];
  if (!record.clockIn || !record.clockOut) return 0;

  const clockInDate = new Date(record.clockIn);
  const clockOutDate = new Date(record.clockOut);
  const workHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);

  const standardHours = 8;
  const overtimeHours = Math.max(0, workHours - standardHours);

  return Math.round(overtimeHours * 100) / 100;
}

export function getEmployeeOvertimeSummary(employeeId: string): {
  totalOvertimeHours: number;
  averageDailyOvertime: number;
  daysWithOvertime: number;
} {
  const records = getRecords().filter(r => r.employeeId === employeeId);
  let totalOvertime = 0;
  let daysWithOvertime = 0;

  records.forEach(record => {
    const overtime = calculateOvertime(employeeId, record.date);
    totalOvertime += overtime;
    if (overtime > 0) daysWithOvertime++;
  });

  const averageDailyOvertime = records.length > 0 ? totalOvertime / records.length : 0;

  return {
    totalOvertimeHours: Math.round(totalOvertime * 100) / 100,
    averageDailyOvertime: Math.round(averageDailyOvertime * 100) / 100,
    daysWithOvertime,
  };
}
