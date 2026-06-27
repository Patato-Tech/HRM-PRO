"use client";
import "../sidebar.css";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth, hasPermission } from "@/lib/withAuth";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "DB", roles: "all", soon: false },
  { href: "/dashboard/employees", label: "Employees", icon: "EMP", roles: "manage_employees", soon: false },
  { href: "/dashboard/departments", label: "Departments", icon: "DPT", roles: "manage_departments", soon: false },
  { href: "/dashboard/attendance", label: "Attendance", icon: "ATT", roles: "attendance", soon: false },
  { href: "/dashboard/leaves", label: "Leaves", icon: "LVE", roles: "leaves", soon: false },
  { href: "/dashboard/payroll", label: "Payroll", icon: "PAY", roles: "manage_payroll", soon: false },
  { href: "/dashboard/reports", label: "Reports", icon: "RPT", roles: "reports", soon: false },
  { href: "/dashboard/roles", label: "Roles", icon: "ROL", roles: "company_admin", soon: false },
  { href: "/dashboard/performance", label: "Performance", icon: "PRF", roles: "performance" },
  { href: "/dashboard/recruitment", label: "Recruitment", icon: "REC", roles: "recruitment" },
  { href: "/dashboard/training", label: "Training", icon: "TRN", roles: "training" },
  { href: "/dashboard/documents", label: "Documents", icon: "DOC", roles: "documents" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth(false);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem('dark_mode');
    if (saved === 'true') { setDarkMode(true); document.documentElement.setAttribute('data-theme', 'dark'); }
    const pic = localStorage.getItem('user_profile_pic');
    if (pic) setProfilePic(pic);
  }, []);
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('dark_mode', String(next));
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  };
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const isPlainEmployee = user.role === "EMPLOYEE" && !user.customRoleName;
  const isAdmin = user.role === "COMPANY_ADMIN";

  const isAllowed = (roles: string) => {
    if (roles === "all") return true;
    if (roles === "company_admin") return isAdmin;
    if (isPlainEmployee) return false;
    if (isAdmin) return true;
    if (roles === "manage_employees") return hasPermission(user, "employees", "view");
    if (roles === "manage_departments") return hasPermission(user, "departments", "view");
    if (roles === "manage_payroll") return hasPermission(user, "payroll", "view");
    if (roles === "attendance") return hasPermission(user, "attendance", "view");
    if (roles === "leaves") return hasPermission(user, "leaves", "view") || hasPermission(user, "leaves", "approve");
    if (roles === "reports") return hasPermission(user, "reports", "view");
    if (roles === "performance") return isAdmin || hasPermission(user, "performance", "view");
    if (roles === "recruitment") return isAdmin || hasPermission(user, "recruitment", "view");
    if (roles === "training") return isAdmin || hasPermission(user, "training", "view");
    if (roles === "documents") return isAdmin || hasPermission(user, "documents", "view");
    return false;
  };

  const OPTIONAL_MODULES = ["recruitment", "training", "performance", "documents", "roles"];
  const visibleNav = allNavItems.filter((item) => {
    if (isPlainEmployee) return ["all", "attendance", "leaves", "payroll"].includes(item.roles);
    if (isAdmin) return isAllowed(item.roles);
    const moduleKey = item.href.replace("/dashboard/", "");
    if (OPTIONAL_MODULES.includes(moduleKey) && activeModules[moduleKey] === false) return false;
    return isAllowed(item.roles);
  });

  const roleLabel = user.customRoleName || user.role?.replace(/_/g, " ") || "User";

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-64" style={{background:"linear-gradient(180deg,#0f172a 0%,#1e293b 100%)"}}>
      <style>{`
        .nav-link { transition: all 0.15s ease; }
        .nav-link:hover { background: rgba(255,255,255,0.08) !important; transform: translateX(2px); }
        .user-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .dd-item:hover { background: rgba(255,255,255,0.06) !important; }
        .dd-logout:hover { background: rgba(239,68,68,0.15) !important; }
      `}</style>

      {/* Logo */}
      <div className="p-5" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>H</div>
          <div>
            <p className="font-black text-white text-sm">HRMPro</p>
            <p className="text-xs truncate max-w-[120px]" style={{color:"rgba(255,255,255,0.4)"}}>{user.companyName || "Enterprise"}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color:"rgba(255,255,255,0.3)"}}>{user.companyName}{user.departmentName ? ` · ${user.departmentName}` : ""}</p>
        <p className="text-sm font-bold text-white truncate">{user.name}</p>
        <p className="text-xs truncate" style={{color:"rgba(255,255,255,0.4)"}}>{user.email}</p>
        {user.departmentName && <p className="text-xs truncate mt-0.5" style={{color:"#60a5fa"}}>{user.departmentName}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1" style={{overflowY:"scroll",scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,0.1) transparent"}}>
        {visibleNav.map((item) => {
          if (item.soon) {
            return (
              <span key={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed" style={{color:"rgba(255,255,255,0.2)"}}>
                <span className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.3)"}}>Soon</span>
              </span>
            );
          }
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
              style={isActive ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",boxShadow:"0 4px 15px rgba(59,130,246,0.4)"} : {color:"rgba(255,255,255,0.6)"}}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-60" />}
            </a>
          );
        })}
      </nav>

      {/* Profile dropdown */}
      <div className="p-3" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}} ref={dropdownRef}>
        {profileOpen && (
          <div className="mb-2 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
                  <span className="text-white">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs" style={{color:"rgba(255,255,255,0.4)"}}>{user.email}</p>
                </div>
              </div>
            </div>
            <a href="/dashboard/profile" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
              className="dd-item flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all" style={{color:"rgba(255,255,255,0.7)"}}>
              <span>👤</span><span>View Profile</span>
            </a>
            <a href="/dashboard/profile" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
              className="dd-item flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all" style={{color:"rgba(255,255,255,0.7)"}}>
              <span>🔒</span><span>Change Password</span>
            </a>
            {user?.role === "COMPANY_ADMIN" && (
              <a href="/dashboard/settings" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
                className="dd-item flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all" style={{color:"rgba(255,255,255,0.7)"}}>
                <span>⚙️</span><span>Company Settings</span>
              </a>
            )}
            <button onClick={toggleDarkMode} className="dd-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all" style={{color:"rgba(255,255,255,0.7)"}}>
              <span>{darkMode ? "☀️" : "🌙"}</span><span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="dd-logout w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 transition-all">
                <span>🚪</span><span>Logout</span>
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setProfileOpen((prev) => !prev)}
          className="user-btn w-full flex items-center gap-3 rounded-xl p-2.5 transition-all"
          style={{background: profileOpen ? "rgba(255,255,255,0.08)" : "transparent"}}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs truncate" style={{color:"rgba(255,255,255,0.4)"}}>{roleLabel}</p>
          </div>
          <span className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{profileOpen ? "▲" : "▼"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#f1f5f9"}}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl">☰</button>
          <p className="font-bold text-gray-900 text-sm">HRMPro</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


