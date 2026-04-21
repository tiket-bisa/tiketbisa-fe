import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { InternalTokenResponseData } from "./internal-auth.api";
import { AUTH_STORAGE_KEY } from "./auth.constants";

export interface BaseAuthUser {
  email: string;
  name: string;
  picture?: string;
  internal_token?: string;
}

export interface AdminUser extends BaseAuthUser {
  role: "admin";
  brand_slug?: undefined;
  brand_name?: undefined;
}

export interface PartnerUser extends BaseAuthUser {
  role: "partner";
  brand_slug: string;
  brand_name: string;
}

export type AuthUser = AdminUser | PartnerUser;
export type AuthRole = AuthUser["role"];

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsAdmin: () => void;
  loginAsPartner: (brandSlug: string, brandName: string) => void;
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
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsAdmin = useCallback(() => {
    const mockUser: AuthUser = {
      email: "admin@tiketbisa.com",
      name: "Admin Tiketbisa",
      role: "admin",
    };
    setUser(mockUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  }, []);

  const loginAsPartner = useCallback((brandSlug: string, brandName: string) => {
    const mockUser: AuthUser = {
      email: `partner@${brandSlug}.com`,
      name: brandName,
      role: "partner",
      brand_slug: brandSlug,
      brand_name: brandName,
    };
    setUser(mockUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
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
      brand_slug: payload.brandSlug,
      brand_name: payload.brandName,
      internal_token: payload.idToken,
    };
    setUser(partnerUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(partnerUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsAdmin, loginAsPartner, loginWithOAuth, logout }}>
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
