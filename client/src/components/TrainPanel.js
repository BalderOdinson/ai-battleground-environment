import React, {Component, Fragment, useEffect, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import Typography from "@material-ui/core/Typography";
import clsx from "clsx";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Zoom from "@material-ui/core/Zoom";
import Avatar from "@material-ui/core/Avatar";
import WarningIcon from '@material-ui/icons/Warning';


const useStyles = makeStyles(theme => ({
    root: {
        margin: "15% auto",
        width: "50%",
        minWidth: 300,
        backgroundColor: theme.palette.background.default
    },
    progress: {},
    hostButton: {
        marginLeft: "auto"
    },
    gameOptions: {
        marginTop: theme.spacing(2)
    },
    avatar: {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.getContrastText(theme.palette.warning.main),
    },
    heading: {
        marginLeft: theme.spacing(1)
    }
}));

function TrainPanel(props) {
    const classes = useStyles(props);
    const [entrance, setEntrance] = useState(false)

    useEffect(() => {
        setEntrance(true)
    }, [])

    return (
        <Zoom in={entrance} mountOnEnter unmountOnExit>
            <Card elevation={4} className={clsx(classes.root, props.className)}>
                <CardHeader
                    avatar={
                        <Avatar className={classes.avatar}>
                            <WarningIcon/>
                        </Avatar>
                    }
                    title="Work in progress"
                    subheader="Coming soon!"/>
                <CardContent className={classes.content}>
                    <Typography gutterBottom variant="h6" component="h2">
                        Work on this content is in progress. Stay tuned!
                    </Typography>
                </CardContent>
            </Card>
        </Zoom>
    );
}

TrainPanel.propTypes = {
    className: PropTypes.string
}

export default TrainPanel;