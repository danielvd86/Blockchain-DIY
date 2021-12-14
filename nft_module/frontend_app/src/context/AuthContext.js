import { createContext } from "react";

export const authDefault = null;

export const authContext = createContext({
  ...authDefault,
});
