const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state for import modal
content = content.replace(
  "  const [showAddModal, setShowAddModal] = useState(false);",
  "  const [showAddModal, setShowAddModal] = useState(false);\n  const [showImportModal, setShowImportModal] = useState(false);\n  const [importData, setImportData] = useState<any[]>([]);\n  const [importLoading, setImportLoading] = useState(false);\n  const [importResult, setImportResult] = useState<any>(null);"
);

// Add import handler
content = content.replace(
  "  const showSuccessMsg",
  "  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    const reader = new FileReader();\n    reader.onload = (ev) => {\n      const text = ev.target?.result as string;\n      const lines = text.split('\\n').filter(l => l.trim());\n      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());\n      const data = lines.slice(1).map(line => {\n        const vals = line.split(',').map(v => v.trim());\n        const obj: any = {};\n        headers.forEach((h, i) => obj[h] = vals[i] || '');\n        return obj;\n      });\n      setImportData(data);\n    };\n    reader.readAsText(file);\n  };\n  const handleBulkImport = async () => {\n    if (!importData.length) return;\n    setImportLoading(true);\n    try {\n      const token = getToken() || '';\n      const result = await apiCall('/employees/bulk-import', { method: 'POST', body: JSON.stringify({ employees: importData }) }, token);\n      setImportResult(result);\n      fetchData();\n    } catch (e: any) { setError(e.message); }\n    finally { setImportLoading(false); }\n  };\n  const showSuccessMsg"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');