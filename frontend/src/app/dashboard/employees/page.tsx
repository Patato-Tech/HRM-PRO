"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, hasPermission, isCompanyAdmin } from "@/lib/withAuth";
import { apiCall, getToken } from "@/lib/api";

interface Department {
  id: string;
  name: string;
  status: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  designation: string;
  salary?: number;
  status: string;
  joinDate: string;
  roleId?: number;
  department: Department | null;
  customRole?: {
    id: number;
    name: string;
    scope: string;
    permissions: any;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

const ROLES = ["EMPLOYEE"];

const roleColors: Record<string, string> = {
  COMPANY_ADMIN: "bg-purple-100 text-purple-700",
  COMPANY_ADMIN: "bg-purple-100 text-purple-700",
  EMPLOYEE: "bg-green-100 text-green-700",
  EMPLOYEE: "bg-green-100 text-green-700",
};


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
export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth(false);
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [incrementForm, setIncrementForm] = useState({
    amount: "",
    type: "increment",
    reason: "",
  });
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [showSalaryHistory, setShowSalaryHistory] = useState(false);
  const [incrementLoading, setIncrementLoading] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
    departmentId: "",
    salary: "",
    role: "EMPLOYEE",
    roleId: "",
    phone: "",
    cnic: "",
    gender: "",
    employmentType: "full_time",
    joinDate: new Date().toISOString().split("T")[0],
  });
  const [editForm, setEditForm] = useState({
    name: "",
    designation: "",
    departmentId: "",
    salary: "",
    status: "",
    roleId: "",
  });

  // ✅ Reset-password modal state
  const [resetForm, setResetForm] = useState({ newPassword: "", confirm: "" });
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);

  const canView =
    user?.role === "COMPANY_ADMIN" || hasPermission(user, "employees", "view");
  const canCreate =
    user?.role === "COMPANY_ADMIN" ||
    hasPermission(user, "employees", "create");
  const canEditBasic =
    user?.role === "COMPANY_ADMIN" ||
    hasPermission(user, "employees", "edit_basic") ||
    hasPermission(user, "employees", "edit_full") ||
    hasPermission(user, "employees", "edit");
  const canEditFull =
    user?.role === "COMPANY_ADMIN" ||
    hasPermission(user, "employees", "edit_full");
  const canEditSalary =
    user?.role === "COMPANY_ADMIN" ||
    hasPermission(user, "employees", "edit_salary");
  const canDelete =
    user?.role === "COMPANY_ADMIN" ||
    hasPermission(user, "employees", "delete");
  const canEdit = canEditBasic;
  const canManage = canCreate || canEditBasic || canDelete;
  const hideSalary =
    !isCompanyAdmin(user?.role || "") &&
    !hasPermission(user, "employees", "edit_salary");
  useEffect(() => {
    if (authLoading || !user) return;
    if (
      user.role !== "COMPANY_ADMIN" &&
      !hasPermission(user, "employees", "view")
    ) {
      router.replace("/dashboard");
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    const token = getToken() || "";
    try {
      const empData = await apiCall("/employees", {}, token);
      setEmployees(empData);
    } catch (err) {
      console.error("employees error:", err);
    }
    try {
      const deptData = await apiCall("/departments", {}, token);
      setDepartments(deptData);
    } catch {
      setDepartments([]);
    }
    try {
      const rolesData = await apiCall("/roles", {}, token);
      setRoles(rolesData || []);
    } catch {
      setRoles([]);
    }
    setLoading(false);
  };

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleAdd = async () => {
    setError("");
    const errors: string[] = [];
    if (!addForm.name.trim()) errors.push("Full name is required.");
    if (!addForm.email.trim() || !addForm.email.includes("@")) errors.push("Valid email address is required.");
    if (!addForm.password) { errors.push("Password is required."); } else { const pwErrors = validatePassword(addForm.password); if (pwErrors.length > 0) errors.push("Password must have: " + pwErrors.join(", ")); }
    if (addForm.salary && (isNaN(Number(addForm.salary)) || Number(addForm.salary) < 0)) errors.push("Salary must be a positive number.");
    if (addForm.phone && !/^03[0-9]{9}$/.test(addForm.phone.replace(/[-\s]/g, ""))) errors.push("Phone must be a valid Pakistani number (03XXXXXXXXX).");
    if (addForm.cnic && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(addForm.cnic)) errors.push("CNIC format must be XXXXX-XXXXXXX-X.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }
    const selectedRole = roles.find((r: any) => String(r.id) === String(addForm.roleId));
    const isCompanyWide = selectedRole?.scope === "all";
    const isDeptRequired =
      !selectedRole || selectedRole.scope === "own_department";
    if (!addForm.name || !addForm.email || !addForm.password) {
      setError("Name, email and password are required");
      return;
    }
    if (isDeptRequired && !addForm.departmentId) {
      setError("Department is required for this role");
      return;
    }
    try {
      const token = getToken() || "";
      await apiCall(
        "/employees",
        {
          method: "POST",
          body: JSON.stringify({
            ...addForm,
            salary: parseFloat(addForm.salary) || 0,
            roleId: addForm.roleId ? parseInt(addForm.roleId) : null,
          }),
        },
        token,
      );
      setShowAddModal(false);
      setAddForm({
        name: "",
        email: "",
        password: "",
        designation: "",
        departmentId: "",
        salary: "",
        role: "EMPLOYEE",
        roleId: "",
        phone: "",
        cnic: "",
        gender: "",
        employmentType: "full_time",
        joinDate: new Date().toISOString().split("T")[0],
      });
      showSuccessMsg("Employee added successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async () => {
    setError("");
    if (!selectedEmployee) return;
    try {
      const token = getToken() || "";
      await apiCall(
        `/employees/${selectedEmployee.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editForm.name,
            designation: editForm.designation,
            departmentId: editForm.departmentId || null,
            status: editForm.status,
            roleId: editForm.roleId || null,
          }),
        },
        token,
      );
      setShowEditModal(false);
      showSuccessMsg("Employee updated successfully!");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ✅ NEW: admin reset password handler
  const handleResetPassword = async () => {
    setResetError("");
    if (!selectedEmployee) return;
    if (!resetForm.newPassword) {
      setResetError("New password is required");
      return;
    }
    if (resetForm.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirm) {
      setResetError("Passwords do not match");
      return;
    }
    setResetLoading(true);
    try {
      const token = getToken() || "";
      await apiCall(
        `/employees/${selectedEmployee.id}/reset-password`,
        {
          method: "PUT",
          body: JSON.stringify({ newPassword: resetForm.newPassword }),
        },
        token,
      );
      setShowResetModal(false);
      setResetForm({ newPassword: "", confirm: "" });
      showSuccessMsg(`Password reset for ${selectedEmployee.user.name}!`);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    try {
      const token = getToken() || "";
      if (emp.status === "active") {
        await apiCall(
          `/employees/${emp.id}/deactivate`,
          { method: "PUT" },
          token,
        );
        showSuccessMsg("Employee deactivated!");
      } else {
        await apiCall(
          `/employees/${emp.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ status: "active" }),
          },
          token,
        );
        showSuccessMsg("Employee activated!");
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      const token = getToken() || "";
      await apiCall(
        `/employees/${selectedEmployee.id}`,
        { method: "DELETE" },
        token,
      );
      setShowDeleteModal(false);
      setShowDetailModal(false);
      showSuccessMsg("Employee deleted!");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncrement = async () => {
    if (!selectedEmployee || !incrementForm.amount) {
      setError("Amount is required");
      return;
    }
    setIncrementLoading(true);
    try {
      const token = getToken() || "";
      const amount =
        incrementForm.type === "increment"
          ? Math.abs(Number(incrementForm.amount))
          : -Math.abs(Number(incrementForm.amount));
      await apiCall(
        `/employees/${selectedEmployee.id}/increment-salary`,
        {
          method: "PUT",
          body: JSON.stringify({
            amount,
            reason: incrementForm.reason || undefined,
          }),
        },
        token,
      );
      setShowIncrementModal(false);
      showSuccessMsg(
        `Salary ${incrementForm.type === "increment" ? "incremented" : "decremented"} successfully!`,
      );
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update salary");
    } finally {
      setIncrementLoading(false);
    }
  };

  const handleViewSalaryHistory = async (emp: Employee) => {
    const token = getToken() || "";
    try {
      const data = await apiCall(
        `/employees/${emp.id}/salary-history`,
        {},
        token,
      );
      setSalaryHistory(data || []);
      setSelectedEmployee(emp);
      setShowSalaryHistory(true);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.user.name,
      designation: emp.designation || "",
      departmentId: emp.department?.id || "",
      salary: emp.salary != null ? emp.salary.toString() : "",
      status: emp.status,
      roleId: (emp as any).customRole?.id?.toString() || "",
    });
    setShowEditModal(true);
    setError("");
  };

  // ✅ open reset modal
  const openResetModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setResetForm({ newPassword: "", confirm: "" });
    setResetError("");
    setShowResetPw(false);
    setShowResetModal(true);
  };

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    const matchDept = deptFilter === "all" || String(emp.department?.id) === String(deptFilter);
    const isOwnRecord = !!(
      user?.customRoleName && String(emp.user.id) === String(user?.id)
    );
    return matchSearch && matchStatus && matchDept && !isOwnRecord;
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <style>{`.emp-row { transition: all 0.15s ease; } .emp-row:hover { background: #f8faff !important; }`}</style>
      {/* Success Toast */}
      {success && (
        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold flex items-center gap-2" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Employees</h1>
          <p className="text-gray-400 text-sm mt-0.5">{employees.length} total employees across all departments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const canSeeSalary = user?.role === "COMPANY_ADMIN" || user?.role === "HR_MANAGER";
              const { default: jsPDF } = await import('jspdf');
              const { default: autoTable } = await import('jspdf-autotable');
              const doc = new jsPDF();
              doc.setFontSize(16);
              doc.setTextColor(30, 64, 175);
              doc.text("Employee Report", 14, 20);
              doc.setFontSize(9);
              doc.setTextColor(100, 100, 100);
              doc.text("Company: " + (user?.companyName || "-") + "   |   Generated: " + new Date().toLocaleDateString() + "   |   Total: " + employees.length + " employees", 14, 28);
              const cols = ["Name", "Code", "Designation", "Department", "Role", "Status", ...(canSeeSalary ? ["Salary"] : [])];
              const rows = employees.map(emp => [
                emp.user.name,
                emp.employeeCode,
                emp.designation || "-",
                emp.department?.name || "Company Wide",
                emp.customRole?.name || emp.user.role?.replace(/_/g, " "),
                emp.status.charAt(0).toUpperCase() + emp.status.slice(1),
                ...(canSeeSalary ? ["PKR " + Number(emp.salary).toLocaleString()] : [])
              ]);
              autoTable(doc, {
                startY: 34,
                head: [cols],
                body: rows,
                headStyles: { fillColor: [30, 64, 175], fontSize: 9 },
                bodyStyles: { fontSize: 9 },
                alternateRowStyles: { fillColor: [249, 250, 251] },
              });
              doc.save("Employee_Report_" + new Date().toISOString().split("T")[0] + ".pdf");
            }}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}
          >
            📄 Export PDF
          </button>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setError("");
            }}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}
          >
            + Add Employee
          </button>
        )}
        {canCreate && (
          <button
            onClick={() => setShowImportModal(true)}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{background:"linear-gradient(135deg,#7c3aed,#8b5cf6)",boxShadow:"0 4px 12px rgba(139,92,246,0.3)"}}
          >
            📥 Import CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Staff",
            value: employees.length,
            color: "text-gray-900",
            bg: "bg-blue-50",
          },
          {
            label: "Active",
            value: employees.filter((e) => e.status === "active").length,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Inactive",
            value: employees.filter((e) => e.status === "inactive").length,
            color: "text-red-500",
            bg: "bg-red-50",
          },
          {
            label: "Resigned",
            value: employees.filter((e) => e.status === "resigned").length,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "Terminated",
            value: employees.filter((e) => e.status === "terminated").length,
            color: "text-red-700",
            bg: "bg-red-50",
          },
          {
            label: "Sabbatical",
            value: employees.filter((e) => e.status === "sabbatical").length,
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            label: "With Custom Role",
            value: employees.filter((e) => (e as any).customRole).length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "No Role Assigned",
            value: employees.filter((e) => !(e as any).customRole).length,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white cursor-default`}
            style={{boxShadow:"0 2px 10px rgba(0,0,0,0.06)",transition:"all 0.2s"}}
            onMouseEnter={e => (e.currentTarget.style.transform="translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform="translateY(0)")}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100" style={{boxShadow:"0 2px 10px rgba(0,0,0,0.04)"}}>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name, email, code, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
            <option value="sabbatical">Sabbatical</option>
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  "Employee",
                  "Code",
                  "Designation",
                  "Department",
                  ...(!hideSalary ? ["Salary"] : []),
                  "Role",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-black text-slate-300 uppercase tracking-widest"
                    style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={hideSalary ? 7 : 8}
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-gray-500 font-medium">
                      No employees found
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {emp.user.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {emp.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {emp.employeeCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.designation || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                        {emp.department?.name || "Company Wide"}
                      </span>
                    </td>








                    {!hideSalary && (
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {emp.salary != null
                          ? `PKR ${emp.salary.toLocaleString()}`
                          : "—"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(emp as any).customRole ? "bg-blue-100 text-blue-700" : roleColors[emp.user?.role] || "bg-gray-100 text-gray-600"}`}
                      >
                        {(emp as any).customRole?.name ||
                          emp.customRole?.name || emp.user?.role?.replace(/_/g, " ") ||
                          "Employee"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${emp.status === "active" ? "bg-green-100 text-green-700" : emp.status === "sabbatical" ? "bg-blue-100 text-blue-700" : emp.status === "resigned" ? "bg-orange-100 text-orange-700" : emp.status === "terminated" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowDetailModal(true);
                          }}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg"
                        >
                          View
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEditModal(emp)}
                              className="text-xs bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-2.5 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            {/* ✅ Reset Password button */}
                            <button
                              onClick={() => openResetModal(emp)}
                              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg"
                            >
                              Reset Pwd
                            </button>
                            {canEditSalary && (
                              <button
                                onClick={() => {
                                  setShowIncrementModal(true);
                                  setSelectedEmployee(emp);
                                  setIncrementForm({
                                    amount: "",
                                    type: "increment",
                                    reason: "",
                                  });
                                }}
                                className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg"
                              >
                                💰 Salary
                              </button>
                            )}
                            {emp.user.id !== user?.id && (
                              <button
                                onClick={() => handleDeactivate(emp)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg ${emp.status === "active" ? "bg-red-50 text-red-600 hover:bg-red-100" : emp.status === "inactive" ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-50 text-gray-500 cursor-default"}`}
                              >
                                {emp.status === "active" ? "Deactivate" : emp.status === "inactive" ? "Activate" : emp.status === "resigned" ? "Resigned" : emp.status === "terminated" ? "Terminated" : "On Sabbatical"}
                              </button>
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

      {/* DETAIL MODAL */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Employee Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5 p-4 bg-blue-50 rounded-2xl">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl">
                {selectedEmployee.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {selectedEmployee.user.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedEmployee.user.email}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedEmployee.customRole ? "bg-blue-100 text-blue-700" : roleColors[selectedEmployee.user.role] || "bg-gray-100 text-gray-600"}`}
                >
                  {selectedEmployee.customRole?.name || selectedEmployee.user.role.replace(/_/g, " ")}

                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Employee Code",
                  value: selectedEmployee.employeeCode,
                },
                {
                  label: "Status",
                  value: selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1),
                  badge: true,
                },
                {
                  label: "Designation",
                  value: selectedEmployee.designation || "—",
                },
                {
                  label: "Department",
                  value: selectedEmployee.department?.name || "—",
                },
                ...(!hideSalary
                  ? [
                      {
                        label: "Salary",
                        value:
                          selectedEmployee.salary != null
                            ? `PKR ${selectedEmployee.salary.toLocaleString()}`
                            : "—",
                      },
                    ]
                  : []),
                {
                  label: "Join Date",
                  value: new Date(
                    selectedEmployee.joinDate,
                  ).toLocaleDateString(),
                },
              ].map((item: any, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  {item.badge ? (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedEmployee.status === "active" ? "bg-green-100 text-green-700" : selectedEmployee.status === "sabbatical" ? "bg-blue-100 text-blue-700" : selectedEmployee.status === "resigned" ? "bg-orange-100 text-orange-700" : selectedEmployee.status === "terminated" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {item.value}
                    </span>
                  ) : (
                    <p className="text-gray-900 font-semibold text-sm">
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm"
              >
                Close
              </button>
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedEmployee);
                    }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-sm font-medium"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Add New Employee
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Fill in the details to create a new employee account
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Section 1: Account Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Account Information
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm({ ...addForm, name: e.target.value })
                      }
                      placeholder="Enter full name"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm({ ...addForm, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm({ ...addForm, password: e.target.value })
                      }
                      placeholder="Enter password"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  {addForm.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Password strength</span>
                        <span className="text-xs font-bold" style={{color: getPasswordStrength(addForm.password).color}}>{getPasswordStrength(addForm.password).label}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div className="h-1.5 rounded-full transition-all" style={{width: getPasswordStrength(addForm.password).width, background: getPasswordStrength(addForm.password).color}}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { label: "8+ characters", test: addForm.password.length >= 8 },
                          { label: "Uppercase letter", test: /[A-Z]/.test(addForm.password) },
                          { label: "Lowercase letter", test: /[a-z]/.test(addForm.password) },
                          { label: "Number", test: /[0-9]/.test(addForm.password) },
                          { label: "Special character", test: /[@#$!%*?&]/.test(addForm.password) },
                        ].map((req, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${req.test ? "text-green-500" : "text-gray-300"}`}>{req.test ? "✓" : "○"}</span>
                            <span className={`text-xs ${req.test ? "text-green-600" : "text-gray-400"}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={(e) =>
                        setAddForm({ ...addForm, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Job Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Job Details
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={addForm.designation}
                      onChange={(e) =>
                        setAddForm({ ...addForm, designation: e.target.value })
                      }
                      placeholder="Enter designation"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Salary (PKR)
                    </label>
                    <input
                      type="number"
                      value={addForm.salary}
                      onChange={(e) =>
                        setAddForm({ ...addForm, salary: e.target.value })
                      }
                      placeholder="Enter salary"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Department{" "}
                      {!roles.find(
                        (r: any) => String(r.id) === String(addForm.roleId),
                      ) ||
                      roles.find(
                        (r: any) => String(r.id) === String(addForm.roleId),
                      )?.scope === "own_department" ? (
                        <span className="text-red-500">*</span>
                      ) : (
                        <span className="text-gray-400">(optional)</span>
                      )}
                    </label>
                    <select
                      value={addForm.departmentId}
                      onChange={(e) =>
                        setAddForm({ ...addForm, departmentId: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="">Select Department</option>
                      {departments
                        .filter((d) => d.status === "active")
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={addForm.employmentType}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          employmentType: e.target.value,
                        })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={addForm.joinDate}
                      onChange={(e) =>
                        setAddForm({ ...addForm, joinDate: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Custom Role{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      value={addForm.roleId}
                      onChange={(e) =>
                        setAddForm({ ...addForm, roleId: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="">No Custom Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Personal Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Personal Information{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      CNIC
                    </label>
                    <input
                      type="text"
                      value={addForm.cnic}
                      onChange={(e) =>
                        setAddForm({ ...addForm, cnic: e.target.value })
                      }
                      placeholder="Enter CNIC number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Gender
                    </label>
                    <select
                      value={addForm.gender}
                      onChange={(e) =>
                        setAddForm({ ...addForm, gender: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError("");
                }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT MODAL */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-gray-900">Edit Employee</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedEmployee.user.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Designation</label>
                <input type="text" value={editForm.designation} onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                  placeholder="Enter designation"
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                  <select value={editForm.departmentId} onChange={(e) => setEditForm({...editForm, departmentId: e.target.value})}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50">
                    <option value="">No Department</option>
                    {departments.filter((d) => d.status === "active").map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                    <option value="sabbatical">Sabbatical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom Role</label>
                <select value={editForm.roleId} onChange={(e) => setEditForm({...editForm, roleId: e.target.value})}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-gray-50">
                  <option value="">Default Employee</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleEdit}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESET PASSWORD MODAL */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Password
              </h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900 text-sm">
                {selectedEmployee.user.name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedEmployee.user.email}
              </p>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              You're setting a new password directly. Share it with the employee
              — they can change it later from their Profile.
            </p>

            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {resetError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showResetPw ? "text" : "password"}
                    value={resetForm.newPassword}
                    onChange={(e) =>
                      setResetForm({
                        ...resetForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="At least 6 characters"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPw(!showResetPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    {showResetPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div>
              {resetForm.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span className="text-xs font-bold" style={{color: getPasswordStrength(resetForm.newPassword).color}}>{getPasswordStrength(resetForm.newPassword).label}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className="h-1.5 rounded-full transition-all" style={{width: getPasswordStrength(resetForm.newPassword).width, background: getPasswordStrength(resetForm.newPassword).color}}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "8+ characters", test: resetForm.newPassword.length >= 8 },
                      { label: "Uppercase letter", test: /[A-Z]/.test(resetForm.newPassword) },
                      { label: "Lowercase letter", test: /[a-z]/.test(resetForm.newPassword) },
                      { label: "Number", test: /[0-9]/.test(resetForm.newPassword) },
                      { label: "Special character", test: /[@#$!%*?&]/.test(resetForm.newPassword) },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${req.test ? "text-green-500" : "text-gray-300"}`}>{req.test ? "✓" : "○"}</span>
                        <span className={`text-xs ${req.test ? "text-green-600" : "text-gray-400"}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showResetPw ? "text" : "password"}
                  value={resetForm.confirm}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, confirm: e.target.value })
                  }
                  placeholder="Re-enter new password"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Employee?
            </h3>
            <p className="text-gray-500 text-sm mb-1">
              You are about to delete
            </p>
            <p className="font-bold text-gray-900 mb-4">
              "{selectedEmployee.user.name}"
            </p>
            <p className="text-red-500 text-xs mb-6">
              This will permanently remove the employee and their user account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#dc2626,#ef4444)"}}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showIncrementModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Salary
              </h3>
              <button
                onClick={() => {
                  setShowIncrementModal(false);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                x
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedEmployee.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  Current Salary: PKR{" "}
                  {(selectedEmployee as any).salary?.toLocaleString() || 0}
                </p>
              </div>
              <button
                onClick={() => handleViewSalaryHistory(selectedEmployee)}
                className="text-xs bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                View History
              </button>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={incrementForm.type}
                  onChange={(e) =>
                    setIncrementForm({ ...incrementForm, type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="increment">Increment (Increase)</option>
                  <option value="decrement">Decrement (Decrease)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (PKR) *
                </label>
                <input
                  type="number"
                  value={incrementForm.amount}
                  onChange={(e) =>
                    setIncrementForm({
                      ...incrementForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    "Annual Increment",
                    "Performance Bonus",
                    "Promotion",
                    "Market Adjustment",
                    "Correction",
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setIncrementForm({ ...incrementForm, reason: r })
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${incrementForm.reason === r ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={incrementForm.reason}
                  onChange={(e) =>
                    setIncrementForm({
                      ...incrementForm,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Or type custom reason..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowIncrementModal(false);
                  setError("");
                }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleIncrement}
                disabled={incrementLoading}
                className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}
              >
                {incrementLoading ? "Updating..." : "Update Salary"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSalaryHistory && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Salary History — {selectedEmployee.user.name}
              </h3>
              <button
                onClick={() => setShowSalaryHistory(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                x
              </button>
            </div>
            {salaryHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-gray-500">No salary history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {salaryHistory.map((h: any) => (
                  <div
                    key={h.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${h.type === "increment" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {h.type === "increment" ? "▲ Increment" : "▼ Decrement"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-gray-400">Old Salary</p>
                        <p className="font-semibold text-gray-900">
                          PKR {h.oldSalary?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-gray-400">Amount</p>
                        <p
                          className={`font-semibold ${h.type === "increment" ? "text-green-600" : "text-red-600"}`}
                        >
                          {h.type === "increment" ? "+" : "-"}PKR{" "}
                          {h.amount?.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-gray-400">New Salary</p>
                        <p className="font-semibold text-gray-900">
                          PKR {h.newSalary?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {h.reason && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                        Reason: {h.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      By: Administration
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowSalaryHistory(false)}
              className="w-full mt-4 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  📥 Bulk Import Employees
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Import multiple employees at once using a CSV file
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                  setImportResults(null);
                  setImportProgress(0);
                }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {importResults ? (
                /* Success Screen */
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    Import Complete!
                  </p>
                  <p className="text-green-600 font-semibold text-lg">
                    ✅ {importResults.success} employees imported successfully
                  </p>
                  {importResults.failed > 0 && (
                    <p className="text-red-500 mt-1">
                      ❌ {importResults.failed} records failed
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportRows([]);
                      setImportResults(null);
                      setImportProgress(0);
                      fetchData();
                    }}
                    className="mt-6 text-white px-8 py-3 rounded-xl text-sm font-bold" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}
                  >
                    Done
                  </button>
                </div>
              ) : importLoading ? (
                /* Progress Screen */
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <span className="text-4xl">⏳</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    Importing Employees...
                  </p>
                  <p className="text-gray-500 text-sm mb-6">
                    Please wait, do not close this window
                  </p>
                  <div className="w-full max-w-xs mx-auto bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-600 font-semibold mt-2">
                    {importProgress}%
                  </p>
                </div>
              ) : importRows.length === 0 ? (
                /* Upload Screen */
                <div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-5 border border-blue-100">
                    <p className="text-sm font-black text-blue-800 mb-3">📋 How to Import Employees</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span><p className="text-xs text-blue-700">Download the CSV template using the button below</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span><p className="text-xs text-blue-700">Open in Excel or Google Sheets — do NOT change column headers</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span><p className="text-xs text-blue-700">Fill in employee details row by row starting from row 2</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">4</span><p className="text-xs text-blue-700">Save as CSV format then upload the file here</p></div>
                      <div className="flex items-start gap-2"><span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">5</span><p className="text-xs text-blue-700">Review the data, fix any errors shown in red, then click Import</p></div>
                    </div>
                    <p className="text-xs font-bold text-blue-800 mb-1">📄 Column Reference:</p>
                    <p className="text-xs text-blue-700 font-mono bg-white rounded-lg px-3 py-2 border border-blue-100 mb-3">Name, Email, Password, Designation, Department, Salary, Phone, CNIC, Gender, EmploymentType, CustomRole</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-600">
                      <p>• Name, Email, Password — required</p>
                      <p>• Department — optional (blank = Company Wide)</p>
                      <p>• Salary — number only e.g. 50000</p>
                      <p>• Gender — male, female, other</p>
                      <p>• EmploymentType — full_time, part_time, contract, intern</p>
                      <p>• CustomRole — must exist in Roles page (optional)</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-blue-700">
                        🏢 Available Departments:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {departments.map((d: any) => (
                          <span
                            key={d.id}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-5">
                    <button
                      onClick={() => {
                        const csv =
                          "Name,Email,Password,Designation,Department,Salary,Phone,CNIC,Gender,EmploymentType,CustomRole\nSam Smith,sam@company.com,pass123,Developer,Hardware Department,50000,03001234567,12345-1234567-1,male,full_time,";
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "employees_template.csv";
                        a.click();
                      }}
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-green-200"
                    >
                      📄 Download Template
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-300 transition-colors">
                    <div className="text-4xl mb-3">📂</div>
                    <p className="text-gray-700 font-semibold mb-1">
                      Upload your CSV file
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Drag and drop or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const text = evt.target?.result as string;
                          const lines = text
                            .split("\n")
                            .filter((l) => l.trim());
                          const existingEmails = employees.map((emp: any) =>
                            emp.user.email.toLowerCase(),
                          );
                          const rows = lines.slice(1).map((line, idx) => {
                            // Handle quoted CSV fields
                            const cols: string[] = [];
                            let current = "";
                            let inQuotes = false;
                            for (const char of line) {
                              if (char === '"') inQuotes = !inQuotes;
                              else if (char === "," && !inQuotes) {
                                cols.push(current.trim());
                                current = "";
                              } else current += char;
                            }
                            cols.push(current.trim());

                            const row: any = {
                              id: idx,
                              name: cols[0] || "",
                              email: cols[1] || "",
                              password: cols[2] || "",
                              designation: cols[3] || "",
                              department: cols[4] || "",
                              role: "EMPLOYEE",
                              salary: cols[5] || "0",
                              phone: cols[6] || "",
                              cnic: cols[7] || "",
                              gender: cols[8] || "",
                              employmentType: cols[9] || "full_time",
                              customRole: cols[10] || "",
                              selected: true,
                              error: "",
                            };

                            if (!row.name) row.error = "Name required";
                            else if (!row.email || !row.email.includes("@"))
                              row.error = "Valid email required";
                            else if (!row.password || row.password.length < 6)
                              row.error = "Password min 6 chars";
                            else if (existingEmails.includes(row.email.toLowerCase()))
                              row.error = "Email already exists";

                            else if (row.customRole) {
                              const roleExists = (roles || []).some((r: any) => r.name.toLowerCase() === row.customRole.toLowerCase());
                              if (!roleExists) row.error = `Custom role "${row.customRole}" not found. Create it in Roles page first.`;
                            }

                            return row;
                          });
                          setImportRows(rows);
                        };
                        reader.readAsText(file);
                      }}
                      className="border border-gray-300 rounded-xl px-4 py-2 text-sm text-gray-900 cursor-pointer hover:border-blue-400"
                    />
                  </div>
                </div>
              ) : (
                /* Review Screen */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ✅ {importRows.filter((r) => !r.error).length} Valid
                      </span>
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                        ❌ {importRows.filter((r) => r.error).length} Invalid
                      </span>
                      <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold">
                        ☑️ {importRows.filter((r) => r.selected).length}{" "}
                        Selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setImportRows((prev) =>
                            prev.map((r) => ({ ...r, selected: !r.error })),
                          )
                        }
                        className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        Select Valid Only
                      </button>
                      <button
                        onClick={() =>
                          setImportRows((prev) =>
                            prev.map((r) => ({ ...r, selected: true })),
                          )
                        }
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setImportRows([])}
                        className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
                      >
                        ↩ Re-upload
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            ✓
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Name
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Email
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Designation
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Department
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Custom Role
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Salary
                          </th>
                          <th className="px-3 py-2.5 text-left text-gray-500 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {importRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`${row.error ? "bg-red-50" : row.selected ? "bg-green-50" : "bg-white"} transition-colors`}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={(e) =>
                                  setImportRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, selected: e.target.checked }
                                        : r,
                                    ),
                                  )
                                }
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) =>
                                  setImportRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            name: e.target.value,
                                            error: !e.target.value
                                              ? "Name required"
                                              : r.error === "Name required"
                                                ? ""
                                                : r.error,
                                          }
                                        : r,
                                    ),
                                  )
                                }
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-28 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.email}
                                onChange={(e) =>
                                  setImportRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            email: e.target.value,
                                            error: !e.target.value.includes("@")
                                              ? "Valid email required"
                                              : r.error ===
                                                  "Valid email required"
                                                ? ""
                                                : r.error,
                                          }
                                        : r,
                                    ),
                                  )
                                }
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {row.designation || "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {row.department || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${row.customRole ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                                {row.customRole || "Employee"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              PKR {Number(row.salary).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              {row.error ? (
                                <span className="text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                                  ❌ {row.error}
                                </span>
                              ) : (
                                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                  ✅ Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setImportRows([]);
                        setImportResults(null);
                      }}
                      className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      disabled={
                        importRows.filter((r) => r.selected && !r.error)
                          .length === 0
                      }
                      onClick={async () => {
                        setImportLoading(true);
                        const token = getToken() || "";
                        const selectedRows = importRows.filter(
                          (r) => r.selected && !r.error,
                        );
                        let success = 0;
                        let failed = 0;
                        for (let i = 0; i < selectedRows.length; i++) {
                          const row = selectedRows[i];
                          setImportProgress(
                            Math.round(((i + 1) / selectedRows.length) * 100),
                          );
                          try {
                            const dept = departments.find(
                              (d: any) =>
                                d.name.toLowerCase() ===
                                row.department.toLowerCase(),
                            );
                            await apiCall(
                              "/employees",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  name: row.name,
                                  email: row.email,
                                  password: row.password,
                                  designation: row.designation,
                                  departmentId: dept?.id || null,
                                  role: row.role,
                                  salary: Number(row.salary),
                                  phone: row.phone || null,
                                  cnic: row.cnic || null,
                                  gender: row.gender || null,
                                  employmentType: row.employmentType || "full_time",
                                  ...(row.customRole ? { customRoleName: row.customRole } : {}),
                                }),
                              },
                              token,
                            );
                            success++;
                          } catch {
                            failed++;
                          }
                        }
                        setImportLoading(false);
                        setImportResults({ success, failed });
                      }}
                      className="flex-1 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}
                    >
                      Import{" "}
                      {importRows.filter((r) => r.selected && !r.error).length}{" "}
                      Employees
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


























