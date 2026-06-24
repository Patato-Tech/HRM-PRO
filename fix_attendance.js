const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header
c = c.replace(
  `      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={handleMarkAbsents}
              disabled={absentLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              {absentLoading ? "Marking..." : "Mark Absents"}
            </button>
            <button
              onClick={() => {
                setShowMarkModal(true);
                setError("");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              + Mark Attendance
            </button>
          </div>
        )}
      </div>`,
  `      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Attendance</h1>
          <p className="text-gray-400 text-sm mt-0.5">{new Date().toLocaleDateString("en-US", {weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={handleMarkAbsents} disabled={absentLoading}
              className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{background:"linear-gradient(135deg,#dc2626,#ef4444)",boxShadow:"0 4px 12px rgba(239,68,68,0.3)"}}>
              {absentLoading ? "Marking..." : "Mark Absents"}
            </button>
            <button onClick={() => { setShowMarkModal(true); setError(""); }}
              className="text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
              + Mark Attendance
            </button>
          </div>
        )}
      </div>`
);

// 2. Redesign stat cards
c = c.replace(
  `          ].map((s, i) => (
            <div key={i} className={\`\${s.bg} rounded-2xl p-5\`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className={\`text-3xl font-bold \${s.color}\`}>{s.value}</p>
            </div>
          ))}`,
  `          ].map((s, i) => (
            <div key={i} className={\`\${s.bg} rounded-2xl p-4 border border-white\`}
              style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={\`text-3xl font-black \${s.color}\`}>{s.value}</p>
            </div>
          ))}`
);

// 3. Redesign attendance rate bar
c = c.replace(
  `        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900">
              Today's Attendance Rate
            </p>`,
  `        <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-gray-900">Today's Attendance Rate</p>`
);

// 4. Redesign tabs
c = c.replace(
  `        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm flex-wrap">
          {(
            [
              { key: "today", label: "📅 Today" },
              { key: "history", label: "📋 By Date" },
              canSetShifts && { key: "shifts", label: "⚙️ Shift Settings" },
              canManage && { key: "bulk", label: "📝 Bulk Mark" },
            ] as any[]
          )
            .filter(Boolean)
            .map((tab: any) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }\`}
              >
                {tab.label}
              </button>
            ))}
        </div>`,
  `        <div className="flex gap-2 flex-wrap">
          {(
            [
              { key: "today", label: "📅 Today" },
              { key: "history", label: "📋 By Date" },
              canSetShifts && { key: "shifts", label: "⚙️ Shift Settings" },
              canManage && { key: "bulk", label: "📝 Bulk Mark" },
            ] as any[]
          ).filter(Boolean).map((tab: any) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
              style={activeTab === tab.key
                ? {background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"transparent",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}
                : {background:"white",color:"#6b7280",border:"1px solid #e5e7eb"}}>
              {tab.label}
            </button>
          ))}
        </div>`
);

// 5. Redesign check-in/out buttons for employees
c = c.replace(
  `                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    {checkInLoading ? "Checking in..." : "✅ Check In"}
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={checkOutLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    {checkOutLoading ? "Checking out..." : "🚪 Check Out"}`,
  `                  className="text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 12px rgba(16,185,129,0.3)"}}>
                    {checkInLoading ? "Checking in..." : "✅ Check In"}
                  </button>
                  <button onClick={handleCheckOut} disabled={checkOutLoading}
                    className="text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",boxShadow:"0 4px 12px rgba(59,130,246,0.3)"}}>
                    {checkOutLoading ? "Checking out..." : "🚪 Check Out"`
);

// 6. Redesign success toast
c = c.replace(
  `        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium">
          ✅ {success}
        </div>`,
  `        <div className="fixed top-6 right-6 text-white px-5 py-3.5 rounded-2xl z-50 text-sm font-bold" style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 8px 25px rgba(16,185,129,0.4)"}}>
          ✅ {success}
        </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
