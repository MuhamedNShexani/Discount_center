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
import {
  isFlutterApp,
  isNotificationsEnabled,
  requestNotifications,
  shouldShowEnableNotificationsButton,
  subscribeFlutterNotificationStatus,
} from "../utils/notificationPermission";

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
  const [authRequired, setAuthRequired] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState("default");
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [pushEnableError, setPushEnableError] = useState(null);
  const [showEnableNotifications, setShowEnableNotifications] = useState(false);

  const refreshPermissionState = useCallback(() => {
    const perm = getPermissionState();
    setPushPermission(perm);
    setPushSupported(isPushSupported());
    setShowEnableNotifications(
      isPushSupported() && shouldShowEnableNotificationsButton(),
    );
    return perm;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (authRequired && !isAuthenticated) {
      // Avoid spamming backend with 401 for guests without a server-side user.
      return;
    }
    setLoading(true);
    try {
      const deviceId = isAuthenticated ? null : getDeviceId();
      const res = await notificationAPI.getAll(deviceId);
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        // Guest deviceId may not exist in DB yet; treat as no notifications.
        setNotifications([]);
        setUnreadCount(0);
        if (!isAuthenticated) setAuthRequired(true);
        return;
      }
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [authRequired, isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const ensurePushSubscription = useCallback(async () => {
    /** Native Flutter FCM handles delivery; skip web PushManager in the shell. */
    if (isFlutterApp()) return;
    if (!pushEnabled || !isPushSupported() || getPermissionState() !== "granted")
      return;
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
      refreshPermissionState();
      if (isFlutterApp()) return undefined;
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
      setShowEnableNotifications(false);
    }
  }, [ensurePushSubscription, pushEnabled, refreshPermissionState]);

  /** Flutter: refresh UI when returning from native notification settings. */
  useEffect(() => {
    const unsubscribe = subscribeFlutterNotificationStatus(() => {
      const perm = refreshPermissionState();
      if (perm === "granted" || isNotificationsEnabled()) {
        setPushEnabledState(true);
        try {
          localStorage.setItem(PUSH_ENABLED_KEY, "true");
        } catch {}
        setPushEnableError(null);
      }
    });
    return unsubscribe;
  }, [refreshPermissionState]);

  const subscribeToPush = useCallback(async () => {
    if (isFlutterApp()) {
      refreshPermissionState();
      return isNotificationsEnabled();
    }
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
      setShowEnableNotifications(false);
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    } finally {
      setPushSubscribing(false);
    }
  }, [isAuthenticated, refreshPermissionState]);

  const enablePushNotifications = useCallback(async () => {
    if (!isPushSupported()) return false;

    if (isFlutterApp()) {
      setPushSubscribing(true);
      try {
        await requestNotifications();
        const perm = refreshPermissionState();
        return perm === "granted" || isNotificationsEnabled();
      } catch (e) {
        console.error("Request Flutter notification settings error:", e);
        return false;
      } finally {
        setPushSubscribing(false);
      }
    }

    const perm = getPermissionState();
    if (perm === "granted") {
      return await subscribeToPush();
    }
    if (perm === "denied") return false;
    setPushSubscribing(true);
    try {
      const permission = await requestNotifications();
      setPushPermission(permission);
      setShowEnableNotifications(
        isPushSupported() && shouldShowEnableNotificationsButton(),
      );
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
  }, [refreshPermissionState, subscribeToPush]);

  const requestPushPermission = useCallback(async () => {
    if (!isPushSupported()) return false;

    if (isFlutterApp()) {
      setPushSubscribing(true);
      try {
        await requestNotifications();
        const perm = refreshPermissionState();
        if (perm === "granted" || isNotificationsEnabled()) {
          setPushEnabledState(true);
          try {
            localStorage.setItem(PUSH_ENABLED_KEY, "true");
          } catch {}
          setPushEnableError(null);
          return true;
        }
        return false;
      } catch (e) {
        console.error("Flutter notification settings error:", e);
        return false;
      } finally {
        setPushSubscribing(false);
      }
    }

    if (getPermissionState() !== "default") return false;
    try {
      const permission = await requestNotifications();
      setPushPermission(permission);
      setShowEnableNotifications(
        isPushSupported() && shouldShowEnableNotificationsButton(),
      );
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
  }, [enablePushNotifications, refreshPermissionState]);

  const setPushEnabled = useCallback(
    async (enabled) => {
      setPushEnableError(null);
      if (enabled) {
        if (getPermissionState() === "denied" && !isFlutterApp()) {
          setPushEnableError("denied");
          return;
        }
        setPushEnabledState(true);
        const ok = await enablePushNotifications();
        if (!ok) {
          /** Flutter opens Settings asynchronously — keep optimistic enabled until status event. */
          if (isFlutterApp()) {
            try {
              localStorage.setItem(PUSH_ENABLED_KEY, "true");
            } catch {}
            return;
          }
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
        if (!isFlutterApp()) {
          await unsubscribePush();
        }
        setPushEnabledState(false);
        try {
          localStorage.setItem(PUSH_ENABLED_KEY, "false");
        } catch {}
      }
    },
    [enablePushNotifications],
  );

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
        showEnableNotifications,
        refreshPermissionState,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
