'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, canManageEmployees, canManageDepartments, canManagePayroll } from '@/lib/withAuth';

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: 'all', soon: false },
  { href: '/dashboard/employees', label: 'Employees', icon: '👥', roles: 'manage_employees', soon: false },
  { href: '/dashboard/departments', label: 'Departments', icon: '🏢', roles: 'manage_departments', soon: false },
  { href: '/dashboard/attendance', label: 'Attendance', icon: '📅', roles: 'all', soon: false },
  { href: '/dashboard/leaves', label: 'Leaves', icon: '🌿', roles: 'all', soon: false },
  { href: '/dashboard/payroll', label: 'Payroll', icon: '💰', roles: 'manage_payroll', soon: false },
  { href: '/dashboard/performance', label: 'Performance', icon: '⭐', roles: 'all', soon: true },
  { href: '/dashboard/recruitment', label: 'Recruitment', icon: '🎯', roles: 'manage_employees', soon: true },
  { href: '/dashboard/training', label: 'Training', icon: '📚', roles: 'all', soon: true },
  { href: '/dashboard/documents', label: 'Documents', icon: '📄', roles: 'all', soon: true },
  { href: '/dashboard/reports', label: 'Reports', icon: '📈', roles: 'all', soon: true },
];

const roleColors: Record<string, string> = {
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700',
  HR_MANAGER: 'bg-blue-100 text-blue-700',
  DEPT_MANAGER: 'bg-yellow-100 text-yellow-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth(false);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const isAllowed = (roles: string) => {
    if (roles === 'all') return true;
    if (roles === 'manage_employees') return canManageEmployees(user.role);
    if (roles === 'manage_departments') return canManageDepartments(user.role);
    if (roles === 'manage_payroll') return canManagePayroll(user.role);
    return false;
  };

  const visibleNav = allNavItems.filter(item => isAllowed(item.roles));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">

      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg">
            H
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">HRMPro</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {user.companyName || 'Enterprise'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleNav.map(item => {
          const isActive = pathname === item.href;
          const tag = item.soon ? 'span' : 'a';
          const props: any = {
            key: item.href,
            onClick: () => setSidebarOpen(false),
            className: `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              item.soon
                ? 'text-gray-300 cursor-not-allowed'
                : isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`,
          };
          if (!item.soon) props.href = item.href;

          if (item.soon) {
            return (
              <span key={item.href} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 cursor-not-allowed">
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
              </span>
            );
          }

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
          {user.role.replace(/_/g, ' ')}
        </span>
        <button
          onClick={logout}
          className="w-full mt-3 text-sm bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      <div className="hidden md:flex flex-col w-64 shrink-0">
        <SidebarContent />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 text-2xl leading-none">
            ☰
          </button>
          <span className="font-bold text-gray-900">HRMPro</span>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
