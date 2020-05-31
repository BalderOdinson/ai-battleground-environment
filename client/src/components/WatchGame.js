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
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import AgentAvatar from "./AgentAvatar";
import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import Zoom from "@material-ui/core/Zoom";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Skeleton from "@material-ui/lab/Skeleton";
import Iframe from "react-iframe";
import useWindowDimensions from "../hooks/useWindowDimensions";
import Grid from "@material-ui/core/Grid";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import MenuIcon from '@material-ui/icons/Menu';

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
    menuButton: {
        marginRight: theme.spacing(2),
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
    const [entrance, setEntrance] = useState(false)
    const {loading, error, data} = useQuery(Query.GAME_QUERY, {variables: {id}})

    useEffect(() => {
        setEntrance(true)
    }, [])

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

            <AppBar className={classes.app} position="static">
                <Toolbar variant="dense">
                    <Grid container
                          direction="row"
                          justify="center"
                          alignItems="stretch">
                        <Grid item xs>
                            <AgentAvatar agent={playerOne}/>
                        </Grid>
                        <Grid item xs>
                            <Typography variant="h6" color="inherit">
                                {playerOne.name}
                            </Typography>
                        </Grid>
                        <Grid item xs>
                            <Typography className={classes.floatLeft} variant="h6" color="inherit">
                                {playerTwo.name}
                            </Typography>
                        </Grid>
                        <Grid item xs>
                            <AgentAvatar className={classes.floatLeft} agent={playerTwo}/>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
        </Fragment>
    );
}

WatchGame.propTypes = {
    className: PropTypes.string
}

export default WatchGame;