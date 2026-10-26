import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, StatusDeclaration } from '../types';
import {
  getRecords,
  getEmployees,
  addEmployee,
  deleteEmployee,
  getAllStatusForDate,
  getEmployeeWorkDays,
  addStatusDeclaration,
  deleteStatusDeclaration,
} from '../store';
import {
  Users,
  Clock,
  Coffee,
  Calendar,
  Search,
  UserPlus,
  Trash2,
  Shield,
  BarChart3,
  CheckCircle2,
  Filter,
  CalendarDays,
  FileText,
} from 'lucide-react';
import LeaveRequestsPage from './LeaveRequestsPage';
import Logo from '../components/Logo';

interface AdminDashboardProps {
  user: Employee;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'records' | 'status'>('overview');
  const [activePage, setActivePage] = useState<'dashboard' | 'leaves'>('dashboard');
  const [successMessage, setSuccessMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'admin'>('all');
  const [statusDateFilter, setStatusDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [pendingDeleteEmpId, setPendingDeleteEmpId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<{
    employeeId: string;
    date: string;
    status: StatusDeclaration['status'];
    reason: string;
  }>({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'leave', reason: '' });
  const [newEmployee, setNewEmployee] = useState<{
    name: string;
    email: string;
    password: string;
    department: string;
    role: 'employee' | 'admin';
  }>({ name: '', email: '', password: '', department: '', role: 'employee' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRecords(getRecords());
    setEmployees(getEmployees());
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const added = addEmployee(newEmployee);
    setNewEmployee({ name: '', email: '', password: '', department: '', role: 'employee' });
    setShowAddEmployee(false);
    refreshData();
    setSuccessMessage(`${added.role === 'admin' ? 'Admin' : 'Employee'} "${added.name}" added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const confirmDeleteEmployee = () => {
    if (pendingDeleteEmpId) {
      deleteEmployee(pendingDeleteEmpId);
      setPendingDeleteEmpId(null);
      refreshData();
    }
  };

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === newStatus.employeeId);
    if (!employee) return;
    addStatusDeclaration(newStatus.employeeId, employee.name, newStatus.date, newStatus.status, newStatus.reason, 'admin');
    setNewStatus({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'leave', reason: '' });
    setShowAddStatus(false);
    refreshData();
  };

  const handleDeleteStatus = (id: string) => {
    deleteStatusDeclaration(id);
    refreshData();
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const todayRecords = records.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const activeEmployees = todayRecords.filter(r => r.status === 'active' || r.status === 'on-break');
  const onBreakEmployees = todayRecords.filter(r => r.status === 'on-break');
  const totalBreakMinutes = todayRecords.reduce(
    (sum, r) => sum + r.breaks.filter(b => b.duration).reduce((s, b) => s + (b.duration || 0), 0),
    0
  );

  const filteredRecords = records.filter(r => {
    const matchesDate = r.date === dateFilter;
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const dateDeclarations = statusDateFilter ? getAllStatusForDate(statusDateFilter) : [];

  if (activePage === 'leaves') {
    return <LeaveRequestsPage user={user} onBack={() => setActivePage('dashboard')} />;
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-white font-semibold">Super Admin Panel</h1>
              <p className="text-blue-200/60 text-sm">Attendance Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-purple-300/60 text-xs flex items-center justify-end gap-1">
                <Shield className="w-3 h-3" /> Administrator
              </p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm font-medium">{successMessage}</p>
            <button onClick={() => setSuccessMessage('')} className="ml-auto text-green-400/60 hover:text-green-400 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Total Employees</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{employees.filter(e => e.role === 'employee').length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Active Now</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{activeEmployees.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Coffee className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-blue-200/70 text-sm">On Break</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{onBreakEmployees.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Break Time Today</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums">{totalBreakMinutes}m</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'records' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Records
            </span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'employees' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Employees
            </span>
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'status' ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Work Status
            </span>
          </button>
          <button
            onClick={() => setActivePage('leaves')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-blue-200/70 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Leave Requests
            </span>
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Today's Activity
              </h3>
              {todayRecords.length === 0 ? (
                <p className="text-blue-200/50 text-center py-8 text-sm">No attendance records for today</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayRecords.map(record => (
                    <div key={record.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {record.employeeName.charAt(0)}
                          </div>
                          <span className="text-white font-medium text-sm">{record.employeeName}</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            record.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : record.status === 'on-break'
                              ? 'bg-orange-500/20 text-orange-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {record.status === 'active' ? 'Active' : record.status === 'on-break' ? 'Break' : 'Done'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-blue-200/60 tabular-nums">
                        <p>
                          Clock In: <span className="text-white">{formatTime(record.clockIn)}</span>
                        </p>
                        <p>
                          Clock Out: <span className="text-white">{record.clockOut ? formatTime(record.clockOut) : '---'}</span>
                        </p>
                        <p>
                          Breaks:{' '}
                          <span className="text-white">
                            {record.breaks.length} (
                            {record.breaks.filter(b => b.duration).reduce((s, b) => s + (b.duration || 0), 0)}m total)
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-blue-200/50" />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-200/50" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {filteredRecords.length === 0 ? (
              <p className="text-blue-200/50 text-center py-8 text-sm">No records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Employee</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Date</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Clock In</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Clock Out</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Breaks</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {record.employeeName.charAt(0)}
                            </div>
                            <span className="text-white text-sm">{record.employeeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-white text-sm tabular-nums">{record.date}</td>
                        <td className="py-3 px-2 text-white text-sm tabular-nums">{formatTime(record.clockIn)}</td>
                        <td className="py-3 px-2 text-white text-sm tabular-nums">
                          {record.clockOut ? formatTime(record.clockOut) : '---'}
                        </td>
                        <td className="py-3 px-2 text-white text-sm tabular-nums">{record.breaks.length}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              record.status === 'completed'
                                ? 'bg-green-500/20 text-green-300'
                                : record.status === 'active'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-orange-500/20 text-orange-300'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setNewEmployee({ name: '', email: '', password: '', department: '', role: 'employee' });
                  setShowAddEmployee(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add Employee
              </button>
              <button
                onClick={() => {
                  setNewEmployee({ name: '', email: '', password: '', department: '', role: 'admin' });
                  setShowAddEmployee(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                Add Admin
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-200/50" />
              <span className="text-sm text-blue-200/60 mr-2">Filter:</span>
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer tabular-nums ${
                  roleFilter === 'all' ? 'bg-white/20 text-white' : 'text-blue-200/60 hover:text-white'
                }`}
              >
                All ({employees.length})
              </button>
              <button
                onClick={() => setRoleFilter('employee')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer tabular-nums ${
                  roleFilter === 'employee' ? 'bg-blue-500/20 text-blue-300' : 'text-blue-200/60 hover:text-white'
                }`}
              >
                Employees ({employees.filter(e => e.role === 'employee').length})
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer tabular-nums ${
                  roleFilter === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'text-blue-200/60 hover:text-white'
                }`}
              >
                Admins ({employees.filter(e => e.role === 'admin').length})
              </button>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Employee</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Email</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Department</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Role</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter(emp => roleFilter === 'all' || emp.role === roleFilter)
                      .map(emp => (
                        <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                  emp.role === 'admin'
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                                    : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                }`}
                              >
                                {emp.name.charAt(0)}
                              </div>
                              <span className="text-white text-sm font-medium">{emp.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-blue-200/70 text-sm">{emp.email}</td>
                          <td className="py-3 px-2 text-white text-sm">{emp.department}</td>
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                emp.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {emp.role}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            {emp.role !== 'admin' && (
                              <button
                                onClick={() => setPendingDeleteEmpId(emp.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all cursor-pointer"
                                title="Delete employee"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-200/50" />
                <input
                  type="date"
                  value={statusDateFilter}
                  onChange={e => setStatusDateFilter(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowAddStatus(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4" />
                Declare Status
              </button>
            </div>

            {dateDeclarations.length > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-3">Declarations for {statusDateFilter}</h3>
                <div className="space-y-2">
                  {dateDeclarations.map(dec => (
                    <div key={dec.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                      <div>
                        <span className="text-white font-medium text-sm">{dec.employeeName}</span>
                        <span className="text-blue-200/60 text-xs ml-2 capitalize">· {dec.status.replace('-', ' ')}</span>
                        {dec.reason && <p className="text-blue-200/50 text-xs mt-0.5">{dec.reason}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteStatus(dec.id)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Employee Work Days Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Employee</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Present</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Leave</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Sick Leave</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Holidays</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Week Off</th>
                      <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees
                      .filter(e => e.role === 'employee')
                      .map(emp => {
                        const stats = getEmployeeWorkDays(emp.id);
                        return (
                          <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 tabular-nums">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {emp.name.charAt(0)}
                                </div>
                                <span className="text-white text-sm">{emp.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-green-400 font-medium text-sm">{stats.presentDays}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-red-400 font-medium text-sm">{stats.leaveDays}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-orange-400 font-medium text-sm">{stats.sickLeaveDays}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-purple-400 font-medium text-sm">{stats.holidayDays}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-blue-400 font-medium text-sm">{stats.weekOffDays}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-white font-bold text-sm">{stats.totalDays}</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white/5 border-t border-white/10 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-blue-200/60 text-xs">© {new Date().getFullYear()} Global Futura INC</span>
          </div>
          <p className="text-blue-200/40 text-xs">Pure Quality · Global Reach · Jericho, NY</p>
        </div>
      </footer>

      {pendingDeleteEmpId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-2">Remove Employee?</h3>
            <p className="text-blue-200/70 text-sm mb-5">
              This will permanently remove the employee account from the portal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDeleteEmpId(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEmployee}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              {newEmployee.role === 'admin' ? 'Add New Admin' : 'Add New Employee'}
            </h3>
            <div className="mb-5">
              <label className="block text-sm text-blue-200/70 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewEmployee({ ...newEmployee, role: 'employee' })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    newEmployee.role === 'employee'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-white/10 bg-white/5 text-blue-200/60'
                  }`}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-medium">Employee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewEmployee({ ...newEmployee, role: 'admin' })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    newEmployee.role === 'admin'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-white/10 bg-white/5 text-blue-200/60'
                  }`}
                >
                  <Shield className="w-6 h-6" />
                  <span className="text-sm font-medium">Admin</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Password</label>
                <input
                  type="password"
                  value={newEmployee.password}
                  onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Department</label>
                <input
                  type="text"
                  value={newEmployee.department}
                  onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 font-medium rounded-xl transition-all text-white cursor-pointer ${
                    newEmployee.role === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {newEmployee.role === 'admin' ? 'Add Admin' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddStatus && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              Declare Employee Status
            </h3>
            <form onSubmit={handleAddStatus} className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Employee</label>
                <select
                  value={newStatus.employeeId}
                  onChange={e => setNewStatus({ ...newStatus, employeeId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" className="bg-slate-800">Select employee...</option>
                  {employees
                    .filter(e => e.role === 'employee')
                    .map(emp => (
                      <option key={emp.id} value={emp.id} className="bg-slate-800">
                        {emp.name} - {emp.department}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Date</label>
                <input
                  type="date"
                  value={newStatus.date}
                  onChange={e => setNewStatus({ ...newStatus, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-2">Status Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['working', 'leave', 'sick-leave', 'personal-leave', 'holiday', 'week-off'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewStatus({ ...newStatus, status: type })}
                      className={`p-2 rounded-xl border-2 transition-all text-xs font-medium capitalize cursor-pointer ${
                        newStatus.status === type
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                          : 'border-white/10 bg-white/5 text-blue-200/60'
                      }`}
                    >
                      {type.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Reason</label>
                <textarea
                  value={newStatus.reason}
                  onChange={e => setNewStatus({ ...newStatus, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStatus(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all cursor-pointer"
                >
                  Declare Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
