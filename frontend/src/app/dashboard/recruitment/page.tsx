'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Department {
  id: string;
  name: string;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  interviewDate: string | null;
  notes: string;
  createdAt: string;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string;
  salaryMin: number | null;
  salaryMax: number | null;
  status: string;
  department?: { name: string } | null;
  createdBy: { name: string };
  applicants: Applicant[];
  createdAt: string;
}

const APPLICANT_STATUSES = ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-blue-100 text-blue-700',
  interview: 'bg-yellow-100 text-yellow-700',
  offered: 'bg-purple-100 text-purple-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function RecruitmentPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showViewJobModal, setShowViewJobModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const [jobForm, setJobForm] = useState({
    title: '', departmentId: '', description: '', requirements: '', salaryMin: '', salaryMax: '',
  });

  const [applicantForm, setApplicantForm] = useState({
    name: '', email: '', phone: '', notes: '', jobId: '',
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'recruitment', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [jobsData, deptsData] = await Promise.all([
        apiCall('/recruitment/jobs', {}, token),
        apiCall('/departments', {}, token),
      ]);
      const isOwnDeptRec = user?.customRoleScope === "own_department" && user?.departmentId;
      setJobs(isOwnDeptRec ? (jobsData || []).filter((j) => String(j.departmentId) === String(user.departmentId)) : (jobsData || []));
      setDepartments(deptsData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAddJob = async () => {
    setError('');
    if (!jobForm.title) { setError('Job title is required'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/recruitment/jobs', { method: 'POST', body: JSON.stringify(jobForm) }, token);
      setShowJobModal(false);
      setJobForm({ title: '', departmentId: '', description: '', requirements: '', salaryMin: '', salaryMax: '' });
      showSuccessMsg('Job posting created!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateJobStatus = async (id: string, status: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/recruitment/jobs/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }, token);
      showSuccessMsg(`Job ${status}!`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Delete this job posting and all applicants?')) return;
    try {
      const token = getToken() || '';
      await apiCall(`/recruitment/jobs/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Job posting deleted!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAddApplicant = async () => {
    setError('');
    if (!applicantForm.name || !applicantForm.email || !applicantForm.jobId) {
      setError('Name, email and job are required');
      return;
    }
    try {
      const token = getToken() || '';
      await apiCall('/recruitment/applicants', { method: 'POST', body: JSON.stringify(applicantForm) }, token);
      setShowApplicantModal(false);
      setApplicantForm({ name: '', email: '', phone: '', notes: '', jobId: '' });
      showSuccessMsg('Applicant added!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateApplicant = async (id: string, status: string, interviewDate?: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/recruitment/applicants/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, interviewDate }),
      }, token);
      showSuccessMsg('Applicant status updated!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteApplicant = async (id: string) => {
    if (!confirm('Delete this applicant?')) return;
    try {
      const token = getToken() || '';
      await apiCall(`/recruitment/applicants/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Applicant deleted!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const allApplicants = jobs.flatMap(j => j.applicants.map(a => ({ ...a, jobTitle: j.title, jobId: j.id })));

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>✅ {success}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Recruitment</h1>
          <p className="text-gray-400 text-sm mt-0.5">{jobs.filter(j => j.status === "open").length} open positions</p>
        </div>
        {(isCompanyAdmin(user?.role || "") || hasPermission(user, "recruitment", "manage")) && (
          <div className="flex gap-2">
            <button onClick={() => { setShowApplicantModal(true); setError(""); }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-all">
              + Add Applicant
            </button>
            <button onClick={() => { setShowJobModal(true); setError(""); }}
              className="text-white px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
              + Post Job
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Positions', value: jobs.filter(j => j.status === 'open').length, bg: 'bg-green-50', color: 'text-green-600' },
          { label: 'Total Applicants', value: allApplicants.length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Interviews', value: allApplicants.filter(a => a.status === 'interview').length, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Hired', value: allApplicants.filter(a => a.status === 'hired').length, bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 relative overflow-hidden"
            style={{background:["linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#1d4ed8,#3b82f6)","linear-gradient(135deg,#d97706,#f59e0b)","linear-gradient(135deg,#7c3aed,#8b5cf6)"][i],boxShadow:"0 4px 15px rgba(0,0,0,0.15)"}}>
            <div className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10" style={{background:"white",transform:"translate(30%,-30%)"}} />
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.75)"}}>{s.label}</p>
            <p className="text-3xl font-black text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {([{ key: "jobs", label: "💼 Job Postings" }, { key: "applicants", label: "👥 All Applicants" }] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
            style={activeTab === tab.key
              ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}
              : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Search jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">💼</p>
              <p className="text-gray-500 font-medium">No job postings found</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl p-5 border border-gray-100 transition-all hover:-translate-y-0.5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {job.status}
                    </span>
                    {job.department && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{job.department.name}</span>}
                  </div>
                  {job.description && <p className="text-sm text-gray-500 mb-2">{job.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {(job.salaryMin || job.salaryMax) && (
                      <span>💰 PKR {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}</span>
                    )}
                    <span>👥 {job.applicants.length} applicants</span>
                    <span>📅 {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => { setSelectedJob(job); setShowViewJobModal(true); }}
                    className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                    View Applicants ({job.applicants.length})
                  </button>
                  {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'recruitment', 'manage')) && (
                    <>
                      <button onClick={() => handleUpdateJobStatus(job.id, job.status === 'open' ? 'closed' : 'open')}
                        className={`text-xs px-3 py-1.5 rounded-lg ${job.status === 'open' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {job.status === 'open' ? 'Close' : 'Reopen'}
                      </button>



                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'applicants' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Applicant', 'Job', 'Phone', 'Status', 'Interview Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allApplicants.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center">
                    <p className="text-3xl mb-3">👥</p>
                    <p className="text-gray-500">No applicants yet</p>
                  </td></tr>
                ) : allApplicants.map((applicant: any) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 text-sm">{applicant.name}</p>
                      <p className="text-xs text-gray-400">{applicant.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(applicant as any).jobTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{applicant.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <select value={applicant.status}
                        onChange={e => handleUpdateApplicant(applicant.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${STATUS_COLORS[applicant.status]}`}>
                        {APPLICANT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {applicant.interviewDate ? new Date(applicant.interviewDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Post New Job</h3>
              <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input type="text" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Senior Developer" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={jobForm.departmentId} onChange={e => setJobForm({ ...jobForm, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">No Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Job description..." rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })}
                  placeholder="Job requirements..." rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (PKR)</label>
                  <input type="number" value={jobForm.salaryMin} onChange={e => setJobForm({ ...jobForm, salaryMin: e.target.value })}
                    placeholder="e.g. 50000" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (PKR)</label>
                  <input type="number" value={jobForm.salaryMax} onChange={e => setJobForm({ ...jobForm, salaryMax: e.target.value })}
                    placeholder="e.g. 100000" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowJobModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAddJob} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>Post Job</button>
            </div>
          </div>
        </div>
      )}

      {showApplicantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Applicant</h3>
              <button onClick={() => setShowApplicantModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position *</label>
                <select value={applicantForm.jobId} onChange={e => setApplicantForm({ ...applicantForm, jobId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                  <option value="">Select job</option>
                  {jobs.filter(j => j.status === 'open').map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={applicantForm.name} onChange={e => setApplicantForm({ ...applicantForm, name: e.target.value })}
                  placeholder="Enter full name" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={applicantForm.email} onChange={e => setApplicantForm({ ...applicantForm, email: e.target.value })}
                  placeholder="Enter email address" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={applicantForm.phone} onChange={e => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                  placeholder="+92 300 0000000" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={applicantForm.notes} onChange={e => setApplicantForm({ ...applicantForm, notes: e.target.value })}
                  placeholder="Additional notes..." rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowApplicantModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAddApplicant} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>Add Applicant</button>
            </div>
          </div>
        </div>
      )}

      {showViewJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedJob.title} — Applicants</h3>
              <button onClick={() => setShowViewJobModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {selectedJob.applicants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-gray-500">No applicants yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedJob.applicants.map(applicant => (
                  <div key={applicant.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{applicant.name}</p>
                        <p className="text-sm text-gray-500">{applicant.email}</p>
                        {applicant.phone && <p className="text-xs text-gray-400">{applicant.phone}</p>}
                        {applicant.notes && <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">{applicant.notes}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <select value={applicant.status}
                          onChange={e => handleUpdateApplicant(applicant.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer ${STATUS_COLORS[applicant.status]}`}>
                          {APPLICANT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                        {applicant.status === 'interview' && (
                          <input type="datetime-local"
                            defaultValue={applicant.interviewDate ? new Date(applicant.interviewDate).toISOString().slice(0, 16) : ''}
                            onChange={e => handleUpdateApplicant(applicant.id, applicant.status, e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-900" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowViewJobModal(false)} className="w-full mt-4 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

