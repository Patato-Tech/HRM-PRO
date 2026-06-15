'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  department?: { name: string } | null;
  user: { name: string; email: string };
}

interface Review {
  id: string;
  period: string;
  reviewDate: string;
  kpis: { title: string; rating: number; comment: string }[];
  overallRating: number;
  comments: string;
  status: string;
  employee: {
    id: string;
    employeeCode: string;
    department?: { name: string } | null;
    user: { name: string; email: string };
  };
  reviewer: { name: string };
}

const PERIODS = ['monthly', 'quarterly', 'annual'];
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  acknowledged: 'bg-green-100 text-green-700',
};

const RATING_COLORS = (r: number) => {
  if (r >= 4.5) return 'text-green-600';
  if (r >= 3.5) return 'text-blue-600';
  if (r >= 2.5) return 'text-yellow-600';
  return 'text-red-500';
};

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const [form, setForm] = useState({
    employeeId: '',
    departmentId: '',
    period: 'monthly',
    reviewDate: new Date().toISOString().split('T')[0],
    comments: '',
    kpis: [{ title: '', rating: 5, comment: '' }],
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'performance', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [reviewsData, empsData, deptsData] = await Promise.all([
        apiCall('/performance', {}, token),
        apiCall('/employees', {}, token),
        apiCall('/departments', {}, token),
      ]);
      setReviews(reviewsData || []);
      setEmployees(empsData || []);
      setDepartments(deptsData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAdd = async () => {
    setError('');
    if (!form.employeeId || !form.reviewDate || form.kpis.some(k => !k.title)) {
      setError('Please fill all required fields and KPI titles');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/performance', {
        method: 'POST',
        body: JSON.stringify(form),
      }, token);
      setShowAddModal(false);
      setForm({ employeeId: '', departmentId: '', period: 'monthly', reviewDate: new Date().toISOString().split('T')[0], comments: '', kpis: [{ title: '', rating: 5, comment: '' }] });
      showSuccessMsg('Performance review added!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/performance/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      showSuccessMsg('Status updated!');
      fetchData();
      setShowViewModal(false);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      const token = getToken() || '';
      await apiCall(`/performance/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Review deleted!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const addKpi = () => setForm(prev => ({ ...prev, kpis: [...prev.kpis, { title: '', rating: 5, comment: '' }] }));
  const removeKpi = (i: number) => setForm(prev => ({ ...prev, kpis: prev.kpis.filter((_, idx) => idx !== i) }));
  const updateKpi = (i: number, field: string, value: any) => {
    setForm(prev => ({ ...prev, kpis: prev.kpis.map((k, idx) => idx === i ? { ...k, [field]: value } : k) }));
  };

  const filtered = reviews.filter(r => {
    const matchSearch = r.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPeriod = periodFilter === 'all' || r.period === periodFilter;
    const matchDept = deptFilter === 'all' || r.employee?.department?.name === deptFilter;
    return matchSearch && matchPeriod && matchDept;
  });

  const getRatingLabel = (r: number) => {
    if (r >= 4.5) return 'Excellent';
    if (r >= 3.5) return 'Good';
    if (r >= 2.5) return 'Average';
    return 'Poor';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">{reviews.length} total reviews</p>
        </div>
        {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'performance', 'manage')) && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + New Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: reviews.length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Draft', value: reviews.filter(r => r.status === 'draft').length, bg: 'bg-gray-50', color: 'text-gray-600' },
          { label: 'Submitted', value: reviews.filter(r => r.status === 'submitted').length, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Acknowledged', value: reviews.filter(r => r.status === 'acknowledged').length, bg: 'bg-green-50', color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search by employee name..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option value="all">All Periods</option>
              {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Employee', 'Department', 'Period', 'Review Date', 'Overall Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-3xl mb-3">📊</p>
                  <p className="text-gray-500 font-medium">No performance reviews found</p>
                </td></tr>
              ) : filtered.map(review => (
                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                        {review.employee?.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.employee?.user?.name}</p>
                        <p className="text-xs text-gray-400">{review.employee?.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {review.employee?.department?.name ? (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{review.employee.department.name}</span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{review.period}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(review.reviewDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${RATING_COLORS(review.overallRating)}`}>
                        {review.overallRating.toFixed(1)}
                      </span>
                      <span className={`text-xs font-semibold ${RATING_COLORS(review.overallRating)}`}>
                        {getRatingLabel(review.overallRating)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[review.status] || 'bg-gray-100 text-gray-600'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setSelectedReview(review); setShowViewModal(true); }}
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">View</button>
                      {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'performance', 'manage')) && (
                        <button onClick={() => handleDelete(review.id)}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Performance Review</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department (filter)</label>
                  <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value, employeeId: '' })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    <option value="">Select employee</option>
                    {employees.filter((emp: any) => !form.departmentId || String(emp.departmentId) === String(form.departmentId)).map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                  <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date *</label>
                  <input type="date" value={form.reviewDate} onChange={e => setForm({ ...form, reviewDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">KPIs *</label>
                  <button onClick={addKpi} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">+ Add KPI</button>
                </div>
                <div className="space-y-3">
                  {form.kpis.map((kpi, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="col-span-2">
                          <input type="text" placeholder="KPI Title *" value={kpi.title}
                            onChange={e => updateKpi(i, 'title', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                        </div>
                        <div className="flex items-center gap-2">
                          <select value={kpi.rating} onChange={e => updateKpi(i, 'rating', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                            {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                          </select>
                          {form.kpis.length > 1 && (
                            <button onClick={() => removeKpi(i)} className="text-red-500 hover:text-red-700 text-lg">✕</button>
                          )}
                        </div>
                      </div>
                      <input type="text" placeholder="Comment (optional)" value={kpi.comment}
                        onChange={e => updateKpi(i, 'comment', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comments</label>
                <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}
                  placeholder="General feedback and comments..." rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Review</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <p className="font-bold text-gray-900">{selectedReview.employee?.user?.name}</p>
              <p className="text-sm text-gray-500">{selectedReview.employee?.department?.name || 'No Department'}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{selectedReview.period}</span>
                <span className="text-xs text-gray-500">{new Date(selectedReview.reviewDate).toLocaleDateString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[selectedReview.status]}`}>{selectedReview.status}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900 text-sm">Overall Rating</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${RATING_COLORS(selectedReview.overallRating)}`}>{selectedReview.overallRating.toFixed(1)}</span>
                  <span className={`text-sm font-semibold ${RATING_COLORS(selectedReview.overallRating)}`}>{getRatingLabel(selectedReview.overallRating)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {(selectedReview.kpis as any[]).map((kpi, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{kpi.title}</p>
                      <span className="text-sm font-bold text-blue-600">{kpi.rating} ⭐</span>
                    </div>
                    {kpi.comment && <p className="text-xs text-gray-500 mt-1">{kpi.comment}</p>}
                  </div>
                ))}
              </div>
            </div>

            {selectedReview.comments && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Comments</p>
                <p className="text-sm text-gray-900">{selectedReview.comments}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-4">Reviewed by: {selectedReview.reviewer?.name}</p>

            {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'performance', 'manage')) && (
              <div className="flex gap-2">
                {selectedReview.status === 'draft' && (
                  <button onClick={() => handleUpdateStatus(selectedReview.id, 'submitted')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium">
                    Submit
                  </button>
                )}
                {selectedReview.status === 'submitted' && (
                  <button onClick={() => handleUpdateStatus(selectedReview.id, 'acknowledged')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium">
                    Acknowledge
                  </button>
                )}
                <button onClick={() => setShowViewModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-sm">
                  Close
                </button>
              </div>
            )}
            {!isCompanyAdmin(user?.role || '') && (
              <button onClick={() => setShowViewModal(false)}
                className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
