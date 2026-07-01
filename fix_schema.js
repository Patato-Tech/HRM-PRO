const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/prisma/schema.prisma";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  "  resetToken           String?",
  "  phone                String?\n  designation          String?\n  cnic                 String?\n  resetToken           String?"
);
fs.writeFileSync(file, content, "utf8");
console.log("Done!");