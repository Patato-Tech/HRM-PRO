'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
  employeeId?: string;
  departmentId?: string;
  designation?: string;
  customRoleName?: string;
  permissions?: any;
  customRoleScope?: string;
}

export function useAuth(isPlatform = false) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlatform) {
      const token = localStorage.getItem('platform_token');
      const role = localStorage.getItem('platform_role');
      const name = localStorage.getItem('platform_name');
      const email = localStorage.getItem('platform_email');
      const id = localStorage.getItem('platform_id');
      if (!token || role !== 'PLATFORM_ADMIN') {
        router.replace('/admin');
        return;
      }
      setUser({ id: id || '', name: name || '', email: email || '', role: 'PLATFORM_ADMIN' });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/');
      return;
    }

    const role = localStorage.getItem('user_role') || '';
    const name = localStorage.getItem('user_name') || '';
    const email = localStorage.getItem('user_email') || '';
    const id = localStorage.getItem('user_id') || '';
    const companyId = localStorage.getItem('user_companyId') || '';
    const companyName = localStorage.getItem('user_companyName') || '';
    const employeeId = localStorage.getItem('user_employeeId') || undefined;
    const departmentId = localStorage.getItem('user_departmentId') || undefined;
    const designation = localStorage.getItem('user_designation') || undefined;
    const customRoleName = localStorage.getItem('user_customRoleName') || undefined;
    const permissionsRaw = localStorage.getItem('user_permissions');
    let permissions = undefined;
    try {
      permissions = permissionsRaw && permissionsRaw !== '' ? JSON.parse(permissionsRaw) : undefined;
    } catch { permissions = undefined; }
    const customRoleScope = localStorage.getItem('user_customRoleScope') || undefined;

    // ✅ Initial session check
    apiCall('/auth/profile', {}, token)
      .then(() => {
        setUser({ id, name, email, role, companyId, companyName, employeeId, departmentId, designation, customRoleName, permissions, customRoleScope });
        setLoading(false);
      })
      .catch(() => {
        // api.ts handles force logout for 401 — just redirect for other errors
        if (localStorage.getItem('token')) {
          router.replace('/');
        }
        setLoading(false);
      });

    // ✅ Poll every 15 seconds to detect deactivation/deletion/password change
    intervalRef.current = setInterval(async () => {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      try {
        await apiCall('/auth/profile', {}, currentToken);
      } catch {
        // api.ts already handles force logout on 401
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 15000);

    // ✅ Cleanup interval on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlatform, router]);

  const logout = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlatform) {
      localStorage.removeItem('platform_token');
      localStorage.removeItem('platform_role');
      localStorage.removeItem('platform_name');
      localStorage.removeItem('platform_email');
      localStorage.removeItem('platform_id');
      router.replace('/admin');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_companyId');
      localStorage.removeItem('user_companyName');
      localStorage.removeItem('user_employeeId');
      localStorage.removeItem('user_departmentId');
      localStorage.removeItem('user_designation');
      localStorage.removeItem('user_customRoleName');
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_customRoleScope');
      router.replace('/');
    }
  };

  return { user, loading, logout };
}

export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: { isPlatform?: boolean } = {}
) {
  return function ProtectedComponent(props: T) {
    const { user, loading, logout } = useAuth(options.isPlatform);
    if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
    if (!user) return null;
    return <Component {...props} user={user} logout={logout} />;
  };
}

// ✅ Permission checker — works for both Company Admin (full access) and custom roles
export const hasPermission = (user: AuthUser | null, module: string, action: string): boolean => {
  if (!user) return false;
  if (user.role === 'COMPANY_ADMIN') return true; // Company Admin has full access
  if (!user.permissions) return false;
  return user.permissions?.[module]?.[action] === true;
};

export const isCompanyAdmin = (role: string) => role === 'COMPANY_ADMIN';
export const isHRManager = (role: string) => role === 'HR_MANAGER';
export const isDeptManager = (role: string) => role === 'DEPT_MANAGER';
export const isEmployee = (role: string) => role === 'EMPLOYEE';
export const isPlatformAdmin = (role: string) => role === 'PLATFORM_ADMIN';
export const canManageEmployees = (role: string) => ['COMPANY_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(role);
export const canManagePayroll = (role: string) => ['COMPANY_ADMIN', 'HR_MANAGER'].includes(role);
export const canManageDepartments = (role: string) => ['COMPANY_ADMIN'].includes(role);
export const canApproveLeaves = (role: string) => ['COMPANY_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(role);
