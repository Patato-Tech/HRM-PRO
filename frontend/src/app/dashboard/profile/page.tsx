'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

interface PayrollRecord {
  id: number; month: number; year: number;
  basic: number; allowances: number; deductions: number;
  netSalary: number; status: 'PENDING' | 'APPROVED' | 'PAID';
}

interface EmployeeInfo {
  id: number; employeeCode: string; designation: string;
  salary: number; joinDate: string;
  department?: { name: string } | null;
  customRole?: { name: string } | null;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Company Admin',
  EMPLOYEE: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Manufacturing','Retail','Construction','Transportation','Hospitality','Media','Real Estate','Agriculture','Other'];
const COUNTRIES = ['Pakistan','United Arab Emirates','Saudi Arabia','United Kingdom','United States','Canada','Australia','Other'];
const COMPANY_SIZES = ['1-10 employees','11-50 employees','51-200 employees','201-500 employees','500+ employees'];

type TabKey = 'info' | 'security' | 'payroll' | 'documents' | 'salary' | 'company';


const validatePassword = (pw) => {
  const errors = [];
  if (pw.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("one number");
  if (!/[@#$!%*?&]/.test(pw)) errors.push("one special character (@#$!%*?&)");
  return errors;
};
const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[@#$!%*?&]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (score <= 3) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (score <= 4) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#10b981", width: "100%" };
};
export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(false);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);


  const [showEditCompany, setShowEditCompany] = useState(false);
  const [customIndustry, setCustomIndustry] = useState(false);
  const [customCountry, setCustomCountry] = useState(false);
  const [editCompanyForm, setEditCompanyForm] = useState<any>({});
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [toast, setToast] = useState('');
  const [editName, setEditName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [editDesignation, setEditDesignation] = useState('');
  const [nameError, setNameError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [docUploadFiles, setDocUploadFiles] = useState<File[]>([]);
  const [docUploadType, setDocUploadType] = useState('CNIC');
  const [docUploadName, setDocUploadName] = useState('');
  const [docUploadExpiry, setDocUploadExpiry] = useState('');
  const [docUploadError, setDocUploadError] = useState('');
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
    if (user) {
      setEditName(user.name || '');
      apiCall('/auth/profile', {}, getToken() || '').then(data => { setFullProfile(data); setEditPhone(data?.phone || ''); setEditCnic(data?.cnic || ''); }).catch(() => {});
      const savedPic = localStorage.getItem('user_profile_pic');
      if (savedPic) setProfilePic(savedPic);
      const pic = localStorage.getItem('user_profile_pic');
      if (pic) setProfilePic(pic);
      fetchEmployeeInfo();
      fetchCompanyInfo();
      setEditDesignation(user.designation || '');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'documents' && user.employeeId) {
      setDocsLoading(true);
      apiCall(`/documents?employeeId=${user.employeeId}`, {}, getToken() || '')
        .then(data => setDocuments((data || []).filter((d: any) => String(d.employeeId) === String(user.employeeId))))
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false));
    }
    if (activeTab === 'payroll' && user.employeeId) {
      setPayrollLoading(true);
      apiCall(`/payroll/employee/${user.employeeId}`, {}, getToken() || '')
        .then(data => setPayrolls(data || []))
        .catch(() => setPayrolls([]))
        .finally(() => setPayrollLoading(false));
    }
  }, [activeTab, user]);
  const handleDocUpload = async () => {
    setDocUploadError('');
    if (docUploadFiles.length === 0) { setDocUploadError('Please select at least one file'); return; }
    if (!docUploadName.trim()) { setDocUploadError('Document name is required'); return; }
    if (!user?.employeeId) { setDocUploadError('Unable to identify your employee record'); return; }
    setDocUploadLoading(true);
    try {
      const token = getToken() || '';
      for (let i = 0; i < docUploadFiles.length; i++) {
        const f = docUploadFiles[i];
        const docName = docUploadFiles.length > 1 ? `${docUploadName} (${i + 1})` : docUploadName;
        const formData = new FormData();
        formData.append('file', f);
        formData.append('employeeId', String(user.employeeId));
        formData.append('type', docUploadType);
        formData.append('name', docName);
        formData.append('expiryDate', docUploadExpiry);
        formData.append('notes', '');
        const response = await fetch('http://localhost:5001/documents', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData,
        });
        if (!response.ok) throw new Error(`Upload failed for ${f.name}`);
      }
      setShowDocUploadModal(false);
      setDocUploadFiles([]);
      setDocUploadName('');
      setDocUploadExpiry('');
      setDocUploadType('CNIC');
      setDocsLoading(true);
      const data = await apiCall(`/documents?employeeId=${user.employeeId}`, {}, token);
      setDocuments((data || []).filter((d: any) => String(d.employeeId) === String(user.employeeId)));
      setDocsLoading(false);
    } catch (err: any) {
      setDocUploadError(err.message || 'Upload failed');
    } finally {
      setDocUploadLoading(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    setPicUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem('user_profile_pic', base64);
      setProfilePic(base64);
      window.dispatchEvent(new Event('profile_pic_updated'));
      setPicUploading(false);
    };
    reader.readAsDataURL(file);
  };















