import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

export type AuthRole = "admin" | "partner";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  role: AuthRole;
  idToken: string;
  brand_slug?: string; // only for partner role
  brand_name?: string; // only for partner role
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;

  loginWithSession: (sessionParams: {
    idToken: string;
    role: string;
    brandSlug?: string;
    brandName?: string;
  }) => void;
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

  const loginWithSession = useCallback(
    ({
      idToken,
      role,
      brandSlug,
      brandName,
    }: {
      idToken: string;
      role: string;
      brandSlug?: string;
      brandName?: string;
    }) => {
      try {
        const decoded = jwtDecode<{ email?: string; name?: string; picture?: string }>(idToken);
        const newUser: AuthUser = {
          email: decoded.email || "",
          name: decoded.name || "Unknown",
          picture: decoded.picture,
          role: role as AuthRole,
          idToken,
          brand_slug: brandSlug,
          brand_name: brandName,
        };
        setUser(newUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      } catch (err) {
        console.error("Failed to decode token", err);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithSession, logout }}>
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
