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

        // Only get device user if not authenticated
        if (!isAuthenticated) {
          const response = await userAPI.getByDevice(id);
          if (response.data.success) {
            setUser(response.data.data);
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [isAuthenticated]);

  // Toggle product like (requires authentication)
  const toggleLike = useCallback(
    async (productId) => {
      console.log(
        "toggleLike called with productId:",
        productId,
        "isAuthenticated:",
        isAuthenticated
      );

      if (!isAuthenticated) {
        return {
          success: false,
          message: "Please login to like products",
          requiresAuth: true,
        };
      }

      try {
        const headers = getAuthHeaders();
        console.log("Making API call with headers:", headers);

        const response = await userAPI.toggleLike(null, productId, headers);
        console.log("API response:", response.data);

        if (response.data.success) {
          // Update local user state to reflect the like/unlike
          setUser((prevUser) => {
            if (!prevUser) return prevUser;

            const isCurrentlyLiked = prevUser.likedProducts.some(
              (id) => id === productId
            );

            if (isCurrentlyLiked) {
              // Remove from liked products
              return {
                ...prevUser,
                likedProducts: prevUser.likedProducts.filter(
                  (id) => id !== productId
                ),
              };
            } else {
              // Add to liked products
              return {
                ...prevUser,
                likedProducts: [...prevUser.likedProducts, productId],
              };
            }
          });

          // Also update the authenticated user data in localStorage
          const authUser = JSON.parse(localStorage.getItem("user"));
          if (authUser) {
            const isCurrentlyLiked = authUser.likedProducts.some(
              (id) => id === productId
            );

            if (isCurrentlyLiked) {
              // Remove from liked products
              authUser.likedProducts = authUser.likedProducts.filter(
                (id) => id !== productId
              );
            } else {
              // Add to liked products
              authUser.likedProducts = [...authUser.likedProducts, productId];
            }

            localStorage.setItem("user", JSON.stringify(authUser));
            console.log("Updated localStorage with new like state");
          }

          // Don't refresh user profile to avoid logout issues
          // The local state update is sufficient for immediate UI feedback

          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling like:", error);
        return { success: false, message: "Failed to toggle like" };
      }
    },
    [isAuthenticated, getAuthHeaders]
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

  // Check if product is liked (requires authentication)
  const isProductLiked = useCallback(
    (productId) => {
      if (!isAuthenticated) return false;

      // Get the authenticated user from AuthContext
      const authUser = JSON.parse(localStorage.getItem("user"));
      if (!authUser || !authUser.likedProducts) return false;

      return authUser.likedProducts.some((id) => id === productId);
    },
    [isAuthenticated]
  );

  // Get user's liked products (requires authentication)
  const getLikedProducts = useCallback(async () => {
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Please login to view liked products",
        requiresAuth: true,
      };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getLikedProducts(null, headers);
      return response.data;
    } catch (error) {
      console.error("Error getting liked products:", error);
      return { success: false, message: "Failed to get liked products" };
    }
  }, [isAuthenticated, getAuthHeaders]);

  // Get user's viewed products (requires authentication)
  const getViewedProducts = useCallback(async () => {
    if (!isAuthenticated) {
      return {
        success: false,
        message: "Please login to view history",
        requiresAuth: true,
      };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getViewedProducts(null, headers);
      return response.data;
    } catch (error) {
      console.error("Error getting viewed products:", error);
      return { success: false, message: "Failed to get viewed products" };
    }
  }, [isAuthenticated, getAuthHeaders]);

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
