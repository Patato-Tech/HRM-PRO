const API_URL = 'http://159.65.154.28/testing-api';

function forceLogout(message: string) {
    localStorage.setItem('session_message', message);
    ['token','user_role','user_name','user_email','user_id','user_companyId',
     'user_companyName','user_employeeId','user_departmentId','user_designation']
        .forEach(k => localStorage.removeItem(k));
    // Detect if running on staging (/testing) or production
    const isStaging = window.location.pathname.startsWith('/testing');
    window.location.href = isStaging ? '/testing' : '/';
}

export async function apiCall(
    endpoint: string,
    options: RequestInit = {},
    token?: string
) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
        const msg = data.message || '';
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('token');

        // ✅ Force logout on 401 for authenticated sessions
        if (response.status === 401 && hasToken && endpoint !== '/auth/login') {
            if (msg.includes('COMPANY_DELETED')) {
                forceLogout('Your company account has been permanently deleted by the platform administrator. Please contact support.');
                return;
            }
            if (msg.includes('COMPANY_DEACTIVATED') || msg.includes('deactivated')) {
                forceLogout('Your company account has been deactivated by the platform administrator. Please contact support.');
                return;
            }
            if (msg.includes('SESSION_INVALIDATED') || (msg.includes('Invalid credentials') && endpoint === '/auth/profile')) {
                forceLogout('Your password has been changed by the platform administrator. Please login with your new password.');
                return;
            }
            if (msg.includes('User not found') || msg.includes('not found')) {
                forceLogout('Your account session has expired. Please login again.');
                return;
            }
        }
        throw new Error(msg || 'Something went wrong');
    }
    return data;
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

export function getPlatformToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('platform_token');
}
