/**
 * 🖼️ Image URL Utility
 * Normalizes image paths from the database to work with the PHP backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/backend/api';

// Extract the base URL without the /api suffix (e.g., http://localhost:8000/backend)
const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Gets the correct public URL for an image stored on the server
 * Falls back to a deterministic high-quality placeholder if the image path is missing
 */
export const getImageUrl = (
    path: string | null | undefined,
    type: 'cover' | 'logo' | 'service' = 'cover',
    id: string = 'default'
): string => {
    // Deterministic fallback based on ID
    const getFallback = () => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const coverFallbacks = [
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=800&auto=format&fit=crop",
        ];

        const logoFallbacks = [
            "https://images.unsplash.com/photo-1620331311520-246422ff8347?w=120&h=120&fit=crop",
            "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=120&h=120&fit=crop",
            "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=120&h=120&fit=crop",
            "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=120&h=120&fit=crop",
        ];

        if (type === 'logo') return logoFallbacks[hash % logoFallbacks.length];
        return coverFallbacks[hash % coverFallbacks.length];
    };

    if (!path || path === 'placeholder.svg' || path === '/placeholder.svg') return getFallback();

    // 1. If it's already a full absolute URL (e.g., from a CDN), return it as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }

    // 2. Clean up leading slashes
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // 3. Normalize paths
    if (cleanPath.startsWith('backend/uploads/')) {
        cleanPath = cleanPath.replace('backend/uploads/', 'uploads/');
    }

    // Force it to go through the backend/uploads route handled by router.php
    if (cleanPath.startsWith('uploads/')) {
        return `${BACKEND_URL}/${cleanPath}`;
    }

    // 4. Default: If it's just a filename, assume it's in the uploads folder
    return `${BACKEND_URL}/uploads/${cleanPath}`;
};

export default getImageUrl;
