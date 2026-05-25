import { useCallback, useState, useEffect } from "react";

interface AuthUser {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("admin_user");
        localStorage.removeItem("admin_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";

  const logout = useCallback(() => {
    localStorage.removeItem("admin_auth");
    localStorage.removeItem("admin_user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return {
    user,
    isLoggedIn,
    isAdmin,
    isLoading,
    logout,
  };
}
