import re
file = r"C:\Users\aghaa\Desktop\HRM PRO\frontend\src\app\dashboard\layout.tsx"
with open(file, "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("import { useState } from " + chr(39) + "react" + chr(39) + ";", "import { useState, useEffect } from " + chr(39) + "react" + chr(39) + ";")
old = "const [sidebarOpen, setSidebarOpen] = useState(false);"
new_code = old + "\n  const [activeModules, setActiveModules] = useState({});\n  useEffect(() => {\n    const loadModules = () => {\n      const companyId = localStorage.getItem(" + chr(39) + "user_companyId" + chr(39) + ");\n      const saved = localStorage.getItem(" + chr(39) + "company_modules_" + chr(39) + " + companyId);\n      if (saved) setActiveModules(JSON.parse(saved));\n      else setActiveModules({ recruitment: true, training: true, performance: true, documents: true, roles: true });\n    };\n    loadModules();\n    window.addEventListener(" + chr(39) + "modules_updated" + chr(39) + ", loadModules);\n    return () => window.removeEventListener(" + chr(39) + "modules_updated" + chr(39) + ", loadModules);\n  }, []);"
c = c.replace(old, new_code)
old2 = "    return isAllowed(item.roles);\n  });"
new2 = "    if (isAdmin) return isAllowed(item.roles);\n    const OPTIONAL = [" + chr(39) + "recruitment" + chr(39) + ", " + chr(39) + "training" + chr(39) + ", " + chr(39) + "performance" + chr(39) + ", " + chr(39) + "documents" + chr(39) + ", " + chr(39) + "roles" + chr(39) + "];\n    const moduleKey = item.href.replace(" + chr(39) + "/dashboard/" + chr(39) + ", " + chr(39) + chr(39) + ");\n    if (OPTIONAL.includes(moduleKey) && activeModules[moduleKey] === false) return false;\n    return isAllowed(item.roles);\n  });"
c = c.replace(old2, new2)
with open(file, "w", encoding="utf-8") as f:
    f.write(c)
print("Done!")