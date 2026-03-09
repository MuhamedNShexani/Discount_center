import React, { createContext, useState, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

const CityFilterContext = createContext(null);

const CITY_DATA = [
  { value: "Erbil", flag: "🏛️" },
  { value: "Sulaimani", flag: "🏔️" },
  { value: "Duhok", flag: "🏞️" },
  { value: "Kerkuk", flag: "🛢️" },
  { value: "Halabja", flag: "🌸" },
];

export const CityFilterProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Erbil");
  const { t, i18n } = useTranslation();

  const cities = useMemo(
    () =>
      CITY_DATA.map((city) => ({
        ...city,
        label: t(`city.${city.value}`),
      })),
    [t, i18n.language]
  );

  const changeCity = (city) => {
    setSelectedCity(city);
    // Store in localStorage for persistence
    localStorage.setItem("selectedCity", city);
  };

  // Load city from localStorage on mount
  React.useEffect(() => {
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity && CITY_DATA.some((city) => city.value === savedCity)) {
      setSelectedCity(savedCity);
    }
  }, []);

  return (
    <CityFilterContext.Provider
      value={{
        selectedCity,
        changeCity,
        cities,
      }}
    >
      {children}
    </CityFilterContext.Provider>
  );
};

export const useCityFilter = () => {
  const context = useContext(CityFilterContext);
  if (!context) {
    throw new Error("useCityFilter must be used within a CityFilterProvider");
  }
  return context;
};
