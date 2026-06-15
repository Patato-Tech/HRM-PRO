'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, canApproveLeaves, hasPermission, getRoleName, getRoleColor, isCompanyAdmin } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  department?: { name: string } | null;
  user: { name: string; email: string; role: string };
}

interface LeaveBalance {
  id: string;
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  year: number;
}

interface Leave {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  approvedBy: string | null;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    department?: { name: string } | null;
    user: { name: string; email: string; role: string };
  };
}

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Emergency'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function LeavesPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myBalances, setMyBalances] = useState<Record<string, LeaveBalance[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'balance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showBulkBalanceModal, setShowBulkBalanceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);

  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    days: '',
    reason: '',
  });

  const [balanceForm, setBalanceForm] = useState({
    employeeId: '',
    departmentId: '',
    leaveType: 'Annual',
    total: '',
    year: new Date().getFullYear().toString(),
  });

  const [bulkBalanceForm, setBulkBalanceForm] = useState({
    leaveType: 'Annual',
    total: '',
    year: new Date().getFullYear().toString(),
  });
  const [bulkBalanceLoading, setBulkBalanceLoading] = useState(false);

  const canApprove = canApproveLeaves(user?.role || '') || hasPermission(user, 'leaves', 'approve') || isCompanyAdmin(user?.role || '');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !(user.role === 'EMPLOYEE' && !user.customRoleName) && !hasPermission(user, 'leaves', 'view') && !hasPermission(user, 'leaves', 'approve')) {
      router.replace('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    const isPlainEmployee = user?.role === 'EMPLOYEE' && !user?.customRoleName;
    try {
      if (isPlainEmployee && user?.employeeId) {
        const data = await apiCall(`/leaves/employee/${user.employeeId}`, {}, token);
        setLeaves(data || []);
      } else {
        const promises: Promise<any>[] = [
          apiCall('/leaves', {}, token),
          apiCall('/leaves/pending', {}, token),
          apiCall('/employees', {}, token),
        ];
        const results = await Promise.allSettled(promises);
        if (results[0].status === 'fulfilled') setLeaves(results[0].value);
        if (results[1].status === 'fulfilled') setPendingLeaves(results[1].value);
        if (results[2].status === 'fulfilled') setEmployees(results[2].value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleApply = async () => {
    setError('');
    if (!applyForm.employeeId || !applyForm.startDate || !applyForm.endDate || !applyForm.days) {
      setError('Please fill all required fields');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/leaves', {
        method: 'POST',
        body: JSON.stringify({ ...applyForm, days: parseInt(applyForm.days) }),
      }, token);
      setShowApplyModal(false);
      setApplyForm({ employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', days: '', reason: '' });
      showSuccessMsg('Leave application submitted!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/leaves/${id}/approve`, { method: 'PUT' }, token);
      showSuccessMsg('Leave approved!');
      setShowDetailModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/leaves/${id}/reject`, { method: 'PUT' }, token);
      showSuccessMsg('Leave rejected!');
      setShowDetailModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBalance = async () => {
    setError('');
    if (!balanceForm.employeeId || !balanceForm.total) {
      setError('Please fill all required fields');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/leaves/balance', {
        method: 'POST',
        body: JSON.stringify({
          ...balanceForm,
          total: parseInt(balanceForm.total),
          year: parseInt(balanceForm.year),
        }),
      }, token);
      setShowBalanceModal(false);
      setBalanceForm({ employeeId: '', departmentId: '', leaveType: 'Annual', total: '', year: new Date().getFullYear().toString() });
      showSuccessMsg('Leave balance added!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkAssignBalance = async () => {
    if (!bulkBalanceForm.total) { setError('Total days is required'); return; }
    setBulkBalanceLoading(true);
    const token = getToken() || '';
    let successCount = 0;
    let errorCount = 0;
    try {
      for (const emp of employees) {
        try {
          await apiCall('/leaves/balance', {
            method: 'POST',
            body: JSON.stringify({
              employeeId: emp.id,
              leaveType: bulkBalanceForm.leaveType,
              total: parseInt(bulkBalanceForm.total),
              year: parseInt(bulkBalanceForm.year),
            }),
          }, token);
          successCount++;
        } catch { errorCount++; }
      }
      setShowBulkBalanceModal(false);
      setBulkBalanceForm({ leaveType: 'Annual', total: '', year: new Date().getFullYear().toString() });
      showSuccessMsg(`Assigned to ${successCount} employees${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
    } finally {
      setBulkBalanceLoading(false);
    }
  };

  const handleViewBalance = async (emp: Employee) => {
    const token = getToken() || '';
    console.log('Fetching balance for emp:', emp.id);
    try {
      const data = await apiCall(`/leaves/balance/${emp.id}`, {}, token);
      console.log('Balance data:', data);
      setMyBalances(prev => ({ ...prev, [String(emp.id)]: data }));
    } catch (err) {
      console.error('Balance error:', err);
    }
  };
  const calculateDays = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff.toString() : '';
  };

  const filtered = leaves.filter(l => {
    const matchSearch = l.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchType = typeFilter === 'all' || l.leaveType === typeFilter;
    const matchDept = deptFilter === 'all' || (l.employee as any)?.department?.name === deptFilter;
    return matchSearch && matchStatus && matchType && matchDept;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {success && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 text-sm mt-1">{pendingLeaves.length} pending approval</p>
        </div>
        <div className="flex gap-2">
          {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'leaves', 'manage')) && (
            <>
              <button onClick={() => { setShowBulkBalanceModal(true); setError(''); }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
                🔄 Bulk Assign
              </button>
              <button onClick={() => { setShowBalanceModal(true); setError(''); }}
                className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium">
                + Add Balance
              </button>
            </>
          )}
          {!isCompanyAdmin(user?.role || '') && (
            <button onClick={() => { setShowApplyModal(true); setError(''); if(user?.employeeId) setApplyForm(prev => ({ ...prev, employeeId: String(user.employeeId) })); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              + Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Leaves', value: leaves.length, color: 'text-gray-900', bg: 'bg-blue-50' },
          { label: 'Pending', value: pendingLeaves.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved', value: leaves.filter(l => l.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
        {([
          { key: 'all', label: '📋 All Leaves' },
          { key: 'pending', label: `⏳ Pending (${pendingLeaves.length})` },
          { key: 'balance', label: '📊 Balances' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ALL LEAVES TAB */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Search by name or leave type..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                <option value="all">All Types</option>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                <option value="all">All Departments</option>
                {employees.filter((emp: any) => emp.department).map((emp: any) => emp.department?.name).filter((v: any, i: any, a: any) => a.indexOf(v) === i).map((name: any) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Department', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <p className="text-3xl mb-3">🌿</p>
                      <p className="text-gray-500 font-medium">No leave records found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(leave => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {leave.employee?.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{leave.employee?.user?.name}</p>
                            <p className="text-xs text-gray-400">{leave.employee?.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{(leave.employee as any)?.department?.name ? (<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{(leave.employee as any)?.department?.name}</span>) : (leave.employee as any)?.customRole?.scope === "all" ? (<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Company Wide</span>) : (<span className="text-xs text-gray-400">—</span>)}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{leave.leaveType}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{leave.days}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate">{leave.reason || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[leave.status] || 'bg-gray-100 text-gray-600'}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setSelectedLeave(leave); setShowDetailModal(true); }}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">
                            View
                          </button>
                          {canApprove && leave.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(leave.id)}
                                className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg">
                                Approve
                              </button>
                              <button onClick={() => handleReject(leave.id)}
                                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PENDING TAB */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-500 font-medium">No pending leave requests</p>
            </div>
          ) : (
            pendingLeaves.map(leave => (
              <div key={leave.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 text-yellow-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">
                      {leave.employee?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{leave.employee?.user?.name}</p>
                      <p className="text-sm text-gray-500">{leave.employee?.user?.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{leave.leaveType}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{leave.days} day(s)</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {leave.reason && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">"{leave.reason}"</p>
                      )}
                    </div>
                  </div>
                  {canApprove && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprove(leave.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                        ✓ Approve
                      </button>
                      <button onClick={() => handleReject(leave.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-medium">
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* BALANCE TAB */}
      {activeTab === 'balance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Leave Balances by Employee</h2>
            {canApprove && (
              <button onClick={() => { setShowBalanceModal(true); setError(''); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                + Add Balance
              </button>
            )}
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm">
                        {emp.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                        <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                      </div>
                    </div>
                    <button onClick={() => handleViewBalance(emp)}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                      {myBalances[String(emp.id)] ? "↻ Refresh" : "View Balance"}
                    </button>
                  </div>
                  {(myBalances[String(emp.id)] || []).length > 0 && (
                    <div className="space-y-2 mt-2">
                      {(myBalances[String(emp.id)] || []).map(balance => (
                        <div key={balance.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{balance.leaveType}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-semibold">{balance.remaining} left</span>
                            <span className="text-gray-400">/ {balance.total} total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Leave Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-bold text-gray-900 text-lg">{selectedLeave.employee?.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedLeave.employee?.user?.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Leave Type', value: selectedLeave.leaveType },
                  { label: 'Status', value: selectedLeave.status, badge: true },
                  { label: 'Start Date', value: new Date(selectedLeave.startDate).toLocaleDateString() },
                  { label: 'End Date', value: new Date(selectedLeave.endDate).toLocaleDateString() },
                  { label: 'Days', value: selectedLeave.days.toString() },
                  { label: 'Applied On', value: new Date(selectedLeave.createdAt).toLocaleDateString() },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    {item.badge ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[selectedLeave.status]}`}>
                        {item.value}
                      </span>
                    ) : (
                      <p className="text-gray-900 font-semibold text-sm">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {selectedLeave.reason && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Reason</p>
                  <p className="text-gray-900 text-sm">{selectedLeave.reason}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
              {canApprove && selectedLeave.status === 'pending' && (
                <>
                  <button onClick={() => handleApprove(selectedLeave.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium">Approve</button>
                  <button onClick={() => handleReject(selectedLeave.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">Reject</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Apply for Leave</h3>
              <button onClick={() => { setShowApplyModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'leaves', 'manage')) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select value={applyForm.employeeId} onChange={e => setApplyForm({ ...applyForm, employeeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">Select employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>)}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600">
                  Applying for: <strong>{user?.name}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                <select value={applyForm.leaveType} onChange={e => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" value={applyForm.startDate}
                    onChange={e => {
                      const start = e.target.value;
                      setApplyForm(prev => ({ ...prev, startDate: start, days: calculateDays(start, prev.endDate) }));
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" value={applyForm.endDate}
                    onChange={e => {
                      const end = e.target.value;
                      setApplyForm(prev => ({ ...prev, endDate: end, days: calculateDays(prev.startDate, end) }));
                    }}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days *</label>
                <input type="number" value={applyForm.days} onChange={e => setApplyForm({ ...applyForm, days: e.target.value })}
                  placeholder="Auto-calculated"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={applyForm.reason} onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Brief reason for leave..." rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowApplyModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleApply} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Submit Application</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BALANCE MODAL */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Leave Balance</h3>
              <button onClick={() => { setShowBalanceModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {(() => {
                const selEmp = employees.find((e: any) => String(e.id) === String(balanceForm.employeeId));
                const isCompanyWide = selEmp && (selEmp.customRole?.scope === "all" || (!selEmp.customRole && !selEmp.departmentId));
                return !isCompanyWide && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-gray-400 font-normal">(optional filter)</span></label>
                    <select value={balanceForm.departmentId} onChange={e => setBalanceForm({ ...balanceForm, departmentId: e.target.value, employeeId: "" })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                      <option value="">All Departments</option>
                      {employees.filter((e: any) => e.department).map((e: any) => e.department?.name).filter((v: any, i: any, a: any) => a.indexOf(v) === i).map((name: any) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={balanceForm.employeeId} onChange={e => setBalanceForm({ ...balanceForm, employeeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select employee</option>
                  {employees.filter((emp: any) => !balanceForm.departmentId || emp.department?.name === balanceForm.departmentId).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                  <select value={balanceForm.leaveType} onChange={e => setBalanceForm({ ...balanceForm, leaveType: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
                  <input type="number" value={balanceForm.total} onChange={e => setBalanceForm({ ...balanceForm, total: e.target.value })}
                    placeholder="e.g. 14"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={balanceForm.year} onChange={e => setBalanceForm({ ...balanceForm, year: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowBalanceModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAddBalance} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Add Balance</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK BALANCE MODAL */}
      {showBulkBalanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Assign Leave Balance</h3>
              <button onClick={() => setShowBulkBalanceModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-yellow-700">This will assign leave balance to all <strong>{employees.length}</strong> employees.</p>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select value={bulkBalanceForm.leaveType} onChange={e => setBulkBalanceForm({ ...bulkBalanceForm, leaveType: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Days</label>
                  <input type="number" value={bulkBalanceForm.total} onChange={e => setBulkBalanceForm({ ...bulkBalanceForm, total: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" value={bulkBalanceForm.year} onChange={e => setBulkBalanceForm({ ...bulkBalanceForm, year: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulkBalanceModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleBulkAssignBalance} disabled={bulkBalanceLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {bulkBalanceLoading ? 'Assigning...' : 'Assign to All Employees'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}