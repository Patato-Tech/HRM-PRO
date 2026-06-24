const fs = require("fs");

// EMPLOYEES PAGE - Add inline field errors state and onBlur validation
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Add fieldErrors state after addForm state
c = c.replace(
  `const [addForm, setAddForm] = useState({`,
  `const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const validateField = (name: string, value: string) => {
    let err = "";
    if (name === "name" && !value.trim()) err = "Name is required";
    if (name === "email") {
      if (!value.trim() || !value.includes("@")) err = "Valid email required";
      else if (employees.some((emp) => emp.user.email.toLowerCase() === value.toLowerCase())) err = "Email already exists";
    }
    if (name === "phone" && value && !/^03[0-9]{9}$/.test(value.replace(/[-\\s]/g, ""))) err = "Format: 03XXXXXXXXX";
    if (name === "cnic" && value && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(value)) err = "Format: XXXXX-XXXXXXX-X";
    if (name === "salary" && value && (isNaN(Number(value)) || Number(value) < 0)) err = "Must be positive number";
    if (name === "joinDate" && value && value > new Date().toISOString().split("T")[0]) err = "Cannot be in the future";
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };
  const [addForm, setAddForm] = useState({`
);

// Add onBlur and inline error to name field
c = c.replace(
  `onChange={(e) =>
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
                  </div>`,
  `onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      onBlur={(e) => validateField("name", e.target.value)}
                      placeholder="Enter full name"
                      className={\`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 bg-gray-50 focus:bg-white transition-colors \${fieldErrors.name ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}\`}
                    />
                    {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      onBlur={(e) => validateField("email", e.target.value)}
                      placeholder="Enter email address"
                      className={\`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 bg-gray-50 focus:bg-white transition-colors \${fieldErrors.email ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}\`}
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                  </div>`
);

// Add onBlur to phone field
c = c.replace(
  `onChange={(e) =>
                      setAddForm({ ...addForm, phone: e.target.value })
                    }
                      placeholder="Enter phone number"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50 focus:bg-white transition-colors"
                    />`,
  `onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      onBlur={(e) => validateField("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className={\`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 bg-gray-50 focus:bg-white transition-colors \${fieldErrors.phone ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-blue-500"}\`}
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}`
);

fs.writeFileSync(file, c, "utf8");
console.log("Employees inline validation done!");

