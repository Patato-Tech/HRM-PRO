const fs = require('fs');
const file = 'C:/Users/aghaa/Desktop/HRM PRO/backend/src/employees/employees.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Add bulk import method at the end before last }
const bulkMethod = 
    async bulkImport(employees: any[], companyId: number, user: any) {
        const isAdmin = user.role === 'COMPANY_ADMIN';
        if (!isAdmin) throw new Error('Only Company Admin can bulk import employees');
        const results = { success: 0, skipped: 0, errors: [] as string[] };
        for (const emp of employees) {
            try {
                if (!emp.email || !emp.name || !emp.password) {
                    results.errors.push(emp.email + ': Missing required fields (name, email, password)');
                    results.skipped++;
                    continue;
                }
                const existing = await this.prisma.user.findFirst({ where: { email: emp.email } });
                if (existing) {
                    results.errors.push(emp.email + ': Email already exists');
                    results.skipped++;
                    continue;
                }
                const hashedPassword = await require('bcryptjs').hash(emp.password, 10);
                const count = await this.prisma.employee.count({ where: { companyId } });
                const employeeCode = 'EMP' + String(count + 1).padStart(3, '0');
                const newUser = await this.prisma.user.create({
                    data: { name: emp.name, email: emp.email, passwordHash: hashedPassword, role: 'EMPLOYEE', companyId },
                });
                const deptId = emp.departmentId ? Number(emp.departmentId) : null;
                await this.prisma.employee.create({
                    data: { companyId, userId: newUser.id, employeeCode, designation: emp.designation, departmentId: deptId, salary: Number(emp.salary || 0) },
                });
                // Send welcome email
                try {
                    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
                    await this.emailService.sendWelcome(emp.email, emp.name, company?.name || 'HRMPro', 'EMPLOYEE', emp.password);
                } catch (e) { console.error('Welcome email failed:', e.message); }
                results.success++;
            } catch (e) {
                results.errors.push(emp.email + ': ' + e.message);
                results.skipped++;
            }
        }
        return results;
    }
;

content = content.replace(/\}\s*$/, bulkMethod + '\n}');
fs.writeFileSync(file, content, 'utf8');
console.log('Done!');