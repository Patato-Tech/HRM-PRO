const fs = require("fs");

// LEAVES
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/leaves/page.tsx";
let c = fs.readFileSync(file, "utf8");
c = c.replace(
  `    setError("");
    if (!applyForm.startDate || !applyForm.endDate) { setError("Please select start and end dates."); return; }
    if (applyForm.startDate > applyForm.endDate) { setError("Start date cannot be after end date."); return; }
    if (!applyForm.days || Number(applyForm.days) <= 0) { setError("Number of days must be at least 1."); return; }
    if (!applyForm.employeeId) { setError("Please select an employee."); return; }
    if (!applyForm.leaveType) { setError("Please select a leave type."); return; }`,
  `    setError("");
    const errors: string[] = [];
    if (!applyForm.employeeId) errors.push("Please select an employee.");
    if (!applyForm.leaveType) errors.push("Please select a leave type.");
    if (!applyForm.startDate || !applyForm.endDate) errors.push("Please select start and end dates.");
    else if (applyForm.startDate > applyForm.endDate) errors.push("Start date cannot be after end date.");
    if (!applyForm.days || Number(applyForm.days) <= 0) errors.push("Number of days must be at least 1.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Leaves done!");

// ATTENDANCE
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/attendance/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `    setError("");
    if (!markForm.employeeId) { setError("Please select an employee."); return; }
    if (!markForm.date) { setError("Please select a date."); return; }
    if (markForm.date > new Date().toISOString().split("T")[0]) { setError("Cannot mark attendance for future dates."); return; }
    if (markForm.checkIn && markForm.checkOut && markForm.checkIn >= markForm.checkOut) { setError("Check-out time must be after check-in time."); return; }`,
  `    setError("");
    const errors: string[] = [];
    if (!markForm.employeeId) errors.push("Please select an employee.");
    if (!markForm.date) errors.push("Please select a date.");
    else if (markForm.date > new Date().toISOString().split("T")[0]) errors.push("Cannot mark attendance for future dates.");
    if (markForm.checkIn && markForm.checkOut && markForm.checkIn >= markForm.checkOut) errors.push("Check-out time must be after check-in time.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Attendance done!");

// PAYROLL
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/payroll/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `    setError("");
    if (!form.employeeId) { setError("Please select an employee."); return; }
    if (!form.basic || Number(form.basic) <= 0) { setError("Basic salary must be greater than 0."); return; }
    if (calcNet(form) < 0) { setError("Net salary cannot be negative. Please check deductions."); return; }
    const existingPayroll = payrolls.find((p: any) => String(p.employee?.id) === String(form.employeeId) && p.month === Number(form.month) && p.year === Number(form.year));
    if (existingPayroll) { setError("Payroll already exists for this employee for the selected month."); return; }`,
  `    setError("");
    const errors: string[] = [];
    if (!form.employeeId) errors.push("Please select an employee.");
    if (!form.basic || Number(form.basic) <= 0) errors.push("Basic salary must be greater than 0.");
    if (calcNet(form) < 0) errors.push("Net salary cannot be negative. Please check deductions.");
    const existingPayroll = payrolls.find((p: any) => String(p.employee?.id) === String(form.employeeId) && p.month === Number(form.month) && p.year === Number(form.year));
    if (existingPayroll) errors.push("Payroll already exists for this employee for the selected month.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Payroll done!");

// DEPARTMENTS
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/departments/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `    setError("");
    if (!addForm.name.trim()) { setError("Department name is required."); return; }
    if (departments.some(d => d.name.toLowerCase() === addForm.name.trim().toLowerCase())) { setError("A department with this name already exists."); return; }`,
  `    setError("");
    const errors: string[] = [];
    if (!addForm.name.trim()) errors.push("Department name is required.");
    else if (departments.some(d => d.name.toLowerCase() === addForm.name.trim().toLowerCase())) errors.push("A department with this name already exists.");
    if (errors.length > 0) { setError(errors.join(" | ")); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Departments done!");

// ROLES
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/roles/page.tsx";
c = fs.readFileSync(file, "utf8");
c = c.replace(
  `    setError("");
    if (!form.name.trim()) { setError("Role name is required."); return; }
    const duplicate = roles.find((r: any) => r.name.toLowerCase() === form.name.trim().toLowerCase() && (!isEditing || r.id !== selectedRole?.id));
    if (duplicate) { setError("A role with this name already exists."); return; }`,
  `    setError("");
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("Role name is required.");
    else {
      const duplicate = roles.find((r: any) => r.name.toLowerCase() === form.name.trim().toLowerCase() && (!isEditing || r.id !== selectedRole?.id));
      if (duplicate) errors.push("A role with this name already exists.");
    }
    if (errors.length > 0) { setError(errors.join(" | ")); return; }`
);
fs.writeFileSync(file, c, "utf8");
console.log("Roles done!");
