import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { InternalTokenResponseData } from "./internal-auth.api";
import { refreshInternalToken } from "./internal-auth.api";
import { AUTH_STORAGE_KEY } from "./auth.constants";
import { internalHttpClient } from "~/core/api";

export interface BaseAuthUser {
  identifier: string;
  email: string;
  name: string;
  picture?: string;
  internal_token?: string;
  brand_id?: string;
}

export interface AdminUser extends BaseAuthUser {
  role: "admin";
  username?: undefined;
  brand_slug?: undefined;
  brand_name?: undefined;
  brand_id?: undefined;
}

export interface PartnerUser extends BaseAuthUser {
  role: "partner";
  username?: undefined;
  brand_id: string;
  brand_slug: string;
  brand_name: string;
}

export interface ScannerUser extends BaseAuthUser {
  role: "scanner";
  username: string;
  brand_id: string;
  brand_slug: string;
  brand_name: string;
}

export type AuthUser = AdminUser | PartnerUser | ScannerUser;
export type AuthRole = AuthUser["role"];

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithOAuth: (payload: InternalTokenResponseData) => void;
  loginWithScanner: (payload: InternalTokenResponseData) => void;
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

  const buildUserFromPayload = useCallback(
    (payload: InternalTokenResponseData, profile?: GoogleIdTokenPayload): AuthUser => {
      const email = profile?.email ?? "";
      const name = profile?.name ?? email ?? payload.username ?? payload.brandName ?? "Tiketbisa User";

      if (payload.role === "admin") {
        if (!email) {
          throw new Error("ID token does not contain email");
        }
        return {
          identifier: email,
          email,
          name,
          picture: profile?.picture,
          role: "admin",
          internal_token: payload.idToken,
        };
      }

      if (!payload.brandSlug || !payload.brandName || !payload.brandId) {
        throw new Error("Account is missing brand details");
      }

      if (payload.role === "scanner") {
        if (!payload.username) {
          throw new Error("Scanner account is missing username");
        }

        return {
          identifier: payload.username,
          username: payload.username,
          email: payload.username,
          name: payload.brandName,
          role: "scanner",
          brand_id: payload.brandId,
          brand_slug: payload.brandSlug,
          brand_name: payload.brandName,
          internal_token: payload.idToken,
        };
      }

      if (!email) {
        throw new Error("ID token does not contain email");
      }

      return {
        identifier: email,
        email,
        name: payload.brandName || name,
        picture: profile?.picture,
        role: "partner",
        brand_id: payload.brandId,
        brand_slug: payload.brandSlug,
        brand_name: payload.brandName,
        internal_token: payload.idToken,
      };
    },
    [],
  );

  // Restore session on mount
  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          const clearSession = () => {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            if (isActive) {
              setUser(null);
            }
          };

          const applySession = (nextUser: AuthUser) => {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
            if (isActive) {
              setUser(nextUser);
            }
          };

          const refreshSession = async () => {
            const refreshed = await refreshInternalToken();
            if (!isActive) {
              return;
            }

            const refreshedUser = buildUserFromPayload(
              {
                ...refreshed,
                brandId: refreshed.brandId ?? parsed.brand_id ?? null,
                brandSlug: refreshed.brandSlug ?? parsed.brand_slug ?? null,
                brandName: refreshed.brandName ?? parsed.brand_name ?? parsed.name ?? null,
                username: refreshed.username ?? parsed.username ?? null,
              },
              parsed.role === "scanner"
                ? undefined
                : {
                    email: parsed.email,
                    name: parsed.name,
                    picture: parsed.picture,
                  },
            );
            applySession(refreshedUser);
          };

          // Invalidate legacy sessions that are missing the internal_token
          if (!parsed.internal_token || ((parsed.role === "partner" || parsed.role === "scanner") && !parsed.brand_id)) {
            try {
              await refreshSession();
            } catch {
              clearSession();
            }
          } else {
            applySession(parsed);

            const meResponse = await internalHttpClient.get("/user/me");
            if (!isActive) {
              return;
            }

            if (!meResponse.success && (meResponse.status_code === 401 || meResponse.status_code === 403)) {
              try {
                await refreshSession();

                const meRetry = await internalHttpClient.get("/user/me");
                if (!meRetry.success && (meRetry.status_code === 401 || meRetry.status_code === 403)) {
                  clearSession();
                }
              } catch {
                clearSession();
              }
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
  }, [buildUserFromPayload]);

  const loginWithOAuth = useCallback((payload: InternalTokenResponseData) => {
    const profile = decodeJwtPayload(payload.idToken);
    const nextUser = buildUserFromPayload(payload, profile);
    setUser(nextUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }, [buildUserFromPayload]);

  const loginWithScanner = useCallback((payload: InternalTokenResponseData) => {
    const nextUser = buildUserFromPayload(payload);
    setUser(nextUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
  }, [buildUserFromPayload]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithOAuth, loginWithScanner, logout }}>
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
