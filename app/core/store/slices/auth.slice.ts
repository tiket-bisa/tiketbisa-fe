import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthRole = "admin" | "partner";

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  role: AuthRole;
  brand_slug?: string; // only for partner role
  brand_name?: string; // only for partner role
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = "tiketbisa_auth";

const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return { user: null, isLoading: true };
  }
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return {
      user: stored ? JSON.parse(stored) : null,
      isLoading: false,
    };
  } catch {
    return { user: null, isLoading: false };
  }
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginAsAdmin: (state) => {
      const mockUser: AuthUser = {
        email: "admin@tiketbisa.com",
        name: "Admin Tiketbisa",
        role: "admin",
      };
      state.user = mockUser;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    },
    loginAsPartner: (state, action: PayloadAction<{ brandSlug: string; brandName: string }>) => {
      const { brandSlug, brandName } = action.payload;
      const mockUser: AuthUser = {
        email: `partner@${brandSlug}.com`,
        name: brandName,
        role: "partner",
        brand_slug: brandSlug,
        brand_name: brandName,
      };
      state.user = mockUser;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { loginAsAdmin, loginAsPartner, logout, setLoading } = authSlice.actions;

export default authSlice.reducer;
