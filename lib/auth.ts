import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
  sub: string;
}

// --- TOKEN STORAGE (localStorage 기반) ---

/**
 * accessToken을 localStorage에 저장
 */
export function setToken(token: string) {
  localStorage.setItem("accessToken", token)
}

/**
 * accessToken을 localStorage에서 가져옴
 */
export function getToken(): string | null {
  return localStorage.getItem("accessToken")
}

/**
 * accessToken을 localStorage에서 제거
 */
export function removeToken() {
  localStorage.removeItem("accessToken")
}

/**
 * refreshToken을 localStorage에 저장
 */
export function setRefreshToken(token: string) {
  localStorage.setItem("refreshToken", token);
}

/**
 * refreshToken을 localStorage에서 가져옴
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

/**
 * refreshToken을 localStorage에서 제거
 */
export function removeRefreshToken() {
  localStorage.removeItem("refreshToken");
}

// --- FETCH WRAPPER ---

/**
 * 자동으로 Authorization 헤더를 붙여주는 fetch wrapper
 */
export async function secureFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken()
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  return fetch(input, { ...init, headers })
}

export const isTokenExpired = (token: string) => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token found");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/jwt/reissue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }), // ✅ JSON 바디에 포함
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Failed to refresh token");
    }

    const result = await response.json();

    if (!result || typeof result !== 'object') {
      throw new Error("Invalid response format");
    }

    if (!result.accessToken) {
      throw new Error("Access token not found in response");
    }

    return result.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw error;
  }
};


export const getValidToken = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error("No token found");
  }

  if (isTokenExpired(token)) {
    const newToken = await refreshToken();
    setToken(newToken);
    return newToken;
  }

  return token;
}; 