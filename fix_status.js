const fs = require("fs");
const file = "C:/Users/aghaa/Desktop/HRM PRO/frontend/src/app/dashboard/employees/page.tsx";
let c = fs.readFileSync(file, "utf8");

// 1. Status color helper - replace all status badge classes
const oldBadge1 = "emp.status === \"active\" ? \"bg-green-100 text-green-700\" : \"bg-red-100 text-red-700\"";
const newBadge1 = "emp.status === \"active\" ? \"bg-green-100 text-green-700\" : emp.status === \"sabbatical\" ? \"bg-blue-100 text-blue-700\" : emp.status === \"resigned\" ? \"bg-orange-100 text-orange-700\" : emp.status === \"terminated\" ? \"bg-red-100 text-red-700\" : \"bg-gray-100 text-gray-600\"";
c = c.replaceAll(oldBadge1, newBadge1);

// 2. Detail modal badge
const oldBadge2 = "selectedEmployee.status === \"active\" ? \"bg-green-100 text-green-700\" : \"bg-red-100 text-red-700\"";
const newBadge2 = "selectedEmployee.status === \"active\" ? \"bg-green-100 text-green-700\" : selectedEmployee.status === \"sabbatical\" ? \"bg-blue-100 text-blue-700\" : selectedEmployee.status === \"resigned\" ? \"bg-orange-100 text-orange-700\" : selectedEmployee.status === \"terminated\" ? \"bg-red-100 text-red-700\" : \"bg-gray-100 text-gray-600\"";
c = c.replaceAll(oldBadge2, newBadge2);

// 3. Status filter dropdown
c = c.replace(
  "<option value=\"inactive\">Inactive</option>\n          </select>",
  "<option value=\"active\">Active</option>\n            <option value=\"inactive\">Inactive</option>\n            <option value=\"resigned\">Resigned</option>\n            <option value=\"terminated\">Terminated</option>\n            <option value=\"sabbatical\">Sabbatical</option>\n          </select>"
);

// 4. Edit form status dropdown
c = c.replace(
  "<option value=\"active\">Active</option>\n                    <option value=\"inactive\">Inactive</option>\n                  </select>",
  "<option value=\"active\">Active</option>\n                    <option value=\"inactive\">Inactive</option>\n                    <option value=\"resigned\">Resigned</option>\n                    <option value=\"terminated\">Terminated</option>\n                    <option value=\"sabbatical\">Sabbatical</option>\n                  </select>"
);

// 5. Stats cards - add new statuses
c = c.replace(
  "label: \"Inactive\",\n            value: employees.filter((e) => e.status === \"inactive\").length,\n            color: \"text-red-500\",\n            bg: \"bg-red-50\",",
  "label: \"Inactive\",\n            value: employees.filter((e) => e.status === \"inactive\").length,\n            color: \"text-red-500\",\n            bg: \"bg-red-50\",\n          },\n          {\n            label: \"Resigned\",\n            value: employees.filter((e) => e.status === \"resigned\").length,\n            color: \"text-orange-500\",\n            bg: \"bg-orange-50\",\n          },\n          {\n            label: \"Terminated\",\n            value: employees.filter((e) => e.status === \"terminated\").length,\n            color: \"text-red-700\",\n            bg: \"bg-red-50\",\n          },\n          {\n            label: \"Sabbatical\",\n            value: employees.filter((e) => e.status === \"sabbatical\").length,\n            color: \"text-blue-500\",\n            bg: \"bg-blue-50\","
);

// 6. Deactivate/Activate button - handle new statuses
c = c.replace(
  "{emp.status === \"active\"\n                                  ? \"Deactivate\"\n                                  : \"Activate\"}",
  "{emp.status === \"active\" ? \"Deactivate\" : emp.status === \"inactive\" ? \"Activate\" : emp.status === \"resigned\" ? \"Resigned\" : emp.status === \"terminated\" ? \"Terminated\" : \"On Sabbatical\"}"
);
c = c.replace(
  "className={`text-xs px-2.5 py-1.5 rounded-lg ${emp.status === \"active\" ? \"bg-red-50 text-red-600 hover:bg-red-100\" : \"bg-green-50 text-green-600 hover:bg-green-100\"}`}",
  "className={`text-xs px-2.5 py-1.5 rounded-lg ${emp.status === \"active\" ? \"bg-red-50 text-red-600 hover:bg-red-100\" : emp.status === \"inactive\" ? \"bg-green-50 text-green-600 hover:bg-green-100\" : \"bg-gray-50 text-gray-500 cursor-default\"}`}"
);

fs.writeFileSync(file, c, "utf8");
console.log("Done!");
