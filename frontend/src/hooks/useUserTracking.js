import { useState, useEffect, useCallback } from "react";
import { getDeviceId } from "../utils/deviceId";
import { userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const useUserTracking = () => {
  const [deviceId, setDeviceId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, getAuthHeaders, refreshUserProfile } = useAuth();
  const [viewRecording, setViewRecording] = useState(new Set()); // Track products being recorded

  // Initialize device ID and user
  useEffect(() => {
    const initUser = async () => {
      try {
        const id = getDeviceId();
        setDeviceId(id);

        // Get device user when not authenticated (each device has its own account)
        if (!isAuthenticated) {
          const response = await userAPI.getByDevice(id);
          if (response.data.success) {
            setUser(response.data.data);
          }
        } else {
          setUser(null); // Clear device user when logged in
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [isAuthenticated]);

  // Toggle product like (works for both logged-in and anonymous/device users)
  const toggleLike = useCallback(
    async (productId) => {
      // Need either auth or deviceId to like
      if (!isAuthenticated && !deviceId) {
        return {
          success: false,
          message: "Please wait for app to load",
          requiresAuth: false,
        };
      }

      try {
        const headers = getAuthHeaders();
        const response = await userAPI.toggleLike(
          isAuthenticated ? null : deviceId,
          productId,
          headers
        );

        if (response.data.success) {
          // Update local user state for anonymous users
          if (!isAuthenticated) {
            setUser((prevUser) => {
              if (!prevUser) return prevUser;
              const isCurrentlyLiked = prevUser.likedProducts?.some(
                (id) => id.toString() === productId || id === productId
              );
              if (isCurrentlyLiked) {
                return {
                  ...prevUser,
                  likedProducts: prevUser.likedProducts.filter(
                    (id) => id.toString() !== productId && id !== productId
                  ),
                };
              }
              return {
                ...prevUser,
                likedProducts: [...(prevUser.likedProducts || []), productId],
              };
            });
          } else {
            // Update localStorage for authenticated users
            const authUser = JSON.parse(localStorage.getItem("user"));
            if (authUser) {
              const isCurrentlyLiked = authUser.likedProducts?.some(
                (id) => id === productId
              );
              if (isCurrentlyLiked) {
                authUser.likedProducts = authUser.likedProducts.filter(
                  (id) => id !== productId
                );
              } else {
                authUser.likedProducts = [...(authUser.likedProducts || []), productId];
              }
              localStorage.setItem("user", JSON.stringify(authUser));
            }
          }
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling like:", error);
        return { success: false, message: "Failed to toggle like" };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders]
  );

  // Record product view (works for both authenticated and anonymous users)
  const recordView = useCallback(
    async (productId) => {
      // Prevent multiple rapid recordings for the same product
      if (viewRecording.has(productId)) {
        return { success: false, message: "View already being recorded" };
      }

      try {
        // Add to recording set
        setViewRecording((prev) => new Set(prev).add(productId));

        const headers = getAuthHeaders();
        const response = await userAPI.recordView(deviceId, productId, headers);

        // Remove from recording set after a delay
        setTimeout(() => {
          setViewRecording((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }, 2000); // 2 second cooldown

        if (response.data.success) {
          return response.data;
        }
        return response.data;
      } catch (error) {
        // Remove from recording set on error
        setViewRecording((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });

        console.error("Error recording view:", error);
        return { success: false, message: "Failed to record view" };
      }
    },
    [deviceId, getAuthHeaders, viewRecording]
  );

  // Add product review (requires authentication)
  const addReview = useCallback(
    async (productId, rating, comment = "") => {
      if (!isAuthenticated) {
        return {
          success: false,
          message: "Please login to leave reviews",
          requiresAuth: true,
        };
      }

      try {
        const headers = getAuthHeaders();
        const response = await userAPI.addReview(
          null,
          productId,
          rating,
          comment,
          headers
        );
        if (response.data.success) {
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error adding review:", error);
        return { success: false, message: "Failed to add review" };
      }
    },
    [isAuthenticated, getAuthHeaders]
  );

  // Check if product is liked (works for both logged-in and device users)
  const isProductLiked = useCallback(
    (productId) => {
      if (isAuthenticated) {
        const authUser = JSON.parse(localStorage.getItem("user"));
        if (!authUser || !authUser.likedProducts) return false;
        return authUser.likedProducts.some((id) => id === productId);
      }
      // Device user - check local user state (likedProducts can be IDs or populated objects)
      if (!user?.likedProducts) return false;
      return user.likedProducts.some((item) => {
        const id = item?._id ?? item;
        return id?.toString() === productId || id === productId;
      });
    },
    [isAuthenticated, user]
  );

  // Get user's liked products (works for both logged-in and device users)
  const getLikedProducts = useCallback(async () => {
    if (!isAuthenticated && !deviceId) {
      return { success: false, message: "Please wait for app to load", requiresAuth: false };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getLikedProducts(
        isAuthenticated ? null : deviceId,
        headers
      );
      return response.data;
    } catch (error) {
      console.error("Error getting liked products:", error);
      return { success: false, message: "Failed to get liked products" };
    }
  }, [isAuthenticated, deviceId, getAuthHeaders]);

  // Get user's viewed products (works for both logged-in and device users)
  const getViewedProducts = useCallback(async () => {
    if (!isAuthenticated && !deviceId) {
      return { success: false, message: "Please wait for app to load", requiresAuth: false };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getViewedProducts(
        isAuthenticated ? null : deviceId,
        headers
      );
      return response.data;
    } catch (error) {
      console.error("Error getting viewed products:", error);
      return { success: false, message: "Failed to get viewed products" };
    }
  }, [isAuthenticated, deviceId, getAuthHeaders]);

  return {
    deviceId,
    user,
    loading,
    isAuthenticated,
    toggleLike,
    recordView,
    addReview,
    isProductLiked,
    getLikedProducts,
    getViewedProducts,
  };
};
