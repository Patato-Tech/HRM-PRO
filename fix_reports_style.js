const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/reports/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Redesign header section
c = c.replace(
  `    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}
        </p>
      </div>`,
  `    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Reports</h1>
          <p className="text-gray-500 text-sm mt-1">{isDeptMgr ? 'Department-level reports' : 'Company-wide analytics and summaries'}</p>
        </div>`
);

// 2. Move download button into header and remove separate div
c = c.replace(
  `      </div>
      <div className="flex justify-end">
        <button onClick={async () => {`,
  `        <button onClick={async () => {`
);

c = c.replace(
  `        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>
      </div>`,
  `        }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          📄 Download Summary PDF
        </button>
      </div>`
);

// 3. Redesign tabs
c = c.replace(
  `      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 w-fit shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${
              activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>`,
  `      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={\`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border \${
              activeTab === tab.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }\`}
          >
            {tab.label}
          </button>
        ))}
      </div>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
