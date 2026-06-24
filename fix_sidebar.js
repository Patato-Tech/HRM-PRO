const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/layout.tsx";
let c = fs.readFileSync(file, "utf8");

// Redesign SidebarContent
c = c.replace(
  `  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
            H
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">HRMPro</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {user.companyName || "Enterprise"}
            </p>
            {user.departmentName && (
              <p className="text-xs text-blue-500 truncate max-w-[150px]">
                🏢 {user.departmentName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleNav.map((item) => {
          if (item.soon) {
            return (
              <span
                key={item.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 cursor-not-allowed"
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                  Soon
                </span>
              </span>
            );
          }
          const isActive = pathname === item.href;
          return (
            
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all \${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }\`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>`,
  `  const SidebarContent = () => (
    <div className="flex flex-col h-full w-64" style={{background:"linear-gradient(180deg,#0f172a 0%,#1e293b 100%)"}}>
      <style>{\`
        .nav-link { transition: all 0.15s ease; }
        .nav-link:hover { background: rgba(255,255,255,0.08) !important; transform: translateX(2px); }
        .nav-link-active { background: linear-gradient(135deg,#1d4ed8,#3b82f6) !important; box-shadow: 0 4px 15px rgba(59,130,246,0.4); }
        .user-btn { transition: all 0.15s ease; }
        .user-btn:hover { background: rgba(255,255,255,0.08) !important; }
      \`}</style>
      {/* Logo */}
      <div className="p-5" style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg flex-shrink-0" style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)"}}>
            <span className="text-white">H</span>
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight">HRMPro</p>
            <p className="text-xs truncate max-w-[130px]" style={{color:"rgba(255,255,255,0.5)"}}>
              {user.companyName || "Enterprise"}
            </p>
            {user.departmentName && (
              <p className="text-xs truncate max-w-[130px]" style={{color:"#60a5fa"}}>
                {user.departmentName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleNav.map((item) => {
          if (item.soon) {
            return (
              <span key={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed" style={{color:"rgba(255,255,255,0.2)"}}>
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
              className={\`nav-link \${isActive ? 'nav-link-active' : ''} flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold\`}
              style={isActive ? {} : {color:"rgba(255,255,255,0.6)"}}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-60" />}
            </a>
          );
        })}
      </nav>`
);

// Redesign user footer
c = c.replace(
  `      {/* User footer with dropdown */}
      <div className="p-3 border-t border-gray-100" ref={dropdownRef}>
        {/* Profile Dropdown */}
        {profileOpen && (
          <div className="mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span
                    className={\`text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block \${roleBadgeClass}\`}
                  >
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
            {/* Links */}
            
              href="/dashboard/profile"
              onClick={() => {
                setProfileOpen(false);
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
            >
              <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs group-hover:bg-blue-200">
                👤
              </span>
              <span className="font-medium">View Profile</span>
            </a>
            
              href="/dashboard/profile"
              onClick={() => {
                setProfileOpen(false);
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group"
            >
              <span className="w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs group-hover:bg-purple-200">
                🔒
              </span>
              <span className="font-medium">Change Password</span>
            </a>
            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
              >
                <span className="w-7 h-7 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs group-hover:bg-red-200">
                  🚪
                </span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
        {/* User button */}
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className={\`w-full flex items-center gap-3 rounded-xl p-2.5 transition-all \${profileOpen ? "bg-blue-50 ring-2 ring-blue-200" : "hover:bg-gray-50"}\`}
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <span
              className={\`text-xs px-1.5 py-0.5 rounded-full font-medium \${roleBadgeClass}\`}
            >
              {roleLabel}
            </span>
          </div>
          <span className="text-gray-400 text-xs ml-1">
            {profileOpen ? "▲" : "▼"}
          </span>
        </button>
      </div>
    </div>
  );`,
  `      {/* User footer */}
      <div className="p-3" style={{borderTop:"1px solid rgba(255,255,255,0.08)"}} ref={dropdownRef}>
        {profileOpen && (
          <div className="mb-2 rounded-2xl overflow-hidden" style={{background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 20px 40px rgba(0,0,0,0.4)"}}>
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
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors" style={{color:"rgba(255,255,255,0.7)"}}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span>👤</span><span>View Profile</span>
            </a>
            <a href="/dashboard/profile" onClick={() => { setProfileOpen(false); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors" style={{color:"rgba(255,255,255,0.7)"}}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span>🔒</span><span>Change Password</span>
            </a>
            <div style={{borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <button onClick={() => { setProfileOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors" style={{color:"#fca5a5"}}
                onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span>🚪</span><span>Logout</span>
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setProfileOpen((prev) => !prev)}
          className="user-btn w-full flex items-center gap-3 rounded-xl p-2.5"
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
  );`
);

// Fix mobile top bar
c = c.replace(
  `        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 text-2xl leading-none"
          >
            ☰
          </button>
          <span className="font-bold text-gray-900">HRMPro</span>
          <div className="w-8" />
        </div>`,
  `        <div className="md:hidden px-4 py-3 flex items-center justify-between" style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
          <button onClick={() => setSidebarOpen(true)} className="text-white text-2xl leading-none">☰</button>
          <span className="font-black text-white text-sm">HRMPro</span>
          <div className="w-8" />
        </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
