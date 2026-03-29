import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Primary/source text from the database (e.g. Kurdish or mixed) */
export const DATA_LANG_NORMAL = "normal";
export const DATA_LANG_KU = "ku";
export const DATA_LANG_EN = "en";
export const DATA_LANG_AR = "ar";

export const DATA_LANGUAGE_OPTIONS = [
  { value: DATA_LANG_NORMAL, labelKey: "Normal (original)" },
  { value: DATA_LANG_KU, labelKey: "Kurdish" },
  { value: DATA_LANG_EN, labelKey: "English" },
  { value: DATA_LANG_AR, labelKey: "Arabic" },
];

const STORAGE_KEY = "patrisSystemDataLanguage.v1";

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DATA_LANG_NORMAL;
    if (
      [DATA_LANG_NORMAL, DATA_LANG_KU, DATA_LANG_EN, DATA_LANG_AR].includes(raw)
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return DATA_LANG_NORMAL;
}

const DataLanguageContext = createContext(null);

export function DataLanguageProvider({ children }) {
  const [dataLanguage, setDataLanguageState] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, dataLanguage);
    } catch {
      // ignore
    }
  }, [dataLanguage]);

  const setDataLanguage = useCallback((value) => {
    setDataLanguageState(
      [DATA_LANG_NORMAL, DATA_LANG_KU, DATA_LANG_EN, DATA_LANG_AR].includes(
        value,
      )
        ? value
        : DATA_LANG_NORMAL,
    );
  }, []);

  const value = useMemo(
    () => ({ dataLanguage, setDataLanguage }),
    [dataLanguage, setDataLanguage],
  );

  return (
    <DataLanguageContext.Provider value={value}>
      {children}
    </DataLanguageContext.Provider>
  );
}

export function useDataLanguage() {
  const ctx = useContext(DataLanguageContext);
  if (!ctx) {
    throw new Error("useDataLanguage must be used within DataLanguageProvider");
  }
  return ctx;
}
