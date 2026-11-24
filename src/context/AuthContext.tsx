import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService, pushTokenService, type RegisterResult, type UpdateProfilePayload } from "../services";
import { queryClient } from "../config/queryClient";
import { LoginPayload, RegisterPayload, User } from "../types/auth";

type AuthContextValue = {
  currentUser: User | null;
  isRestoring: boolean;
  isAuthenticating: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService
      .getCurrentUser()
      .then((user) => {
        if (isMounted) setCurrentUser(user);
      })
      .catch(() => {
        // Không khôi phục được (mất mạng, profile lỗi...) → về màn đăng nhập.
        if (isMounted) setCurrentUser(null);
      })
      .finally(() => {
        if (isMounted) setIsRestoring(false);
      });

    const unsubscribe = authService.onSignedOut(() => {
      setCurrentUser(null);
      // Không giữ dữ liệu sức khỏe của người vừa đăng xuất trong bộ nhớ.
      queryClient.clear();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsAuthenticating(true);
    try {
      const user = await authService.login(payload);
      setCurrentUser(user);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsAuthenticating(true);
    try {
      const result = await authService.register(payload);
      if (result.status === "SIGNED_IN") setCurrentUser(result.user);
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!currentUser) return;
      const user = await authService.updateProfile(currentUser.id, payload);
      setCurrentUser(user);
    },
    [currentUser]
  );

  const logout = useCallback(async () => {
    // Gỡ push token khi còn phiên; lỗi mạng cũng không chặn đăng xuất.
    await pushTokenService.unregisterPushToken().catch(() => undefined);
    await authService.logout();
    setCurrentUser(null);
    queryClient.clear();
  }, []);

  const value = useMemo(
    () => ({ currentUser, isRestoring, isAuthenticating, login, register, updateProfile, logout }),
    [currentUser, isRestoring, isAuthenticating, login, register, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
