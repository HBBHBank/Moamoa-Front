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
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token found");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Failed to refresh token");
    }

    const result = await response.json();
    
    // 응답 형식 검증
    if (!result || typeof result !== 'object') {
      throw new Error("Invalid response format");
    }

    // data 필드가 있는 경우
    if (result.data) {
      if (!result.data.accessToken) {
        throw new Error("Access token not found in response");
      }
      return result.data.accessToken;
    }
    
    // data 필드가 없는 경우 (직접 accessToken이 있는 경우)
    if (!result.accessToken) {
      throw new Error("Access token not found in response");
    }
    
    return result.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
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