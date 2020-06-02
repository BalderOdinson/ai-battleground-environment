import React, {Component, Fragment} from 'react';
import {makeStyles} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import SvgIcon from "@material-ui/core/SvgIcon";
import AIAvatar from "./icons/Aiavatar";
import UserAvatar from "./icons/Useravatar";
import Avatar from "@material-ui/core/Avatar";
import DonutLargeIcon from "@material-ui/icons/DonutLarge"
import clsx from "clsx";
import * as Colors from "../utils/colors"

const useStyles = makeStyles(theme => ({
    avatar: {
        backgroundColor: props => props.agent ?
            Colors.hashStringToColor(props.agent.id) :
            theme.palette.secondary.dark,
        color: props => props.agent ?
            theme.palette.getContrastText(Colors.hashStringToColor(props.agent.id)) :
            theme.palette.getContrastText(theme.palette.secondary.dark)
    }
}));

function AgentAvatar(props) {
    const classes = useStyles(props);
    return (
        <Avatar className={clsx(classes.avatar, props.className)}>
            {!props.agent && <DonutLargeIcon/>}
            {props.agent && !props.agent.isBot && <SvgIcon component={UserAvatar} viewBox="0 0 13 13"/>}
            {props.agent && props.agent.isBot && <SvgIcon component={AIAvatar} viewBox="0.35 0.35 12 12"/>}
        </Avatar>
    );
}

AgentAvatar.propTypes = {
    className: PropTypes.string,
    agent: PropTypes.shape({
        id: PropTypes.string.isRequired,
        isBot: PropTypes.bool.isRequired,
    })
}

export default AgentAvatar;