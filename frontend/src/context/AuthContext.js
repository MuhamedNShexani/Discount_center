import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authAPI } from "../services/api";
import { installNativeGoogleAuthBridge } from "../utils/nativeGoogleAuthBridge";

const AuthContext = createContext(null);

const LOG = (...args) => console.log("[DASHKAN_WEB]", ...args);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const acceptRef = useRef(null);

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        LOG("hydrated session from localStorage on mount");
      } catch (e) {
        LOG("failed to parse localStorage.user on mount", e);
      }

      refreshUserProfile().catch((error) => {
        console.log(
          "Profile refresh failed on startup, but keeping user logged in:",
          error.message,
        );
      });
    } else {
      LOG("no localStorage session on mount", {
        hasToken: Boolean(savedToken),
        hasUser: Boolean(savedUser),
      });
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only hydrate
  }, []);

  const logout = useCallback(() => {
    LOG("logout() called", new Error().stack);
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const refreshUserProfile = async () => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        const response = await authAPI.getProfile({
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (response.data.success) {
          const updatedUser = response.data.data.user;
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          LOG("profile refreshed successfully");
        }
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        LOG("profile refresh 401 → logout");
        logout();
        return;
      }
      if (status === 404) {
        LOG("profile refresh 404 → logout");
        logout();
        return;
      }
      console.error("Error refreshing user profile:", error);
      console.log(
        "Profile refresh failed, but keeping user logged in with existing data",
      );
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        LOG("password login success → state + localStorage updated");
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        LOG("GIS loginWithGoogle success → state + localStorage updated");
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Google sign-in failed",
      };
    }
  };

  /** After Google OAuth redirect or native Flutter JWT injection. */
  const completeSessionWithToken = useCallback(
    async (appJwt) => {
      if (!appJwt || typeof appJwt !== "string") {
        LOG("completeSessionWithToken: invalid jwt");
        return { success: false, message: "Invalid session" };
      }
      try {
        LOG("completeSessionWithToken: fetching /auth/profile");
        const response = await authAPI.getProfile({
          headers: { Authorization: `Bearer ${appJwt}` },
        });
        if (response.data?.success) {
          const u = response.data.data.user;
          setToken(appJwt);
          setUser(u);
          localStorage.setItem("token", appJwt);
          localStorage.setItem("user", JSON.stringify(u));
          LOG("completeSessionWithToken success", {
            userId: u?._id,
            email: u?.email,
          });
          return { success: true };
        }
        LOG("completeSessionWithToken: profile not success → logout");
        logout();
        return {
          success: false,
          message: response.data?.message || "Could not complete sign-in",
        };
      } catch (error) {
        console.error("completeSessionWithToken:", error);
        LOG("completeSessionWithToken error → logout", error?.message);
        logout();
        return {
          success: false,
          message:
            error.response?.data?.message || "Could not complete sign-in",
        };
      }
    },
    [logout],
  );

  /**
   * Apply session from Flutter (JWT already issued by POST /api/auth/google).
   * Same localStorage + React state path as password / GIS login.
   */
  const acceptNativeAuthSession = useCallback(
    async ({ token: appJwt, user: injectedUser } = {}) => {
      const jwt = typeof appJwt === "string" ? appJwt.trim() : "";
      LOG("acceptNativeAuthSession called", {
        hasJwt: Boolean(jwt),
        hasInjectedUser: Boolean(injectedUser),
        injectedUserType: typeof injectedUser,
      });
      if (!jwt) {
        return { success: false, message: "Invalid session" };
      }

      // Always persist token first so axios interceptor picks it up immediately.
      localStorage.setItem("token", jwt);

      if (injectedUser && typeof injectedUser === "object") {
        setToken(jwt);
        setUser(injectedUser);
        localStorage.setItem("user", JSON.stringify(injectedUser));
        LOG("acceptNativeAuthSession: applied injected user + token", {
          userId: injectedUser?._id,
          email: injectedUser?.email,
          localStorageToken: Boolean(localStorage.getItem("token")),
          localStorageUser: Boolean(localStorage.getItem("user")),
          isAuthenticatedWouldBe: true,
        });
        return { success: true };
      }

      LOG("acceptNativeAuthSession: no injected user → completeSessionWithToken");
      return completeSessionWithToken(jwt);
    },
    [completeSessionWithToken],
  );

  acceptRef.current = acceptNativeAuthSession;

  // Stable bridge install (avoid remove/re-add on every callback identity change).
  useEffect(() => {
    LOG("AuthProvider mounting native Google auth bridge");
    return installNativeGoogleAuthBridge({
      onSession: (payload) => {
        LOG("AuthContext onSession → acceptNativeAuthSession");
        void acceptRef.current?.(payload);
      },
      onError: (message) => {
        LOG("AuthContext onError from bridge", message);
      },
    });
  }, []);

  useEffect(() => {
    LOG("AuthContext state changed", {
      hasUser: Boolean(user),
      hasToken: Boolean(token),
      isAuthenticated: Boolean(user && token),
      userId: user?._id,
      email: user?.email,
    });
  }, [user, token]);

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const { user, token } = response.data.data;
        setUser(user);
        setToken(token);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const deactivate = async () => {
    try {
      const response = await authAPI.deactivate(getAuthHeaders());
      if (response.data?.success) {
        logout();
        return { success: true, message: response.data.message };
      }
      return {
        success: false,
        message: response.data?.message || "Deactivation failed",
      };
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Deactivation failed";
      return { success: false, message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Update failed",
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(
        currentPassword,
        newPassword,
      );
      if (response.data.success) {
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Change password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Password change failed",
      };
    }
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        completeSessionWithToken,
        acceptNativeAuthSession,
        logout,
        deactivate,
        register,
        updateProfile,
        changePassword,
        getAuthHeaders,
        refreshUserProfile,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
