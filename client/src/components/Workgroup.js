import React, {Component} from 'react';
import {makeStyles} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import EventAvailableIcon from '@material-ui/icons/EventAvailable'
import EventBusyIcon from '@material-ui/icons/EventBusy'
import ListItem from "@material-ui/core/ListItem";
import Avatar from "@material-ui/core/Avatar";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Checkbox from "@material-ui/core/Checkbox";
import ListItemIcon from "@material-ui/core/ListItemIcon";


const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(1)
    },
    alignRight: {
        float: "right",
        marginRight: theme.spacing(1)
    },
    avatar: {
        backgroundColor: props =>
            props.workgroup.busy ? theme.palette.error.main : theme.palette.success.main
    }
}));

function Workgroup(props) {
    const classes = useStyles(props);

    return (
        <ListItem className={props.className}
                  style={props.style}
                  key={props.workgroup.id}
                  button={props.button}
                  onClick={e => {
                      if (props.onClick) {
                          props.onClick(props.workgroup)
                      }
                  }}>
            {props.select && <ListItemIcon>
                <Checkbox
                    edge="start"
                    color="primary"
                    onChange={e => {
                        if (props.onClick) {
                            props.onClick(props.workgroup)
                        }
                    }}
                    checked={props.selectedItems ?
                        !!props.selectedItems.find(id => props.workgroup.id === id) : false}
                    tabIndex={-1}
                    disableRipple/>
            </ListItemIcon>}
            {!props.select && <ListItemAvatar>
                <Avatar className={classes.avatar}>
                    {props.workgroup.busy ?
                        <EventBusyIcon/> :
                        <EventAvailableIcon/>}
                </Avatar>
            </ListItemAvatar>}
            <ListItemText primary={props.workgroup.workstation.name}
                          secondary={props.workgroup.id}/>
        </ListItem>
    );
}

Workgroup.propTypes = {
    className: PropTypes.string,
    workgroup: PropTypes.shape({
        id: PropTypes.string.isRequired,
        busy: PropTypes.bool.isRequired,
        workstation: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        }).isRequired
    }).isRequired,
    button: PropTypes.bool,
    onClick: PropTypes.func,
    select: PropTypes.bool,
    selectedItems: PropTypes.arrayOf(PropTypes.string)
}


export default Workgroup;