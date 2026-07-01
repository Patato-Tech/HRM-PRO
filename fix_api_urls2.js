const fs = require("fs");

const files = [
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/documents/page.tsx",
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx",
  "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/register/page.tsx",
];

const apiBase = '(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001")';

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  // Fix single-quote fetch URLs
  content = content.replace(/'process\.env\.NEXT_PUBLIC_API_URL \|\| "http:\/\/localhost:5001"\/([^']+)'/g, (match, path) => {
    return "`${" + apiBase + "}/" + path + "`";
  });
  // Fix backtick fetch URLs
  content = content.replace(/`process\.env\.NEXT_PUBLIC_API_URL \|\| "http:\/\/localhost:5001"\/([^`]+)`/g, (match, path) => {
    return "`${" + apiBase + "}/" + path + "`";
  });
  fs.writeFileSync(file, content, "utf8");
  console.log("Fixed:", file.split("/").pop());
});