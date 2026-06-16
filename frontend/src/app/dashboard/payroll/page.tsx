'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, canManagePayroll , hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  salary: number;
  user: { name: string; email: string };
}

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basic: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    user: { name: string; email: string };
  };
}

interface PayrollSummary {
  totalPaid: number;
  totalPending: number;
  totalRecords: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
};

export default function PayrollPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'monthly' | 'process'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyPayrolls, setMonthlyPayrolls] = useState<PayrollRecord[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic: '',
    allowances: '',
    deductions: '',
  });

  const [editForm, setEditForm] = useState({
    basic: '',
    allowances: '',
    deductions: '',
  });

  const [bulkMonth, setBulkMonth] = useState(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkForms, setBulkForms] = useState<Record<string, { basic: string; allowances: string; deductions: string }>>({});

  const canManage = canManagePayroll(user?.role || '') || hasPermission(user, 'payroll', 'process') || hasPermission(user, 'payroll', 'approve');


  // ✅ Page permission guard
  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'payroll', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);
  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [payrollData, empData, summaryData] = await Promise.all([
        apiCall('/payroll', {}, token),
        apiCall('/employees', {}, token),
        apiCall('/payroll/summary', {}, token),
      ]);
      setPayrolls(payrollData);
      setEmployees(empData);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthly = async () => {
    setMonthlyLoading(true);
    const token = getToken() || '';
    try {
      const data = await apiCall(`/payroll/month?month=${selectedMonth}&year=${selectedYear}`, {}, token);
      setMonthlyPayrolls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthly();
  }, [activeTab, selectedMonth, selectedYear]);

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async () => {
    setError('');
    if (!createForm.employeeId || !createForm.basic) {
      setError('Employee and basic salary are required');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/payroll', {
        method: 'POST',
        body: JSON.stringify({
          ...createForm,
          basic: parseFloat(createForm.basic),
          allowances: parseFloat(createForm.allowances) || 0,
          deductions: parseFloat(createForm.deductions) || 0,
        }),
      }, token);
      setShowCreateModal(false);
      setCreateForm({ employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic: '', allowances: '', deductions: '' });
      showSuccessMsg('Payroll record created!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setError('');
    if (!selectedPayroll) return;
    try {
      const token = getToken() || '';
      await apiCall(`/payroll/${selectedPayroll.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          basic: parseFloat(editForm.basic),
          allowances: parseFloat(editForm.allowances) || 0,
          deductions: parseFloat(editForm.deductions) || 0,
        }),
      }, token);
      setShowEditModal(false);
      showSuccessMsg('Payroll updated!');
      fetchData();
      if (activeTab === 'monthly') fetchMonthly();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/payroll/${id}/approve`, { method: 'PUT' }, token);
      showSuccessMsg('Payroll approved!');
      setShowDetailModal(false);
      fetchData();
      if (activeTab === 'monthly') fetchMonthly();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkProcess = async () => {
    setError('');
    setBulkLoading(true);
    const token = getToken() || '';
    let successCount = 0;
    let errorCount = 0;

    for (const [employeeId, form] of Object.entries(bulkForms)) {
      if (!form.basic) continue;
      try {
        await apiCall('/payroll', {
          method: 'POST',
          body: JSON.stringify({
            employeeId,
            month: bulkMonth,
            year: bulkYear,
            basic: parseFloat(form.basic),
            allowances: parseFloat(form.allowances) || 0,
            deductions: parseFloat(form.deductions) || 0,
          }),
        }, token);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setBulkLoading(false);
    setShowBulkModal(false);
    setBulkForms({});
    showSuccessMsg(`Processed ${successCount} payrolls. ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
    fetchData();
  };

  const initBulkForms = () => {
    const forms: Record<string, { basic: string; allowances: string; deductions: string }> = {};
    employees.forEach(emp => {
      forms[emp.id] = {
        basic: emp.salary.toString(),
        allowances: '',
        deductions: '',
      };
    });
    setBulkForms(forms);
  };

  const openEditModal = (p: PayrollRecord) => {
    setSelectedPayroll(p);
    setEditForm({
      basic: p.basic.toString(),
      allowances: p.allowances.toString(),
      deductions: p.deductions.toString(),
    });
    setShowEditModal(true);
    setError('');
  };

  const netSalaryPreview = (basic: string, allowances: string, deductions: string) => {
    const b = parseFloat(basic) || 0;
    const a = parseFloat(allowances) || 0;
    const d = parseFloat(deductions) || 0;
    return b + a - d;
  };

  const filtered = payrolls.filter(p => {
    const matchSearch = p.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 text-sm mt-1">{payrolls.length} total records</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => { initBulkForms(); setShowBulkModal(true); setError(''); }}
              className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium">
              ⚡ Bulk Process
            </button>
            <button onClick={() => { setShowCreateModal(true); setError(''); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              + Add Payroll
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: summary?.totalRecords ?? 0, color: 'text-gray-900', bg: 'bg-blue-50', icon: '📋' },
          { label: 'Total Paid', value: `PKR ${((summary?.totalPaid ?? 0) / 1000).toFixed(0)}K`, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Pending Amount', value: `PKR ${((summary?.totalPending ?? 0) / 1000).toFixed(0)}K`, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
          { label: 'Pending Records', value: payrolls.filter(p => p.status === 'pending').length, color: 'text-red-500', bg: 'bg-red-50', icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {([
          { key: 'all', label: '📋 All Records' },
          { key: 'monthly', label: '📅 By Month' },
          canManage && { key: 'process', label: '⚡ Process' },
        ] as any[]).filter(Boolean).map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ALL RECORDS TAB */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="Search by name or code..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Period', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <p className="text-3xl mb-3">💰</p>
                      <p className="text-gray-500 font-medium">No payroll records found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {p.employee?.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{p.employee?.user?.name}</p>
                            <p className="text-xs text-gray-400">{p.employee?.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">PKR {p.basic.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600">+{p.allowances.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-red-500">-{p.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">PKR {p.netSalary.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setSelectedPayroll(p); setShowDetailModal(true); }}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                          {canManage && (
                            <>
                              <button onClick={() => openEditModal(p)}
                                className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                              {p.status === 'pending' && (
                                <button onClick={() => handleApprove(p.id)}
                                  className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg">Approve</button>
                              )}
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

      {/* BY MONTH TAB */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-semibold text-gray-900">Monthly Payroll Report</h2>
              <div className="flex items-center gap-3">
                <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Monthly Summary */}
            {monthlyPayrolls.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">{monthlyPayrolls.length}</p>
                  <p className="text-xs text-gray-500">Records</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-green-600">
                    PKR {monthlyPayrolls.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Total Payroll</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-yellow-600">
                    {monthlyPayrolls.filter(p => p.status === 'pending').length}
                  </p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            )}
          </div>

          {monthlyLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Employee', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status', canManage && 'Actions'].filter(Boolean).map(h => (
                      <th key={h as string} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlyPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <p className="text-3xl mb-3">📅</p>
                        <p className="text-gray-500 font-medium">No payroll for {MONTHS[selectedMonth - 1]} {selectedYear}</p>
                      </td>
                    </tr>
                  ) : (
                    monthlyPayrolls.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                              {p.employee?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{p.employee?.user?.name}</p>
                              <p className="text-xs text-gray-400">{p.employee?.employeeCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">PKR {p.basic.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-green-600">+{p.allowances.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-red-500">-{p.deductions.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">PKR {p.netSalary.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                            {p.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => openEditModal(p)}
                                className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                              {p.status === 'pending' && (
                                <button onClick={() => handleApprove(p.id)}
                                  className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg">Approve</button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROCESS TAB */}
      {activeTab === 'process' && canManage && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-1">Process Payroll</h2>
            <p className="text-sm text-gray-400 mb-5">Create individual or bulk payroll records for employees</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => { setShowCreateModal(true); setError(''); }}
                className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-blue-50"
              >
                <p className="text-3xl mb-2">👤</p>
                <p className="font-semibold text-gray-900">Single Employee</p>
                <p className="text-sm text-gray-400 mt-1">Process payroll for one employee with custom amounts</p>
              </div>
              <div
                onClick={() => { initBulkForms(); setShowBulkModal(true); }}
                className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-purple-50"
              >
                <p className="text-3xl mb-2">👥</p>
                <p className="font-semibold text-gray-900">Bulk Processing</p>
                <p className="text-sm text-gray-400 mt-1">Process payroll for all employees at once</p>
              </div>
            </div>
          </div>

          {/* Pending approvals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
              <p className="text-xs text-gray-400 mt-0.5">{payrolls.filter(p => p.status === 'pending').length} records awaiting approval</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Employee', 'Period', 'Net Salary', 'Action'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payrolls.filter(p => p.status === 'pending').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">No pending approvals</td>
                    </tr>
                  ) : (
                    payrolls.filter(p => p.status === 'pending').map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                              {p.employee?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">{p.employee?.user?.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">PKR {p.netSalary.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleApprove(p.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-1.5 rounded-lg font-medium">
                            ✓ Approve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-4 flex items-center gap-3">
              <div className="bg-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl">
                {selectedPayroll.employee?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedPayroll.employee?.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedPayroll.employee?.employeeCode}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Period</span>
                <span className="text-sm font-semibold text-gray-900">{MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Basic Salary</span>
                <span className="text-sm font-semibold text-gray-900">PKR {selectedPayroll.basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Allowances</span>
                <span className="text-sm font-semibold text-green-600">+PKR {selectedPayroll.allowances.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Deductions</span>
                <span className="text-sm font-semibold text-red-500">-PKR {selectedPayroll.deductions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-xl px-3 mt-2">
                <span className="text-sm font-bold text-gray-900">Net Salary</span>
                <span className="text-lg font-bold text-blue-600">PKR {selectedPayroll.netSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[selectedPayroll.status]}`}>
                  {selectedPayroll.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
              {canManage && (
                <>
                  <button onClick={() => { setShowDetailModal(false); openEditModal(selectedPayroll); }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium">Edit</button>
                  {selectedPayroll.status === 'pending' && (
                    <button onClick={() => handleApprove(selectedPayroll.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium">Approve</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Payroll</h3>
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={createForm.employeeId}
                  onChange={e => {
                    const emp = employees.find(em => em.id === e.target.value);
                    setCreateForm({ ...createForm, employeeId: e.target.value, basic: emp?.salary.toString() || '' });
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <select value={createForm.month} onChange={e => setCreateForm({ ...createForm, month: +e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <select value={createForm.year} onChange={e => setCreateForm({ ...createForm, year: +e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (PKR) *</label>
                <input type="number" value={createForm.basic} onChange={e => setCreateForm({ ...createForm, basic: e.target.value })}
                  placeholder="Auto-filled from employee salary"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                  <input type="number" value={createForm.allowances} onChange={e => setCreateForm({ ...createForm, allowances: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input type="number" value={createForm.deductions} onChange={e => setCreateForm({ ...createForm, deductions: e.target.value })}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              {createForm.basic && (
                <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Salary Preview</span>
                  <span className="font-bold text-blue-600">
                    PKR {netSalaryPreview(createForm.basic, createForm.allowances, createForm.deductions).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Create Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Payroll</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}

            <div className="bg-purple-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">{selectedPayroll.employee?.user?.name}</p>
              <p className="text-xs text-gray-500">{MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                <input type="number" value={editForm.basic} onChange={e => setEditForm({ ...editForm, basic: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                  <input type="number" value={editForm.allowances} onChange={e => setEditForm({ ...editForm, allowances: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input type="number" value={editForm.deductions} onChange={e => setEditForm({ ...editForm, deductions: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              {editForm.basic && (
                <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Salary Preview</span>
                  <span className="font-bold text-blue-600">
                    PKR {netSalaryPreview(editForm.basic, editForm.allowances, editForm.deductions).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk Payroll Processing</h3>
                <p className="text-xs text-gray-400 mt-0.5">Process payroll for all employees at once</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <select value={bulkMonth} onChange={e => setBulkMonth(+e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={bulkYear} onChange={e => setBulkYear(+e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Employee', 'Basic (PKR)', 'Allowances', 'Deductions', 'Net Preview'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {emp.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{emp.user.name}</p>
                            <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={bulkForms[emp.id]?.basic || ''}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], basic: e.target.value } }))}
                          className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={bulkForms[emp.id]?.allowances || ''}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], allowances: e.target.value } }))}
                          placeholder="0"
                          className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={bulkForms[emp.id]?.deductions || ''}
                          onChange={e => setBulkForms(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], deductions: e.target.value } }))}
                          placeholder="0"
                          className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-600 text-sm">
                          PKR {netSalaryPreview(bulkForms[emp.id]?.basic || '0', bulkForms[emp.id]?.allowances || '0', bulkForms[emp.id]?.deductions || '0').toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleBulkProcess} disabled={bulkLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {bulkLoading ? 'Processing...' : `⚡ Process ${employees.length} Payrolls`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
