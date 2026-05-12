/**
 * 인증 컨텍스트 — 로그인 상태를 전역에서 관리
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getToken, setToken as saveToken, removeToken } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginUser: (token: string, user: User) => void;
  logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loginUser: () => {},
  logoutUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // 새로고침 시 localStorage에서 복원
    const saved = localStorage.getItem("user_info");
    return saved ? JSON.parse(saved) : null;
  });

  const isLoggedIn = !!user && !!getToken();

  const loginUser = useCallback((token: string, userData: User) => {
    saveToken(token);
    localStorage.setItem("user_info", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logoutUser = useCallback(() => {
    removeToken();
    localStorage.removeItem("user_info");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
