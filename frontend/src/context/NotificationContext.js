import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { notificationAPI, userAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { getDeviceId } from "../utils/deviceId";
import {
  registerServiceWorker,
  subscribePush,
  unsubscribePush,
  isPushSupported,
  getPermissionState,
} from "../utils/pushNotifications";

const PUSH_ENABLED_KEY = "push-enabled";
const LEGACY_KEY = "notifications-enabled";

const getStoredPushEnabled = () => {
  try {
    const stored = localStorage.getItem(PUSH_ENABLED_KEY);
    if (stored !== null) return stored === "true";
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      const val = legacy === "true";
      localStorage.setItem(PUSH_ENABLED_KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
      return val;
    }
    return true;
  } catch {
    return true;
  }
};

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [pushEnabled, setPushEnabledState] = useState(getStoredPushEnabled);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState("default");
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushEnableError, setPushEnableError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const deviceId = isAuthenticated ? null : getDeviceId();
      const res = await notificationAPI.getAll(deviceId);
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const ensurePushSubscription = useCallback(async () => {
    if (!pushEnabled || !isPushSupported() || getPermissionState() !== "granted") return;
    try {
      const res = await notificationAPI.getVapidPublic();
      if (!res.data?.success || !res.data?.vapidPublicKey) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) return;
      const subscription = await subscribePush(res.data.vapidPublicKey);
      const deviceId = isAuthenticated ? null : getDeviceId();
      await userAPI.pushSubscribe(subscription, deviceId);
    } catch (e) {
      console.warn("Ensure push subscription:", e);
    }
  }, [isAuthenticated, pushEnabled]);

  useEffect(() => {
    try {
      setPushSupported(isPushSupported());
      setPushPermission(getPermissionState());
      registerServiceWorker()
        .then(async (reg) => {
          if (!reg) return;
          const perm = getPermissionState();
          if (pushEnabled && perm === "granted") {
            await ensurePushSubscription();
          } else if (!pushEnabled && perm === "granted") {
            await unsubscribePush();
          }
        })
        .catch(() => {});
    } catch (e) {
      setPushSupported(false);
      setPushPermission("denied");
    }
  }, [ensurePushSubscription, pushEnabled]);

  const subscribeToPush = useCallback(async () => {
    if (!isPushSupported() || getPermissionState() !== "granted") return false;
    setPushSubscribing(true);
    try {
      await registerServiceWorker();
      const res = await notificationAPI.getVapidPublic();
      if (!res.data?.success || !res.data?.vapidPublicKey) {
        throw new Error("Push not configured");
      }
      const subscription = await subscribePush(res.data.vapidPublicKey);
      const deviceId = isAuthenticated ? null : getDeviceId();
      await userAPI.pushSubscribe(subscription, deviceId);
      setPushPermission("granted");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    } finally {
      setPushSubscribing(false);
    }
  }, [isAuthenticated]);

  const enablePushNotifications = useCallback(async () => {
    if (!isPushSupported()) return false;
    const perm = getPermissionState();
    if (perm === "granted") {
      return await subscribeToPush();
    }
    if (perm === "denied") return false;
    setPushSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        return await subscribeToPush();
      }
      if (permission === "denied") {
        setPushPermission("denied");
      }
      return false;
    } catch (e) {
      console.error("Request permission error:", e);
      setPushPermission("denied");
      return false;
    } finally {
      setPushSubscribing(false);
    }
  }, [subscribeToPush]);

  const requestPushPermission = useCallback(async () => {
    if (!isPushSupported() || getPermissionState() !== "default") return false;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        const ok = await enablePushNotifications();
        if (ok) {
          setPushEnabledState(true);
          try {
            localStorage.setItem(PUSH_ENABLED_KEY, "true");
          } catch {}
        }
        return ok;
      }
    } catch (e) {
      setPushPermission("denied");
    }
    return false;
  }, [enablePushNotifications]);

  const setPushEnabled = useCallback(async (enabled) => {
    setPushEnableError(null);
    if (enabled) {
      if (getPermissionState() === "denied") {
        setPushEnableError("denied");
        return;
      }
      setPushEnabledState(true);
      const ok = await enablePushNotifications();
      if (!ok) {
        setPushEnabledState(false);
        try {
          localStorage.setItem(PUSH_ENABLED_KEY, "false");
        } catch {}
        setPushEnableError("failed");
      } else {
        try {
          localStorage.setItem(PUSH_ENABLED_KEY, "true");
        } catch {}
      }
    } else {
      await unsubscribePush();
      setPushEnabledState(false);
      try {
        localStorage.setItem(PUSH_ENABLED_KEY, "false");
      } catch {}
    }
  }, [enablePushNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      try {
        const deviceId = isAuthenticated ? null : getDeviceId();
        await notificationAPI.markAsRead(id, deviceId);
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error("Mark read error:", err);
      }
    },
    [isAuthenticated],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const deviceId = isAuthenticated ? null : getDeviceId();
      await notificationAPI.markAllAsRead(deviceId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  }, [isAuthenticated]);

  const clearAll = useCallback(async () => {
    try {
      const deviceId = isAuthenticated ? null : getDeviceId();
      await notificationAPI.clearAll(deviceId);
      setNotifications([]);
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  }, [isAuthenticated, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        pushSupported,
        pushPermission,
        pushSubscribing,
        requestPushPermission,
        pushEnabled,
        setPushEnabled,
        pushEnableError,
        setPushEnableError,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
