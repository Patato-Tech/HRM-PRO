'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
  companyName?: string;
}

export function useAuth(isPlatform = false) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    } else {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('user_role');
      const name = localStorage.getItem('user_name');
      const email = localStorage.getItem('user_email');
      const id = localStorage.getItem('user_id');
      const companyId = localStorage.getItem('user_companyId');
      const companyName = localStorage.getItem('user_companyName');

      if (!token) {
        router.replace('/');
        return;
      }

      setUser({
        id: id || '',
        name: name || '',
        email: email || '',
        role: role || '',
        companyId: companyId || '',
        companyName: companyName || '',
      });
    }
    setLoading(false);
  }, [isPlatform, router]);

  const logout = () => {
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

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) return null;

    return <Component {...props} user={user} logout={logout} />;
  };
}

// Role helpers
export const isCompanyAdmin = (role: string) => role === 'COMPANY_ADMIN';
export const isHRManager = (role: string) => role === 'HR_MANAGER';
export const isDeptManager = (role: string) => role === 'DEPT_MANAGER';
export const isEmployee = (role: string) => role === 'EMPLOYEE';
export const isPlatformAdmin = (role: string) => role === 'PLATFORM_ADMIN';

export const canManageEmployees = (role: string) =>
  ['COMPANY_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(role);

export const canManagePayroll = (role: string) =>
  ['COMPANY_ADMIN', 'HR_MANAGER'].includes(role);

export const canManageDepartments = (role: string) =>
  ['COMPANY_ADMIN'].includes(role);

export const canApproveLeaves = (role: string) =>
  ['COMPANY_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(role);
