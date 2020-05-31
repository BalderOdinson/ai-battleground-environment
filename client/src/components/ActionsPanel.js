import React, {Component} from 'react';
import Iframe from 'react-iframe'
import {makeStyles} from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Button from "@material-ui/core/Button";

const useStyles = makeStyles(theme => ({
    margin: {
        margin: theme.spacing(2),
        marginLeft: "auto",
        marginRight: "auto",
        display: "block",
        width: "100%"
    },
    extendedIcon: {
        marginRight: theme.spacing(1),
    },
    cardPosition: {
        position: "relative",
        margin: theme.spacing(2),
        marginLeft: "auto",
        marginRight: "auto",
        width: "90%"
    }
}));

function ActionsPanel(props) {
    const classes = useStyles();

    return (
        <Card className={classes.cardPosition} >
            <CardContent>
                <Button variant="contained" size="large" className={classes.margin} color="primary">
                    Move
                </Button>
                <Button variant="contained" size="large" className={classes.margin} color="primary">
                    Attack
                </Button>
                <Button variant="contained" size="large" className={classes.margin} color="primary">
                    Stay
                </Button>
            </CardContent>
        </Card>
    );
}

export default ActionsPanel;