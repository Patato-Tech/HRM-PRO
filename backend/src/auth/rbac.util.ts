import { ForbiddenException } from '@nestjs/common';

/**
 * Check if user has a specific permission
 * Throws ForbiddenException if not allowed
 */
export function checkPermission(
    user: any,
    module: string,
    action: string,
    targetEmployeeId?: number,
): void {
    // Company Admin — full access always
    if (user.role === 'COMPANY_ADMIN') {
        // But cannot modify own record
        if (targetEmployeeId && targetEmployeeId === user.employeeId) {
            throw new ForbiddenException('You cannot modify your own record.');
        }
        return;
    }

    // Self-operation prevention for all custom roles
    if (targetEmployeeId && targetEmployeeId === user.employeeId) {
        throw new ForbiddenException('You cannot modify your own record.');
    }

    // Plain employee — no custom permissions
    if (!user.permissions) {
        throw new ForbiddenException('Access denied. No permissions assigned.');
    }

    // Check specific permission
    const hasPerm = user.permissions?.[module]?.[action] === true;

    // edit_basic also granted if edit_full is true
    const hasEditFull = action === 'edit_basic' && user.permissions?.[module]?.edit_full === true;
    const hasEdit = action === 'edit_basic' && user.permissions?.[module]?.edit === true;

    if (!hasPerm && !hasEditFull && !hasEdit) {
        throw new ForbiddenException(`Permission denied: ${module}.${action}`);
    }
}

/**
 * Get Prisma where clause filter based on user scope
 * Ensures department-level data isolation
 */
export function getScopeFilter(user: any): any {
    // Company Admin — no filter, sees everything
    if (user.role === 'COMPANY_ADMIN') return {};

    // Custom role with own_department scope — strict department filter
    if (user.customRoleScope === 'own_department' && user.departmentId) {
        return { employee: { departmentId: Number(user.departmentId) } };
    }

    // Custom role with all scope — no filter
    if (user.customRoleScope === 'all') return {};

    // Plain employee — only own records
    if (user.employeeId) {
        return { employeeId: Number(user.employeeId) };
    }

    // Fallback — deny all
    return { id: -1 };
}

/**
 * Get employee list scope filter
 * Different from getScopeFilter because it filters employees directly
 */
export function getEmployeeScopeFilter(user: any): any {
    if (user.role === 'COMPANY_ADMIN') return {};

    if (user.customRoleScope === 'own_department' && user.departmentId) {
        return { departmentId: Number(user.departmentId) };
    }

    if (user.customRoleScope === 'all') return {};

    // Plain employee — empty (handled separately)
    return {};
}

/**
 * Check if user is trying to operate on their own record
 */
export function isSelfOperation(user: any, targetEmployeeId: number): boolean {
    return user.employeeId && Number(user.employeeId) === Number(targetEmployeeId);
}

/**
 * Check if user can view salary
 */
export function canViewSalary(user: any): boolean {
    if (user.role === 'COMPANY_ADMIN') return true;
    return user.permissions?.payroll?.view_salary === true ||
        user.permissions?.payroll?.view === true;
}
