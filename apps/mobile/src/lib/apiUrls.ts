const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiOrigin(): string {
    if (!API_BASE_URL) {
        throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
    }

    return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

export function buildUploadedFileUrl(path: string | null): string | null {
    if (!path) {
        return null;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    return `${getApiOrigin()}${normalizedPath}`;
}