import { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, StatusDeclaration } from '../types';
import {
  getTodayRecord,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getEmployeeRecords,
  addStatusDeclaration,
  getStatusForDate,
  getEmployeeWorkDays,
} from '../store';
import {
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Pause,
  Play,
  History,
  CalendarDays,
  FileText,
} from 'lucide-react';
import LeaveRequestsPage from './LeaveRequestsPage';
import Logo from '../components/Logo';

interface EmployeeDashboardProps {
  user: Employee;
  onLogout: () => void;
}

export default function EmployeeDashboard({ user, onLogout }: EmployeeDashboardProps) {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [breakReason, setBreakReason] = useState('');
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusDate, setStatusDate] = useState('');
  const [statusType, setStatusType] = useState<StatusDeclaration['status']>('leave');
  const [statusReason, setStatusReason] = useState('');
  const [tomorrowStatus, setTomorrowStatus] = useState<StatusDeclaration | null>(null);
  const [workDays, setWorkDays] = useState({
    totalDays: 0,
    presentDays: 0,
    leaveDays: 0,
    holidayDays: 0,
    weekOffDays: 0,
    sickLeaveDays: 0,
    personalLeaveDays: 0,
    workingDays: 0,
  });
  const [showLeaveRequests, setShowLeaveRequests] = useState(false);

  useEffect(() => {
    refreshData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    const record = getTodayRecord(user.id);
    setTodayRecord(record);
    setHistory(getEmployeeRecords(user.id).sort((a, b) => b.date.localeCompare(a.date)));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    setStatusDate(tomorrowStr);
    setTomorrowStatus(getStatusForDate(user.id, tomorrowStr));
    setWorkDays(getEmployeeWorkDays(user.id));
  };

  const handleClockIn = () => {
    clockIn(user.id, user.name);
    refreshData();
  };
  const handleClockOut = () => {
    clockOut(user.id);
    refreshData();
  };
  const handleStartBreak = () => {
    if (!breakReason.trim()) return;
    startBreak(user.id, breakReason);
    setBreakReason('');
    setShowBreakModal(false);
    refreshData();
  };
  const handleEndBreak = () => {
    endBreak(user.id);
    refreshData();
  };
  const handleDeclareStatus = () => {
    if (!statusDate || !statusReason.trim()) return;
    addStatusDeclaration(user.id, user.name, statusDate, statusType, statusReason, 'employee');
    setStatusReason('');
    setShowStatusModal(false);
    refreshData();
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateWorkHours = () => {
    if (!todayRecord?.clockIn) return '0h 0m';
    const start = new Date(todayRecord.clockIn).getTime();
    const end = todayRecord.clockOut ? new Date(todayRecord.clockOut).getTime() : currentTime.getTime();
    const totalBreakMs = todayRecord.breaks
      .filter(b => b.duration !== null)
      .reduce((sum, b) => sum + (b.duration || 0) * 60000, 0);
    const activeBreak = todayRecord.breaks.find(b => !b.endTime);
    let currentBreakMs = 0;
    if (activeBreak) currentBreakMs = currentTime.getTime() - new Date(activeBreak.startTime).getTime();
    const workMs = Math.max(0, end - start - totalBreakMs - currentBreakMs);
    const hours = Math.floor(workMs / 3600000);
    const minutes = Math.floor((workMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const calculateTotalBreakTime = () => {
    if (!todayRecord) return '0m';
    const totalMs = todayRecord.breaks
      .filter(b => b.duration !== null)
      .reduce((sum, b) => sum + (b.duration || 0) * 60000, 0);
    const activeBreak = todayRecord.breaks.find(b => !b.endTime);
    let currentBreakMs = 0;
    if (activeBreak) currentBreakMs = currentTime.getTime() - new Date(activeBreak.startTime).getTime();
    const totalMinutes = Math.max(0, Math.floor((totalMs + currentBreakMs) / 60000));
    return `${totalMinutes}m`;
  };

  if (showLeaveRequests) {
    return <LeaveRequestsPage user={user} onBack={() => setShowLeaveRequests(false)} />;
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-white font-semibold">Employee Dashboard</h1>
              <p className="text-blue-200/60 text-sm">Attendance Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-blue-200/60 text-xs">{user.department}</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setShowLeaveRequests(true)}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Leaves</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-blue-200/60 text-sm mb-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-4xl sm:text-5xl font-bold text-white font-mono tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Work Hours</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{calculateWorkHours()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Coffee className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Break Time</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{calculateTotalBreakTime()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-blue-200/70 text-sm">Status</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {todayRecord?.status === 'active'
                ? 'Working'
                : todayRecord?.status === 'on-break'
                ? 'On Break'
                : todayRecord?.status === 'completed'
                ? 'Completed'
                : 'Off Duty'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-400" />
              My Work Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400 tabular-nums">{workDays.presentDays}</p>
                <p className="text-xs text-green-300/70 mt-1">Days Present</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400 tabular-nums">{workDays.totalDays}</p>
                <p className="text-xs text-blue-300/70 mt-1">Total Tracked</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400 tabular-nums">
                  {workDays.leaveDays + workDays.sickLeaveDays}
                </p>
                <p className="text-xs text-red-300/70 mt-1">Leaves Taken</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-400 tabular-nums">
                  {workDays.holidayDays + workDays.weekOffDays}
                </p>
                <p className="text-xs text-purple-300/70 mt-1">Holidays / Week Off</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              Tomorrow's Status
            </h3>
            {tomorrowStatus ? (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl border ${
                    tomorrowStatus.status === 'working'
                      ? 'bg-green-500/10 border-green-500/20'
                      : tomorrowStatus.status === 'leave'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <p className="text-white font-medium capitalize">{tomorrowStatus.status.replace('-', ' ')}</p>
                  <p className="text-blue-200/70 text-sm">{tomorrowStatus.reason}</p>
                </div>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-all cursor-pointer"
                >
                  Update Status
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-blue-200/60 mb-4 text-sm">No status declared for tomorrow</p>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
                >
                  Declare Status
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          {!todayRecord || todayRecord.status === 'completed' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {todayRecord && todayRecord.status === 'completed'
                  ? 'You have clocked out for today'
                  : 'Ready to start your day?'}
              </h2>
              <p className="text-blue-200/60 mb-6 text-sm">
                {todayRecord && todayRecord.status === 'completed'
                  ? `Clocked out at ${formatTime(todayRecord.clockOut)}`
                  : 'Clock in to start tracking your attendance'}
              </p>
              <button
                onClick={handleClockIn}
                className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-600/30 transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                Clock In
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-blue-200/70 text-sm">Clocked In:</span>
                    <span className="text-white font-medium tabular-nums">{formatTime(todayRecord.clockIn)}</span>
                  </div>
                  {todayRecord.clockOut && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-blue-200/70 text-sm">Clocked Out:</span>
                      <span className="text-white font-medium tabular-nums">{formatTime(todayRecord.clockOut)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {todayRecord.status === 'active' && (
                  <>
                    <button
                      onClick={() => setShowBreakModal(true)}
                      className="px-5 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Coffee className="w-4 h-4" />
                      Start Break
                    </button>
                    <button
                      onClick={handleClockOut}
                      className="px-5 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Clock Out
                    </button>
                  </>
                )}
                {todayRecord.status === 'on-break' && (
                  <>
                    <button
                      onClick={handleEndBreak}
                      className="px-5 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      End Break & Resume
                    </button>
                    <button
                      onClick={handleClockOut}
                      className="px-5 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Clock Out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {todayRecord && todayRecord.breaks.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Pause className="w-5 h-5 text-orange-400" />
              Today's Breaks
            </h3>
            <div className="space-y-3">
              {todayRecord.breaks.map((breakRecord, index) => (
                <div
                  key={breakRecord.id}
                  className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm tabular-nums">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{breakRecord.reason}</p>
                      <p className="text-blue-200/50 text-xs tabular-nums">
                        {formatTime(breakRecord.startTime)} -{' '}
                        {breakRecord.endTime ? formatTime(breakRecord.endTime) : 'Ongoing'}
                      </p>
                    </div>
                  </div>
                  <p className="text-white font-medium text-sm tabular-nums">
                    {breakRecord.duration !== null ? `${breakRecord.duration}m` : <span className="text-orange-400">Active</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Attendance History
          </h3>
          {history.length === 0 ? (
            <p className="text-blue-200/50 text-center py-8 text-sm">No attendance records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Date</th>
                    <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Clock In</th>
                    <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Clock Out</th>
                    <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Breaks</th>
                    <th className="text-left text-blue-200/60 text-sm font-medium py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map(record => (
                    <tr key={record.id} className="border-b border-white/5">
                      <td className="py-3 px-2 text-white text-sm tabular-nums">{record.date}</td>
                      <td className="py-3 px-2 text-white text-sm tabular-nums">{formatTime(record.clockIn)}</td>
                      <td className="py-3 px-2 text-white text-sm tabular-nums">
                        {record.clockOut ? formatTime(record.clockOut) : '--'}
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
      </main>

      <footer className="bg-white/5 border-t border-white/10 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-blue-200/60 text-xs">© {new Date().getFullYear()} Global Futura INC</span>
          </div>
          <p className="text-blue-200/40 text-xs">Pure Quality · Global Reach · Jericho, NY</p>
        </div>
      </footer>

      {showBreakModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-400" />
              Start Break
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-blue-200/70 mb-2">Reason for break</label>
              <select
                value={breakReason}
                onChange={e => setBreakReason(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="bg-slate-800">Select reason...</option>
                <option value="Lunch Break" className="bg-slate-800">Lunch Break</option>
                <option value="Coffee Break" className="bg-slate-800">Coffee Break</option>
                <option value="Personal" className="bg-slate-800">Personal</option>
                <option value="Medical" className="bg-slate-800">Medical</option>
                <option value="Other" className="bg-slate-800">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBreakModal(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBreak}
                disabled={!breakReason}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Start Break
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Declare Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200/70 mb-2">Date</label>
                <input
                  type="date"
                  value={statusDate}
                  onChange={e => setStatusDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-2">Status Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['working', 'leave', 'sick-leave', 'personal-leave', 'holiday', 'week-off'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setStatusType(type)}
                      className={`p-2 rounded-xl border-2 transition-all text-xs font-medium capitalize cursor-pointer ${
                        statusType === type
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
                <label className="block text-sm text-blue-200/70 mb-2">Reason</label>
                <textarea
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a reason..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusReason('');
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclareStatus}
                  disabled={!statusDate}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  Declare Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
