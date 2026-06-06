'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/withAuth';
import { apiCall, getPlatformToken } from '@/lib/api';

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  pendingCompanies: number;
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

const PLANS = ['Starter', 'Professional', 'Enterprise'];

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'pending'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', industry: '', address: '', planId: '', status: '' });
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState<string | null>(null);

  useEffect(() => { if (user) fetchData(); }, [user]);

  // ✅ Auto-refresh every 30 seconds to catch new registrations
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    try {
      const token = getPlatformToken();
      const [statsData, companiesData, pendingData] = await Promise.all([
        apiCall('/platform/stats', {}, token || ''),
        apiCall('/platform/companies', {}, token || ''),
        apiCall('/platform/companies/pending', {}, token || ''),
      ]);
      setStats(statsData);
      setCompanies(companiesData);
      setPendingCompanies(pendingData);
    } catch (err) { console.error(err); }
    finally { setDataLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const handleApprove = async (company: Company) => {
    setApproveLoading(company.id);
    try {
      const token = getPlatformToken();
      const res = await apiCall(`/platform/companies/${company.id}/approve`, { method: 'PUT' }, token || '');
      setPendingCompanies(prev => prev.filter(c => c.id !== company.id));
      showSuccessMsg(res.message || `${company.name} approved!`);
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setApproveLoading(null); }
  };

  const handleReject = async (company: Company) => {
    setRejectLoading(company.id);
    try {
      const token = getPlatformToken();
      const res = await apiCall(`/platform/companies/${company.id}/reject`, { method: 'DELETE' }, token || '');
      setPendingCompanies(prev => prev.filter(c => c.id !== company.id));
      showSuccessMsg(res.message || `${company.name} rejected`);
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setRejectLoading(null); }
  };

  const handleEditCompany = async () => {
    setError('');
    if (!selectedCompany) return;
    try {
      const token = getPlatformToken();
      await apiCall(`/platform/companies/${selectedCompany.id}`, { method: 'PUT', body: JSON.stringify(editForm) }, token || '');
      setShowEditModal(false);
      showSuccessMsg('Company updated!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      const token = getPlatformToken();
      const newStatus = company.status === 'active' ? 'inactive' : 'active';
      await apiCall(`/platform/companies/${company.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) }, token || '');
      if (selectedCompany?.id === company.id) setSelectedCompany({ ...selectedCompany, status: newStatus });
      showSuccessMsg(`Company ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany || !deleteConfirmed) return;
    setDeleteLoading(true);
    const deletedId = selectedCompany.id;
    try {
      const token = getPlatformToken();
      await apiCall(`/platform/companies/${deletedId}`, { method: 'DELETE' }, token || '');
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedCompany(null);
      setDeleteConfirmed(false);
      setCompanies(prev => prev.filter(c => c.id !== deletedId));
      showSuccessMsg('Company permanently deleted!');
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setDeleteLoading(false); }
  };

  const handleResetPassword = async () => {
    setError('');
    if (!selectedCompany) return;
    if (!resetPassword || resetPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (resetPassword !== resetConfirm) { setError('Passwords do not match'); return; }
    setResetLoading(true);
    try {
      const token = getPlatformToken();
      const res = await apiCall(`/platform/companies/${selectedCompany.id}/reset-password`, { method: 'PUT', body: JSON.stringify({ newPassword: resetPassword }) }, token || '');
      setShowResetModal(false);
      setResetPassword(''); setResetConfirm('');
      showSuccessMsg(res.message || 'Password reset!');
    } catch (err: any) { setError(err.message); }
    finally { setResetLoading(false); }
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setEditForm({ name: company.name, industry: company.industry || '', address: company.address || '', planId: company.planId || '', status: company.status });
    setShowEditModal(true); setError('');
  };

  const handleCopyId = (id: string) => { navigator.clipboard.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || dataLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-500 text-sm">Loading...</p></div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg">H</div>
          <div><span className="font-bold text-gray-900">HRMPro Enterprise</span><span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Platform Admin</span></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block"><p className="text-sm font-semibold text-gray-900">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
          <button onClick={logout} className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-medium">Logout</button>
        </div>
      </nav>

      {success && <div className="fixed top-20 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1><p className="text-gray-500 text-sm mt-1">Manage all registered companies</p></div>

        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'companies', label: '🏢 Companies' },
            { key: 'pending', label: `⏳ Pending${stats?.pendingCompanies ? ` (${stats.pendingCompanies})` : ''}` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Companies', value: stats?.totalCompanies ?? 0, color: 'text-gray-900', bg: 'bg-blue-50', icon: '🏢' },
                { label: 'Active', value: stats?.activeCompanies ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
                { label: 'Inactive', value: stats?.inactiveCompanies ?? 0, color: 'text-red-500', bg: 'bg-red-50', icon: '🚫' },
                { label: 'Pending Approval', value: stats?.pendingCompanies ?? 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3"><p className="text-sm text-gray-500 font-medium">{s.label}</p><div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>{s.icon}</div></div>
                  <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Your Account</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Name</p><p className="font-semibold text-gray-900">{user.name}</p></div>
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-semibold text-gray-900">{user.email}</p></div>
                <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">Role</p><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">Platform Admin</span></div>
              </div>
            </div>

            {pendingCompanies.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-yellow-900">⏳ Pending Approvals ({pendingCompanies.length})</h2>
                  <button onClick={() => setActiveTab('pending')} className="text-sm text-yellow-700 hover:underline">Review all →</button>
                </div>
                <div className="space-y-2">
                  {pendingCompanies.slice(0, 3).map(company => (
                    <div key={company.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                      <div><p className="font-semibold text-gray-900 text-sm">{company.name}</p><p className="text-xs text-gray-400">{company.industry || 'No industry'} · {new Date(company.createdAt).toLocaleDateString()}</p></div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(company)} disabled={approveLoading === company.id}
                          className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium">
                          {approveLoading === company.id ? '...' : 'Approve'}
                        </button>
                        <button onClick={() => handleReject(company)} disabled={rejectLoading === company.id}
                          className="text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium">
                          {rejectLoading === company.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Recent Companies</h2>
                <button onClick={() => setActiveTab('companies')} className="text-sm text-blue-600 hover:underline">View all →</button>
              </div>
              {companies.length === 0 ? (
                <div className="text-center py-10"><p className="text-4xl mb-3">🏢</p><p className="text-gray-500 font-medium">No active companies yet</p><p className="text-gray-400 text-xs mt-1">Companies appear here after approval</p></div>
              ) : (
                <div className="space-y-3">
                  {companies.slice(0, 5).map(company => (
                    <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer" onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm">{company.name.charAt(0).toUpperCase()}</div>
                        <div><p className="font-semibold text-gray-900 text-sm">{company.name}</p><p className="text-xs text-gray-400">{company.industry || 'No industry'} · {new Date(company.createdAt).toLocaleDateString()}</p></div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{company.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div><h2 className="text-lg font-semibold text-gray-900">All Companies</h2><p className="text-xs text-gray-400 mt-0.5">{companies.length} companies</p></div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Company', 'Industry', 'Plan', 'Status', 'Created', 'Actions'].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCompanies.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center"><p className="text-4xl mb-3">🔍</p><p className="text-gray-500">No companies found</p></td></tr>
                  ) : filteredCompanies.map(company => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">{company.name.charAt(0).toUpperCase()}</div>
                          <div><p className="font-semibold text-gray-900 text-sm">{company.name}</p><p className="text-xs text-gray-400 font-mono">{company.id.slice(0, 10)}...</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '—'}</td>
                      <td className="px-6 py-4">{company.planId ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{company.planId}</span> : <span className="text-xs text-gray-400">No plan</span>}</td>
                      <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{company.status}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                          <button onClick={() => openEditModal(company)} className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                          <button onClick={() => { setSelectedCompany(company); setResetPassword(''); setResetConfirm(''); setError(''); setShowResetModal(true); }} className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg">Reset Pwd</button>
                          <button onClick={() => handleToggleStatus(company)} className={`text-xs px-2.5 py-1.5 rounded-lg ${company.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {company.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => { setSelectedCompany(company); setDeleteConfirmed(false); setError(''); setShowDeleteModal(true); }} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div><h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2><p className="text-xs text-gray-400 mt-0.5">{pendingCompanies.length} companies waiting</p></div>
            {pendingCompanies.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
                <p className="text-5xl mb-4">✅</p><p className="text-gray-700 font-semibold">No pending approvals</p><p className="text-gray-400 text-sm mt-1">All registrations have been processed</p>
              </div>
            ) : pendingCompanies.map(company => (
              <div key={company.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-100 text-yellow-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg">{company.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.industry || 'No industry'}{company.address ? ` · ${company.address}` : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Registered {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(company)} disabled={approveLoading === company.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium">
                      {approveLoading === company.id ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button onClick={() => handleReject(company)} disabled={rejectLoading === company.id}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium">
                      {rejectLoading === company.id ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-semibold">⏳ Pending Approval</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-gray-900">Company Details</h3><button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-blue-500 font-semibold uppercase mb-1">Company Name</p><p className="text-gray-900 font-bold text-xl">{selectedCompany.name}</p></div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Company ID</p>
                <div className="flex items-center gap-2"><p className="text-gray-900 font-mono text-xs flex-1 break-all">{selectedCompany.id}</p><button onClick={() => handleCopyId(selectedCompany.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">{copied ? '✓ Copied!' : 'Copy ID'}</button></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Industry', value: selectedCompany.industry || '—' }, { label: 'Status', value: selectedCompany.status, badge: true }, { label: 'Plan', value: selectedCompany.planId || 'No plan' }, { label: 'Created', value: new Date(selectedCompany.createdAt).toLocaleDateString() }].map((item: any, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1">{item.label}</p>
                    {item.badge ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedCompany.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.value}</span> : <p className="text-gray-900 font-semibold text-sm">{item.value}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5 flex-wrap">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
              <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCompany); }} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium">Edit</button>
              <button onClick={() => { setResetPassword(''); setResetConfirm(''); setError(''); setShowResetModal(true); }} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium">Reset Pwd</button>
              <button onClick={() => handleToggleStatus(selectedCompany)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${selectedCompany.status === 'active' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
                {selectedCompany.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Reset Company Admin Password</h3><button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            <div className="bg-indigo-50 rounded-xl p-3 mb-4"><p className="font-semibold text-gray-900 text-sm">{selectedCompany.name}</p><p className="text-xs text-gray-500 mt-0.5">Company Admin password will be changed</p></div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label><input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="At least 6 characters" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label><input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} placeholder="Re-enter password" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowResetModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleResetPassword} disabled={resetLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">{resetLoading ? 'Resetting...' : 'Reset Password'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-red-600">⚠️ Permanently Delete</h3><button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"><p className="text-red-700 text-sm font-semibold mb-1">This cannot be undone.</p><p className="text-red-600 text-xs">All data for <strong>{selectedCompany.name}</strong> will be deleted.</p></div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <label className="flex items-center gap-3 mb-5 cursor-pointer"><input type="checkbox" checked={deleteConfirmed} onChange={e => setDeleteConfirmed(e.target.checked)} className="w-4 h-4 accent-red-600" /><span className="text-sm text-gray-700">I understand this permanently deletes <strong>{selectedCompany.name}</strong></span></label>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmed(false); setError(''); }} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDeleteCompany} disabled={deleteLoading || !deleteConfirmed} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium">{deleteLoading ? 'Deleting...' : 'Permanently Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Edit Company</h3><button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button></div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              {[{ label: 'Company Name *', key: 'name', type: 'text' }, { label: 'Industry', key: 'industry', type: 'text' }, { label: 'Address', key: 'address', type: 'text' }].map(field => (
                <div key={field.key}><label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label><input type={field.type} value={(editForm as any)[field.key]} onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>
              ))}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><select value={editForm.planId} onChange={e => setEditForm({ ...editForm, planId: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="">No Plan</option>{PLANS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleEditCompany} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
