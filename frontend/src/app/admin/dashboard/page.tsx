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
    <div className="min-h-screen" style={{background:"#f8fafc"}}>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .nav-item { transition: all 0.2s ease; }
        .nav-item:hover { background: rgba(255,255,255,0.1) !important; }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.1) !important; }
        .tab-btn { transition: all 0.2s ease; }
        .company-row { transition: all 0.15s ease; }
        .company-row:hover { background: #f8fafc !important; }
        .action-btn { transition: all 0.15s ease; }
        .action-btn:hover { transform: translateY(-1px); }
      `}</style>
      <nav style={{background:"linear-gradient(135deg,#0f172a,#1e293b)",borderBottom:"1px solid rgba(255,255,255,0.08)"}} className="px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">H</span>
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight">HRMPro Enterprise</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" style={{animation:"pulse 2s infinite"}} />
              <span className="text-xs text-slate-400 font-medium">Platform Administration</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
          <button onClick={logout} className="text-xs font-semibold px-4 py-2 rounded-xl transition-all" style={{background:"rgba(239,68,68,0.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.2)"}}>
            Logout
          </button>
        </div>
      </nav>

      {success && <div className="fixed top-20 right-6 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 text-sm font-semibold flex items-center gap-2" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 30px rgba(16,185,129,0.4)"}}>✅ {success}</div>}

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8 pt-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and monitor all registered companies</p>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'companies', label: '🏢 Companies' },
            { key: 'pending', label: `⏳ Pending${stats?.pendingCompanies ? ` (${stats.pendingCompanies})` : ''}` },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="tab-btn px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border"
              style={activeTab === tab.key ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 15px rgba(59,130,246,0.4)"} : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Companies', value: stats?.totalCompanies ?? 0, color: '#1e40af', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)', icon: '🏢', border: '#bfdbfe' },
                { label: 'Active', value: stats?.activeCompanies ?? 0, color: '#065f46', bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', icon: '✅', border: '#bbf7d0' },
                { label: 'Inactive', value: stats?.inactiveCompanies ?? 0, color: '#991b1b', bg: 'linear-gradient(135deg,#fef2f2,#fee2e2)', icon: '🚫', border: '#fecaca' },
                { label: 'Pending Approval', value: stats?.pendingCompanies ?? 0, color: '#92400e', bg: 'linear-gradient(135deg,#fffbeb,#fef3c7)', icon: '⏳', border: '#fde68a' },
              ].map((s, i) => (
                <div key={i} className="stat-card rounded-2xl p-6 border" style={{background:s.bg,borderColor:s.border,boxShadow:"0 2px 15px rgba(0,0,0,0.05)"}}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{color:s.color,opacity:0.7}}>{s.label}</p>
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <p className="text-4xl font-black" style={{color:s.color}}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 border border-blue-100 overflow-hidden relative" style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{background:"radial-gradient(circle,white,transparent)",transform:"translate(30%,-30%)"}} />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                  <span className="text-white">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-white text-lg">{user.name}</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{background:"rgba(59,130,246,0.2)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.3)"}}>Platform Admin</span>
                  </div>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full" style={{background:"rgba(16,185,129,0.15)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.2)"}}>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Active Session
                </div>
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🏢</div>
                  <p className="text-gray-600 font-semibold">No active companies yet</p>
                  <p className="text-gray-400 text-xs mt-1">Companies appear here after approval</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companies.slice(0, 5).map((company, i) => (
                    <div key={company.id} className="company-row flex items-center justify-between p-4 rounded-2xl cursor-pointer border border-transparent hover:border-blue-100" style={{background:"#f8fafc"}} onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{background:`linear-gradient(135deg,${['#1d4ed8','#7c3aed','#059669','#dc2626','#d97706'][i%5]},${['#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b'][i%5]})`}}>
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{company.name}</p>
                          <p className="text-xs text-gray-400">{company.industry || 'No industry'} · {new Date(company.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {company.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                        <span className="text-gray-300 text-xs">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">All Companies</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{companies.length} registered companies</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 w-64" />
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                    className="border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
                    {['Company', 'Industry', 'Plan', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCompanies.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center"><p className="text-4xl mb-3">🔍</p><p className="text-gray-500">No companies found</p></td></tr>
                  ) : filteredCompanies.map(company => (
                    <tr key={company.id} className="company-row border-b border-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">{company.name.charAt(0).toUpperCase()}</div>
                          <div><p className="font-semibold text-gray-900 text-sm">{company.name}</p><p className="text-xs text-gray-400 font-mono">{String(company.id).slice(0, 10)}...</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '—'}</td>
                      <td className="px-6 py-4">{company.planId ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{company.planId}</span> : <span className="text-xs text-gray-400">No plan</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1.5 rounded-full font-bold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {company.status === 'active' ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => { setSelectedCompany(company); setShowDetailModal(true); }} className="action-btn text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-xl">View</button>
                          <button onClick={() => openEditModal(company)} className="action-btn text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-xl">Edit</button>
                          <button onClick={() => { setSelectedCompany(company); setResetPassword(''); setResetConfirm(''); setError(''); setShowResetModal(true); }} className="action-btn text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl">Reset Pwd</button>
                          <button onClick={() => handleToggleStatus(company)} className={`action-btn text-xs font-semibold px-3 py-1.5 rounded-xl ${company.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {company.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>

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
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Pending Approvals</h2>
                <p className="text-xs text-gray-400 mt-0.5">{pendingCompanies.length} companies waiting for review</p>
              </div>
              {pendingCompanies.length > 0 && (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{background:"#fef3c7",color:"#92400e"}}>
                  ⏳ {pendingCompanies.length} Pending
                </span>
              )}
            </div>
            {pendingCompanies.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100" style={{boxShadow:"0 4px 30px rgba(0,0,0,0.05)"}}>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✅</div>
                <p className="text-gray-800 font-black text-lg">All clear!</p>
                <p className="text-gray-400 text-sm mt-1">No pending approvals at this time</p>
              </div>
            ) : pendingCompanies.map((company, i) => (
              <div key={company.id} className="bg-white rounded-3xl p-6 border border-yellow-100 overflow-hidden relative" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white flex-shrink-0" style={{background:`linear-gradient(135deg,${['#d97706','#7c3aed','#059669','#dc2626','#1d4ed8'][i%5]},${['#f59e0b','#8b5cf6','#10b981','#ef4444','#3b82f6'][i%5]})`}}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg">{company.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{company.industry || 'No industry'}{company.address ? ` · ${company.address}` : ''}</p>
                      <p className="text-xs text-gray-400 mt-1">Registered {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleApprove(company)} disabled={approveLoading === company.id}
                      className="font-bold text-white px-6 py-2.5 rounded-2xl text-sm transition-all disabled:opacity-50"
                      style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 15px rgba(16,185,129,0.3)"}}>
                      {approveLoading === company.id ? 'Approving...' : '✅ Approve'}
                    </button>
                    <button onClick={() => handleReject(company)} disabled={rejectLoading === company.id}
                      className="font-bold text-white px-6 py-2.5 rounded-2xl text-sm transition-all disabled:opacity-50"
                      style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 4px 15px rgba(239,68,68,0.3)"}}>
                      {rejectLoading === company.id ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-50 flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">⏳ Awaiting Approval</span>
                  <span className="text-xs text-gray-400">{company._count?.employees || 0} employees · {company._count?.users || 0} users</span>
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