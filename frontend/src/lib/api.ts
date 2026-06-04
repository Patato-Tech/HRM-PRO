const API_URL = 'http://159.65.154.28/testing-api';

// ✅ Session termination messages — shown when force-logged out
export const SESSION_MESSAGES: Record<string, string> = {
    'deactivated': 'Your company account has been deactivated by the platform administrator.',
    'deleted': 'Your company account has been removed from the platform.',
    'password': 'Your password has been changed by the platform administrator. Please login again.',
};

export async function apiCall(
    endpoint: string,
    options: RequestInit = {},
    token?: string
) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    const data = await response.json();
    if (!response.ok) {
        // ✅ Force logout on 401 — company deleted/deactivated/password changed
        if (response.status === 401 && typeof window !== 'undefined') {
            const msg = data.message || '';
            if (msg.includes('deactivated') || msg.includes('deleted') || msg.includes('Invalid credentials')) {
                // Only force logout if user was previously logged in
                if (localStorage.getItem('token')) {
                    let sessionMsg = '';
                    if (msg.includes('deactivated')) sessionMsg = SESSION_MESSAGES['deactivated'];
                    else if (msg.includes('deleted')) sessionMsg = SESSION_MESSAGES['deleted'];
                    // Store message to show on login page
                    localStorage.setItem('session_message', sessionMsg);
                    // Clear all auth data
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
                    window.location.href = '/';
                }
            }
        }
        throw new Error(data.message || 'Something went wrong');
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
