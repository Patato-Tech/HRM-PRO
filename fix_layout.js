const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/layout.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Add activeModules state after profileOpen
c = c.replace(
  `const [profileOpen, setProfileOpen] = useState(false);`,
  `const [profileOpen, setProfileOpen] = useState(false);
  const [activeModules, setActiveModules] = useState({});

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

// 2. Update visibleNav to filter optional modules
c = c.replace(
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
    if (isAdmin) return isAllowed(item.roles);
    const moduleKey = item.href.replace("/dashboard/", "");
    if (OPTIONAL_MODULES.includes(moduleKey) && activeModules[moduleKey] === false) return false;
    return isAllowed(item.roles);
  });`
);

// 3. Add Company Settings in profile dropdown after Change Password
c = c.replace(
  `<span>🔒</span><span>Change Password</span>
            </a>`,
  `<span>🔒</span><span>Change Password</span>
            </a>
            {user?.role === "COMPANY_ADMIN" && (
              <a href="/dashboard/settings" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
                className="dd-item flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all" style={{color:"rgba(255,255,255,0.7)"}}>
                <span>⚙️</span><span>Company Settings</span>
              </a>
            )}`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done! Lines: " + c.split("\\n").length);
