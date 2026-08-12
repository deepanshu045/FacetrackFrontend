import React, { createContext, useContext } from "react";

interface AppContextValue {
  logout?: () => void;
}

const AppContext = createContext<AppContextValue>({});

export const AppProvider = AppContext.Provider;

export function useAppContext() {
  return useContext(AppContext);
}
