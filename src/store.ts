import { Employee, AttendanceRecord, BreakRecord, StatusDeclaration, LeaveRequest, CompanyHoliday } from './types';
import { v4 as uuidv4 } from 'uuid';

const INITIALIZED_KEY = 'attendance_initialized_v1';
const EMPLOYEES_KEY = 'attendance_employees';
const RECORDS_KEY = 'attendance_records';
const CURRENT_USER_KEY = 'attendance_current_user';
const STATUS_DECLARATIONS_KEY = 'attendance_status_declarations';
const LEAVE_REQUESTS_KEY = 'attendance_leave_requests';
const HOLIDAYS_KEY = 'attendance_holidays';

// Fallback memory store for strict mobile private browsing / embedded webviews
const memoryFallback = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch {
    // Ignore storage access errors
  }
  return memoryFallback.get(key) ?? null;
}

function storageSet(key: string, value: string) {
  memoryFallback.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore quota/private mode errors
  }
}

function storageRemove(key: string) {
  memoryFallback.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors
  }
}

function notifyStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('attendance-store-updated'));
  }
}

// Optional cross-device sync when hosted with backend /api/store
let isSyncingFromServer = false;

export async function syncFromServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/store', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || typeof data !== 'object') return false;

    isSyncingFromServer = true;
    if (Array.isArray(data.employees) && data.employees.length > 0) {
      storageSet(EMPLOYEES_KEY, JSON.stringify(data.employees));
      storageSet(INITIALIZED_KEY, 'true');
    }
    if (Array.isArray(data.records)) {
      storageSet(RECORDS_KEY, JSON.stringify(data.records));
    }
    if (Array.isArray(data.statusDeclarations)) {
      storageSet(STATUS_DECLARATIONS_KEY, JSON.stringify(data.statusDeclarations));
    }
    if (Array.isArray(data.leaveRequests)) {
      storageSet(LEAVE_REQUESTS_KEY, JSON.stringify(data.leaveRequests));
    }
    if (Array.isArray(data.holidays)) {
      storageSet(HOLIDAYS_KEY, JSON.stringify(data.holidays));
    }
    isSyncingFromServer = false;
    notifyStoreUpdate();
    return true;
  } catch {
    isSyncingFromServer = false;
    return false;
  }
}

function pushToServer() {
  if (typeof window === 'undefined' || isSyncingFromServer) return;
  const payload = {
    employees: getEmployeesRaw(),
    records: getRecords(),
    statusDeclarations: getStatusDeclarations(),
    leaveRequests: getLeaveRequests(),
    holidays: getHolidays(),
  };
  fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Gracefully ignore when running as static frontend-only Vite app
  });
}

function createDefaultEmployees(): Employee[] {
  return [
    {
      id: uuidv4(),
      name: 'Global Futura Admin',
      email: 'admin@globalfutura.com',
      password: 'admin123',
      role: 'admin',
      department: 'Management',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'John Smith',
      email: 'john@globalfutura.com',
      password: 'emp123',
      role: 'employee',
      department: 'Operations',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Sarah Johnson',
      email: 'sarah@globalfutura.com',
      password: 'emp123',
      role: 'employee',
      department: 'Distribution',
      createdAt: new Date().toISOString(),
    },
  ];
}

