const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/profile/page.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  '}} disabled={editDesignation === (user.designation || "")}',
  '}} disabled={editDesignation === (user.designation || "") && editPhone === (fullProfile?.phone || "") && editCnic === (fullProfile?.cnic || "")}'
);
fs.writeFileSync(file, content, "utf8");
console.log("Done!");