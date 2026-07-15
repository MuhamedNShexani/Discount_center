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
          headers,
        );

        if (response.data.success) {
          // Update local user state for anonymous users
          if (!isAuthenticated) {
            setUser((prevUser) => {
              if (!prevUser) return prevUser;
              const isCurrentlyLiked = prevUser.likedProducts?.some(
                (id) => id.toString() === productId || id === productId,
              );
              if (isCurrentlyLiked) {
                return {
                  ...prevUser,
                  likedProducts: prevUser.likedProducts.filter(
                    (id) => id.toString() !== productId && id !== productId,
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
              const current = Array.isArray(authUser.likedProducts)
                ? authUser.likedProducts
                : [];
              const isCurrentlyLiked = current.some(
                (item) => String(item?._id ?? item) === String(productId),
              );
              if (isCurrentlyLiked) {
                authUser.likedProducts = current.filter(
                  (item) => String(item?._id ?? item) !== String(productId),
                );
              } else {
                authUser.likedProducts = [...current, String(productId)];
              }
              localStorage.setItem("user", JSON.stringify(authUser));
            }
          }
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling like:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Failed to toggle like";
        return { success: false, message };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders],
  );

  // Toggle reel like (works for both logged-in and anonymous/device users)
  const toggleVideoLike = useCallback(
    async (videoId) => {
      if (!isAuthenticated && !deviceId) {
        return {
          success: false,
          message: "Please wait for app to load",
          requiresAuth: false,
        };
      }

      try {
        const headers = getAuthHeaders();
        const response = await userAPI.toggleVideoLike(
          isAuthenticated ? null : deviceId,
          videoId,
          headers,
        );

        if (response.data.success) {
          if (!isAuthenticated) {
            setUser((prevUser) => {
              if (!prevUser) return prevUser;
              const likedVideos = prevUser.likedVideos || [];
              const isCurrentlyLiked = likedVideos.some(
                (id) => id.toString() === videoId || id === videoId,
              );
              if (isCurrentlyLiked) {
                return {
                  ...prevUser,
                  likedVideos: likedVideos.filter(
                    (id) => id.toString() !== videoId && id !== videoId,
                  ),
                };
              }
              return {
                ...prevUser,
                likedVideos: [...likedVideos, videoId],
              };
            });
          } else {
            const authUser = JSON.parse(localStorage.getItem("user"));
            if (authUser) {
              const likedVideos = authUser.likedVideos || [];
              const isCurrentlyLiked = likedVideos.some(
                (id) => id === videoId || id?.toString?.() === videoId,
              );
              if (isCurrentlyLiked) {
                authUser.likedVideos = likedVideos.filter(
                  (id) => id !== videoId && id?.toString?.() !== videoId,
                );
              } else {
                authUser.likedVideos = [...likedVideos, videoId];
              }
              localStorage.setItem("user", JSON.stringify(authUser));
            }
          }
        }

        return response.data;
      } catch (error) {
        console.error("Error toggling video like:", error);
        return {
          success: false,
          message:
            error.response?.data?.message ||
            error.message ||
            "Failed to toggle like",
        };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders],
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
    [deviceId, getAuthHeaders, viewRecording],
  );

  // Check if product is liked (works for both logged-in and device users)
  const isProductLiked = useCallback(
    (productId) => {
      if (isAuthenticated) {
        const authUser = JSON.parse(localStorage.getItem("user"));
        if (!authUser || !authUser.likedProducts) return false;
        return authUser.likedProducts.some(
          (item) => String(item?._id ?? item) === String(productId),
        );
      }
      // Device user - check local user state (likedProducts can be IDs or populated objects)
      if (!user?.likedProducts) return false;
      return user.likedProducts.some((item) => {
        const id = item?._id ?? item;
        return id?.toString() === productId || id === productId;
      });
    },
    [isAuthenticated, user],
  );

  const isVideoLiked = useCallback(
    (videoId) => {
      if (isAuthenticated) {
        const authUser = JSON.parse(localStorage.getItem("user"));
        if (!authUser || !authUser.likedVideos) return false;
        return authUser.likedVideos.some(
          (id) => id === videoId || id?.toString?.() === videoId,
        );
      }
      if (!user?.likedVideos) return false;
      return user.likedVideos.some((item) => {
        const id = item?._id ?? item;
        return id?.toString() === videoId || id === videoId;
      });
    },
    [isAuthenticated, user],
  );

  // Get user's liked products (works for both logged-in and device users)
  const getLikedProducts = useCallback(async () => {
    if (!isAuthenticated && !deviceId) {
      return {
        success: false,
        message: "Please wait for app to load",
        requiresAuth: false,
      };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getLikedProducts(
        isAuthenticated ? null : deviceId,
        headers,
      );
      return response.data;
    } catch (error) {
      console.error("Error getting liked products:", error);
      return { success: false, message: "Failed to get liked products" };
    }
  }, [isAuthenticated, deviceId, getAuthHeaders]);

  const syncFollowedList = useCallback(
    (field, entityId) => {
      const idStr = String(entityId);
      const matches = (id) => String(id) === idStr;
      if (!isAuthenticated) {
        setUser((prevUser) => {
          if (!prevUser) return prevUser;
          const list = prevUser[field] || [];
          const isCurrentlyFollowed = list.some(matches);
          return {
            ...prevUser,
            [field]: isCurrentlyFollowed
              ? list.filter((id) => !matches(id))
              : [...list, entityId],
          };
        });
        return;
      }
      try {
        const authUser = JSON.parse(localStorage.getItem("user"));
        if (!authUser) return;
        const list = authUser[field] || [];
        const isCurrentlyFollowed = list.some(matches);
        authUser[field] = isCurrentlyFollowed
          ? list.filter((id) => !matches(id))
          : [...list, entityId];
        localStorage.setItem("user", JSON.stringify(authUser));
      } catch (e) {
        console.error("syncFollowedList:", e);
      }
    },
    [isAuthenticated],
  );

  const isEntityFollowed = useCallback(
    (field, entityId) => {
      if (!entityId) return false;
      const idStr = String(entityId);
      if (isAuthenticated) {
        try {
          const authUser = JSON.parse(localStorage.getItem("user"));
          if (!authUser?.[field]) return false;
          return authUser[field].some((id) => String(id) === idStr);
        } catch {
          return false;
        }
      }
      if (!user?.[field]) return false;
      return user[field].some((id) => String(id) === idStr);
    },
    [isAuthenticated, user],
  );

  // Toggle store follow (works for both logged-in and device users)
  const toggleFollowStore = useCallback(
    async (storeId) => {
      if (!isAuthenticated && !deviceId) {
        return {
          success: false,
          message: "Please wait for app to load",
          requiresAuth: false,
        };
      }

      try {
        const headers = getAuthHeaders();
        const response = await userAPI.toggleFollowStore(
          isAuthenticated ? null : deviceId,
          storeId,
          headers,
        );

        if (response.data.success) {
          syncFollowedList("followedStores", storeId);
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling store follow:", error);
        return {
          success: false,
          message: error.response?.data?.message || "Failed to toggle follow",
        };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders, syncFollowedList],
  );

  const toggleFollowBrand = useCallback(
    async (brandId) => {
      if (!isAuthenticated && !deviceId) {
        return {
          success: false,
          message: "Please wait for app to load",
          requiresAuth: false,
        };
      }
      try {
        const headers = getAuthHeaders();
        const response = await userAPI.toggleFollowBrand(
          isAuthenticated ? null : deviceId,
          brandId,
          headers,
        );
        if (response.data.success) {
          syncFollowedList("followedBrands", brandId);
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling brand follow:", error);
        return {
          success: false,
          message: error.response?.data?.message || "Failed to toggle follow",
        };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders, syncFollowedList],
  );

  const toggleFollowCompany = useCallback(
    async (companyId) => {
      if (!isAuthenticated && !deviceId) {
        return {
          success: false,
          message: "Please wait for app to load",
          requiresAuth: false,
        };
      }
      try {
        const headers = getAuthHeaders();
        const response = await userAPI.toggleFollowCompany(
          isAuthenticated ? null : deviceId,
          companyId,
          headers,
        );
        if (response.data.success) {
          syncFollowedList("followedCompanies", companyId);
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error toggling company follow:", error);
        return {
          success: false,
          message: error.response?.data?.message || "Failed to toggle follow",
        };
      }
    },
    [isAuthenticated, deviceId, getAuthHeaders, syncFollowedList],
  );

  // Check if store is followed
  const isStoreFollowed = useCallback(
    (storeId) => isEntityFollowed("followedStores", storeId),
    [isEntityFollowed],
  );

  const isBrandFollowed = useCallback(
    (brandId) => isEntityFollowed("followedBrands", brandId),
    [isEntityFollowed],
  );

  const isCompanyFollowed = useCallback(
    (companyId) => isEntityFollowed("followedCompanies", companyId),
    [isEntityFollowed],
  );

  // Get user's followed stores
  const getFollowedStores = useCallback(async () => {
    if (!isAuthenticated && !deviceId) {
      return {
        success: false,
        message: "Please wait for app to load",
        requiresAuth: false,
      };
    }

    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getFollowedStores(
        isAuthenticated ? null : deviceId,
        headers,
      );
      return response.data;
    } catch (error) {
      console.error("Error getting followed stores:", error);
      return {
        success: false,
        message: "Failed to get followed stores",
      };
    }
  }, [isAuthenticated, deviceId, getAuthHeaders]);

  const getFollowing = useCallback(async () => {
    if (!isAuthenticated && !deviceId) {
      return {
        success: false,
        message: "Please wait for app to load",
        requiresAuth: false,
      };
    }
    try {
      const headers = getAuthHeaders();
      const response = await userAPI.getFollowing(
        isAuthenticated ? null : deviceId,
        headers,
      );
      return response.data;
    } catch (error) {
      console.error("Error getting following:", error);
      return {
        success: false,
        message: "Failed to get following",
      };
    }
  }, [isAuthenticated, deviceId, getAuthHeaders]);

  const updateGuestName = useCallback(
    async (name) => {
      if (!deviceId || isAuthenticated) {
        return { success: false, message: "Not a guest user" };
      }
      try {
        const response = await userAPI.updateDeviceProfile(deviceId, name);
        if (response.data?.success) {
          setUser((prev) => ({
            ...(prev || {}),
            displayName: response.data.data.displayName,
          }));
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error updating guest name:", error);
        return {
          success: false,
          message: error?.response?.data?.message || "Failed to update name",
        };
      }
    },
    [deviceId, isAuthenticated],
  );

  return {
    deviceId,
    user,
    loading,
    isAuthenticated,
    toggleLike,
    toggleVideoLike,
    toggleFollowStore,
    toggleFollowBrand,
    toggleFollowCompany,
    recordView,
    updateGuestName,
    isProductLiked,
    isVideoLiked,
    isStoreFollowed,
    isBrandFollowed,
    isCompanyFollowed,
    getLikedProducts,
    getFollowedStores,
    getFollowing,
  };
};
