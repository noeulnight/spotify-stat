import { createContext, useContext, type ReactNode } from "react";

const MediaActions = createContext<
  ((id: string, title: string) => ReactNode) | undefined
>(undefined);

export const MediaActionsProvider = MediaActions.Provider;
export const useMediaActions = () => useContext(MediaActions);
