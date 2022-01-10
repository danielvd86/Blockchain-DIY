import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import axios from "axios";
import * as api from "../../api";
import { authDefault, updateUserCookie } from "../../context/AuthContext";
import Cookies from "js-cookie";
import { passphrase, cryptography, tree } from "@liskhq/lisk-client";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
    },
  },
}));

export default function AuthDialog(props) {
  const [data, setData] = useState({ passphrase: "", address: "" });
  const classes = useStyles();
  const [user, updateUser] = useState(authDefault);
  const [newUser, setNewUser] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [newUserRegistered, setNewUserRegistered] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    wallet: data.address,
  });

  useEffect(() => {
    const pw = passphrase.Mnemonic.generateMnemonic();
    const address = cryptography
      .getBase32AddressFromPassphrase(pw)
      .toString("hex");
    setData({ passphrase: pw, address });
    setRegisterData({ wallet: address });
  }, [props.open]);

  useEffect(() => {
    console.log("User changed...");
    const config = {
      headers: {
        Authorization: "Bearer " + Cookies.get("jwt"),
      },
    };

    if (loggedIn) {
      axios.get(`${api.AUTH_URL}/user/me`, config).then((res) => {
        const data = res.data;
        Cookies.set("user", JSON.stringify(data));
      });
    }
  }, [loggedIn]);

  const handleLoginChange = (event) => {
    event.persist();
    setLoginData({ ...loginData, [event.target.name]: event.target.value });
  };

  const handleRegisterChange = (event) => {
    event.persist();
    setRegisterData({
      ...registerData,
      [event.target.name]: event.target.value,
    });
  };

  const handleOnClick = async (event) => {
    event.preventDefault();
    if (newUser) {
      console.log("Sign up attempt");
      const data = {
        name: registerData.name,
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        wallet: registerData.wallet,
        role: "user",
      };

      axios
        .post(`${api.AUTH_URL}/register`, data)
        .then((res) => {
          console.log(res.data);
          setNewUserRegistered(true);
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("Sign in attempt");
      const data = new URLSearchParams();
      data.append("username", loginData.username);
      data.append("password", loginData.password);

      axios
        .post(`${api.AUTH_URL}/login`, data)
        .then((res) => {
          const data = res.data;
          console.log(res.data);
          Cookies.set("jwt", data.access_token);
          setLoggedIn(true);
          window.location.reload();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <Fragment>
      <Dialog open={props.open} onBackdropClick={props.handleClose} fullWidth>
        <DialogTitle id="alert-dialog-title">
          {newUser ? "Sign up" : "Sign in"}
        </DialogTitle>
        <DialogContent>
          {newUser ? (
            <>
              {!newUserRegistered ? (
                <>
                  <RegisterForm
                    registerData={registerData}
                    handleRegisterChange={handleRegisterChange}
                    classes={classes}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-lg font-bold underline text-red-600">
                    Make sure to copy the following information!
                  </h1>
                  <TextField
                    label="Passphrase (click to copy)"
                    value={data.passphrase}
                    onClick={() => {
                      navigator.clipboard.writeText(data.passphrase);
                    }}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <TextField
                    label="Address (click to copy)"
                    value={data.address}
                    onClick={() => {
                      navigator.clipboard.writeText(data.address);
                    }}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </>
              )}
            </>
          ) : (
            <LoginForm
              loginData={loginData}
              handleLoginChange={handleLoginChange}
              classes={classes}
            />
          )}
        </DialogContent>
        <DialogActions>
          {!newUserRegistered ? (
            <>
              <Button
                variant="contained"
                color="info"
                onClick={() => setNewUser(!newUser)}
              >
                {newUser
                  ? "Have an account already? Sign in!"
                  : "No account yet? Sign up!"}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOnClick}
              >
                {newUser ? "Sign up" : "Sign in"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  props.handleClose();
                  window.location.reload();
                }}
              >
                Proceed
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}

const RegisterForm = ({ registerData, handleRegisterChange, classes }) => {
  return (
    <form className={classes.root} noValidate autoComplete="off">
      <TextField
        required
        label="Name"
        value={registerData.name}
        name="name"
        onChange={handleRegisterChange}
        fullWidth
      />
      <TextField
        required
        label="Username"
        value={registerData.username}
        name="username"
        onChange={handleRegisterChange}
        fullWidth
      />
      <TextField
        required
        label="Email"
        value={registerData.email}
        name="email"
        type="email"
        onChange={handleRegisterChange}
        fullWidth
      />
      <TextField
        required
        label="Password"
        value={registerData.password}
        name="password"
        onChange={handleRegisterChange}
        type="password"
        fullWidth
      />
    </form>
  );
};

const LoginForm = ({ loginData, handleLoginChange, classes }) => {
  return (
    <form className={classes.root} noValidate autoComplete="off">
      <TextField
        required
        label="Username"
        value={loginData.username}
        name="username"
        onChange={handleLoginChange}
        fullWidth
      />
      <TextField
        required
        label="Password"
        type="password"
        value={loginData.password}
        name="password"
        onChange={handleLoginChange}
        fullWidth
      />
    </form>
  );
};
