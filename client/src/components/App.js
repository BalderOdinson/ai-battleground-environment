import React, {Component, useState} from 'react';
import Login from "./Login";
import Paper from '@material-ui/core/Paper';
import {createMuiTheme, makeStyles, MuiThemeProvider} from "@material-ui/core/styles";
import {Switch, Route, Link, useHistory, Redirect} from "react-router-dom";
import WorkgroupList from "./WorkgroupList";
import PrivateRoute from "./PrivateRoute";
import gql from "graphql-tag";
import {useQuery} from "@apollo/react-hooks";
import GameList from "./GameList";
import * as GameOrderByInput from "../constants/gameOrderByInput"
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import UserPanel from "./UserPanel";
import Home from "./Home";
import {orange, red, yellow} from "@material-ui/core/colors";
import WatchGame from "./WatchGame";

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
        primary: orange,
        secondary: red,
    },
});

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: orange,
        secondary: red,
    },
});

const useStyles = makeStyles(theme => ({
    workgroup: {
        margin: theme.spacing(2)
    },
    background: {
        backgroundColor: "transparent",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0
    }
}));

const IS_LOGGED_IN = gql`
    query IsUserLoggedIn {
        isLoggedIn @client
    }`;

function App(props) {
    const [theme, setTheme] = useState(darkTheme)
    const classes = useStyles()
    document.body.style.background = theme.palette.background.default
    const {data} = useQuery(IS_LOGGED_IN);

    return (
        <MuiThemeProvider theme={theme}>
            <Paper elevation={0}
                   className={classes.background}>
                <Switch>
                    <PrivateRoute path="/home">
                        <Home/>
                    </PrivateRoute>
                    <PrivateRoute path="/watch/:id">
                        <WatchGame/>
                    </PrivateRoute>
                    <Route path="/login" render={() =>
                        data.isLoggedIn ?
                            <Redirect to="/home"/> :
                            <Login/>}/>
                    <Redirect path="/*" to="/home"/>
                </Switch>
            </Paper>
        </MuiThemeProvider>
    );
}

export default App;