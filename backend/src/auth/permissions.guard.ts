import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (module: string, action: string) => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(PERMISSION_KEY, { module, action }, descriptor?.value || target);
    return descriptor || target;
  };
};

const SELF_SERVICE_ROUTES = [
  { method: 'GET',  pattern: /^\/employees$/ },
  { method: 'GET',  pattern: /^\/employees\/\d+$/ },
  { method: 'GET',  pattern: /^\/attendance$/ },
  { method: 'GET',  pattern: /^\/attendance\/employee\/\d+$/ },
  { method: 'POST', pattern: /^\/attendance\/checkin$/ },
  { method: 'POST', pattern: /^\/attendance\/checkout$/ },
  { method: 'GET',  pattern: /^\/leaves$/ },
  { method: 'POST', pattern: /^\/leaves$/ },
  { method: 'GET',  pattern: /^\/leaves\/employee\/\d+$/ },
  { method: 'GET',  pattern: /^\/leaves\/balance\/\d+$/ },
  { method: 'GET',  pattern: /^\/payroll$/ },
  { method: 'GET',  pattern: /^\/payroll\/employee\/\d+$/ },
  { method: 'GET',  pattern: /^\/payroll\/payslip\/\d+$/ },
  { method: 'GET',  pattern: /^\/departments$/ },
  { method: 'GET',  pattern: /^\/auth\/profile$/ },
  { method: 'PUT',  pattern: /^\/auth\/profile$/ },
  { method: 'PUT',  pattern: /^\/auth\/profile\/password$/ },
  { method: 'GET',  pattern: /^\/auth\/company$/ },
  { method: 'GET',  pattern: /^\/attendance\/shift$/ },
  { method: 'GET',  pattern: /^\/attendance\/summary\/today$/ },
  { method: 'GET',  pattern: /^\/attendance\/company-settings$/ },
  { method: 'GET',  pattern: /^\/attendance\/company-holidays$/ },
  { method: 'GET',  pattern: /^\/roles$/ },
  { method: 'GET',  pattern: /^\/employees\/stats$/ },
  { method: 'GET',  pattern: /^\/departments$/ },
  { method: 'GET',  pattern: /^\/departments\/\d+$/ },
];

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<{ module: string; action: string }>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // No permission decorator — allow through
    if (!permission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user yet (JWT guard hasn't run or failed) — let JWT guard handle it
    if (!user) return true;

    // Platform Admin — full access
    if (user.role === 'PLATFORM_ADMIN') return true;

    // Company Admin — full access
    if (user.role === 'COMPANY_ADMIN') return true;

    // Check self-service routes — all authenticated users can access these
    const path = request.path;
    const method = request.method;
    const isSelfService = SELF_SERVICE_ROUTES.some(
      r => r.method === method && r.pattern.test(path)
    );
    if (isSelfService) return true;

    // No custom permissions assigned — deny
    if (!user.permissions) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    // Check specific permission
    const hasPermission = user.permissions?.[permission.module]?.[permission.action] === true;
    if (!hasPermission) {
      throw new ForbiddenException(`You do not have permission: ${permission.module}.${permission.action}`);
    }

    return true;
  }
}
