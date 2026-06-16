'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, isCompanyAdmin, hasPermission } from '@/lib/withAuth';
import { apiCall, getToken } from '@/lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Employee {
  id: string; employeeCode: string; designation?: string; salary?: number;
  user: { name: string; email: string };
  department?: { name: string } | null;
  customRole?: { name: string } | null;
}

interface PayrollRecord {
  id: string; employeeId: string; month: number; year: number;
  basic: number; houseRent: number; medicalAllowance: number;
  transportAllowance: number; otherAllowances: number; bonus: number;
  overtimePay: number; grossSalary: number; withholdingTax: number;
  eobi: number; loanDeduction: number; otherDeductions: number;
  totalDeductions: number; netSalary: number; allowances: number;
  deductions: number; notes?: string; status: string;
  employee: {
    id: string; employeeCode: string; designation?: string;
    user: { name: string; email: string };
    department?: { name: string } | null;
    customRole?: { name: string } | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  paid: 'bg-blue-100 text-blue-700',
};

const emptyForm = () => ({
  employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
  basic: '', houseRent: '', medicalAllowance: '', transportAllowance: '',
  otherAllowances: '', bonus: '', overtimePay: '', withholdingTax: '',
  eobi: '', loanDeduction: '', otherDeductions: '', notes: '',
});

export default function PayrollPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'month' | 'process'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthPayrolls, setMonthPayrolls] = useState<PayrollRecord[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const canManage = isCompanyAdmin(user?.role || '') || hasPermission(user, 'payroll', 'process') || hasPermission(user, 'payroll', 'approve');
  const canApprove = isCompanyAdmin(user?.role || '') || hasPermission(user, 'payroll', 'approve');
  const canProcess = isCompanyAdmin(user?.role || '') || hasPermission(user, 'payroll', 'process');

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = getToken() || '';
    try {
      const [payrollData, empData] = await Promise.all([
        apiCall('/payroll', {}, token),
        apiCall('/employees', {}, token),
      ]);
      setPayrolls(payrollData || []);
      setEmployees(empData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showSuccessMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const calcGross = (f: typeof form) => {
    return (Number(f.basic) || 0) + (Number(f.houseRent) || 0) + (Number(f.medicalAllowance) || 0) +
      (Number(f.transportAllowance) || 0) + (Number(f.otherAllowances) || 0) +
      (Number(f.bonus) || 0) + (Number(f.overtimePay) || 0);
  };

  const calcDeductions = (f: typeof form) => {
    const basic = Number(f.basic) || 0;
    const eobi = Number(f.eobi) !== 0 ? Number(f.eobi) : Math.round(basic * 0.01);
    return (Number(f.withholdingTax) || 0) + eobi + (Number(f.loanDeduction) || 0) + (Number(f.otherDeductions) || 0);
  };

  const calcNet = (f: typeof form) => calcGross(f) - calcDeductions(f);

  const handleFormChange = (field: string, value: string) => {
    const updated = { ...form, [field]: value };
    if (field === 'employeeId') {
      const emp = employees.find((e: any) => String(e.id) === value);
      if (emp?.salary) {
        updated.basic = String(emp.salary);
        updated.eobi = String(Math.round(emp.salary * 0.01));
      }
    }
    if (field === 'basic') {
      updated.eobi = String(Math.round((Number(value) || 0) * 0.01));
    }
    setForm(updated);
  };

  const handleAdd = async () => {
    setError('');
    if (!form.employeeId || !form.basic) { setError('Employee and basic salary are required'); return; }
    try {
      const token = getToken() || '';
      await apiCall('/payroll', { method: 'POST', body: JSON.stringify(form) }, token);
      setShowAddModal(false);
      setForm(emptyForm());
      showSuccessMsg('Payroll created!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleEdit = async () => {
    if (!selectedPayroll) return;
    setError('');
    try {
      const token = getToken() || '';
      await apiCall(`/payroll/${selectedPayroll.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
      setShowEditModal(false);
      showSuccessMsg('Payroll updated!');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/payroll/${id}/approve`, { method: 'PUT' }, token);
      showSuccessMsg('Payroll approved!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const token = getToken() || '';
      await apiCall(`/payroll/${id}/paid`, { method: 'PUT' }, token);
      showSuccessMsg('Payroll marked as paid!');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const fetchMonthPayrolls = async () => {
    try {
      const token = getToken() || '';
      const data = await apiCall(`/payroll/month?month=${monthFilter}&year=${yearFilter}`, {}, token);
      setMonthPayrolls(data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (activeTab === 'month') fetchMonthPayrolls(); }, [activeTab, monthFilter, yearFilter]);

  const handleBulkProcess = async () => {
    setBulkLoading(true);
    try {
      const token = getToken() || '';
      const unprocessed = employees.filter((emp: any) => !payrolls.some((p: any) => String(p.employee?.id) === String(emp.id) && p.month === monthFilter && p.year === yearFilter));
      for (const emp of unprocessed) {
        const payload = {
          employeeId: emp.id, month: monthFilter, year: yearFilter,
          basic: emp.salary || 0,
          eobi: Math.round((emp.salary || 0) * 0.01),
        };
        await apiCall('/payroll', { method: 'POST', body: JSON.stringify(payload) }, token);
      }
      showSuccessMsg(`Processed payroll for ${employees.length} employees!`);
      fetchData();
    } catch (err: any) { setError(err.message); }
    finally { setBulkLoading(false); }
  };

  const openEditModal = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setForm({
      employeeId: payroll.employee.id,
      month: payroll.month, year: payroll.year,
      basic: String(payroll.basic),
      houseRent: String(payroll.houseRent || 0),
      medicalAllowance: String(payroll.medicalAllowance || 0),
      transportAllowance: String(payroll.transportAllowance || 0),
      otherAllowances: String(payroll.otherAllowances || 0),
      bonus: String(payroll.bonus || 0),
      overtimePay: String(payroll.overtimePay || 0),
      withholdingTax: String(payroll.withholdingTax || 0),
      eobi: String(payroll.eobi || 0),
      loanDeduction: String(payroll.loanDeduction || 0),
      otherDeductions: String(payroll.otherDeductions || 0),
      notes: payroll.notes || '',
    });
    setShowEditModal(true);
    setError('');
  };

  const handlePrint = () => {
    if (!selectedPayroll) return;
    const p = selectedPayroll;
    const co = user?.companyName || "Company";
    const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Salary Slip</title><style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:12px}
.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px;border-bottom:4px solid #1e40af;margin-bottom:20px}
.co{font-size:22px;font-weight:900;color:#1e40af}.co-sub{font-size:11px;color:#6b7280;margin-top:3px}
.badge{background:#1e40af;color:#fff;padding:10px 18px;border-radius:8px;text-align:center}
.badge-t{font-size:10px;opacity:.8;text-transform:uppercase;letter-spacing:1px}
.badge-m{font-size:16px;font-weight:900}
.emp{background:#eff6ff;border-left:5px solid #1e40af;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ef label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:2px}
.ef span{font-size:13px;font-weight:700}
.tbls{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
table{width:100%;border-collapse:collapse}
.th-e{background:#059669;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
.th-d{background:#dc2626;color:#fff;padding:9px 12px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px}
td{padding:7px 12px;font-size:11px;border-bottom:1px solid #f3f4f6}
.r{text-align:right;font-weight:600}
.even td{background:#f9fafb}
.te td{background:#d1fae5!important;font-weight:800;color:#065f46;border-top:2px solid #059669}
.td td{background:#fee2e2!important;font-weight:800;color:#991b1b;border-top:2px solid #dc2626}
.net{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:18px;border-radius:10px;text-align:center;margin:16px 0}
.net-l{font-size:10px;opacity:.75;text-transform:uppercase;letter-spacing:3px}
.net-a{font-size:32px;font-weight:900;margin:6px 0}
.net-p{font-size:11px;opacity:.65}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px}
.sig{text-align:center}.sl{border-top:1.5px solid #374151;padding-top:6px;margin-top:40px}
.st{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
.sn{font-size:12px;font-weight:700;margin-top:2px}
.foot{text-align:center;margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af}
@media print{@page{margin:10mm}}
</style></head><body>
<div class="hdr"><div><div class="co">${co}</div><div class="co-sub">Official Salary Slip</div></div>
<div class="badge"><div class="badge-t">Salary Slip</div><div class="badge-m">${MN[p.month-1]} ${p.year}</div></div></div>
<div class="emp">
<div class="ef"><label>Employee Name</label><span>${p.employee?.user?.name||"-"}</span></div>
<div class="ef"><label>Employee Code</label><span>${p.employee?.employeeCode||"-"}</span></div>
<div class="ef"><label>Designation</label><span>${p.employee?.designation||"-"}</span></div>
<div class="ef"><label>Department</label><span>${(p.employee as any)?.department?.name||"Company Wide"}</span></div>
<div class="ef"><label>Pay Period</label><span>${MN[p.month-1]} ${p.year}</span></div>
<div class="ef"><label>Status</label><span>${p.status.toUpperCase()}</span></div>
</div>
<div class="tbls">
<table><tr><th class="th-e" colspan="2">Earnings</th></tr>
<tr><td>Basic Salary</td><td class="r">PKR ${p.basic.toLocaleString()}</td></tr>
<tr class="even"><td>House Rent</td><td class="r">PKR ${(p.houseRent||0).toLocaleString()}</td></tr>
<tr><td>Medical Allowance</td><td class="r">PKR ${(p.medicalAllowance||0).toLocaleString()}</td></tr>
<tr class="even"><td>Transport</td><td class="r">PKR ${(p.transportAllowance||0).toLocaleString()}</td></tr>
<tr><td>Other Allowances</td><td class="r">PKR ${(p.otherAllowances||0).toLocaleString()}</td></tr>
<tr class="even"><td>Bonus</td><td class="r">PKR ${(p.bonus||0).toLocaleString()}</td></tr>
<tr><td>Overtime Pay</td><td class="r">PKR ${(p.overtimePay||0).toLocaleString()}</td></tr>
<tr class="te"><td><b>Gross Salary</b></td><td class="r"><b>PKR ${(p.grossSalary||p.basic+p.allowances).toLocaleString()}</b></td></tr>
</table>
<table><tr><th class="th-d" colspan="2">Deductions</th></tr>
<tr><td>Withholding Tax</td><td class="r">PKR ${(p.withholdingTax||0).toLocaleString()}</td></tr>
<tr class="even"><td>EOBI (1%)</td><td class="r">PKR ${(p.eobi||0).toLocaleString()}</td></tr>
<tr><td>Loan Deduction</td><td class="r">PKR ${(p.loanDeduction||0).toLocaleString()}</td></tr>
<tr class="even"><td>Other Deductions</td><td class="r">PKR ${(p.otherDeductions||0).toLocaleString()}</td></tr>
<tr class="td"><td><b>Total Deductions</b></td><td class="r"><b>PKR ${(p.totalDeductions||p.deductions).toLocaleString()}</b></td></tr>
</table></div>
<div class="net"><div class="net-l">Net Pay</div><div class="net-a">PKR ${p.netSalary.toLocaleString()}</div>
<div class="net-p">${MN[p.month-1]} ${p.year} &bull; ${p.status.toUpperCase()}</div></div>
<div class="sigs">
<div class="sig"><div class="sl"><div class="st">Employee Signature</div><div class="sn">${p.employee?.user?.name}</div></div></div>
<div class="sig"><div class="sl"><div class="st">Authorized By</div><div class="sn">${co}</div></div></div>
</div>
<div class="foot">Computer-generated salary slip. Generated on ${new Date().toLocaleDateString()}.</div>
</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const filtered = payrolls.filter(p => {
    const matchSearch = p.employee?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee?.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = payrolls.filter(p => p.status === 'approved').reduce((s, p) => s + p.netSalary, 0);
  const totalPending = payrolls.filter(p => p.status === 'pending').reduce((s, p) => s + p.netSalary, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  const PayrollForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
      {error && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

      {!showEditModal && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Employee *</label>
            <select value={form.employeeId} onChange={e => handleFormChange('employeeId', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select employee</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.user.name} ({emp.employeeCode})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Month *</label>
              <select value={form.month} onChange={e => handleFormChange('month', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Year *</label>
              <select value={form.year} onChange={e => handleFormChange('year', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* EARNINGS */}
      <div className="bg-green-50 rounded-xl p-4">
        <p className="text-xs font-bold text-green-700 uppercase mb-3">💰 Earnings</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'basic', label: 'Basic Salary *' },
            { key: 'houseRent', label: 'House Rent' },
            { key: 'medicalAllowance', label: 'Medical Allowance' },
            { key: 'transportAllowance', label: 'Transport Allowance' },
            { key: 'otherAllowances', label: 'Other Allowances' },
            { key: 'bonus', label: 'Bonus' },
            { key: 'overtimePay', label: 'Overtime Pay' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</label>
              <input type="number" value={(form as any)[field.key]}
                onChange={e => handleFormChange(field.key, e.target.value)}
                placeholder="0" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>
        <div className="mt-3 bg-green-100 rounded-lg px-3 py-2 flex justify-between">
          <span className="text-xs font-semibold text-green-700">Gross Salary</span>
          <span className="text-sm font-bold text-green-700">PKR {calcGross(form).toLocaleString()}</span>
        </div>
      </div>

      {/* DEDUCTIONS */}
      <div className="bg-red-50 rounded-xl p-4">
        <p className="text-xs font-bold text-red-700 uppercase mb-3">➖ Deductions</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'withholdingTax', label: 'Withholding Tax' },
            { key: 'eobi', label: 'EOBI (1% auto)' },
            { key: 'loanDeduction', label: 'Loan Deduction' },
            { key: 'otherDeductions', label: 'Other Deductions' },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</label>
              <input type="number" value={(form as any)[field.key]}
                onChange={e => handleFormChange(field.key, e.target.value)}
                placeholder="0" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
        </div>
        <div className="mt-3 bg-red-100 rounded-lg px-3 py-2 flex justify-between">
          <span className="text-xs font-semibold text-red-700">Total Deductions</span>
          <span className="text-sm font-bold text-red-700">PKR {calcDeductions(form).toLocaleString()}</span>
        </div>
      </div>

      {/* NET PAY */}
      <div className="bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm font-bold text-white">NET PAY</span>
        <span className="text-xl font-bold text-white">PKR {calcNet(form).toLocaleString()}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => handleFormChange('notes', e.target.value)}
          placeholder="Additional notes..." rows={2}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setError(''); }}
          className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm">Cancel</button>
        <button onClick={onSubmit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium">{submitLabel}</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {success && <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">✅ {success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 text-sm mt-1">{payrolls.length} total records</p>
        </div>
        {canProcess && (
          <div className="flex gap-2">
            <button onClick={() => { setShowAddModal(true); setForm(emptyForm()); setError(''); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              + Add Payroll
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: payrolls.length, color: 'text-gray-900', bg: 'bg-blue-50', icon: '📋' },
          { label: 'Total Approved', value: `PKR ${(totalPaid/1000).toFixed(0)}K`, color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
          { label: 'Pending Amount', value: `PKR ${(totalPending/1000).toFixed(0)}K`, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⏳' },
          { label: 'Pending Records', value: payrolls.filter(p => p.status === 'pending').length, color: 'text-red-500', bg: 'bg-red-50', icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {([
          { key: 'all', label: '📋 All Records' },
          { key: 'month', label: '📅 By Month' },
          canProcess && { key: 'process', label: '⚡ Process' },
        ] as any[]).filter(Boolean).map((tab: any) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex gap-3">
            <input type="text" placeholder="Search by name or code..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Period', 'Basic', 'Gross', 'Deductions', 'Net Salary', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-16 text-center">
                    <p className="text-3xl mb-3">💰</p>
                    <p className="text-gray-500">No payroll records found</p>
                  </td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                          {p.employee?.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{p.employee?.user?.name}</p>
                          <p className="text-xs text-gray-400">{p.employee?.employeeCode}</p>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{(p.employee as any)?.customRole?.name || 'Employee'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">PKR {p.basic.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">PKR {(p.grossSalary || p.basic + p.allowances).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-red-500">PKR {(p.totalDeductions || p.deductions).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">PKR {p.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setSelectedPayroll(p); setShowSlipModal(true); }}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">Slip</button>
                        {canProcess && (
                          <button onClick={() => openEditModal(p)}
                            className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg">Edit</button>
                        )}
                        {canApprove && p.status === 'pending' && (
                          <button onClick={() => handleApprove(p.id)}
                            className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg">Approve</button>
                        )}
                        {canApprove && p.status === "approved" && (
                          <button onClick={() => handleMarkPaid(p.id)}
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg">Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex gap-3 mb-4">
              <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {monthPayrolls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-500">No payroll for {MONTHS[monthFilter - 1]} {yearFilter}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Employee', 'Basic', 'Gross', 'Deductions', 'Net Pay', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthPayrolls.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">{p.employee?.user?.name}</p>
                          <p className="text-xs text-gray-400">{p.employee?.department?.name || 'Company Wide'}</p>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{(p.employee as any)?.customRole?.name || 'Employee'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">PKR {p.basic.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium">PKR {(p.grossSalary || p.basic + p.allowances).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-500">PKR {(p.totalDeductions || p.deductions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">PKR {p.netSalary.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td className="px-4 py-3 text-sm">Total ({monthPayrolls.length})</td>
                      <td className="px-4 py-3 text-sm">PKR {monthPayrolls.reduce((s, p) => s + p.basic, 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-green-600">PKR {monthPayrolls.reduce((s, p) => s + (p.grossSalary || p.basic + p.allowances), 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-red-500">PKR {monthPayrolls.reduce((s, p) => s + (p.totalDeductions || p.deductions), 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">PKR {monthPayrolls.reduce((s, p) => s + p.netSalary, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'process' && canProcess && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">⚡ Bulk Process Payroll</h2>
            <div className="bg-yellow-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-yellow-700">This will create payroll records for <strong>{employees.filter((emp: any) => !payrolls.some((p: any) => (String(p.employee?.id) === String(emp.id) || String(p.employeeId) === String(emp.id)) && Number(p.month) === Number(monthFilter) && Number(p.year) === Number(yearFilter))).length}</strong> remaining employees for {MONTHS[monthFilter - 1]} {yearFilter}.</p>
            </div>
            <div className="flex gap-3 mb-4">
              <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[2026,2025,2024,2023].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={handleBulkProcess} disabled={bulkLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-medium">
                {bulkLoading ? 'Processing...' : `⚡ Process ${employees.filter((emp: any) => !payrolls.some((p: any) => String(p.employee?.id) === String(emp.id) && p.month === monthFilter && p.year === yearFilter)).length} Payrolls`}
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Employee', 'Basic Salary', 'EOBI (1%)', 'Est. Net Pay'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.filter((emp: any) => !payrolls.some((p: any) => (String(p.employee?.id) === String(emp.id) || String(p.employeeId) === String(emp.id)) && Number(p.month) === Number(monthFilter) && Number(p.year) === Number(yearFilter))).map((emp: any) => {
                  const basic = emp.salary || 0;
                  const eobi = Math.round(basic * 0.01);
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{emp.user.name}</p>
                        <p className="text-sm font-semibold text-gray-900">{emp.user.name}</p>
                        <p className="text-xs text-gray-400">{emp.employeeCode}</p>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-0.5 inline-block">{(emp as any).customRole?.name || 'Employee'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">PKR {basic.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-red-500">PKR {eobi.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">PKR {(basic - eobi).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">⏳ Pending Approvals</h2>
            {payrolls.filter(p => p.status === 'pending').length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No pending approvals</p>
            ) : (
              <div className="space-y-2">
                {payrolls.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{p.employee?.user?.name}</p>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{(p.employee as any)?.customRole?.name || 'Employee'}</span>
                      </div>
                      <p className="text-xs text-gray-400">{MONTHS[p.month - 1]} {p.year} • Net: PKR {p.netSalary.toLocaleString()}</p>
                    </div>
                    {canApprove && (
                      <button onClick={() => handleApprove(p.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium">
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Payroll</h3>
              <button onClick={() => { setShowAddModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <PayrollForm onSubmit={handleAdd} submitLabel="Create Payroll" />
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Payroll — {selectedPayroll.employee?.user?.name}</h3>
              <button onClick={() => { setShowEditModal(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <PayrollForm onSubmit={handleEdit} submitLabel="Update Payroll" />
          </div>
        </div>
      )}

      {/* SALARY SLIP MODAL */}
      {showSlipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Salary Slip</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                  🖨️ Print / PDF
                </button>
                <button onClick={() => setShowSlipModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>

            <div ref={slipRef} className="p-6">
              {/* Company Header */}
              <div className="header flex justify-between items-start pb-5 border-b-4 border-blue-700 mb-5">
                <div>
                  <div className="company-name text-2xl font-black text-blue-700 tracking-tight">{user?.companyName || 'Company Name'}</div>
                  <div className="company-sub text-xs text-gray-400 mt-1">Official Salary Slip</div>
                </div>
                <div className="slip-badge bg-blue-700 text-white px-4 py-2 rounded-lg text-right">
                  <span className="text-xs opacity-80 uppercase tracking-widest">Salary Slip</span>
                  <span className="month block text-lg font-black">{MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}</span>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { label: 'Employee Name', value: selectedPayroll.employee?.user?.name },
                  { label: 'Employee Code', value: selectedPayroll.employee?.employeeCode },
                  { label: 'Designation', value: selectedPayroll.employee?.designation || '—' },
                  { label: 'Department', value: selectedPayroll.employee?.department?.name || 'Company Wide' },
                  { label: 'Month', value: `${MONTHS[selectedPayroll.month - 1]} ${selectedPayroll.year}` },
                  { label: 'Status', value: selectedPayroll.status.toUpperCase() },
                ].map((item, i) => (
                  <div key={i} className="border-b border-gray-100 pb-2">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <table className="w-full">
                    <thead><tr><th colSpan={2} className="bg-green-600 text-white text-left px-3 py-2 text-sm rounded-t-lg">EARNINGS</th></tr></thead>
                    <tbody>
                      {[
                        { label: 'Basic Salary', value: selectedPayroll.basic },
                        { label: 'House Rent', value: selectedPayroll.houseRent || 0 },
                        { label: 'Medical Allowance', value: selectedPayroll.medicalAllowance || 0 },
                        { label: 'Transport', value: selectedPayroll.transportAllowance || 0 },
                        { label: 'Other Allowances', value: selectedPayroll.otherAllowances || 0 },
                        { label: 'Bonus', value: selectedPayroll.bonus || 0 },
                        { label: 'Overtime', value: selectedPayroll.overtimePay || 0 },
                      ].map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-1.5 text-xs text-gray-600">{item.label}</td>
                          <td className="px-3 py-1.5 text-xs text-right font-medium">PKR {item.value.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-green-50 font-bold">
                        <td className="px-3 py-2 text-sm text-green-700">Gross Salary</td>
                        <td className="px-3 py-2 text-sm text-right text-green-700">PKR {(selectedPayroll.grossSalary || selectedPayroll.basic + selectedPayroll.allowances).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <table className="w-full">
                    <thead><tr><th colSpan={2} className="bg-red-600 text-white text-left px-3 py-2 text-sm rounded-t-lg">DEDUCTIONS</th></tr></thead>
                    <tbody>
                      {[
                        { label: 'Withholding Tax', value: selectedPayroll.withholdingTax || 0 },
                        { label: 'EOBI (1%)', value: selectedPayroll.eobi || 0 },
                        { label: 'Loan Deduction', value: selectedPayroll.loanDeduction || 0 },
                        { label: 'Other Deductions', value: selectedPayroll.otherDeductions || 0 },
                      ].map((item, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="px-3 py-1.5 text-xs text-gray-600">{item.label}</td>
                          <td className="px-3 py-1.5 text-xs text-right font-medium">PKR {item.value.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-red-50 font-bold">
                        <td className="px-3 py-2 text-sm text-red-700">Total Deductions</td>
                        <td className="px-3 py-2 text-sm text-right text-red-700">PKR {(selectedPayroll.totalDeductions || selectedPayroll.deductions).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Pay */}
              <div className="net-pay-box bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl p-5 text-center mb-5">
                <p className="net-label text-xs opacity-75 uppercase tracking-widest">Net Pay</p>
                <p className="net-amount text-4xl font-black mt-1">PKR {selectedPayroll.netSalary.toLocaleString()}</p>
                <p className="net-period text-xs opacity-60 mt-1">{MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year} • {selectedPayroll.status.toUpperCase()}</p>
              </div>

              {selectedPayroll.notes && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <p className="text-xs text-gray-500">Notes: {selectedPayroll.notes}</p>
                </div>
              )}

              {/* Signature */}
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2 mt-8">
                    <p className="text-xs text-gray-500">Employee Signature</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayroll.employee?.user?.name}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 pt-2 mt-8">
                    <p className="text-xs text-gray-500">Authorized Signature</p>
                    <p className="text-sm font-semibold text-gray-900">{user?.companyName}</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">This is a computer-generated salary slip and does not require a physical signature.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}