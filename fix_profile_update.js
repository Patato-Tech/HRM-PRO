const fs = require("fs");

// Update controller
const cf = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.controller.ts";
let c = fs.readFileSync(cf, "utf8");
c = c.replace(
  "updateProfile(@Request() req, @Body() body: { name: string })",
  "updateProfile(@Request() req, @Body() body: { name: string; designation?: string; phone?: string; cnic?: string })"
);
c = c.replace(
  "return this.authService.updateProfile(req.user.sub, body.name);",
  "return this.authService.updateProfile(req.user.sub, body.name, body.designation, body.phone, body.cnic);"
);
fs.writeFileSync(cf, c, "utf8");
console.log("Controller done!");

// Update service
const sf = "C:/Users/aghaa/Desktop/HRM PRO/backend/src/auth/auth.service.ts";
let s = fs.readFileSync(sf, "utf8");
s = s.replace(
  "async updateProfile(userId: number, name: string) {\n        return this.prisma.user.update({\n            where: { id: userId },\n            data: { name },",
  "async updateProfile(userId: number, name: string, designation?: string, phone?: string, cnic?: string) {\n        return this.prisma.user.update({\n            where: { id: userId },\n            data: { name, ...(designation !== undefined && { designation }), ...(phone !== undefined && { phone }), ...(cnic !== undefined && { cnic }) },",
);
fs.writeFileSync(sf, s, "utf8");
console.log("Service done!");