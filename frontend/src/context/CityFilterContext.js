import React, { createContext, useState, useContext } from "react";

const CityFilterContext = createContext(null);

export const CityFilterProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Erbil");

  const cities = [
    { value: "Erbil", label: "Erbil", flag: "🏛️" },
    { value: "Sulaimani", label: "Sulaimani", flag: "🏔️" },
    { value: "Duhok", label: "Duhok", flag: "🏞️" },
    { value: "Kerkuk", label: "Kerkuk", flag: "🛢️" },
    { value: "Halabja", label: "Halabja", flag: "🌸" },
  ];

  const changeCity = (city) => {
    setSelectedCity(city);
    // Store in localStorage for persistence
    localStorage.setItem("selectedCity", city);
  };

  // Load city from localStorage on mount
  React.useEffect(() => {
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity && cities.some((city) => city.value === savedCity)) {
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
