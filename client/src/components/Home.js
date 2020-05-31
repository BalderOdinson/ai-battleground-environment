import React, {Component, createRef, Fragment, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import UserPanel from "./UserPanel";
import Paper from "@material-ui/core/Paper";
import WatchGamePanel from "./WatchGamePanel";
import GameResultsPanel from "./GameResultsPanel";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AssignmentIndIcon from '@material-ui/icons/AssignmentInd';
import SettingsInputComponentIcon from '@material-ui/icons/SettingsInputComponent';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import BlurCircularIcon from '@material-ui/icons/BlurCircular';
import HostGame from "./HostGame";
import JoinGamePanel from "./JoinGamePanel";
import Slide from "@material-ui/core/Slide";
import CustomGamePanel from "./CustomGamePanel";
import TrainPanel from "./TrainPanel";
import StorageIcon from '@material-ui/icons/Storage';
import SettingsIcon from '@material-ui/icons/Settings';
import {useMediaQuery} from "@material-ui/core";
import Settings from "./Settings";


const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: theme.spacing(2)
    },
    mainPanel: {
        width: "100%",
        height: "100%",
    },
    mainPanelGrid: {
        padding: theme.spacing(1),
        margin: 0,
        width: "100%",
    },
    tabPanel: {
        backgroundColor: theme.palette.background.default,
        width: "100%",
    }
}));

function Home(props) {
    const classes = useStyles(props);
    const [entrance, setEntrance] = useState(false)
    const [index, setIndex] = useState(0)
    const theme = useTheme()
    const matches = useMediaQuery(theme.breakpoints.up('lg'));

    const onIndexChange = (event, newValue) => setIndex(newValue);

    useEffect(() => {
        setEntrance(true)
    }, [])

    const [height, setHeight] = useState(0)
    const refPanel = createRef()
    const refTab = createRef()

    useLayoutEffect(() => {
        if (refPanel.current && refTab.current)
            setHeight(refPanel.current.clientHeight - refTab.current.clientHeight)
    })

    return (
        <div className={classes.root}>
            <Grid container
                  spacing={3}>
                <Grid item lg md={12} sm={12} xs={12}>
                    <Grid container
                          spacing={3}>
                        <Slide direction="right" in={entrance} mountOnEnter unmountOnExit>
                            <Grid item lg md={12} sm={12} xs={12}>
                                <UserPanel/>
                            </Grid>
                        </Slide>
                    </Grid>
                </Grid>
                <Grid item lg={6} md={12} sm={12} xs={12}>
                    <Slide direction="up" in={entrance} mountOnEnter unmountOnExit
                           style={{transitionDelay: entrance ? '200ms' : '0ms'}}>
                        <Paper className={classes.mainPanel} ref={refPanel}>
                            <Grid container
                                  className={classes.mainPanelGrid}
                                  spacing={3}>
                                <Grid item xs={12}>
                                    <Paper elevation={5} className={classes.tabPanel} ref={refTab}>
                                        <Tabs value={index}
                                              onChange={onIndexChange}
                                              indicatorColor="primary"
                                              scrollButtons="auto"
                                              variant={matches ? "fullWidth" : "scrollable"}
                                              textColor="primary">
                                            <Tab label="Join game" icon={<SettingsInputComponentIcon/>}/>
                                            <Tab label="Host game" icon={<SupervisorAccountIcon/>}/>
                                            <Tab label="Custom" icon={<BlurCircularIcon/>}/>
                                            <Tab label="Train" icon={<AssignmentIndIcon/>}/>
                                            <Tab label="Settings" icon={<SettingsIcon/>}/>
                                        </Tabs>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12}>
                                    {index === 0 && <JoinGamePanel height={height}/>}
                                    {index === 1 && <HostGame/>}
                                    {index === 2 && <CustomGamePanel/>}
                                    {index === 3 && <TrainPanel/>}
                                    {index === 4 && <Settings/>}
                                </Grid>
                            </Grid>
                        </Paper>
                    </Slide>
                </Grid>
                <Grid item lg md={12} sm={12} xs={12}>
                    <Slide direction="left" in={entrance} mountOnEnter unmountOnExit>
                        <Grid container
                              direction="column"
                              spacing={3}>
                            <Grid item lg md={12} sm={12} xs={12}>
                                <WatchGamePanel/>
                            </Grid>

                            <Grid item lg md={12} sm={12} xs={12}>
                                <GameResultsPanel/>
                            </Grid>
                        </Grid>
                    </Slide>
                </Grid>
            </Grid>
        </div>
    );
}


export default Home;