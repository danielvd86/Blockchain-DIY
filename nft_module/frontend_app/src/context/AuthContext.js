import { createContext } from "react";
import Cookies from "js-cookie";

export const authDefault = Cookies.get("user");

export const authContext = createContext({
  ...authDefault,
});
