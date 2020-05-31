import React, {Component, Fragment, useEffect, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import Typography from "@material-ui/core/Typography";
import {Paper} from "@material-ui/core";
import clsx from "clsx";
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import {useHistory} from "react-router-dom";
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


const useStyles = makeStyles(theme => ({
    root: {
        margin: "15% auto",
        width: "50%",
        minWidth: 300,
        backgroundColor: theme.palette.background.default
    },
    hostButton: {
        marginLeft: "auto"
    },
    gameOptions: {
        marginTop: theme.spacing(2)
    },
    gameOptionsAvatar: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.getContrastText(theme.palette.primary.main),
    },
    heading: {
        marginLeft: theme.spacing(1)
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

function HostGame(props) {
    const classes = useStyles(props);
    let history = useHistory();
    const theme = useTheme()
    const {loading: userLoading, error: userError, data: userData} = useQuery(Query.CURRENT_USER_QUERY)
    const {loading: mapsLoading, error: mapsError, data: mapsData} = useQuery(Query.AVAILABLE_MAPS_QUERY)
    const [hostGame, {loading: mutationLoading, error: mutationError}] = useMutation(Query.HOST_GAME);
    const [entrance, setEntrance] = useState(false)
    const [expanded, setExpanded] = useState(false);
    const [map, setMap] = useState(0);

    const handleExpandChange = (event) => {
        setExpanded(!expanded);
    };
    const handleMapChange = (event) => {
        setMap(event.target.value);
    };

    const handleClick = e => {
        console.log(map)
        hostGame({variables: {map: map ? map : null}})
            .then(d => {
                history.push(`/lobby/${d.data.hostGame.id}`)
            })
            .catch(e => console.log(e))
    }

    useEffect(() => {
        setEntrance(true)
    }, [])

    const loading = userLoading || mapsLoading;

    if (userError) return <Error className={props.className} error={userError}/>
    if (mapsError) return <Error className={props.className} error={mapsError}/>
    if (mutationError) return <Error className={props.className} error={mutationError}/>

    return (
        <Zoom in={entrance} mountOnEnter unmountOnExit>
            <Card elevation={4} className={clsx(classes.root, props.className)}>
                <CardHeader
                    avatar={
                        loading ?
                            <Skeleton animation="wave" variant="circle" width={40} height={40}/> :
                            <AgentAvatar agent={userData.currentUser}/>
                    }
                    title={userData.currentUser.name}
                    subheader="Great warrior, adventure awaits!"
                    action={
                        mutationLoading ?
                            <CircularProgress className={classes.progress}/> : (
                                loading ? null :
                                    <IconButton aria-label="settings" onClick={handleClick}>
                                        <ArrowForwardIcon/>
                                    </IconButton>)
                    }/>
                <CardContent className={classes.content}>
                    {loading ?
                        <Skeleton animation="wave" height={10} width="80%" style={{marginBottom: 6}}/> :
                        <Typography gutterBottom variant="h6" component="h2">
                            Host a game so other players can join!
                        </Typography>}
                    {loading ? null :
                        <ExpansionPanel className={classes.gameOptions} expanded={expanded}
                                        onChange={handleExpandChange}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                <SettingsIcon/>
                                <Typography className={classes.heading}>Game options</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <FormControl disabled={mutationLoading}>
                                    <InputLabel>Map</InputLabel>
                                    <Select value={map}
                                            onChange={handleMapChange}>
                                        <MenuItem value={0}>Random</MenuItem>
                                        {mapsData.maps.map(m =>
                                            <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
                                    </Select>
                                    <FormHelperText>Select game map</FormHelperText>
                                </FormControl>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>}
                </CardContent>
            </Card>
        </Zoom>
    );
}

HostGame.propTypes = {
    className: PropTypes.string
}

export default HostGame;