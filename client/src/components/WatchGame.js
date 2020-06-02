import React, {Component, Fragment, useEffect, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import Typography from "@material-ui/core/Typography";
import {Paper} from "@material-ui/core";
import clsx from "clsx";
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import {useHistory, useParams} from "react-router-dom";
import {useMutation, useQuery} from "@apollo/react-hooks";
import * as Query from "../constants/query";
import AgentAvatar from "./AgentAvatar";
import Iframe from "react-iframe";
import useWindowDimensions from "../hooks/useWindowDimensions";
import * as Colors from "../utils/colors"
import Fab from "@material-ui/core/Fab";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import * as GameStatus from "../constants/gameStatus"
import Snackbar from "@material-ui/core/Snackbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
    root: {
        transform: props => `scale(${props.scale})`,
        transformOrigin: "left top",
        position: "absolute",
        overflow: "hidden",
        top: props => props.top,
        left: props => props.left,
        borderRadius: theme.spacing(2),
        boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
        zIndex: -1
    },
    app: {
        position: "relative",
        marginTop: theme.spacing(1),
        marginLeft: "auto",
        marginRight: "auto",
        width: "80%",
        height: 50,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        borderRadius: theme.spacing(1),
        flexGrow: 1
    },
    leftBottomPanelFloat: {
        position: "absolute",
        bottom: "15%",
        borderRadius: `25px 25px 25px 25px`,
        "&>*": {
            float: "right"
        },
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        left: "5%",
        border: 1,
        borderLeft: 1,
        borderStyle: "solid"
    },
    rightBottomPanelFloat: {
        position: "absolute",
        [theme.breakpoints.down('md')]: {
            bottom: "5%"
        },
        [theme.breakpoints.up('lg')]: {
            bottom: "15%"
        },
        right: "5%",
        borderRadius: `25px 25px 25px 25px`,
        "&>*": {
            float: "left"
        },
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        paddingRight: theme.spacing(1),
        border: 1,
        borderRight: 1,
        borderStyle: "solid"
    },
    leftBottomPanel: {
        position: "absolute",
        bottom: "15%",
        borderRadius: `0px 26px 26px 0px`,
        "&>*": {
            float: "right"
        },
        // paddingTop: theme.spacing(1),
        // paddingBottom: theme.spacing(1),
        left: 0,
        border: 1,
        borderLeft: 0,
        borderStyle: "solid"
    },
    rightBottomPanel: {
        position: "absolute",
        [theme.breakpoints.down('md')]: {
            bottom: "5%"
        },
        [theme.breakpoints.up('lg')]: {
            bottom: "15%"
        },
        right: 0,
        borderRadius: `26px 0px 0px 26px`,
        "&>*": {
            float: "left"
        },
        border: 1,
        borderRight: 0,
        borderStyle: "solid"
    },
    leftPanelText: {
        height: "100%",
        padding: theme.spacing(1),
        paddingRight: theme.spacing(1.5),
        borderRadius: `0px 26px 26px 0px`,
        marginTop: -5,
        border: 1,
        borderLeft: 0,
        borderStyle: "solid",
        boxShadow: "10px 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    },
    rightPanelText: {
        height: "100%",
        padding: theme.spacing(1),
        paddingLeft: theme.spacing(1.5),
        marginTop: -5,
        borderRadius: `26px 0px 0px 26px`,
        border: 1,
        borderRight: 0,
        borderStyle: "solid",
        boxShadow: "0px 4px 8px 10px rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)",
    },
    panelAvatar: {
        height: 50,
        width: 50,
        // marginTop: theme.spacing(-1),
        // marginBottom: theme.spacing(-1),
        "&>*": {
            height: 30,
            width: 30
        }
    },
    panelText: {
        margin: "auto",
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        padding: theme.spacing(1),
        textShadow: "2px 2px 4px #000000"
    },
    floatLeft: {
        marginLeft: theme.spacing(1),
        marginRight: "auto",
        textAlign: "left",
        position: "relative"
    },
    floatRight: {
        marginRight: theme.spacing(1),
        marginLeft: "auto",
        textAlign: "right",
        position: "relative"
    }
}));

const LoadingPage = props => {
    const classes = useStyles()
    return (
        <Paper elevation={0} className={clsx(classes.root, props.className)}
               style={{textAlign: "center"}}>
            <CircularProgress className={classes.progress}/>
        </Paper>
    )
}

