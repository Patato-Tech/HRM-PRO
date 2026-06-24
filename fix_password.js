const fs = require("fs");

const validatePassword = `
const validatePassword = (pw) => {
  const errors = [];
  if (pw.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(pw)) errors.push("one uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("one lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("one number");
  if (!/[@#$!%*?&]/.test(pw)) errors.push("one special character (@#$!%*?&)");
  return errors;
};
const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[@#$!%*?&]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (score <= 3) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (score <= 4) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#10b981", width: "100%" };
};`;

// Fix employees page
let file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// Add validatePassword before export default
c = c.replace(
  "export default function EmployeesPage()",
  validatePassword + "\nexport default function EmployeesPage()"
);

// Fix add employee password validation
c = c.replace(
  `if (!addForm.password || addForm.password.length < 6) errors.push("Password must be at least 6 characters.");`,
  `if (!addForm.password) { errors.push("Password is required."); } else { const pwErrors = validatePassword(addForm.password); if (pwErrors.length > 0) errors.push("Password must have: " + pwErrors.join(", ")); }`
);

// Fix reset password validation
c = c.replace(
  `if (resetForm.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }`,
  `const pwErrors = validatePassword(resetForm.newPassword);
    if (pwErrors.length > 0) {
      setResetError("Password must have: " + pwErrors.join(", "));
      return;
    }`
);

fs.writeFileSync(file, c, "utf8");
console.log("Employees done!");

// Fix profile page
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx";
c = fs.readFileSync(file, "utf8");

c = c.replace(
  "export default function ProfilePage()",
  validatePassword + "\nexport default function ProfilePage()"
);

c = c.replace(
  `if (pwForm.newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return; }`,
  `const pwErrors = validatePassword(pwForm.newPw); if (pwErrors.length > 0) { setPwError("Password must have: " + pwErrors.join(", ")); return; }`
);

c = c.replace(
  `<p className="text-sm text-gray-500">Choose a strong password at least 6 characters long.</p>`,
  `<p className="text-sm text-gray-500">Password must be 8+ chars with uppercase, lowercase, number and special character.</p>`
);

fs.writeFileSync(file, c, "utf8");
console.log("Profile done!");

// Fix register page
file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx";
c = fs.readFileSync(file, "utf8");
if (c.includes("password.length < 6") || c.includes("password.length < 8")) {
  c = c.replace(
    "export default function RegisterPage()",
    validatePassword + "\nexport default function RegisterPage()"
  );
  c = c.replace(/password\.length < [68]/g, "validatePassword(password).length > 0");
  fs.writeFileSync(file, c, "utf8");
  console.log("Register done!");
} else {
  console.log("Register - no password validation found");
}