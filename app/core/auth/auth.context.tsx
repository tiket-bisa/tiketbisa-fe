import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type AuthRole = "admin" | "partner";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  role: AuthRole;
  brand_slug?: string; // only for partner role
  brand_name?: string; // only for partner role
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;

  loginAsAdmin: () => void;
  loginAsPartner: (brandSlug: string, brandName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = "tiketbisa_auth";

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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsAdmin, loginAsPartner, logout }}>
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
