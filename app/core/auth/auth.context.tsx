import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = "tiketbisa_partner_auth";

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

  const login = useCallback(() => {
    // TODO: Integrate real Google OAuth flow
    // For now, simulate a login
    const mockUser: AuthUser = {
      email: "partner@tiketbisa.com",
      name: "Partner User",
      picture: undefined,
    };
    setUser(mockUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
