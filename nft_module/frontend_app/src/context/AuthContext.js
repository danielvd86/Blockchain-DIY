import { createContext } from "react";
import Cookies from "js-cookie";

const cookieUser = Cookies.get("user");

export const authDefault = cookieUser;

export const authContext = createContext({
  ...authDefault,
});

export const updateUserCookie = ({ userObj }) => {
  Cookies.set("user", JSON.stringify(userObj));
};
