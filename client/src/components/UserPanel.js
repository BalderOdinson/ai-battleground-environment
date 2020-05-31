import React, {Component, Fragment} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import {useQuery} from "@apollo/react-hooks";
import * as Query from "../constants/query";
import clsx from "clsx";
import ProfileHeader from "../assets/profileheader.svg";
import Card from "@material-ui/core/Card";
import CardMedia from "@material-ui/core/CardMedia";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Error from "./Error";
import CircularProgress from "@material-ui/core/CircularProgress";
import AgentAvatar from "./AgentAvatar";
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import IconButton from "@material-ui/core/IconButton";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import ListItemText from "@material-ui/core/ListItemText";
import SportsEsportsIcon from '@material-ui/icons/SportsEsports';
import CircularProgressWithLabel from "./CircularProgressWithLabel";
import {useHistory} from "react-router-dom";
import {AUTH_TOKEN} from "../constants/auth";
import { red } from '@material-ui/core/colors';


const useStyles = makeStyles(theme => ({
    root: {
    },
    media: {
        backgroundColor: red["900"],
        height: 140,
    },
    progress: {
        margin: "auto",
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    avatar: {
        width: theme.spacing(8),
        height: theme.spacing(8),
        "&>*": {
            width: theme.spacing(6),
            height: theme.spacing(6),
        },
        margin: "auto",
        marginTop: -theme.spacing(4),
        marginBottom: -theme.spacing(1.5),
    },
    logout: {
        float: "right",
        marginTop: -theme.spacing(7),
        width: theme.spacing(5),
        height: theme.spacing(5),
    },
    logoutIcon: {
        width: theme.spacing(3.5),
        height: theme.spacing(3.5),
    },
    alignRightAvatar: {
        marginLeft: "auto",
        marginRight: theme.spacing(-2)
    },
    alignRight: {
        marginLeft: "auto",
        marginRight: theme.spacing(-1)
    },
    trophyAvatar: {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.getContrastText(theme.palette.warning.main)
    }
}));

const UserPanelRoot = props => {
    const classes = useStyles(props);
    return (
        <Card className={clsx(classes.root, props.className)}>
            {props.children}
        </Card>)
}

const LoadingPage = props => {
    const classes = useStyles(props);
    return (<UserPanelRoot className={props.className}>
        <CardContent style={{textAlign: "center"}}>
            <CircularProgress className={classes.progress}/>
        </CardContent>
    </UserPanelRoot>)
}

function UserPanel(props) {
    const classes = useStyles(props);
    const theme = useTheme()
    let history = useHistory();
    const {loading, error, data, client} = useQuery(Query.CURRENT_USER_QUERY)

    if (loading) return <LoadingPage className={props.className}/>
    if (error) return <UserPanelRoot className={props.className}><Error error={error}/></UserPanelRoot>

    const totalGames = data.currentUser.gamesPlayed

    return (
        <UserPanelRoot className={props.className}>
            <CardMedia
                className={classes.media}
                image={ProfileHeader}
                title="Header"/>
            <AgentAvatar className={classes.avatar} agent={data.currentUser}/>
            <CardContent>
                <Typography align="center" gutterBottom variant="h5" component="h2">
                    {data.currentUser.name}
                </Typography>
                <IconButton className={classes.logout} onClick={e => {
                    localStorage.removeItem(AUTH_TOKEN)
                    client.cache.reset()
                    client.writeData({ data: { isLoggedIn: false } })
                    history.go(history.length)
                }}>
                    <PowerSettingsNewIcon className={classes.logoutIcon}/>
                </IconButton>
                <Divider/>
                <List dense>
                    <ListItem>
                        <ListItemText primary={totalGames} secondary="Total games played"/>
                        <ListItemAvatar>
                            <Avatar className={clsx(classes.alignRightAvatar, classes.trophyAvatar)}>
                                <SportsEsportsIcon/>
                            </Avatar>
                        </ListItemAvatar>
                    </ListItem>
                    <ListItem>
                        <ListItemText primary={data.currentUser.gamesWon} secondary="Total games won"/>
                        <CircularProgressWithLabel className={classes.alignRight}
                                                   style={{color: theme.palette.success.main}}
                                                   value={totalGames !== 0 ?
                                                       100 * data.currentUser.gamesWon / totalGames
                                                       : 0}/>
                    </ListItem>
                    <ListItem>
                        <ListItemText primary={data.currentUser.gamesDraw} secondary="Total games drawn"/>
                        <CircularProgressWithLabel className={classes.alignRight}
                                                   style={{color: theme.palette.info.main}}
                                                   value={totalGames !== 0 ?
                                                       100 * data.currentUser.gamesDraw / totalGames
                                                       : 0}/>
                    </ListItem>
                    <ListItem>
                        <ListItemText primary={data.currentUser.gamesLost} secondary="Total games lost"/>
                        <CircularProgressWithLabel className={classes.alignRight}
                                                   style={{color: theme.palette.error.main}}
                                                   value={totalGames !== 0 ?
                                                       100 * data.currentUser.gamesLost / totalGames
                                                       : 0}/>
                    </ListItem>
                </List>

            </CardContent>
        </UserPanelRoot>
    );
}

UserPanel.propTypes = {
    className: PropTypes.string
}


export default UserPanel;