function WatchGame(props) {
    let history = useHistory();
    let {id} = useParams();
    const theme = useTheme()
    const [open, setOpen] = useState(false)
    const [timeout, setTimeout] = useState(0)
    const {loading, error, data, subscribeToMore} = useQuery(
        Query.GAME_QUERY,
        {
            variables: {id}, onCompleted: d => {
                subscribeToMore({
                    document: Query.SUBSCRIBE_GAME_CHANGE,
                    variables: {id},
                    updateQuery: (prev, {subscriptionData}) => {
                        if (!subscriptionData.data) return prev;

                        if (subscriptionData.data.trackGameStatus.status === GameStatus.ENDED) {
                            setTimeout(3);
                            setOpen(true)
                        }

                        return prev;
                    }
                })
            }
        })

    const {height, width} = useWindowDimensions();
    const h = height - theme.spacing(4)
    const w = width - theme.spacing(4)

    const scaleW = w / 1920
    const scaleH = h / 1080
    let scale = 1

    if (1080 * scaleW > h)
        scale = scaleH
    if (1920 * scaleH > w)
        scale = scaleW

    const top = (height - 1080.0 * scale) / 2.0
    const left = (width - 1920.0 * scale) / 2.0

    const classes = useStyles({scale, top, left});

    const goBack = e => {
        history.goBack()
    }

    React.useEffect(() => {
        const timer =
            timeout > 0 && setInterval(() => setTimeout(timeout - 1), 1000);
        return () => clearInterval(timer);
    }, [timeout]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
        goBack(event);
    };

    const handleCloseCancel = (e) => {
        setOpen(false);
    }

    if (loading) return <LoadingPage/>
    if (error) return <Error className={props.className} error={error}/>

    const playerOne = data.game.host.id === data.game.playerOneId ? data.game.host : data.game.guest
    const playerTwo = data.game.host.id === data.game.playerTwoId ? data.game.host : data.game.guest

    return (
        <Fragment>
            <Iframe
                url={process.env.REACT_APP_GAME_SERVER_URL + (data && data.game ? "/?gameId=" + data.game.gameId : "/")}
                className={classes.root}
                height="1080px"
                width="1920px"
                frameBorder="0"/>

            <Paper elevation={5} className={classes.leftBottomPanel}
                   style={{borderColor: Colors.hashStringToColor(playerOne.id)}}>
                <AgentAvatar className={classes.panelAvatar} agent={playerOne}/>
                <Typography className={classes.panelText} variant="h6" color="inherit">
                    {playerOne.name}
                </Typography>
                <Typography className={classes.leftPanelText}
                            style={{
                                backgroundColor: Colors.hashStringToColor(playerOne.id),
                                color: theme.palette.getContrastText(Colors.hashStringToColor(playerOne.id)),
                                borderColor: Colors.hashStringToColor(playerOne.id)
                            }}
                            variant="h6"
                            color="inherit">
                    Player1
                </Typography>
            </Paper>
            <Paper elevation={5} className={classes.rightBottomPanel}
                   style={{borderColor: Colors.hashStringToColor(playerTwo.id)}}>
                <AgentAvatar className={classes.panelAvatar} agent={playerTwo}/>
                <Typography className={classes.panelText} variant="h6" color="inherit">
                    {playerTwo.name}
                </Typography>
                <Typography className={classes.rightPanelText}
                            style={{
                                backgroundColor: Colors.hashStringToColor(playerTwo.id),
                                color: theme.palette.getContrastText(Colors.hashStringToColor(playerTwo.id)),
                                borderColor: Colors.hashStringToColor(playerTwo.id)
                            }}
                            variant="h6" color="inherit">
                    Player2
                </Typography>
            </Paper>
            <Fab color="primary"
                 size="medium"
                 style={{margin: theme.spacing(2)}}
                 onClick={goBack}>
                <ArrowBackIcon/>
            </Fab>
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                open={open}
                autoHideDuration={3500}
                onClose={handleClose}
                message={`The game will close in ${timeout}`}
                action={
                    <React.Fragment>
                        <Button color="secondary" size="small" onClick={handleCloseCancel}>
                            CANCEL
                        </Button>
                    </React.Fragment>
                }
            />
        </Fragment>
    );
}

WatchGame.propTypes = {
    className: PropTypes.string
}

export default WatchGame;