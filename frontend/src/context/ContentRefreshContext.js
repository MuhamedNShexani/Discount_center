import React, { createContext, useContext, useState, useCallback } from "react";

const ContentRefreshContext = createContext(null);

export const ContentRefreshProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <ContentRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </ContentRefreshContext.Provider>
  );
};

export const useContentRefresh = () => useContext(ContentRefreshContext);
