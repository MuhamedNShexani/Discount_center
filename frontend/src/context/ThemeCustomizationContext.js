import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "appThemeCustomization.v1";

const DEFAULTS = {
  primaryColor: "", // empty = use theme default
  fontFamily: "", // empty = use theme default
};

const ThemeCustomizationContext = createContext({
  ...DEFAULTS,
  setPrimaryColor: () => {},
  setFontFamily: () => {},
  resetCustomization: () => {},
});

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const safeGetItem = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const ThemeCustomizationProvider = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor);
  const [fontFamily, setFontFamily] = useState(DEFAULTS.fontFamily);
  const [lastSaveOk, setLastSaveOk] = useState(true);

  useEffect(() => {
    const saved = safeParse(safeGetItem(STORAGE_KEY));
    if (!saved) return;
    if (typeof saved.primaryColor === "string") setPrimaryColor(saved.primaryColor);
    if (typeof saved.fontFamily === "string") setFontFamily(saved.fontFamily);
  }, []);

  const saveNow = () => {
    const ok = safeSetItem(
      STORAGE_KEY,
      JSON.stringify({
        primaryColor,
        fontFamily,
      }),
    );
    setLastSaveOk(ok);
    return ok;
  };

  useEffect(() => {
    saveNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, fontFamily]);

  const value = useMemo(
    () => ({
      primaryColor,
      fontFamily,
      setPrimaryColor,
      setFontFamily,
      saveNow,
      lastSaveOk,
      resetCustomization: () => {
        setPrimaryColor(DEFAULTS.primaryColor);
        setFontFamily(DEFAULTS.fontFamily);
      },
    }),
    [primaryColor, fontFamily, lastSaveOk],
  );

  return (
    <ThemeCustomizationContext.Provider value={value}>
      {children}
    </ThemeCustomizationContext.Provider>
  );
};

export const useThemeCustomization = () => useContext(ThemeCustomizationContext);

