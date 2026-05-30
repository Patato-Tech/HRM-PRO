const API_URL = 'http://localhost:3000';

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
