import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import Paper from "@material-ui/core/Paper";
import GameList from "./GameList";
import * as GameOrderByInput from "../constants/gameOrderByInput";
import React, {useEffect, useRef, useState} from "react";
import {makeStyles, useTheme} from "@material-ui/core/styles";
import * as GameStatus from "../constants/gameStatus"
import PropTypes from 'prop-types'
import Slide from "@material-ui/core/Slide";
import Zoom from "@material-ui/core/Zoom";
import {useHistory} from "react-router-dom";

const useStyles = makeStyles(theme => ({
    root: {
        width: "100%",
        minHeight: 400,
        margin: "auto",
        backgroundColor: theme.palette.background.default,
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
    },
    list: {
        minHeight: 320,
    },
    background: {
        backgroundColor: theme.palette.background.default,
    },
    headerText: {
        margin: theme.spacing(1.5),
        marginTop: theme.spacing(0)
    }

}));

const MODIFIER = 80
const LIST_MODIFIER = 160

function JoinGamePanel(props) {
    const classes = useStyles(props);
    const theme = useTheme()
    let history = useHistory();
    const [entrance, setEntrance] = useState(false)

    useEffect(() => {
        setEntrance(true)
    }, [])

    return (
        <Zoom in={entrance} mountOnEnter unmountOnExit>
            <Paper className={classes.root}
                   style={{height: props.height - MODIFIER}}>
                <Typography gutterBottom variant="h6" component="h2" className={classes.headerText}>
                    Join game
                </Typography>
                <Divider/>
                <Paper elevation={0} className={classes.list} style={{height: props.height - LIST_MODIFIER}}>
                    <GameList pageSize={20}
                              active={true}
                              onClick={(e) => {
                                  history.push(`/lobby/${e.id}`)
                              }}
                              className={classes.background}
                              gameStatus={GameStatus.OPEN}
                              orderBy={GameOrderByInput.CREATED_AT_DESC}/>
                </Paper>
                <Divider style={{marginTop: theme.spacing(1.1)}}/>
            </Paper>
        </Zoom>
    );
}

JoinGamePanel.propTypes = {
    height: PropTypes.number
}


export default JoinGamePanel;

