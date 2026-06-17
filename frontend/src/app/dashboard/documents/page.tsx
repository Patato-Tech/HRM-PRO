'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface Employee {
  id: string;
  employeeCode: string;
  departmentId?: string | null;
  department?: { name: string } | null;
  user: { name: string };
}

interface Department { id: string; name: string; }

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
  employee: {
    id: string;
    employeeCode: string;
    department?: { name: string } | null;
    user: { name: string };
  };
  uploadedBy: { name: string };
}

const DOC_TYPES = ['CNIC', 'Degree', 'Contract', 'Experience Letter', 'Offer Letter', 'NDA', 'Other'];

const TYPE_COLORS: Record<string, string> = {
  CNIC: 'bg-blue-100 text-blue-700',
  Degree: 'bg-purple-100 text-purple-700',
  Contract: 'bg-green-100 text-green-700',
  'Experience Letter': 'bg-yellow-100 text-yellow-700',
  'Offer Letter': 'bg-orange-100 text-orange-700',
  NDA: 'bg-red-100 text-red-700',
  Other: 'bg-gray-100 text-gray-600',
};

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const [form, setForm] = useState({
    employeeId: '', departmentId: '', type: 'CNIC',
    name: '', url: '', expiryDate: '', notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'COMPANY_ADMIN' && !hasPermission(user, 'documents', 'view')) {
      router.replace('/dashboard');
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [docsData, empsData, deptsData] = await Promise.all([
        apiCall('/documents', {}, token),
        apiCall('/employees', {}, token),
        apiCall('/departments', {}, token),
      ]);
      setDocuments(docsData || []);
      setEmployees(empsData || []);
      setDepartments(deptsData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleAdd = async () => {
    setError('');
    if (!form.employeeId || !form.name) { setError('Employee and document name are required'); return; }
    if (uploadMode === 'file' && !selectedFile) { setError('Please select a file'); return; }
    if (uploadMode === 'url' && !form.url) { setError('Please enter a URL'); return; }
    try {
      const token = getToken() || '';
      if (uploadMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('employeeId', form.employeeId);
        formData.append('type', form.type);
        formData.append('name', form.name);
        formData.append('expiryDate', form.expiryDate);
        formData.append('notes', form.notes);
        const response = await fetch('http://localhost:5001/documents', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
      } else {
        await apiCall('/documents', { method: 'POST', body: JSON.stringify(form) }, token);
      }
      setShowAddModal(false);
      setForm({ employeeId: '', departmentId: '', type: 'CNIC', name: '', url: '', expiryDate: '', notes: '' });
      setSelectedFile(null);
      setUploadMode('file');
      showSuccessMsg('Document added!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      const token = getToken() || '';
      await apiCall(`/documents/${id}`, { method: 'DELETE' }, token);
      showSuccessMsg('Document deleted!');
      fetchData();
      setShowViewModal(false);
    } catch (err) { console.error(err); }
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchDept = deptFilter === 'all' || d.employee?.department?.name === deptFilter;
    return matchSearch && matchType && matchDept;
  });

  const expiringCount = documents.filter(d => isExpiringSoon(d.expiryDate)).length;
  const expiredCount = documents.filter(d => isExpired(d.expiryDate)).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-1">{documents.length} total documents</p>
        </div>
        {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'documents', 'upload')) && (
          <button onClick={() => { setShowAddModal(true); setError(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
            + Add Document
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: documents.length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Expiring Soon', value: expiringCount, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Expired', value: expiredCount, bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Active', value: documents.length - expiredCount, bg: 'bg-green-50', color: 'text-green-600' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {expiringCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-700 text-sm font-medium">⚠️ {expiringCount} document(s) expiring within 30 days</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Search by employee or document name..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              <option value="all">All Types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                {['Employee', 'Department', 'Document', 'Type', 'Expiry', 'Uploaded By', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-3xl mb-3">📄</p>
                  <p className="text-gray-500 font-medium">No documents found</p>
                </td></tr>
              ) : filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                        {doc.employee?.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{doc.employee?.user?.name}</p>
                        <p className="text-xs text-gray-400">{doc.employee?.employeeCode}</p>
                      </div>
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{(doc.employee as any)?.customRole?.name || "Employee"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {doc.employee?.department?.name ? (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{doc.employee.department.name}</span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    {doc.notes && <p className="text-xs text-gray-400 truncate max-w-[150px]">{doc.notes}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-600'}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {doc.expiryDate ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isExpired(doc.expiryDate) ? 'bg-red-100 text-red-600' : isExpiringSoon(doc.expiryDate) ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {new Date(doc.expiryDate).toLocaleDateString()}
                        {isExpired(doc.expiryDate) ? ' ⚠️ Expired' : isExpiringSoon(doc.expiryDate) ? ' ⚠️ Soon' : ''}
                      </span>
                    ) : <span className="text-xs text-gray-400">No expiry</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.uploadedBy?.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">
                        Open
                      </a>
                      <a href={doc.url} download={doc.name}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg">
                        ⬇️ Download
                      </a>
                      <button onClick={() => { setSelectedDoc(doc); setShowViewModal(true); }}
                        className="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg">
                        Details
                      </button>
                      {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'documents', 'upload')) && (
                        <button onClick={() => handleDelete(doc.id)}
                          className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg">
                          Delete
                        </button>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Document</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. National ID Card" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                </div>
              </div>
              <div>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setUploadMode("file")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadMode === "file" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    Upload File
                  </button>
                  <button type="button" onClick={() => setUploadMode("url")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${uploadMode === "url" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    URL Link
                  </button>
                </div>
                {uploadMode === "file" ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                    <input type="file" id="docFile" onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden" />
                    <label htmlFor="docFile" className="cursor-pointer">
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-semibold text-blue-600">{selectedFile.name}</p>
                          <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl mb-1">📄</p>
                          <p className="text-sm text-gray-600">Click to select file</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, JPG, PNG (max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <div>
                    <input type="url" value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })}
                      placeholder="https://drive.google.com/..." className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
                    <p className="text-xs text-gray-400 mt-1">Google Drive, Dropbox, or any public link</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..." rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">Add Document</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-bold text-gray-900">{selectedDoc.employee?.user?.name}</p>
                <p className="text-sm text-gray-500">{selectedDoc.employee?.department?.name || 'No Department'}</p>
              </div>
              {[
                { label: 'Document Name', value: selectedDoc.name },
                { label: 'Type', value: selectedDoc.type },
                { label: 'Uploaded By', value: selectedDoc.uploadedBy?.name },
                { label: 'Upload Date', value: new Date(selectedDoc.createdAt).toLocaleDateString() },
                { label: 'Expiry Date', value: selectedDoc.expiryDate ? new Date(selectedDoc.expiryDate).toLocaleDateString() : 'No expiry' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
              {selectedDoc.notes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{selectedDoc.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium text-center">
                Open Document
              </a>
              {(isCompanyAdmin(user?.role || '') || hasPermission(user, 'documents', 'upload')) && (
                <button onClick={() => handleDelete(selectedDoc.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">
                  Delete
                </button>
              )}
              <button onClick={() => setShowViewModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}