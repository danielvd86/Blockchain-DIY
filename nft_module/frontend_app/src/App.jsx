import React, { Fragment, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Link as RouterLink,
  Switch,
  Route,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Link,
  IconButton,
  Container,
  Chip,
  Button,
} from "@material-ui/core";
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from "@material-ui/lab";
import { makeStyles } from "@material-ui/core/styles";
import { MenuIcon } from "@material-ui/icons/";
import AddIcon from "@material-ui/icons/Add";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import AddPhotoAlternateIcon from "@material-ui/icons/AddPhotoAlternate";
import * as api from "./api";
import { NodeInfoContext, nodeInfoContextDefaultValue } from "./context";
import HomePage from "./components/HomePage";
import TransactionsPage from "./components/TransactionsPage";
import AccountPage from "./components/AccountPage";
import CreateAccountDialog from "./components/dialogs/CreateAccountDialog";
import TransferFundsDialog from "./components/dialogs/TransferFundsDialog";
import CreateNFTTokenDialog from "./components/dialogs/CreateNFTTokenDialog";
import AuthModal from "./components/dialogs/AuthModal";
import { authDefault, authContext } from "./context/AuthContext";
import Cookies from "js-cookie";

const useStyles = makeStyles((theme) => ({
  appBarLink: {
    margin: theme.spacing(0, 2),
    flex: 1,
  },
  speedDial: {
    position: "fixed",
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  contentContainer: {
    padding: theme.spacing(5, 0),
  },
  grow: {
    flexGrow: 1,
  },
}));

export default function App() {
  const classes = useStyles();
  const [nodeInfoState, updateNodeInfoState] = useState(
    nodeInfoContextDefaultValue
  );
  const [openSpeedDial, setOpenSpeedDial] = useState(false);
  const [openDialog, setOpenDialog] = useState(null);
  const [user, updateUser] = useState(JSON.parse(authDefault));

  const updateHeight = async () => {
    const info = await api.fetchNodeInfo();

    updateNodeInfoState({
      networkIdentifier: info.networkIdentifier,
      minFeePerByte: info.genesisConfig.minFeePerByte,
      height: info.height,
    });
  };

  useEffect(() => {
    Cookies.set("user", JSON.stringify({ username: "visitor" }));
    async function fetchData() {
      const info = await api.fetchNodeInfo();
      updateNodeInfoState({
        networkIdentifier: info.networkIdentifier,
        minFeePerByte: info.genesisConfig.minFeePerByte,
        height: info.height,
      });
      setInterval(updateHeight, 1000);
    }
    fetchData();
  }, []);

  const handleSpeedDialClose = () => {
    setOpenSpeedDial(false);
  };

  const handleSpeedDialOpen = () => {
    setOpenSpeedDial(true);
  };

  return (
    <Fragment>
      <authContext.Provider value={authDefault}>
        <NodeInfoContext.Provider value={nodeInfoState}>
          <Router>
            <AppBar position="static">
              <Toolbar className="flex flex-row justify-between">
                <Typography variant="h6">Rave NFT's</Typography>

                <div>
                  <Link
                    color="inherit"
                    component={RouterLink}
                    to="/"
                    className={classes.appBarLink}
                  >
                    Market
                  </Link>
                  <Link
                    color="inherit"
                    component={RouterLink}
                    to="/transactions"
                    className={classes.appBarLink}
                  >
                    Transactions
                  </Link>
                  <Link
                    color="inherit"
                    component={RouterLink}
                    to={"/accounts/lskd4mktjd5xyqp3n49xfdm7e7pkc4hy7s6un3p92"}
                    className={classes.appBarLink}
                    className={`${!user ? "hidden" : ""}`}
                  >
                    My account
                  </Link>
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => {
                      setOpenDialog("AuthenticationDialog");
                    }}
                    variant="contained"
                  >
                    {user ? "Sign out" : "Sign in"}
                  </Button>
                  <Button
                    onClick={() => {
                      const userTest = {
                        username: "kdk",
                        password: "kees",
                      };
                      updateUser(userTest);
                      Cookies.set("user", JSON.stringify(userTest));
                      window.location.reload();
                    }}
                    variant="contained"
                    color="primary"
                  >
                    Set user
                  </Button>
                  <Button variant="contained" color="primary">
                    {Cookies.get("user") ? user.username : "Welloe"}
                  </Button>
                  <Button
                    onClick={() => {
                      Cookies.remove("user");
                      window.location.reload();
                    }}
                    variant="contained"
                    color="secondary"
                  >
                    SIGN OUT
                  </Button>
                </div>
              </Toolbar>
            </AppBar>

            <SpeedDial
              hidden={!user}
              ariaLabel="SpeedDial example"
              color="secondary"
              className={classes.speedDial}
              icon={<SpeedDialIcon />}
              onClose={handleSpeedDialClose}
              onOpen={handleSpeedDialOpen}
              open={openSpeedDial}
              direction={"up"}
            >
              <SpeedDialAction
                key={"Create NFT"}
                icon={<AddPhotoAlternateIcon />}
                tooltipTitle={"Create NFT"}
                onClick={() => {
                  setOpenSpeedDial(false);
                  setOpenDialog("CreateNFTTokenDialog");
                }}
              />

              <SpeedDialAction
                key={"Transfer"}
                icon={<LocalAtmIcon />}
                tooltipTitle={"Transfer Funds"}
                onClick={() => {
                  setOpenSpeedDial(false);
                  setOpenDialog("TransferFundsDialog");
                }}
              />

              <SpeedDialAction
                key={"Create Account"}
                icon={<AddIcon />}
                tooltipTitle={"Create Account"}
                onClick={() => {
                  setOpenSpeedDial(false);
                  setOpenDialog("CreateAccountDialog");
                }}
              />
            </SpeedDial>

            <Container className={classes.contentContainer}>
              <Switch>
                <Route path="/" exact>
                  <HomePage />
                </Route>

                <Route path="/accounts/:address" component={AccountPage} />
                <Route path="/transactions" component={TransactionsPage} />
              </Switch>
            </Container>

            <CreateNFTTokenDialog
              open={openDialog === "CreateNFTTokenDialog"}
              handleClose={() => {
                setOpenDialog(null);
              }}
            />

            <CreateAccountDialog
              open={openDialog === "CreateAccountDialog"}
              handleClose={() => {
                setOpenDialog(null);
              }}
            />

            <TransferFundsDialog
              open={openDialog === "TransferFundsDialog"}
              handleClose={() => {
                setOpenDialog(null);
              }}
            />

            <AuthModal
              open={openDialog === "AuthenticationDialog"}
              handleClose={() => {
                setOpenDialog(null);
              }}
            />
          </Router>
        </NodeInfoContext.Provider>
      </authContext.Provider>
    </Fragment>
  );
}
