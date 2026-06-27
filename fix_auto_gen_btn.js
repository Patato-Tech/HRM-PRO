const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add auto generate state
content = content.replace(
  'const [bulkLoading, setBulkLoading] = useState(false);',
  'const [bulkLoading, setBulkLoading] = useState(false);\n  const [autoGenLoading, setAutoGenLoading] = useState(false);'
);

// Add auto generate handler
content = content.replace(
  'const handleBulkProcess = async () => {',
  'const handleAutoGenerate = async () => {\n    setAutoGenLoading(true);\n    try {\n      await apiCall("/payroll/auto-generate", { method: "POST" }, getToken() || "");\n      fetchData();\n      showSuccessMsg("Payroll auto-generated successfully!");\n    } catch (e: any) { setError(e?.message || "Failed to auto-generate payroll"); }\n    finally { setAutoGenLoading(false); }\n  };\n  const handleBulkProcess = async () => {'
);

// Add button before Bulk Process section
content = content.replace(
  '<h2 className="font-semibold text-gray-900 mb-4">⚡ Bulk Process Payroll</h2>',
  '<div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-900">⚡ Bulk Process Payroll</h2>{isCompanyAdmin(user?.role || "") && <button onClick={handleAutoGenerate} disabled={autoGenLoading} className="text-white text-xs px-4 py-2 rounded-xl font-bold disabled:opacity-50" style={{background:"linear-gradient(135deg,#059669,#10b981)"}}>{autoGenLoading ? "Generating..." : "🤖 Auto Generate Last Month"}</button>}</div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');