const fs = require("fs");

// 1. EMPLOYEES - Email duplicate check in add modal
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");
c = c.replace(
  `if (!addForm.name.trim()) errors.push("Full name is required.");`,
  `if (!addForm.name.trim()) errors.push("Full name is required.");
    const emailExists = employees.some((emp) => emp.user.email.toLowerCase() === addForm.email.trim().toLowerCase());
    if (emailExists) errors.push("An employee with this email already exists.");`
);
// Add join date validation
c = c.replace(
  `if (addForm.cnic && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(addForm.cnic)) errors.push("CNIC format must be XXXXX-XXXXXXX-X.");`,
  `if (addForm.cnic && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(addForm.cnic)) errors.push("CNIC format must be XXXXX-XXXXXXX-X.");
    if (addForm.joinDate && addForm.joinDate > new Date().toISOString().split("T")[0]) errors.push("Join date cannot be in the future.");`
);
fs.writeFileSync(file, c, "utf8");
console.log("Employees done!");

// 2. LEAVES - Past date check and balance check
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `if (!applyForm.days || Number(applyForm.days) <= 0) errors.push("Number of days must be at least 1.");`,
  `if (!applyForm.days || Number(applyForm.days) <= 0) errors.push("Number of days must be at least 1.");
    if (applyForm.startDate && applyForm.startDate < new Date().toISOString().split("T")[0]) errors.push("Leave start date cannot be in the past.");`
);
fs.writeFileSync(file, c, "utf8");
console.log("Leaves done!");

// 3. DEPARTMENTS - Edit modal duplicate check
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/departments/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `const handleEdit = async () => {
    setError("");
    if (!selectedDept) return;`,
  `const handleEdit = async () => {
    setError("");
    if (!selectedDept) return;
    if (!editForm.name.trim()) { setError("Department name is required."); return; }
    if (departments.some((d) => d.name.toLowerCase() === editForm.name.trim().toLowerCase() && d.id !== selectedDept.id)) { setError("A department with this name already exists."); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Departments done!");

// 4. PAYROLL - Future month check
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `if (existingPayroll) errors.push("Payroll already exists for this employee for the selected month.");`,
  `if (existingPayroll) errors.push("Payroll already exists for this employee for the selected month.");
    const now = new Date();
    if (Number(form.year) > now.getFullYear() || (Number(form.year) === now.getFullYear() && Number(form.month) > now.getMonth() + 1)) errors.push("Cannot process payroll for a future month.");`
);
fs.writeFileSync(file, c, "utf8");
console.log("Payroll done!");
