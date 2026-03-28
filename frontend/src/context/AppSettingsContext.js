import React, { createContext, useState, useContext, useEffect } from "react";
import { settingsAPI } from "../services/api";
import { openWhatsAppLink } from "../utils/openWhatsAppLink";

const AppSettingsContext = createContext(null);

const DEFAULT_WHATSAPP = "+9647503683478";
const EMPTY_CONTACT_INFO = {
  whatsapp: "",
  facebook: "",
  instagram: "",
  snapchat: "",
  gmail: "",
  tiktok: "",
  viber: "",
  telegram: "",
};

export const AppSettingsProvider = ({ children }) => {
  const [contactWhatsAppNumber, setContactWhatsAppNumber] =
    useState(DEFAULT_WHATSAPP);
  const [contactInfo, setContactInfo] = useState({
    ...EMPTY_CONTACT_INFO,
    whatsapp: DEFAULT_WHATSAPP,
  });

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      const num = res?.data?.contactWhatsAppNumber;
      if (num) setContactWhatsAppNumber(num);
      const info = res?.data?.contactInfo;
      if (info && typeof info === "object") {
        setContactInfo({
          ...EMPTY_CONTACT_INFO,
          ...info,
          whatsapp: info.whatsapp || num || DEFAULT_WHATSAPP,
        });
      } else {
        setContactInfo((prev) => ({
          ...prev,
          whatsapp: num || DEFAULT_WHATSAPP,
        }));
      }
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
    if (!num) return;
    openWhatsAppLink(`https://api.whatsapp.com/send?phone=${num}`);
  };

  return (
    <AppSettingsContext.Provider
      value={{
        contactWhatsAppNumber,
        setContactWhatsAppNumber,
        contactInfo,
        setContactInfo,
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
