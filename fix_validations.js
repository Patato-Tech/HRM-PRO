const fs = require("fs");

// ========== EMPLOYEES PAGE ==========
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Add phone and CNIC format validation in handleAdd
c = c.replace(
  `const handleAdd = async () => {
    setError("");
    const selectedRole = roles.find((r: any) => String(r.id) === String(addForm.roleId));
    if (selectedRole?.scope === "own_department" && !addForm.departmentId) {
      setError("Department is required for this custom role (department-scoped).");
      return;
    }`,
  `const handleAdd = async () => {
    setError("");
    if (!addForm.name.trim()) { setError("Full name is required."); return; }
    if (!addForm.email.trim() || !addForm.email.includes("@")) { setError("Valid email address is required."); return; }
    if (!addForm.password || addForm.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (addForm.salary && (isNaN(Number(addForm.salary)) || Number(addForm.salary) < 0)) { setError("Salary must be a positive number."); return; }
    if (addForm.phone && !/^03[0-9]{9}$/.test(addForm.phone.replace(/[-\s]/g, ""))) { setError("Phone must be a valid Pakistani number (03XXXXXXXXX)."); return; }
    if (addForm.cnic && !/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(addForm.cnic)) { setError("CNIC format must be XXXXX-XXXXXXX-X."); return; }
    const selectedRole = roles.find((r: any) => String(r.id) === String(addForm.roleId));
    if (selectedRole?.scope === "own_department" && !addForm.departmentId) {
      setError("Department is required for this custom role (department-scoped).");
      return;
    }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Employees validation done!");

// ========== ATTENDANCE PAGE ==========
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
c = fs.readFileSync(file, "utf8");

// 2. Add attendance validation in handleMarkSingle
c = c.replace(
  `const handleMarkSingle = async () => {
    setError("");`,
  `const handleMarkSingle = async () => {
    setError("");
    if (!markForm.employeeId) { setError("Please select an employee."); return; }
    if (!markForm.date) { setError("Please select a date."); return; }
    if (markForm.date > new Date().toISOString().split("T")[0]) { setError("Cannot mark attendance for future dates."); return; }
    if (markForm.checkIn && markForm.checkOut && markForm.checkIn >= markForm.checkOut) { setError("Check-out time must be after check-in time."); return; }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Attendance validation done!");

// ========== LEAVES PAGE ==========
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx";
c = fs.readFileSync(file, "utf8");

// 3. Add leave validation in handleApply
c = c.replace(
  `const handleApply = async () => {
    setError("");`,
  `const handleApply = async () => {
    setError("");
    if (!applyForm.employeeId) { setError("Please select an employee."); return; }
    if (!applyForm.startDate || !applyForm.endDate) { setError("Please select start and end dates."); return; }
    if (applyForm.startDate > applyForm.endDate) { setError("Start date cannot be after end date."); return; }
    if (!applyForm.days || Number(applyForm.days) <= 0) { setError("Number of days must be at least 1."); return; }
    if (!applyForm.leaveType) { setError("Please select a leave type."); return; }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Leaves validation done!");

// ========== DEPARTMENTS PAGE ==========
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/departments/page.tsx";
c = fs.readFileSync(file, "utf8");

// 4. Add department name duplicate check
c = c.replace(
  `const handleAdd = async () => {
    setError("");
    if (!addForm.name) { setError("Department name is required"); return; }`,
  `const handleAdd = async () => {
    setError("");
    if (!addForm.name.trim()) { setError("Department name is required."); return; }
    if (departments.some(d => d.name.toLowerCase() === addForm.name.trim().toLowerCase())) { setError("A department with this name already exists."); return; }`
);

// 5. Prevent deleting dept with active employees
c = c.replace(
  `const handleDelete = async () => {
    if (!selectedDept) return;`,
  `const handleDelete = async () => {
    if (!selectedDept) return;
    if ((selectedDept._count?.employees || 0) > 0) { setError("Cannot delete a department that has employees. Please reassign employees first."); setShowDeleteModal(false); return; }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Departments validation done!");

// ========== ROLES PAGE ==========
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/roles/page.tsx";
c = fs.readFileSync(file, "utf8");

// 6. Add role name duplicate check
c = c.replace(
  `const handleSave = async () => {
    setError("");`,
  `const handleSave = async () => {
    setError("");
    if (!form.name.trim()) { setError("Role name is required."); return; }
    const duplicate = roles.find(r => r.name.toLowerCase() === form.name.trim().toLowerCase() && (!isEditing || r.id !== selectedRole?.id));
    if (duplicate) { setError("A role with this name already exists."); return; }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Roles validation done!");

// ========== PAYROLL PAGE ==========
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx";
c = fs.readFileSync(file, "utf8");

// 7. Add payroll validation
c = c.replace(
  `const handleAdd = async () => {
    setError("");`,
  `const handleAdd = async () => {
    setError("");
    if (!form.employeeId) { setError("Please select an employee."); return; }
    if (!form.basic || Number(form.basic) <= 0) { setError("Basic salary must be greater than 0."); return; }
    if (calcNet(form) < 0) { setError("Net salary cannot be negative. Please check deductions."); return; }
    const existing = payrolls.find(p => String(p.employee?.id) === String(form.employeeId) && p.month === Number(form.month) && p.year === Number(form.year));
    if (existing) { setError("Payroll already exists for this employee for the selected month."); return; }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Payroll validation done!");

