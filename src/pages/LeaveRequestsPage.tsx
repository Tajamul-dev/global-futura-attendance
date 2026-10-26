import React, { useState, useEffect } from 'react';
import { Employee, LeaveRequest } from '../types';
import { getEmployeeLeaveRequests, addLeaveRequest, getLeaveRequests, updateLeaveRequestStatus } from '../store';
import { Calendar, Plus, Clock, CheckCircle2, XCircle, FileText, Filter, ArrowLeft } from 'lucide-react';

interface LeaveRequestsPageProps {
  user: Employee;
  onBack: () => void;
}

export default function LeaveRequestsPage({ user, onBack }: LeaveRequestsPageProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'vacation' as LeaveRequest['leaveType'],
    reason: '',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    if (user.role === 'admin') setRequests(getLeaveRequests());
    else setRequests(getEmployeeLeaveRequests(user.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLeaveRequest(user.id, user.name, formData.startDate, formData.endDate, formData.leaveType, formData.reason);
    setFormData({ startDate: '', endDate: '', leaveType: 'vacation', reason: '' });
    setShowRequestForm(false);
    refreshData();
  };

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    updateLeaveRequestStatus(id, status, user.name, null);
    refreshData();
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'approved':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const calculateDays = (start: string, end: string) =>
    Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-semibold">Leave Requests</h1>
              <p className="text-blue-200/60 text-sm">Manage time-off requests</p>
            </div>
          </div>
          {user.role === 'employee' && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg shadow-green-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200/70 text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{requests.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200/70 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {requests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-blue-200/70 text-sm">Approved</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {requests.filter(r => r.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-blue-200/70 text-sm">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 bg-white/5 rounded-xl p-1 border border-white/10 w-fit">
          <Filter className="w-4 h-4 text-blue-200/50 ml-2" />
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize cursor-pointer ${
                filter === f ? 'bg-blue-600 text-white' : 'text-blue-200/70 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-blue-200/30 mx-auto mb-4" />
            <p className="text-blue-200/50">No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {request.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{request.employeeName}</h3>
                      <p className="text-blue-200/60 text-sm capitalize">{request.leaveType} Leave</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(request.status)}`}>
                    <span className="capitalize">{request.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-blue-200/60 text-xs mb-1">Start Date</p>
                    <p className="text-white font-medium">{formatDate(request.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-blue-200/60 text-xs mb-1">End Date</p>
                    <p className="text-white font-medium">{formatDate(request.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-blue-200/60 text-xs mb-1">Duration</p>
                    <p className="text-white font-medium tabular-nums">
                      {calculateDays(request.startDate, request.endDate)} day
                      {calculateDays(request.startDate, request.endDate) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {request.reason && (
                  <div className="mb-4">
                    <p className="text-blue-200/60 text-xs mb-1">Reason</p>
                    <p className="text-white text-sm">{request.reason}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <p className="text-blue-200/50 text-xs">Requested on {formatDate(request.requestedAt)}</p>
                  {user.role === 'admin' && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(request.id, 'approved')}
                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded-lg text-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(request.id, 'rejected')}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg text-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              New Leave Request
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value as LeaveRequest['leaveType'] })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="vacation" className="bg-slate-800">Vacation</option>
                  <option value="sick" className="bg-slate-800">Sick Leave</option>
                  <option value="personal" className="bg-slate-800">Personal</option>
                  <option value="unpaid" className="bg-slate-800">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-blue-200/70 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-blue-200/70 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-blue-200/70 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Explain the reason..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
