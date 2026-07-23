/**
 * Unified device location helper for browsers and Flutter WebView.
 *
 * Flutter injects (when ready):
 *   window.__FLUTTER_LOCATION_BRIDGE__ === true
 *   window.__FLUTTER_REQUEST_LOCATION__()
 *   window.__FLUTTER_OPEN_LOCATION_SETTINGS__()
 *   window.flutter_inappwebview.callHandler("requestLocation")
 *
 * Success: dispatches "flutterLocationUpdated" with detail { latitude, longitude, accuracy }
 * Denied:  "flutterLocationPermissionDenied"
 * Forever: "flutterLocationPermissionDeniedForever"
 *
 * Browsers keep using navigator.geolocation.getCurrentPosition.
 * Permission is never requested until requestCurrentLocation() is called (e.g. Near Me tap).
 */

/** @typedef {{ latitude: number, longitude: number, accuracy?: number }} DeviceLocation */

export class LocationPermissionError extends Error {
  /**
   * @param {"permissionDenied"|"permissionDeniedForever"|"unavailable"|"timeout"|"positionUnavailable"} code
   * @param {string} [message]
   */
  constructor(code, message) {
    super(message || code);
    this.name = "LocationPermissionError";
    this.code = code;
  }
}

/**
 * True when the Flutter location bridge is present.
 * Prefer this over User-Agent sniffing.
 * @returns {boolean}
 */
export function isFlutterApp() {
  try {
    return (
      typeof window !== "undefined" &&
      window.__FLUTTER_LOCATION_BRIDGE__ === true
    );
  } catch {
    return false;
  }
}

/**
 * Open the app / OS location settings (Flutter only).
 * No-op in normal browsers.
 */
export function openLocationSettings() {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.__FLUTTER_OPEN_LOCATION_SETTINGS__ === "function") {
      window.__FLUTTER_OPEN_LOCATION_SETTINGS__();
      return;
    }
    const handler = window.flutter_inappwebview?.callHandler;
    if (typeof handler === "function") {
      void window.flutter_inappwebview.callHandler("openLocationSettings");
    }
  } catch (e) {
    console.warn("openLocationSettings error:", e);
  }
}

/**
 * @returns {Promise<DeviceLocation>}
 */
async function requestFlutterLocation(timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timer = null;

    const cleanup = () => {
      window.removeEventListener("flutterLocationUpdated", onUpdated);
      window.removeEventListener(
        "flutterLocationPermissionDenied",
        onDenied,
      );
      window.removeEventListener(
        "flutterLocationPermissionDeniedForever",
        onDeniedForever,
      );
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const onUpdated = (event) => {
      const detail =
        (event && event.detail) ||
        (typeof window !== "undefined" ? window.flutterLocation : null) ||
        {};
      const latitude = Number(detail.latitude);
      const longitude = Number(detail.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        finish(() =>
          reject(
            new LocationPermissionError(
              "positionUnavailable",
              "Invalid location from Flutter",
            ),
          ),
        );
        return;
      }
      finish(() =>
        resolve({
          latitude,
          longitude,
          accuracy:
            detail.accuracy != null ? Number(detail.accuracy) : undefined,
        }),
      );
    };

    const onDenied = () => {
      finish(() =>
        reject(
          new LocationPermissionError(
            "permissionDenied",
            "Location permission denied",
          ),
        ),
      );
    };

    const onDeniedForever = () => {
      finish(() =>
        reject(
          new LocationPermissionError(
            "permissionDeniedForever",
            "Location permission denied forever",
          ),
        ),
      );
    };

    window.addEventListener("flutterLocationUpdated", onUpdated);
    window.addEventListener("flutterLocationPermissionDenied", onDenied);
    window.addEventListener(
      "flutterLocationPermissionDeniedForever",
      onDeniedForever,
    );

    timer = setTimeout(() => {
      finish(() =>
        reject(
          new LocationPermissionError(
            "timeout",
            "Timed out waiting for Flutter location",
          ),
        ),
      );
    }, timeoutMs);

    (async () => {
      try {
        if (typeof window.__FLUTTER_REQUEST_LOCATION__ === "function") {
          await window.__FLUTTER_REQUEST_LOCATION__();
          return;
        }
        const handler = window.flutter_inappwebview?.callHandler;
        if (typeof handler === "function") {
          await window.flutter_inappwebview.callHandler("requestLocation");
          return;
        }
        finish(() =>
          reject(
            new LocationPermissionError(
              "unavailable",
              "Flutter location bridge not available",
            ),
          ),
        );
      } catch (e) {
        finish(() =>
          reject(
            e instanceof LocationPermissionError
              ? e
              : new LocationPermissionError(
                  "unavailable",
                  e?.message || "Flutter location request failed",
                ),
          ),
        );
      }
    })();
  });
}

/**
 * @returns {Promise<DeviceLocation>}
 */
function requestBrowserLocation(options) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0,
  } = options || {};

  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== "function"
    ) {
      reject(
        new LocationPermissionError(
          "unavailable",
          "Geolocation is not available",
        ),
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        const code = err?.code;
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (code === 1) {
          reject(
            new LocationPermissionError(
              "permissionDenied",
              "Location permission denied",
            ),
          );
          return;
        }
        if (code === 3) {
          reject(
            new LocationPermissionError("timeout", "Location request timed out"),
          );
          return;
        }
        reject(
          new LocationPermissionError(
            "positionUnavailable",
            err?.message || "Unable to get location",
          ),
        );
      },
      { enableHighAccuracy, timeout, maximumAge },
    );
  });
}

/**
 * Request a one-shot current position.
 * Flutter → native bridge (permission only when this is called).
 * Browser → navigator.geolocation.getCurrentPosition.
 *
 * @param {{ enableHighAccuracy?: boolean, timeout?: number, maximumAge?: number }} [options]
 * @returns {Promise<DeviceLocation>}
 */
export async function requestCurrentLocation(options = {}) {
  const timeoutMs = options.timeout ?? 20000;

  if (isFlutterApp()) {
    return requestFlutterLocation(timeoutMs);
  }

  return requestBrowserLocation({
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 15000,
    maximumAge: options.maximumAge ?? 0,
  });
}
