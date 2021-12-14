import React, { Fragment, useContext, useMemo, useState } from "react";
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
import { authDefault } from "../../context/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiTextField-root": {
      margin: theme.spacing(1),
    },
  },
}));

export default function AuthDialog(props) {
  const classes = useStyles();
  const [user, updateUser] = useState(authDefault);
  const [newUser, setNewUser] = useState(false);
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    wallet: "",
  });

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
    // event.preventDefault();

    if (!newUser) {
      console.log("Sign up attempt");
      const data = {
        name: registerData.name,
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      };

      axios
        .post(`${api.AUTH_URL}/register`, data)
        .then((res) => {
          console.log(res.data);
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
          console.log(res.data);
          // setUser(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <Fragment>
      <Dialog open={props.open} onBackdropClick={props.handleClose}>
        <DialogTitle id="alert-dialog-title">
          {newUser ? "Sign in" : "Sign up"}
        </DialogTitle>
        <DialogContent>
          {!newUser ? (
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
          ) : (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="info"
            onClick={() => setNewUser(!newUser)}
          >
            {!newUser
              ? "Have an account already? Sign in!"
              : "No account yet? Sign up!"}
          </Button>
          <Button variant="contained" color="primary" onClick={handleOnClick}>
            {!newUser ? "Sign up" : "Sign in"}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}
