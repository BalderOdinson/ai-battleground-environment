import React, {Component} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import ListItem from "@material-ui/core/ListItem";
import Avatar from "@material-ui/core/Avatar";
import ListItemText from "@material-ui/core/ListItemText";
import Grid from "@material-ui/core/Grid";
import SvgIcon from "@material-ui/core/SvgIcon";
import AIAvatar from "./icons/Aiavatar"
import Divider from "@material-ui/core/Divider";
import DoneAllIcon from '@material-ui/icons/DoneAll'
import LaunchIcon from '@material-ui/icons/Launch'
import CheckIcon from '@material-ui/icons/Check'
import GamesIcon from '@material-ui/icons/Games'
import CloseIcon from '@material-ui/icons/Close'
import * as GameStatus from '../constants/gameStatus'
import clsx from "clsx";
import AgentAvatar from "./AgentAvatar";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(1)
    },
    textAlignLeft: {
        textAlign: "left",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        marginLeft: theme.spacing(1)
    },
    textAlignRight: {
        textAlign: "right",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        marginRight: theme.spacing(1)
    },
    textWrap: {
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
    },
    mapAvatar: {
        borderRadius: 10,
        width: 85,
        height: 42,
    },
    avatarLeft: {
        display: "inline"
    },
    avatarRight: {
        display: "inline"
    },
    statusOpen: {
        marginLeft: "auto",
        backgroundColor: theme.palette.info.main,
        color: theme.palette.getContrastText(theme.palette.info.main)
    },
    statusReady: {
        marginLeft: "auto",
        backgroundColor: theme.palette.success.main,
        color: theme.palette.getContrastText(theme.palette.success.main)
    },
    statusInPlay: {
        marginLeft: "auto",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.getContrastText(theme.palette.background.default)
    },
    statusClosed: {
        marginLeft: "auto",
        backgroundColor: theme.palette.error.main,
        color: theme.palette.getContrastText(theme.palette.background.default)
    },
    statusEnded: {
        marginLeft: "auto",
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.getContrastText(theme.palette.warning.main)
    },
    rowLeft: {
        display: "flex",
        flexWrap: "nowrap",
        "&>*": {
            float: "left",
            marginTop: "auto",
            marginBottom: "auto"
        },
        marginBottom: theme.spacing(2)
    },
    rowRight: {
        display: "flex",
        flexWrap: "nowrap",
        "&>*": {
            float: "right",
            marginTop: "auto",
            marginBottom: "auto"
        },
        marginBottom: theme.spacing(2)
    }
}));

function timeDifference(current, previous) {
    const milliSecondsPerMinute = 60 * 1000
    const milliSecondsPerHour = milliSecondsPerMinute * 60
    const milliSecondsPerDay = milliSecondsPerHour * 24
    const milliSecondsPerMonth = milliSecondsPerDay * 30
    const milliSecondsPerYear = milliSecondsPerDay * 365

    const elapsed = current - previous

    if (elapsed < milliSecondsPerMinute / 3) {
        return 'just now'
    }

    if (elapsed < milliSecondsPerMinute) {
        return 'less than 1 min ago'
    } else if (elapsed < milliSecondsPerHour) {
        return Math.round(elapsed / milliSecondsPerMinute) + ' min ago'
    } else if (elapsed < milliSecondsPerDay) {
        return Math.round(elapsed / milliSecondsPerHour) + ' h ago'
    } else if (elapsed < milliSecondsPerMonth) {
        return Math.round(elapsed / milliSecondsPerDay) + ' days ago'
    } else if (elapsed < milliSecondsPerYear) {
        return Math.round(elapsed / milliSecondsPerMonth) + ' mo ago'
    } else {
        return Math.round(elapsed / milliSecondsPerYear) + ' years ago'
    }
}

export function timeDifferenceForDate(date) {
    const now = new Date().getTime()
    const updated = new Date(date).getTime()
    return timeDifference(now, updated)
}

function GameItem(props) {
    const classes = useStyles(props);
    const theme = useTheme()

    return (
        <ListItem style={props.style} button={props.button}
                  className={clsx(classes.item, props.className)}
                  key={props.game.id}
                  onClick={e => {
                      if(props.onClick) {
                          props.onClick(props.game)
                      }
                  }}>
            <Grid container
                  spacing={1}>
                <Grid item xs={6} className={classes.rowLeft}>
                    <AgentAvatar agent={props.game.host}/>
                    <ListItemText primary={props.game.host ? props.game.host.name : "Empty"}
                                  secondary="Host" className={classes.textAlignLeft}/>
                </Grid>
                <Grid item xs={6} className={classes.rowRight}>
                    <ListItemText primary={props.game.guest ? props.game.guest.name : "Empty"}
                                  secondary="Guest" className={classes.textAlignRight}/>
                    <AgentAvatar agent={props.game.guest}/>
                </Grid>
                <Grid item xs={7} className={classes.rowLeft}>
                    <img className={classes.mapAvatar} alt="map"
                         src={require(`../assets/${props.game.map.name}.svg`)}/>
                    <ListItemText primary={props.game.map.name}
                                  secondary={timeDifferenceForDate(new Date(Date.parse(props.game.createdAt)))}
                                  className={classes.textAlignLeft}/>
                </Grid>
                <Grid item xs={5} className={classes.rowRight}>
                    {props.game.status === GameStatus.OPEN &&
                    <ListItemText primary="Join game"
                                  className={classes.textAlignRight}/>}
                    {props.game.status === GameStatus.READY &&
                    <ListItemText primary="Starting..."
                                  className={classes.textAlignRight}/>}
                    {props.game.status === GameStatus.IN_PLAY &&
                    <ListItemText primary="Live"
                                  className={classes.textAlignRight}/>}
                    {props.game.status === GameStatus.CLOSED &&
                    <ListItemText primary="Closed"
                                  className={classes.textAlignRight}/>}
                    {props.game.status === GameStatus.ENDED &&
                    <ListItemText primary={props.game.winner ? props.game.winner.name : "Draw"}
                                  secondary={props.game.winner ? "Winner" : undefined}
                                  className={classes.textAlignRight}/>}
                    {props.game.status === GameStatus.OPEN && <Avatar className={classes.statusOpen}>
                        <LaunchIcon/>
                    </Avatar>}
                    {props.game.status === GameStatus.READY && <Avatar className={classes.statusReady}>
                        <CheckIcon/>
                    </Avatar>}
                    {props.game.status === GameStatus.IN_PLAY && <Avatar className={classes.statusInPlay}>
                        <GamesIcon/>
                    </Avatar>}
                    {props.game.status === GameStatus.CLOSED && <Avatar className={classes.statusClosed}>
                        <CloseIcon/>
                    </Avatar>}
                    {props.game.status === GameStatus.ENDED && <Avatar className={classes.statusEnded} >
                        <DoneAllIcon/>
                    </Avatar>}
                </Grid>
                <Grid item xs={12}>
                    <Divider/>
                </Grid>
            </Grid>
        </ListItem>
    );
}

GameItem.propTypes = {
    className: PropTypes.string,
    game: PropTypes.shape({
        id: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        map: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
        host: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            isBot: PropTypes.bool.isRequired,
        }).isRequired,
        guest: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            isBot: PropTypes.bool.isRequired,
        }),
        status: PropTypes.string.isRequired,
        winner: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            isBot: PropTypes.bool.isRequired,
        }),
    }).isRequired,
    button: PropTypes.bool,
    onClick: PropTypes.func,
}


export default GameItem;