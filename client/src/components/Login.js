import React, {Component, useEffect, useState} from 'react';
import {makeStyles} from "@material-ui/core/styles";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward"
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import LoginImg from "../assets/login_img.svg"
import {useMutation} from '@apollo/react-hooks';
import Background from "../assets/background.svg";
import {useHistory} from "react-router-dom";
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import {AUTH_TOKEN} from "../constants/auth";
import * as Query from "../constants/query"
import Slide from "@material-ui/core/Slide";

const useStyles = makeStyles(theme => ({
    root: {
        minWidth: 375,
        width: "30%",
        margin: "15% auto",
        backgroundImage: `url(${LoginImg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right center",
        backgroundOrigin: "content-box"
    },
    background: {
        width: "100%",
        height: "100%",
        backgroundImage: `url(${Background})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        position: "absolute",
        top: 0,
        left: 0
    },
    loginField: {
        margin: theme.spacing(1),
        width: "95%"
    },
    bullet: {
        display: 'inline-block',
        margin: '0 2px',
        transform: 'scale(0.8)',
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
    actionButton: {
        margin: "auto",
        marginTop: theme.spacing(2),
        position: "absolute",
    },
    progress: {
        margin: "auto",
        marginTop: theme.spacing(2.5),
        marginLeft: theme.spacing(0.5),
        position: "absolute",
    },
    wrapper: {
        position: "relative"
    }
}));

function Login(props) {
    const classes = useStyles();
    const bull = <span className={classes.bullet}>•</span>;

    const [entrance, setEntrance] = useState(false)

    useEffect(() => {
        setEntrance(true)
    }, [])

    let history = useHistory();
    const [loginUser, {loading: mutationLoading, error: mutationError, client}] = useMutation(Query.LOGIN_USER);
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null)
    const handleChange = (event) => {
        setUsername(event.target.value);
        setError(null)
    };

    return (
        <div className={classes.background}>
            <Slide direction="up" in={entrance} mountOnEnter unmountOnExit>
                <Card className={classes.root}>
                    <CardContent>
                        <Typography className={classes.pos} color="textSecondary">
                            Choose your glory name!
                        </Typography>
                        <Typography variant="h5" component="h2">
                            AI Battleground App
                        </Typography>
                        <Typography className={classes.pos} color="textSecondary">
                            ai{bull}battleground{bull}app{bull}by{bull}oshikuru
                        </Typography>

                        <form autoComplete="off" onSubmit={e => {
                            e.preventDefault();
                            if (username == null || username.trim() === '') {
                                setError('Username is required!')
                                setUsername('');
                                return
                            }
                            loginUser({variables: {username: username}}).then(res => {
                                localStorage.setItem(AUTH_TOKEN, res.data.login.token)
                                client.writeData({data: {isLoggedIn: true}})
                                history.replace('/')
                            }).catch(() => {
                            });
                            setUsername('');
                        }}>
                            <Grid container>
                                <Grid item lg={11} md={10} sm={10} xs={10}>
                                    <TextField onChange={handleChange}
                                               error={!!error}
                                               value={username}
                                               helperText={error}
                                               className={classes.loginField}
                                               label="Username"/>
                                </Grid>
                                <Grid className={classes.wrapper} item lg={1} md={2} sm={2} xs={2}>
                                    <IconButton type="submit" className={classes.actionButton}>
                                        <ArrowForwardIcon/>
                                    </IconButton>
                                    {mutationLoading && <CircularProgress className={classes.progress}/>}
                                </Grid>
                                {mutationError &&
                                <Grid item lg={12} md={12} sm={12} xs={12}>
                                    <Error error={mutationError}/>
                                </Grid>}
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Slide>
        </div>
    );
}

export default Login;