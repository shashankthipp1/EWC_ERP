import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/http";

type User = { id: string; name: string; email: string; role: "admin" | "manager" | "staff" };
type AuthContextValue = {
  user: User | null;
  token: string | null;
  isCheckingSession: boolean;
  login(email: string, password: string): Promise<void>;
  signup(name: string, email: string, password: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  verifyOtp(email: string, otp: string, password?: string): Promise<void>;
  logout(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser() {
  const raw = localStorage.getItem("erp_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem("erp_user");
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem("erp_token"));
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(token));

  function clearSession() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setToken(null);
    setUser(null);
  }

  function storeSession(nextToken: string, nextUser: User) {
    localStorage.setItem("erp_token", nextToken);
    localStorage.setItem("erp_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }

  useEffect(() => {
    window.addEventListener("erp:session-expired", clearSession);
    return () => window.removeEventListener("erp:session-expired", clearSession);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;
    setIsCheckingSession(true);
    api
      .get("/auth/me")
      .then(({ data }) => {
        if (!isMounted) return;
        localStorage.setItem("erp_user", JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        if (isMounted) clearSession();
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function applySession(endpoint: "login" | "signup", payload: Record<string, string>) {
    const { data } = await api.post(`/auth/${endpoint}`, payload);
    storeSession(data.token, data.user);
    toast.success(endpoint === "login" ? "Welcome back" : "Account created");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isCheckingSession,
      login: (email, password) => applySession("login", { email, password }),
      signup: (name, email, password) => applySession("signup", { name, email, password }),
      forgotPassword: async (email) => {
        await api.post("/auth/forgot-password", { email });
        toast.success("OTP verification started");
      },
      verifyOtp: async (email, otp, password) => {
        const { data } = await api.post("/auth/verify-otp", { email, otp, password });
        storeSession(data.token, data.user);
        toast.success("Secure verification complete");
      },
      logout: clearSession
    }),
    [user, token, isCheckingSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
