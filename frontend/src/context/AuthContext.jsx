import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const { data } = await api.get("/users/me");
      setUser({ ...data.user, onboardingComplete: data.onboardingComplete });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("jammin_token");
    if (token) refreshUser();
    else setLoading(false);
  }, []);

  // Only stores the token, then fetches the real profile (including the
  // accurate onboardingComplete flag) — never trust a caller-supplied
  // user object here, that's how the "always sent back to onboarding"
  // bug happened.
  async function login(token) {
    localStorage.setItem("jammin_token", token);
    await refreshUser();
  }

  function logout() {
    localStorage.removeItem("jammin_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
