const fs = require("fs");

const files = [
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx",
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx",
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx",
];

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/http:\/\/localhost:5001/g, 'process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"');
  fs.writeFileSync(file, content, "utf8");
  console.log("Fixed:", file.split("/").pop());
});