  const fetchCompanyInfo = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token") || "";
      const data = await apiCall("/auth/company", {}, token);
      setCompanyInfo(data);
    } catch (e) { console.error(e); }
  };
  const handleSaveCompany = async () => {
    setCompanyError("");
    if (!editCompanyForm.name?.trim()) { setCompanyError("Company name is required."); return; }
    if (editCompanyForm.phone && !/^03[0-9]{9}$/.test(editCompanyForm.phone.replace(/[-s]/g, ""))) { setCompanyError("Phone format must be 03XXXXXXXXX."); return; }
    if (editCompanyForm.website && !editCompanyForm.website.includes(".")) { setCompanyError("Enter a valid website URL."); return; }
    setCompanyLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const updated = await apiCall("/auth/company", { method: "PUT", body: JSON.stringify(editCompanyForm) }, token);
      setCompanyInfo(updated);
      setShowEditCompany(false);
    } catch (e) { setCompanyError(e?.message || "Failed to update."); }
    finally { setCompanyLoading(false); }
  };
  const fetchEmployeeInfo = async () => {
    if (!user?.employeeId) return;
    try {
      const token = getToken() || '';
      const data = await apiCall(`/employees/${user.employeeId}`, {}, token);
      setEmployeeInfo(data);
    } catch (e) { console.error(e); }
  };

  const handleSaveName = async () => {
    setNameError('');
    if (!editName.trim()) { setNameError('Name cannot be empty.'); return; }
    setNameLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile', { method: 'PUT', body: JSON.stringify({ name: editName.trim() }) }, token);
      localStorage.setItem('user_name', editName.trim());
      showToast('Profile updated!');
    } catch (e: any) { setNameError(e?.message || 'Failed to update.'); }
    finally { setNameLoading(false); }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    const pwErrors = validatePassword(pwForm.newPw); if (pwErrors.length > 0) { setPwError("Password must have: " + pwErrors.join(", ")); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      const token = getToken() || '';
      await apiCall('/auth/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      }, token);
      setPwForm({ current: '', newPw: '', confirm: '' });
      showToast('Password changed!');
    } catch (e: any) { setPwError(e?.message || 'Failed to change password.'); }
    finally { setPwLoading(false); }
  };

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const isAdmin = user.role === 'COMPANY_ADMIN';
  const roleName = user.customRoleName || ROLE_LABELS[user.role] || user.role;
  const roleColor = user.customRoleName ? 'bg-blue-100 text-blue-700' : (ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600');

  const totalEarnedThisYear = payrolls
    .filter(p => p.year === new Date().getFullYear() && (p.status === 'PAID' || p.status === 'APPROVED'))
    .reduce((sum, p) => sum + (p.netSalary || p.basic + p.allowances - p.deductions), 0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info', label: '👤 My Info' },
    { key: 'security', label: '🔒 Security' },
    ...(isAdmin ? [{ key: 'company' as TabKey, label: '🏢 Company Info' }] : []),
    ...(!isAdmin ? [{ key: 'payroll' as TabKey, label: '💰 Payroll History' }] : []),
    { key: 'documents' as TabKey, label: '📄 Documents' },
    ...(!isAdmin ? [{ key: 'salary' as TabKey, label: '📈 Salary History' }] : []),
  ];
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {toast}
        </div>
      )}

      {/* Profile Header */}
      <div className="rounded-2xl overflow-hidden" style={{background:"linear-gradient(135deg,#0f172a,#1e293b)",boxShadow:"0 8px 30px rgba(0,0,0,0.15)"}}>
        <div className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">{user.name?.charAt(0)?.toUpperCase() || "?"}</div>}
              </div>
              <label className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full cursor-pointer flex items-center justify-center text-sm shadow-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {picUploading ? "⏳" : "📷"}
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white">{user.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{background:"rgba(59,130,246,0.2)",color:"#93c5fd"}}>{roleName}</span>
                {employeeInfo?.employeeCode && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)"}}>{employeeInfo.employeeCode}</span>
                )}
                {employeeInfo?.department?.name && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{background:"rgba(139,92,246,0.2)",color:"#c4b5fd"}}>{employeeInfo.department.name}</span>
                )}
                {user.companyName && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{background:"rgba(16,185,129,0.2)",color:"#6ee7b7"}}>{user.companyName}</span>
                )}
              </div>
            </div>
          </div>

        {employeeInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            {[
              { label: "Employee Code", value: employeeInfo.employeeCode || "—" },
              { label: "Department", value: employeeInfo.department?.name || "Company Wide" },
              { label: "Current Salary", value: employeeInfo.salary ? `PKR ${employeeInfo.salary.toLocaleString()}` : "—" },
              { label: "Joined", value: employeeInfo.joinDate ? new Date(employeeInfo.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-3" style={{background:"rgba(255,255,255,0.06)"}}>
                <p className="text-xs font-medium mb-1" style={{color:"rgba(255,255,255,0.4)"}}>{stat.label}</p>
                <p className="text-sm font-bold text-white truncate">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
            style={activeTab === tab.key
              ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}
              : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* MY INFO TAB */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Personal Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">👤</span>
              Personal Details
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full text-gray-900 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Email Address</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400">{user.email}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Designation</label>
                {isAdmin ? (
                  <input type="text" value={editDesignation} onChange={e => setEditDesignation(e.target.value)}
                  placeholder="Enter designation"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{user.designation || employeeInfo?.designation || 'Not set'}</div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Role</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{roleName}</div>
              </div>
              {isAdmin && <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">📞 Phone</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="03XXXXXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
              </div>}
              {isAdmin && <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">🪪 CNIC</label>
                <input type="text" value={editCnic} onChange={e => setEditCnic(e.target.value)} placeholder="XXXXX-XXXXXXX-X"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white" />
              </div>}
              {employeeInfo && <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Department</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{employeeInfo.department?.name || 'Company Wide'}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Employee Code</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{employeeInfo.employeeCode}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Join Date</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{new Date(employeeInfo.joinDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Company</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{user.companyName || '—'}</div>
                </div>
              </>}
              {employeeInfo?.salary && (
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Current Salary</label>
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-bold text-green-700">PKR {employeeInfo.salary.toLocaleString()}</div>
                </div>
              )}
            </div>
            {/* Personal Info */}
            {(employeeInfo?.phone || employeeInfo?.cnic || employeeInfo?.gender || employeeInfo?.employmentType || user?.phone || user?.cnic) && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Personal Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {(employeeInfo?.phone || user?.phone || fullProfile?.phone) && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">📞 Phone</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{employeeInfo?.phone || user?.phone || fullProfile?.phone}</div>
                    </div>
                  )}
                  {(employeeInfo?.cnic || user?.cnic || fullProfile?.cnic) && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">🪪 CNIC</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{employeeInfo?.cnic || user?.cnic || fullProfile?.cnic}</div>
                    </div>
                  )}
                  {employeeInfo.gender && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">👤 Gender</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium capitalize">{employeeInfo.gender.charAt(0).toUpperCase() + employeeInfo.gender.slice(1)}</div>
                    </div>
                  )}
                  {employeeInfo.employmentType && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">💼 Employment Type</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-medium">{employeeInfo.employmentType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {nameError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm mb-3">{nameError}</div>}
            <div className="flex gap-3">
              <button onClick={handleSaveName} disabled={nameLoading || editName.trim() === user.name}
                className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
                {nameLoading ? "Saving..." : "Update Name"}
              </button>
              {isAdmin && (
                <button onClick={async () => {
                  try {
                    const token = (typeof window !== "undefined" ? localStorage.getItem("token") : "") || "";
                    await fetch(`http://localhost:5001/auth/profile`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ designation: editDesignation, phone: editPhone, cnic: editCnic }) });
                    if (typeof window !== "undefined") localStorage.setItem("user_designation", editDesignation);
                    setFullProfile((prev: any) => ({ ...prev, phone: editPhone, cnic: editCnic, designation: editDesignation }));
                    setToast("Profile updated!");
                    setTimeout(() => setToast(""), 3000);
                  } catch (e) { console.error(e); }
                }} disabled={editDesignation === (user.designation || "") && editPhone === (fullProfile?.phone || "") && editCnic === (fullProfile?.cnic || "")}
                className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
                Save Designation
                </button>
              )}
            </div>
          </div>
          {/* Documents Section */}
          {employeeInfo && !isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-7 h-7 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs">📄</span>
                Official Documents
              </h2>
              <button onClick={() => {
                const win = window.open("", "_blank");
                if (!win) return;
                const today = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
                win.document.write(`<!DOCTYPE html><html><head><title>Salary Certificate</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:40px;color:#111;font-size:12px}.hdr{text-align:center;border-bottom:4px solid #1e40af;padding-bottom:20px;margin-bottom:30px}.co{font-size:26px;font-weight:900;color:#1e40af}.sub{font-size:12px;color:#6b7280;margin-top:4px}.title{font-size:18px;font-weight:800;text-align:center;background:#1e40af;color:#fff;padding:12px;border-radius:8px;margin:20px 0;letter-spacing:2px;text-transform:uppercase}.body{line-height:2;font-size:13px;text-align:justify;margin:20px 0}.highlight{font-weight:800;color:#1e40af}.table{width:100%;border-collapse:collapse;margin:20px 0}.table td{padding:10px 14px;border:1px solid #e5e7eb;font-size:12px}.table tr:nth-child(even) td{background:#f9fafb}.table td:first-child{font-weight:700;color:#6b7280;width:40%;text-transform:uppercase;font-size:11px}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:60px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:15mm}}</style></head><body>
                <div class="hdr"><div class="co">${user?.companyName||"Company"}</div><div class="sub">Human Resources Department</div></div>
                <div class="title">Salary Certificate</div>
                <p class="body">This is to certify that <span class="highlight">${user?.name}</span> is a permanent employee of <span class="highlight">${user?.companyName||"our organization"}</span>. The details of employment are as follows:</p>
                <table class="table">
                <tr><td>Employee Name</td><td>${user?.name}</td></tr>
                <tr><td>Employee Code</td><td>${employeeInfo?.employeeCode||"-"}</td></tr>
                <tr><td>Designation</td><td>${employeeInfo?.designation||user?.designation||"-"}</td></tr>
                <tr><td>Department</td><td>${employeeInfo?.department?.name||"Company Wide"}</td></tr>
                <tr><td>Date of Joining</td><td>${employeeInfo?.joinDate ? new Date(employeeInfo.joinDate).toLocaleDateString("en-US",{day:"numeric",month:"long",year:"numeric"}) : "-"}</td></tr>
                <tr><td>Employment Status</td><td><strong>Active</strong></td></tr>
                <tr><td>Monthly Salary</td><td><strong>PKR ${employeeInfo?.salary?.toLocaleString()||"-"}</strong></td></tr>
                </table>
                <p class="body">This certificate is issued on <span class="highlight">${today}</span> at the request of the employee for their personal use.</p>
                <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280;text-transform:uppercase">Employee Signature</div><div style="font-weight:700;margin-top:4px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280;text-transform:uppercase">Authorized Signature</div><div style="font-weight:700;margin-top:4px">${user?.companyName}</div><div style="font-size:10px;color:#6b7280">HR Department</div></div></div></div>
                <div class="foot">This is a computer-generated certificate. Issued on ${today}.</div>
                </body></html>`);
                win.document.close();
                setTimeout(() => win.print(), 500);
              }}
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2">
              📄 Generate Salary Certificate
              </button>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-3">📋 Generate Draft Salary Slip</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <select id="draftMonth" defaultValue={new Date().getMonth()+1}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i) => (
                      <option key={i} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select id="draftYear" defaultValue={new Date().getFullYear()}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={() => {
                  const month = Number((document.getElementById("draftMonth") as HTMLSelectElement)?.value || new Date().getMonth()+1);
                  const year = Number((document.getElementById("draftYear") as HTMLSelectElement)?.value || new Date().getFullYear());
                  const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                  const salary = employeeInfo?.salary || 0;
                  const eobi = Math.round(salary * 0.01);
                  const net = salary - eobi;
                  const win = window.open("", "_blank");
                  if (!win) return;
                  win.document.write(`<!DOCTYPE html><html><head><title>Draft Salary Slip</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:4px solid #1e40af;margin-bottom:20px}.co{font-size:22px;font-weight:900;color:#1e40af}.badge{background:#f59e0b;color:#fff;padding:10px 18px;border-radius:8px;text-align:center}.badge-m{font-size:16px;font-weight:900}.draft-watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:80px;font-weight:900;color:rgba(239,68,68,0.08);pointer-events:none;z-index:0;white-space:nowrap}.emp{background:#eff6ff;border-left:5px solid #1e40af;padding:14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ef label{font-size:10px;color:#6b7280;text-transform:uppercase;display:block}.ef span{font-size:13px;font-weight:700}.tbls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}table{width:100%;border-collapse:collapse}.th-e{background:#059669;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}.th-d{background:#dc2626;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}td{padding:7px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:600}.even td{background:#f9fafb}.te td{background:#d1fae5!important;font-weight:800;color:#065f46;border-top:2px solid #059669}.td td{background:#fee2e2!important;font-weight:800;color:#991b1b;border-top:2px solid #dc2626}.net{background:linear-gradient(135deg,#92400e,#d97706);color:#fff;padding:18px;border-radius:10px;text-align:center;margin:16px 0}.net-a{font-size:32px;font-weight:900;margin:6px 0}.draft-note{background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px;margin:16px 0;font-size:11px;color:#92400e;text-align:center;font-weight:700}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:10mm}}</style></head><body>
                  <div class="draft-watermark">DRAFT</div>
                  <div class="hdr"><div><div class="co">${user?.companyName||"Company"}</div><div style="font-size:11px;color:#6b7280">Official Salary Slip (Draft)</div></div><div class="badge"><div style="font-size:10px;opacity:.8">DRAFT SLIP</div><div class="badge-m">${MN[month-1]} ${year}</div></div></div>
                  <div class="draft-note">⚠️ DRAFT - This is an unofficial salary slip generated by the employee. Final slip will be issued by HR.</div>
                  <div class="emp"><div class="ef"><label>Employee Name</label><span>${user?.name}</span></div><div class="ef"><label>Employee Code</label><span>${employeeInfo?.employeeCode||"-"}</span></div><div class="ef"><label>Designation</label><span>${employeeInfo?.designation||user?.designation||"-"}</span></div><div class="ef"><label>Department</label><span>${employeeInfo?.department?.name||"Company Wide"}</span></div><div class="ef"><label>Pay Period</label><span>${MN[month-1]} ${year}</span></div><div class="ef"><label>Status</label><span>DRAFT</span></div></div>
                  <div class="tbls"><table><tr><th class="th-e" colspan="2">Earnings</th></tr><tr><td>Basic Salary</td><td class="r">PKR ${salary.toLocaleString()}</td></tr><tr class="te"><td><b>Gross Salary</b></td><td class="r"><b>PKR ${salary.toLocaleString()}</b></td></tr></table>
                  <table><tr><th class="th-d" colspan="2">Deductions</th></tr><tr><td>EOBI (1%)</td><td class="r">PKR ${eobi.toLocaleString()}</td></tr><tr class="td"><td><b>Total Deductions</b></td><td class="r"><b>PKR ${eobi.toLocaleString()}</b></td></tr></table></div>
                  <div class="net"><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:3px">Estimated Net Pay</div><div class="net-a">PKR ${net.toLocaleString()}</div><div style="font-size:11px;opacity:.65">${MN[month-1]} ${year} &bull; DRAFT</div></div>
                  <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Employee Signature</div><div style="font-weight:700;margin-top:2px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Authorized By</div><div style="font-weight:700;margin-top:2px">${user?.companyName}</div></div></div></div>
                  <div class="foot">DRAFT - Computer-generated. Generated on ${new Date().toLocaleDateString()}. This slip is not official until approved by HR.</div>
                  </body></html>`);
                  win.document.close();
                  setTimeout(() => win.print(), 500);
                }}
                className="w-full border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                📋 Generate Draft Slip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPANY INFO TAB */}
      {activeTab === 'company' && isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-lg">Company Information</h2>
            <div className="flex items-center gap-2">
              <span className={companyInfo?.status === "active" ? "text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-700" : "text-xs px-3 py-1 rounded-full font-bold bg-yellow-100 text-yellow-700"}>{companyInfo?.status ? companyInfo.status.charAt(0).toUpperCase() + companyInfo.status.slice(1) : "—"}</span>
              <button onClick={() => { setEditCompanyForm({name: companyInfo?.name||"", industry: companyInfo?.industry||"", address: companyInfo?.address||"", city: companyInfo?.city||"", country: companyInfo?.country||"", phone: companyInfo?.phone||"", website: companyInfo?.website||"", companySize: companyInfo?.companySize||"", regNumber: companyInfo?.regNumber||""}); setShowEditCompany(true); }} className="text-xs font-bold text-white px-3 py-1.5 rounded-xl" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>Edit</button>
            </div>
          </div>
          {companyInfo ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Company Name", value: companyInfo.name },
                { label: "Industry", value: companyInfo.industry },
                { label: "Company Size", value: companyInfo.companySize },
                { label: "Phone", value: companyInfo.phone },
                { label: "Website", value: companyInfo.website },
                { label: "City", value: companyInfo.city },
                { label: "Country", value: companyInfo.country },
                { label: "Address", value: companyInfo.address },
                { label: "Reg. Number", value: companyInfo.regNumber },
                { label: "Member Since", value: companyInfo.createdAt ? new Date(companyInfo.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">Loading company info...</div>
          )}
        </div>
      )}
      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500">Password must be 8+ chars with uppercase, lowercase, number and special character.</p>
          {(['current', 'newPw', 'confirm'] as const).map(field => {
            const label = field === 'current' ? 'Current Password' : field === 'newPw' ? 'New Password' : 'Confirm New Password';
            return (
              <div key={field}>
                <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                <div className="relative">
                  <input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]}
                    onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                    className="w-full text-gray-900 border border-gray-300 rounded-xl px-4 py-3 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${label.toLowerCase()}`} />
                  <button type="button" onClick={() => setShowPw({ ...showPw, [field]: !showPw[field] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-700 font-medium">
                    {showPw[field] ? 'Hide' : 'Show'}
                  </button>
                </div>
                {field === "newPw" && pwForm.newPw && (

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className="text-xs font-bold" style={{color: getPasswordStrength(pwForm.newPw).color}}>{getPasswordStrength(pwForm.newPw).label}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                      <div className="h-1.5 rounded-full transition-all" style={{width: getPasswordStrength(pwForm.newPw).width, background: getPasswordStrength(pwForm.newPw).color}}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: "8+ characters", test: pwForm.newPw.length >= 8 },
                        { label: "Uppercase letter", test: /[A-Z]/.test(pwForm.newPw) },
                        { label: "Lowercase letter", test: /[a-z]/.test(pwForm.newPw) },
                        { label: "Number", test: /[0-9]/.test(pwForm.newPw) },
                        { label: "Special character", test: /[@#$!%*?&]/.test(pwForm.newPw) },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${req.test ? "text-green-500" : "text-gray-300"}`}>{req.test ? "✓" : "○"}</span>
                          <span className={`text-xs ${req.test ? "text-green-600" : "text-gray-400"}`}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {field === "confirm" && pwForm.confirm && (
                  <p className={`text-xs mt-1.5 font-medium ${pwForm.confirm === pwForm.newPw ? "text-green-600" : "text-red-500"}`}>
                    {pwForm.confirm === pwForm.newPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            );
          })}
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm">{pwError}</div>}
          <button onClick={handleChangePassword} disabled={pwLoading}
            className="w-full text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>

            {pwLoading ? "Updating..." : "Change Password"}
          </button>
          </div>

      )}

      {/* PAYROLL HISTORY TAB */}
      {activeTab === 'payroll' && user.employeeId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">My Payroll History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your monthly salary records</p>
            {totalEarnedThisYear > 0 && (
              <div className="mt-3 bg-green-50 rounded-xl px-4 py-2">
                <p className="text-xs text-gray-500">Total Earned This Year</p>
                <p className="text-lg font-bold text-green-600">PKR {totalEarnedThisYear.toLocaleString()}</p>
              </div>
            )}
          </div>
          {payrollLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payrolls.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-sm">No payroll records yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
               {payrolls.map((p, i) => (
                 <div key={p.id} className={`px-5 py-4 hover:bg-gray-50 transition-colors ${i === 0 ? "bg-blue-50/50" : ""}`}>
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <p className="text-sm font-bold text-gray-900">{MONTHS[p.month - 1]} {p.year}</p>
                       {i === 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Latest</span>}
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "paid" || p.status === "PAID" ? "bg-green-100 text-green-700" : p.status === "approved" || p.status === "APPROVED" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "—"}</span>
                       <button onClick={() => {
                         const win = window.open("", "_blank");
                         if (!win) return;
                         const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                         win.document.write(`<!DOCTYPE html><html><head><title>Salary Slip</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:4px solid #1e40af;margin-bottom:20px}.co{font-size:22px;font-weight:900;color:#1e40af}.badge{background:#1e40af;color:#fff;padding:10px 18px;border-radius:8px;text-align:center}.badge-m{font-size:16px;font-weight:900}.emp{background:#eff6ff;border-left:5px solid #1e40af;padding:14px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.ef label{font-size:10px;color:#6b7280;text-transform:uppercase;display:block}.ef span{font-size:13px;font-weight:700}.tbls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}table{width:100%;border-collapse:collapse}.th-e{background:#059669;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}.th-d{background:#dc2626;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase}td{padding:7px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}.r{text-align:right;font-weight:600}.even td{background:#f9fafb}.te td{background:#d1fae5!important;font-weight:800;color:#065f46;border-top:2px solid #059669}.td td{background:#fee2e2!important;font-weight:800;color:#991b1b;border-top:2px solid #dc2626}.net{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:18px;border-radius:10px;text-align:center;margin:16px 0}.net-a{font-size:32px;font-weight:900;margin:6px 0}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}@media print{@page{margin:10mm}}</style></head><body>
         <div class="hdr"><div><div class="co">${user?.companyName||"Company"}</div></div><div class="badge"><div style="font-size:10px;opacity:.8">Salary Slip</div><div class="badge-m">${MN[p.month-1]} ${p.year}</div></div></div>
         <div class="emp"><div class="ef"><label>Employee</label><span>${user?.name}</span></div><div class="ef"><label>Designation</label><span>${user?.designation||"-"}</span></div><div class="ef"><label>Pay Period</label><span>${MN[p.month-1]} ${p.year}</span></div><div class="ef"><label>Status</label><span>${p.status.toUpperCase()}</span></div></div>
         <div class="tbls"><table><tr><th class="th-e" colspan="2">Earnings</th></tr><tr><td>Basic Salary</td><td class="r">PKR ${p.basic.toLocaleString()}</td></tr><tr class="even"><td>Allowances</td><td class="r">PKR ${p.allowances.toLocaleString()}</td></tr><tr class="te"><td><b>Gross Salary</b></td><td class="r"><b>PKR ${(p.basic+p.allowances).toLocaleString()}</b></td></tr></table>
         <table><tr><th class="th-d" colspan="2">Deductions</th></tr><tr><td>Total Deductions</td><td class="r">PKR ${p.deductions.toLocaleString()}</td></tr><tr class="td"><td><b>Total</b></td><td class="r"><b>PKR ${p.deductions.toLocaleString()}</b></td></tr></table></div>
         <div class="net"><div style="font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:3px">Net Pay</div><div class="net-a">PKR ${p.netSalary.toLocaleString()}</div></div>
         <div class="sigs"><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Employee Signature</div><div style="font-weight:700;margin-top:2px">${user?.name}</div></div></div><div class="sig"><div class="sl"><div style="font-size:10px;color:#6b7280">Authorized By</div><div style="font-weight:700;margin-top:2px">${user?.companyName}</div></div></div></div>
         <div class="foot">Computer-generated salary slip. ${new Date().toLocaleDateString()}</div></body></html>`);
                         win.document.close();
                         setTimeout(() => win.print(), 500);
                       }}
                       className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                         🖨️ Slip
                       </button>
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-2 text-xs">
                     <div className="bg-green-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Basic</p>
                       <p className="font-bold text-gray-900">PKR {p.basic.toLocaleString()}</p>
                     </div>
                     <div className="bg-blue-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Gross</p>
                       <p className="font-bold text-green-600">PKR {(p.basic + p.allowances).toLocaleString()}</p>
                     </div>
                     <div className="bg-red-50 rounded-lg p-2 text-center">
                       <p className="text-gray-400">Net Pay</p>
                       <p className="font-bold text-blue-700">PKR {p.netSalary.toLocaleString()}</p>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">📄 My Documents</h2>
              <p className="text-xs text-gray-400 mt-0.5">Your uploaded documents</p>
            </div>
            <button onClick={() => { setShowDocUploadModal(true); setDocUploadError(""); }}
              className="text-white px-4 py-2 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
              + Upload Document
            </button>
          </div>
          {docsLoading ? (
            <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-gray-500 font-medium">No documents uploaded yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">Upload your CNIC, degree, or other documents</p>
              <button onClick={() => { setShowDocUploadModal(true); setDocUploadError(""); }}
                className="text-white px-5 py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                + Upload Document
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map((doc: any) => (
                <div key={doc.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center text-lg">📄</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.type} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                      {doc.expiryDate && <p className="text-xs text-yellow-600">Expires: {new Date(doc.expiryDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                      Open
                    </a>
                    <a href={doc.url} download={doc.name}
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg">
                      ⬇️ Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* SALARY HISTORY TAB */}
      {activeTab === "salary" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">📈 Salary History</h2>
            <button onClick={async () => {
              setSalaryLoading(true);
              try {
                const token = getToken() || "";
                const data = await apiCall(`/employees/${user?.employeeId}/salary-history`, {}, token);
                setSalaryHistory(data || []);
              } catch { setSalaryHistory([]); }
              setSalaryLoading(false);
            }} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">
              {salaryLoading ? "Loading..." : "Load History"}
            </button>
          </div>
          {salaryHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📈</p>
              <p className="text-gray-400 text-sm">Click "Load History" to view salary changes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {salaryHistory.map((h: any, i: number) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {h.type === "increment" ? "📈 Salary Increment" : "📉 Salary Decrement"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.reason || "No reason provided"}</p>
                      <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleDateString()} · By Administration</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${h.type === "increment" ? "text-green-600" : "text-red-500"}`}>
                        {h.type === "increment" ? "+" : "-"}PKR {Number(h.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">New: PKR {Number(h.newSalary).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showEditCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Edit Company Info</h3>
              <button onClick={() => setShowEditCompany(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">x</button>
            </div>
            <div className="p-6 space-y-4">
              {companyError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{companyError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
                  <input type="text" value={editCompanyForm.name || ""} onChange={e => setEditCompanyForm({...editCompanyForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                  <select value={INDUSTRIES.includes(editCompanyForm.industry || "") ? editCompanyForm.industry || "" : "Other"} onChange={e => { if (e.target.value === "Other") { setCustomIndustry(true); setEditCompanyForm({...editCompanyForm, industry: ""}); } else { setCustomIndustry(false); setEditCompanyForm({...editCompanyForm, industry: e.target.value}); }}} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {customIndustry && (
                    <input type="text" value={editCompanyForm.industry || ""} onChange={e => setEditCompanyForm({...editCompanyForm, industry: e.target.value})} placeholder="Enter custom industry" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Size</label>
                  <select value={editCompanyForm.companySize || ""} onChange={e => setEditCompanyForm({...editCompanyForm, companySize: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input type="tel" value={editCompanyForm.phone || ""} onChange={e => setEditCompanyForm({...editCompanyForm, phone: e.target.value})} placeholder="03XXXXXXXXX" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Website</label>
                  <input type="text" value={editCompanyForm.website || ""} onChange={e => setEditCompanyForm({...editCompanyForm, website: e.target.value})} placeholder="www.company.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                  <input type="text" value={editCompanyForm.city || ""} onChange={e => setEditCompanyForm({...editCompanyForm, city: e.target.value})} placeholder="Enter city" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <select value={COUNTRIES.includes(editCompanyForm.country || "") ? editCompanyForm.country || "" : "Other"} onChange={e => { if (e.target.value === "Other") { setCustomCountry(true); setEditCompanyForm({...editCompanyForm, country: ""}); } else { setCustomCountry(false); setEditCompanyForm({...editCompanyForm, country: e.target.value}); }}} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {customCountry && (
                    <input type="text" value={editCompanyForm.country || ""} onChange={e => setEditCompanyForm({...editCompanyForm, country: e.target.value})} placeholder="Enter custom country" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reg. Number</label>
                  <input type="text" value={editCompanyForm.regNumber || ""} onChange={e => setEditCompanyForm({...editCompanyForm, regNumber: e.target.value})} placeholder="Business reg. number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                  <input type="text" value={editCompanyForm.address || ""} onChange={e => setEditCompanyForm({...editCompanyForm, address: e.target.value})} placeholder="Enter address" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowEditCompany(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={handleSaveCompany} disabled={companyLoading} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {companyLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDocUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowDocUploadModal(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {docUploadError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">{docUploadError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document Type</label>
                <select value={docUploadType} onChange={(e) => setDocUploadType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50">
                  <option value="CNIC">CNIC</option>
                  <option value="Degree">Degree</option>
                  <option value="Contract">Contract</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Document Name <span className="text-red-500">*</span></label>
                <input type="text" value={docUploadName} onChange={(e) => setDocUploadName(e.target.value)} placeholder="e.g. My CNIC Copy"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="date" value={docUploadExpiry} onChange={(e) => setDocUploadExpiry(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Files <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(you can select multiple)</span></label>
                <input type="file" multiple onChange={(e) => setDocUploadFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50" />
                {docUploadFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {docUploadFiles.map((f, i) => (
                      <p key={i} className="text-xs text-gray-400">📎 {f.name}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowDocUploadModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={handleDocUpload} disabled={docUploadLoading} className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {docUploadLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
















