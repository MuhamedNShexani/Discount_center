import React, { createContext, useState, useContext, useEffect } from "react";
import { settingsAPI } from "../services/api";

const AppSettingsContext = createContext(null);

const DEFAULT_WHATSAPP = "+9647503683478";

export const AppSettingsProvider = ({ children }) => {
  const [contactWhatsAppNumber, setContactWhatsAppNumber] =
    useState(DEFAULT_WHATSAPP);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const num = res?.data?.contactWhatsAppNumber;
      if (num) setContactWhatsAppNumber(num);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openWhatsApp = () => {
    const num = (contactWhatsAppNumber || DEFAULT_WHATSAPP)
      .replace(/\s/g, "")
      .replace(/^\+/, "");
    window.open(`https://wa.me/${num}`, "_blank", "noopener,noreferrer");
  };

  return (
    <AppSettingsContext.Provider
      value={{
        contactWhatsAppNumber,
        setContactWhatsAppNumber,
        fetchSettings,
        openWhatsApp,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};
