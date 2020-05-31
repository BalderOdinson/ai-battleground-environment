import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import GameList from "./GameList";
import * as GameOrderByInput from "../constants/gameOrderByInput";
import React from "react";
import {makeStyles, useTheme} from "@material-ui/core/styles";
import * as GameStatus from  "../constants/gameStatus"

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
        height: "100%",
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    list: {
        width: "100%",
        height: "37vh",
    },
    headerText: {
        margin: theme.spacing(1.5),
        marginTop: theme.spacing(0)
    }

}));

function GameResultsPanel(props) {
    const classes = useStyles(props);
    const theme = useTheme()

    return (
        <Paper className={classes.root}>
            <Typography gutterBottom variant="h6" component="h2" className={classes.headerText}>
                Latest game results
            </Typography>
            <Divider/>
            <Paper elevation={0} className={classes.list}>
                <GameList pageSize={20}
                          gameStatus={GameStatus.ENDED}
                          orderBy={GameOrderByInput.CREATED_AT_DESC}/>
            </Paper>
            <Divider style={{marginTop: theme.spacing(1)}}/>
        </Paper>
    );
}


export default GameResultsPanel;

