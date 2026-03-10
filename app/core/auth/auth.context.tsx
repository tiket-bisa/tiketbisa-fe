import { useCallback, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  loginAsAdmin as loginAsAdminAction,
  loginAsPartner as loginAsPartnerAction,
  logout as logoutAction,
  type AuthUser,
  type AuthRole,
} from "../store/slices/auth.slice";

export type { AuthUser, AuthRole };

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsAdmin: () => void;
  loginAsPartner: (brandSlug: string, brandName: string) => void;
  logout: () => void;
}

/**
 * Compatibility layer for components using AuthProvider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Redux Provider is already at the root, so we just pass through
  return <>{children}</>;
}

/**
 * useAuth hook that now uses Redux under the hood
 */
export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const loginAsAdmin = useCallback(() => {
    dispatch(loginAsAdminAction());
  }, [dispatch]);

  const loginAsPartner = useCallback(
    (brandSlug: string, brandName: string) => {
      dispatch(loginAsPartnerAction({ brandSlug, brandName }));
    },
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  return {
    user,
    isLoading,
    loginAsAdmin,
    loginAsPartner,
    logout,
  };
}
