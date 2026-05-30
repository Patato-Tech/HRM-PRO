'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/withAuth';
import { apiCall, getPlatformToken } from '@/lib/api';

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalEmployees: number;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  address: string;
  status: string;
  planId: string;
  createdAt: string;
  _count: { users: number; employees: number };
}

interface AnalyticsItem {
  id: string;
  name: string;
  industry: string;
  status: string;
  employees: number;
  users: number;
  leaves: number;
  payrolls: number;
  totalPayroll: number;
  attendanceRate: number;
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const PLANS = ['Starter', 'Professional', 'Enterprise'];

const roleColors: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  HR_MANAGER: 'bg-blue-100 text-blue-700',
  DEPT_MANAGER: 'bg-yellow-100 text-yellow-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'analytics' | 'transfer'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '', industry: '', address: '', planId: '',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [editForm, setEditForm] = useState({
    name: '', industry: '', address: '', planId: '', status: '',
  });
  const [transferForm, setTransferForm] = useState({
    employeeId: '', fromCompanyId: '', toCompanyId: '',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const token = getPlatformToken();
      const [statsData, companiesData, analyticsData] = await Promise.all([
        apiCall('/platform/stats', {}, token || ''),
        apiCall('/platform/companies', {}, token || ''),
        apiCall('/platform/analytics', {}, token || ''),
      ]);
      setStats(statsData);
      setCompanies(companiesData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    setError('');
    if (!createForm.name || !createForm.adminName || !createForm.adminEmail || !createForm.adminPassword) {
      setError('Please fill all required fields');
      return;
    }
    try {
      const token = getPlatformToken();
      await apiCall('/platform/companies', {
        method: 'POST',
        body: JSON.stringify(createForm),
      }, token || '');
      setShowCreateModal(false);
      setCreateForm({ name: '', industry: '', address: '', planId: '', adminName: '', adminEmail: '', adminPassword: '' });
      showSuccess('Company created successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditCompany = async () => {
    setError('');
    if (!selectedCompany) return;
    try {
      const token = getPlatformToken();
      await apiCall(`/platform/companies/${selectedCompany.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      }, token || '');
      setShowEditModal(false);
      showSuccess('Company updated successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const token = getPlatformToken();
      const newStatus = company.status === 'active' ? 'inactive' : 'active';
      await apiCall(`/platform/companies/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      }, token || '');
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ ...selectedCompany, status: newStatus });
      }
      showSuccess(`Company ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    try {
      const token = getPlatformToken();
      await apiCall(`/platform/companies/${selectedCompany.id}`, { method: 'DELETE' }, token || '');
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedCompany(null);
      showSuccess('Company deleted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewUsers = async (company: Company) => {
    setSelectedCompany(company);
    setShowUsersModal(true);
    setUsersLoading(true);
    try {
      const token = getPlatformToken();
      const data = await apiCall(`/platform/companies/${company.id}/users`, {}, token || '');
      setCompanyUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTransfer = async () => {
    setError('');
    if (!transferForm.employeeId || !transferForm.toCompanyId) {
      setError('Please fill all required fields');
      return;
    }
    try {
      const token = getPlatformToken();
      const data = await apiCall('/platform/transfer', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: transferForm.employeeId,
          toCompanyId: transferForm.toCompanyId,
        }),
      }, token || '');
      setTransferForm({ employeeId: '', fromCompanyId: '', toCompanyId: '' });
      showSuccess(data.message || 'Employee transferred successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setEditForm({
      name: company.name,
      industry: company.industry || '',
      address: company.address || '',
      planId: company.planId || '',
      status: company.status,
    });
    setShowEditModal(true);
    setError('');
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg">H</div>
          <div>
            <span className="font-bold text-gray-900">HRMPro Enterprise</span>
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Platform Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <button onClick={logout} className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors font-medium">
            Logout
          </button>
        </div>
      </nav>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Complete control over all companies, users and platform data</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'companies', label: '🏢 Companies' },
            { key: 'analytics', label: '📈 Analytics' },
            { key: 'transfer', label: '🔄 Transfer' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Companies', value: stats?.totalCompanies ?? 0, color: 'text-gray-900', bg: 'bg-blue-100', icon: '🏢' },
                { label: 'Active Companies', value: stats?.activeCompanies ?? 0, color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
                { label: 'Inactive Companies', value: stats?.inactiveCompanies ?? 0, color: 'text-red-500', bg: 'bg-red-100', icon: '🚫' },
                { label: 'Total Users', value: stats?.totalUsers ?? 0, color: 'text-purple-600', bg: 'bg-purple-100', icon: '👥' },
                { label: 'Total Employees', value: stats?.totalEmployees ?? 0, color: 'text-blue-600', bg: 'bg-indigo-100', icon: '👤' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    <div className={`${s.bg} w-9 h-9 rounded-lg flex items-center justify-center text-lg`}>{s.icon}</div>
                  </div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Admin Account Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">Platform Admin</span>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Admin Permissions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: '🏢', title: 'Create Companies', desc: 'Register new companies with admin accounts' },
                  { icon: '✏️', title: 'Edit Companies', desc: 'Update company details, plan, address' },
                  { icon: '🔄', title: 'Activate / Deactivate', desc: 'Control company access to the platform' },
                  { icon: '🗑️', title: 'Delete Companies', desc: 'Remove companies from the platform' },
                  { icon: '👥', title: 'View All Users', desc: 'See all users inside any company' },
                  { icon: '📊', title: 'Platform Analytics', desc: 'Cross-company stats and comparisons' },
                  { icon: '🔁', title: 'Transfer Employees', desc: 'Move employees between companies' },
                  { icon: '💳', title: 'Plan Management', desc: 'Set subscription plans per company' },
                  { icon: '🛡️', title: 'Full Platform Access', desc: 'Master control over entire platform' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Companies */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
                <button onClick={() => setActiveTab('companies')} className="text-sm text-blue-600 hover:underline">View all →</button>
              </div>
              {companies.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No companies yet</p>
              ) : (
                <div className="space-y-3">
                  {companies.slice(0, 5).map(company => (
                    <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{company.name}</p>
                          <p className="text-xs text-gray-400">{company.industry || 'No industry'} • {company._count.users} users • {company._count.employees} employees</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {company.status}
                        </span>
                        {company.planId && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{company.planId}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPANIES TAB ── */}
        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Companies</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{companies.length} companies registered</p>
                </div>
                <button
                  onClick={() => { setShowCreateModal(true); setError(''); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
                >
                  + New Company
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Search by name or industry..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Company', 'Industry', 'Plan', 'Users', 'Employees', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-gray-500 font-medium">No companies found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{company.name}</p>
                              <p className="text-xs text-gray-400 font-mono">{company.id.slice(0, 10)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '—'}</td>
                        <td className="px-6 py-4">
                          {company.planId
                            ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{company.planId}</span>
                            : <span className="text-xs text-gray-400">No plan</span>}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{company._count.users}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{company._count.employees}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {company.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }}
                              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                            <button onClick={() => handleViewUsers(company)}
                              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg">Users</button>
                            <button onClick={() => openEditModal(company)}
                              className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                            <button onClick={() => handleToggleStatus(company)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg ${company.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              {company.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => { setSelectedCompany(company); setShowDeleteModal(true); }}
                              className="text-xs bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 rounded-lg">Delete</button>
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

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Cross-Company Analytics</h2>
              <p className="text-sm text-gray-400 mb-6">Compare all companies side by side</p>

              {analytics.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No analytics data yet</p>
              ) : (
                <div className="space-y-4">
                  {/* Headcount Comparison */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">👥 Headcount by Company</h3>
                    <div className="space-y-3">
                      {analytics.map(item => {
                        const max = Math.max(...analytics.map(a => a.employees), 1);
                        const pct = Math.round((item.employees / max) * 100);
                        return (
                          <div key={item.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-gray-500">{item.employees} employees</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2.5">
                              <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">📅 Attendance Rate by Company</h3>
                    <div className="space-y-3">
                      {analytics.map(item => (
                        <div key={item.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className={`font-semibold ${item.attendanceRate >= 80 ? 'text-green-600' : item.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {item.attendanceRate}%
                            </span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full transition-all ${item.attendanceRate >= 80 ? 'bg-green-500' : item.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${item.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payroll Comparison */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">💰 Total Payroll by Company</h3>
                    <div className="space-y-3">
                      {analytics.map(item => {
                        const max = Math.max(...analytics.map(a => a.totalPayroll), 1);
                        const pct = Math.round((item.totalPayroll / max) * 100);
                        return (
                          <div key={item.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-gray-500">PKR {item.totalPayroll.toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2.5">
                              <div className="bg-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 rounded-xl">
                        <tr>
                          {['Company', 'Status', 'Employees', 'Users', 'Leaves', 'Payrolls', 'Attendance', 'Total Payroll'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analytics.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{item.employees}</td>
                            <td className="px-4 py-3 text-gray-700">{item.users}</td>
                            <td className="px-4 py-3 text-gray-700">{item.leaves}</td>
                            <td className="px-4 py-3 text-gray-700">{item.payrolls}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${item.attendanceRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                {item.attendanceRate}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">PKR {item.totalPayroll.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSFER TAB ── */}
        {activeTab === 'transfer' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Inter-Company Employee Transfer</h2>
              <p className="text-sm text-gray-400 mb-6">Move an employee from one company to another. You need the Employee ID and target company.</p>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 mb-4 text-sm">✅ {success}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    value={transferForm.employeeId}
                    onChange={e => setTransferForm({ ...transferForm, employeeId: e.target.value })}
                    placeholder="Paste employee UUID here"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-1">You can find Employee IDs in the company's employee list</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To Company *</label>
                  <select
                    value={transferForm.toCompanyId}
                    onChange={e => setTransferForm({ ...transferForm, toCompanyId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Select target company</option>
                    {companies.filter(c => c.status === 'active').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleTransfer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  🔄 Transfer Employee
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-3">How Transfer Works</h3>
              <div className="space-y-2">
                {[
                  'Employee and their user account are moved to the new company',
                  'Employee retains their designation, salary, and employment code',
                  'Previous company attendance and leave records stay in original company',
                  'Employee can log in normally — their companyId updates automatically',
                  'This action cannot be undone from UI — requires another transfer back',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {showDetailModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-500 font-semibold uppercase mb-1">Company Name</p>
                <p className="text-gray-900 font-bold text-xl">{selectedCompany.name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Company ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-mono text-xs flex-1 break-all">{selectedCompany.id}</p>
                  <button onClick={() => handleCopyId(selectedCompany.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                    {copied ? '✓ Copied!' : 'Copy ID'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Industry', value: selectedCompany.industry || '—' },
                  { label: 'Status', value: selectedCompany.status, badge: true },
                  { label: 'Plan', value: selectedCompany.planId || 'No plan' },
                  { label: 'Users', value: selectedCompany._count.users },
                  { label: 'Employees', value: selectedCompany._count.employees },
                  { label: 'Created', value: new Date(selectedCompany.createdAt).toLocaleDateString() },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    {item.badge ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedCompany.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.value}
                      </span>
                    ) : (
                      <p className="text-gray-900 font-semibold text-sm">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {selectedCompany.address && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-gray-900 text-sm">{selectedCompany.address}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Close</button>
              <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCompany); }} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium">Edit</button>
              <button onClick={() => handleToggleStatus(selectedCompany)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${selectedCompany.status === 'active' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                {selectedCompany.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS MODAL ── */}
      {showUsersModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedCompany.name} — Users</h3>
                <p className="text-xs text-gray-400 mt-0.5">{companyUsers.length} users in this company</p>
              </div>
              <button onClick={() => setShowUsersModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : companyUsers.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No users found</p>
            ) : (
              <div className="space-y-3">
                {companyUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowUsersModal(false)} className="w-full mt-5 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Close</button>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Company</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {[
                { label: 'Company Name *', key: 'name', type: 'text', placeholder: 'Acme Corp' },
                { label: 'Industry', key: 'industry', type: 'text', placeholder: 'Technology' },
                { label: 'Address', key: 'address', type: 'text', placeholder: '123 Main St' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(editForm as any)[field.key]}
                    onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select
                  value={editForm.planId}
                  onChange={e => setEditForm({ ...editForm, planId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">No Plan</option>
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditCompany} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Company?</h3>
            <p className="text-gray-500 text-sm mb-1">You are about to delete</p>
            <p className="font-bold text-gray-900 mb-2">"{selectedCompany.name}"</p>
            <p className="text-red-500 text-xs mb-6">This will deactivate the company and all users will lose access.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDeleteCompany} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-medium">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE COMPANY MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Company</h3>
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {[
                { label: 'Company Name *', key: 'name', type: 'text', placeholder: 'Acme Corp' },
                { label: 'Industry', key: 'industry', type: 'text', placeholder: 'Technology' },
                { label: 'Address', key: 'address', type: 'text', placeholder: '123 Main St' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type={field.type} value={(createForm as any)[field.key]}
                    onChange={e => setCreateForm({ ...createForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Plan</label>
                <select value={createForm.planId} onChange={e => setCreateForm({ ...createForm, planId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">No Plan</option>
                  {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-gray-800 mb-3">Company Admin Account</p>
                <div className="space-y-3">
                  {[
                    { label: 'Admin Name *', key: 'adminName', type: 'text', placeholder: 'John Doe' },
                    { label: 'Admin Email *', key: 'adminEmail', type: 'email', placeholder: 'admin@acme.com' },
                    { label: 'Admin Password *', key: 'adminPassword', type: 'password', placeholder: '••••••••' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input type={field.type} value={(createForm as any)[field.key]}
                        onChange={e => setCreateForm({ ...createForm, [field.key]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCreateModal(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateCompany} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Create Company</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
