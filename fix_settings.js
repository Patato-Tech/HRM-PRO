const fs = require("fs");

// 1. Create settings page
const settingsPage = `"use client";
import { useState, useEffect } from "react";
import { useAuth, isCompanyAdmin } from "@/lib/withAuth";
import { useRouter } from "next/navigation";

const TOGGLEABLE_MODULES = [
  { key: "recruitment", label: "Recruitment", icon: "REC", desc: "Job postings and applicant tracking" },
  { key: "training", label: "Training & Development", icon: "TRN", desc: "Training programs and enrollments" },
  { key: "performance", label: "Performance Reviews", icon: "PRF", desc: "KPI tracking and employee reviews" },
  { key: "documents", label: "Documents", icon: "DOC", desc: "Employee document management" },
  { key: "roles", label: "Custom Roles", icon: "ROL", desc: "Create and manage custom roles" },
];

const CORE_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "DB", desc: "Main overview and quick actions" },
  { key: "employees", label: "Employees", icon: "EMP", desc: "Employee management" },
  { key: "departments", label: "Departments", icon: "DPT", desc: "Department management" },
  { key: "attendance", label: "Attendance", icon: "ATT", desc: "Attendance tracking" },
  { key: "leaves", label: "Leaves", icon: "LVE", desc: "Leave management" },
  { key: "payroll", label: "Payroll", icon: "PAY", desc: "Payroll processing" },
  { key: "reports", label: "Reports", icon: "RPT", desc: "Analytics and reports" },
];

export default function SettingsPage() {
  const { user, loading } = useAuth(false);
  const router = useRouter();
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && user && !isCompanyAdmin(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading]);

  useEffect(() => {
    const saved = localStorage.getItem("company_modules_" + localStorage.getItem("user_companyId"));
    if (saved) {
      setModules(JSON.parse(saved));
    } else {
      const defaults: Record<string, boolean> = {};
      TOGGLEABLE_MODULES.forEach(m => defaults[m.key] = true);
      setModules(defaults);
    }
  }, []);

  const handleToggle = (key: string) => {
    const updated = { ...modules, [key]: !modules[key] };
    setModules(updated);
    localStorage.setItem("company_modules_" + localStorage.getItem("user_companyId"), JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Dispatch event so sidebar updates
    window.dispatchEvent(new Event("modules_updated"));
  };

  if (loading || !user) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      {saved && <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>✅ Settings saved!</div>}
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Company Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage which modules are visible to your team</p>
      </div>

      {/* Core Modules */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-blue-600 text-xs font-black">🔒</span>
          </div>
          <div>
            <h2 className="font-black text-gray-900">Core Modules</h2>
            <p className="text-xs text-gray-400">These modules are always active and cannot be disabled</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CORE_MODULES.map(mod => (
            <div key={mod.key} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{mod.label}</p>
                <p className="text-xs text-gray-400 truncate">{mod.desc}</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs">✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Modules */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.05)"}}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-purple-600 text-xs font-black">⚙️</span>
          </div>
          <div>
            <h2 className="font-black text-gray-900">Optional Modules</h2>
            <p className="text-xs text-gray-400">Toggle these modules on or off for your entire company</p>
          </div>
        </div>
        <div className="space-y-3">
          {TOGGLEABLE_MODULES.map(mod => (
            <div key={mod.key} className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all"
              style={{borderColor: modules[mod.key] ? "#bfdbfe" : "#f1f5f9", background: modules[mod.key] ? "#eff6ff" : "#f8fafc"}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white flex-shrink-0"
                style={{background: modules[mod.key] ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#9ca3af,#d1d5db)"}}>
                {mod.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{mod.label}</p>
                <p className="text-xs text-gray-400">{mod.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={"text-xs font-bold " + (modules[mod.key] ? "text-blue-600" : "text-gray-400")}>
                  {modules[mod.key] ? "Active" : "Hidden"}
                </span>
                <button onClick={() => handleToggle(mod.key)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{background: modules[mod.key] ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "#d1d5db"}}>
                  <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform " + (modules[mod.key] ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`;

fs.writeFileSync("C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/settings/page.tsx", settingsPage, "utf8");
console.log("Settings page created!");

// 2. Update layout.tsx to add settings to nav and filter based on localStorage
let layoutFile = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/layout.tsx";
let layout = fs.readFileSync(layoutFile, "utf8");

// Add settings to nav items
layout = layout.replace(
  `  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: "DOC",
    roles: "documents",
  },`,
  `  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: "DOC",
    roles: "documents",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "SET",
    roles: "company_admin",
    soon: false,
  },`
);

// Add module state to layout
layout = layout.replace(
  `  const [profileOpen, setProfileOpen] = useState(false);`,
  `  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadModules = () => {
      const companyId = localStorage.getItem("user_companyId");
      const saved = localStorage.getItem("company_modules_" + companyId);
      if (saved) setActiveModules(JSON.parse(saved));
      else setActiveModules({ recruitment: true, training: true, performance: true, documents: true, roles: true });
    };
    loadModules();
    window.addEventListener("modules_updated", loadModules);
    return () => window.removeEventListener("modules_updated", loadModules);
  }, []);`
);

// Filter nav items based on active modules
layout = layout.replace(
  `  const visibleNav = allNavItems.filter((item) => {
    if (isPlainEmployee) {
      return ["all", "attendance", "leaves", "payroll"].includes(item.roles);
    }
    return isAllowed(item.roles);
  });`,
  `  const OPTIONAL_MODULES = ["recruitment", "training", "performance", "documents", "roles"];

  const visibleNav = allNavItems.filter((item) => {
    if (isPlainEmployee) {
      return ["all", "attendance", "leaves", "payroll"].includes(item.roles);
    }
    // Check if optional module is disabled
    const moduleKey = item.href.replace("/dashboard/", "");
    if (OPTIONAL_MODULES.includes(moduleKey) && activeModules[moduleKey] === false) return false;
    return isAllowed(item.roles);
  });`
);

fs.writeFileSync(layoutFile, layout, "utf8");
console.log("Layout updated!");
