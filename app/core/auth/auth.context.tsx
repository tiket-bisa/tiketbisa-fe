import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { InternalTokenResponseData } from "./internal-auth.api";
import { AUTH_STORAGE_KEY } from "./auth.constants";
import { internalHttpClient } from "~/core/api";

export interface BaseAuthUser {
  email: string;
  name: string;
  picture?: string;
  internal_token?: string;
  brand_id?: string;
}

export interface AdminUser extends BaseAuthUser {
  role: "admin";
  brand_slug?: undefined;
  brand_name?: undefined;
  brand_id?: undefined;
}

export interface PartnerUser extends BaseAuthUser {
  role: "partner";
  brand_id: string;
  brand_slug: string;
  brand_name: string;
}

export type AuthUser = AdminUser | PartnerUser;
export type AuthRole = AuthUser["role"];

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithOAuth: (payload: InternalTokenResponseData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface GoogleIdTokenPayload {
  email?: string;
  name?: string;
  picture?: string;
}

function decodeJwtPayload(token: string): GoogleIdTokenPayload {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return {};

  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as GoogleIdTokenPayload;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          // Invalidate legacy sessions that are missing the internal_token
          if (!parsed.internal_token || (parsed.role === "partner" && !parsed.brand_id)) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            if (isActive) {
              setUser(null);
            }
          } else {
            if (isActive) {
              setUser(parsed);
            }

            const meResponse = await internalHttpClient.get("/user/me");
            if (!isActive) {
              return;
            }

            if (!meResponse.success && (meResponse.status_code === 401 || meResponse.status_code === 403)) {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setUser(null);
            }
          }
        }
      } catch {
        // ignore parse errors
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const loginWithOAuth = useCallback((payload: InternalTokenResponseData) => {
    const profile = decodeJwtPayload(payload.idToken);
    const email = profile.email ?? "";
    const name = profile.name ?? email ?? "Tiketbisa User";

    if (!email) {
      throw new Error("ID token does not contain email");
    }

    if (payload.role === "admin") {
      const adminUser: AuthUser = {
        email,
        name,
        picture: profile.picture,
        role: "admin",
        internal_token: payload.idToken,
      };
      setUser(adminUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      return;
    }

    if (!payload.brandSlug || !payload.brandName) {
      throw new Error("Partner account is missing brand details");
    }

    const partnerUser: AuthUser = {
      email,
      name: payload.brandName || name,
      picture: profile.picture,
      role: "partner",
      brand_id: payload.brandId || "",
      brand_slug: payload.brandSlug,
      brand_name: payload.brandName,
      internal_token: payload.idToken,
    };

    if (!partnerUser.brand_id) {
      throw new Error("Partner account is missing brand id");
    }

    setUser(partnerUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(partnerUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
