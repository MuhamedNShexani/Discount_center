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
  isPushSupported,
  getPermissionState,
} from "../utils/pushNotifications";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState("default");
  const [pushSubscribing, setPushSubscribing] = useState(false);

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
    if (!isPushSupported() || getPermissionState() !== "granted") return;
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
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      setPushSupported(isPushSupported());
      setPushPermission(getPermissionState());
      registerServiceWorker().then((reg) => {
        if (reg && getPermissionState() === "granted") {
          ensurePushSubscription();
        }
      }).catch(() => {});
    } catch (e) {
      setPushSupported(false);
      setPushPermission("denied");
    }
  }, [ensurePushSubscription]);

  const enablePushNotifications = useCallback(async () => {
    if (!pushSupported || pushPermission === "granted") return;
    setPushSubscribing(true);
    try {
      const res = await notificationAPI.getVapidPublic();
      if (!res.data.success || !res.data.vapidPublicKey) {
        throw new Error("Push not configured");
      }
      const subscription = await subscribePush(res.data.vapidPublicKey);
      const deviceId = isAuthenticated ? null : getDeviceId();
      await userAPI.pushSubscribe(subscription, deviceId);
      setPushPermission("granted");
      return true;
    } catch (err) {
      console.error("Push subscribe error:", err);
      if (err.name === "NotAllowedError") {
        setPushPermission("denied");
      }
      return false;
    } finally {
      setPushSubscribing(false);
    }
  }, [pushSupported, pushPermission, isAuthenticated]);

  const requestPushPermission = useCallback(async () => {
    if (!pushSupported || pushPermission !== "default") return false;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        return await enablePushNotifications();
      }
    } catch (e) {
      setPushPermission("denied");
    }
    return false;
  }, [pushSupported, pushPermission, enablePushNotifications]);

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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        pushSupported,
        pushPermission,
        pushSubscribing,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