function getEmployeesRaw(): Employee[] {
  const data = storageGet(EMPLOYEES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Initialize store with demo accounts and pull latest shared state if available
export function initializeStore() {
  const existing = getEmployeesRaw();
  if (existing.length === 0 && !storageGet(INITIALIZED_KEY)) {
    const defaults = createDefaultEmployees();
    storageSet(EMPLOYEES_KEY, JSON.stringify(defaults));
    storageSet(INITIALIZED_KEY, 'true');
  }
  void syncFromServer();
}

export function resetDemoStore() {
  storageRemove(INITIALIZED_KEY);
  storageRemove(EMPLOYEES_KEY);
  storageRemove(RECORDS_KEY);
  storageRemove(CURRENT_USER_KEY);
  storageRemove(STATUS_DECLARATIONS_KEY);
  storageRemove(LEAVE_REQUESTS_KEY);
  storageRemove(HOLIDAYS_KEY);
  const defaults = createDefaultEmployees();
  storageSet(EMPLOYEES_KEY, JSON.stringify(defaults));
  storageSet(INITIALIZED_KEY, 'true');
  pushToServer();
  notifyStoreUpdate();
}

// Employees
export function getEmployees(): Employee[] {
  let list = getEmployeesRaw();
  if (list.length === 0 && !storageGet(INITIALIZED_KEY)) {
    list = createDefaultEmployees();
    storageSet(EMPLOYEES_KEY, JSON.stringify(list));
    storageSet(INITIALIZED_KEY, 'true');
  }
  return list;
}

export function saveEmployees(employees: Employee[]) {
  storageSet(EMPLOYEES_KEY, JSON.stringify(employees));
  storageSet(INITIALIZED_KEY, 'true');
  pushToServer();
  notifyStoreUpdate();
}

export function addEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Employee {
  const employees = getEmployees();
  const newEmployee: Employee = {
    ...employee,
    name: employee.name.trim(),
    email: employee.email.trim().toLowerCase(),
    password: employee.password.trim(),
    department: employee.department.trim(),
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

function matchesEmployeeCredentials(emp: Employee, rawEmail: string, rawPassword: string): boolean {
  const normalizedEmail = rawEmail.trim().toLowerCase();
  const empEmail = emp.email.trim().toLowerCase();
  if (empEmail !== normalizedEmail) return false;

  const cleanPass = rawPassword.trim();
  const storedPass = emp.password.trim();

  // Exact match
  if (storedPass === cleanPass) return true;

  // Handle mobile keyboard auto-capitalizing the first character of the password
  if (cleanPass.length > 0) {
    const decapitalizedFirst = cleanPass.charAt(0).toLowerCase() + cleanPass.slice(1);
    if (storedPass === decapitalizedFirst) return true;
  }

  return false;
}

// Synchronous login with mobile keyboard normalization
export function login(email: string, password: string): Employee | null {
  const employees = getEmployees();
  const employee = employees.find(e => matchesEmployeeCredentials(e, email, password));
  if (employee) {
    storageSet(CURRENT_USER_KEY, JSON.stringify(employee));
    notifyStoreUpdate();
    return employee;
  }
  return null;
}

// Async login that syncs cross-device accounts from server if local lookup misses
export async function loginWithSync(email: string, password: string): Promise<Employee | null> {
  const immediate = login(email, password);
  if (immediate) return immediate;

  const synced = await syncFromServer();
  if (synced) {
    return login(email, password);
  }
  return null;
}

export function logout() {
  storageRemove(CURRENT_USER_KEY);
  notifyStoreUpdate();
}

export function getCurrentUser(): Employee | null {
  const data = storageGet(CURRENT_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Attendance Records
export function getRecords(): AttendanceRecord[] {
  const data = storageGet(RECORDS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveRecords(records: AttendanceRecord[]) {
  storageSet(RECORDS_KEY, JSON.stringify(records));
  pushToServer();
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
  const data = storageGet(STATUS_DECLARATIONS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStatusDeclarations(declarations: StatusDeclaration[]) {
  storageSet(STATUS_DECLARATIONS_KEY, JSON.stringify(declarations));
  pushToServer();
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
  const data = storageGet(LEAVE_REQUESTS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]) {
  storageSet(LEAVE_REQUESTS_KEY, JSON.stringify(requests));
  pushToServer();
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
  const data = storageGet(HOLIDAYS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveHolidays(holidays: CompanyHoliday[]) {
  storageSet(HOLIDAYS_KEY, JSON.stringify(holidays));
  pushToServer();
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
