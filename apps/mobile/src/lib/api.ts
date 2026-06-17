import { getStoredDemoAccessKey } from "@/src/features/demoAccess/demoAccessStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL environment variable");
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const demoAccessKey = await getStoredDemoAccessKey();

    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (demoAccessKey) {
        headers.set("X-ReturnRadar-Demo-Key", demoAccessKey);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();

    if (!text) {
        return undefined as T;
    }

    return JSON.parse(text) as T;
}