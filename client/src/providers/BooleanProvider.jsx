// BooleanContext.js
import React, { createContext, useState, useContext } from 'react';

// Create a Context for the boolean state
const BooleanContext = createContext();

// Create a provider component
export const BooleanProvider = ({ children }) => {
  const [booleanState, setBooleanState] = useState(true);

  const toggleBooleanState = () => {
    setBooleanState((prevState) => !prevState);
  };

  return <BooleanContext.Provider value={{ booleanState, toggleBooleanState }}>{children}</BooleanContext.Provider>;
};

// Custom hook to use the BooleanContext
export const useBoolean = () => {
  return useContext(BooleanContext);
};
