import React, {Fragment, useEffect, useState} from 'react';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types'
import Paper from "@material-ui/core/Paper";
import {useLazyQuery, useMutation, useQuery} from "@apollo/react-hooks";
import * as Query from "../constants/query";
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import Zoom from "@material-ui/core/Zoom";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import CloseIcon from '@material-ui/icons/Close';
import CheckIcon from '@material-ui/icons/Check';
import WorkgroupList from "./WorkgroupList";
import Divider from "@material-ui/core/Divider";
import TreeView from "@material-ui/lab/TreeView";
import DnsIcon from '@material-ui/icons/Dns';
import TreeItem from "@material-ui/lab/TreeItem";
import AdbIcon from '@material-ui/icons/Adb';
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import MapIcon from '@material-ui/icons/Map';
import {useHistory} from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.default,
        paddingBottom: theme.spacing(1),
        margin: "auto"
    },
    button: {
        marginRight: theme.spacing(1),
    },
    instructions: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    stepper: {
        backgroundColor: theme.palette.background.default,
    },
    content: {
        margin: theme.spacing(2),
        "&>*": {
            margin: theme.spacing(1),
            marginTop: theme.spacing(2)
        }
    },
    formControl: {},
    buttonGameMode: {
        margin: theme.spacing(1, 1, 0, 0),
    },
    rowSpan: {
        display: "block"
    },
    workgroupList: {
        height: 350,
        backgroundColor: theme.palette.background.default
    },
    treeView: {
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
    }
}));

const PLAYER_VS_AGENT = "Player vs agent"
const AGENT_VS_AGENT = "Agent vs agent"

function SelectGameModePanel(props) {
    const classes = useStyles();
    const theme = useTheme()

    const {loading: mapsLoading, error: mapsError, data: mapsData} = useQuery(Query.AVAILABLE_MAPS_QUERY)

    if (mapsLoading) return <CircularProgress/>;
    if (mapsError) return <Error error={mapsError}/>

    return (
        <form onSubmit={props.onSubmit}>
            <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">Select game mode</FormLabel>
                <RadioGroup name="game-mode"
                            value={props.value}
                            onChange={props.onGameModeChanged}
                            style={{marginTop: theme.spacing(1)}}>
                    <FormControlLabel value={PLAYER_VS_AGENT}
                                      control={<Radio color="primary" size="small"/>}
                                      label={PLAYER_VS_AGENT}/>
                    <FormControlLabel value={AGENT_VS_AGENT}
                                      control={<Radio color="primary" size="small"/>}
                                      label={AGENT_VS_AGENT}/>
                </RadioGroup>
                <FormLabel component="legend" style={{marginTop: theme.spacing(1)}}>Map</FormLabel>
                <Select value={props.map}
                        onChange={props.handleMapChange}>
                    <MenuItem value={0}>Random</MenuItem>
                    {mapsData.maps.map(m =>
                        <MenuItem key={m.id} value={m.name}>{m.name}</MenuItem>)}
                </Select>
                <FormHelperText>Select game map</FormHelperText>
                <Button type="submit"
                        className={classes.buttonGameMode}
                        endIcon={<ArrowForwardIcon>send</ArrowForwardIcon>}>
                    Next step
                </Button>
            </FormControl>
        </form>
    )
}

SelectGameModePanel.propTypes = {
    onSubmit: PropTypes.func,
    onGameModeChanged: PropTypes.func,
    value: PropTypes.string,
    handleMapChange: PropTypes.func,
    map: PropTypes.string
}

function SelectGameAgentPanel(props) {
    const classes = useStyles();

    const isValid = (props.mode === PLAYER_VS_AGENT && props.botValid) ||
        (props.mode === AGENT_VS_AGENT && props.bot1Valid && props.bot2Valid)

    return (
        <Fragment>
            {props.mode === PLAYER_VS_AGENT ?
                <Fragment>
                    <Typography className={classes.instructions}>
                        Select agent...
                    </Typography>
                    <TextField label="Guest agent"
                               id="bot"
                               className={classes.rowSpan}
                               value={props.bot}
                               onChange={props.onValueChanged}
                               error={!!props.botError}
                               helperText={props.botError}
                               InputProps={{
                                   endAdornment: (
                                       <InputAdornment position="end">
                                           {props.botError && <CloseIcon/>}
                                           {props.botValid && <CheckIcon/>}
                                           {props.botLoading && <CircularProgress/>}
                                       </InputAdornment>
                                   ),
                               }}/>
                </Fragment> :
                <Fragment>
                    <Typography className={classes.instructions}>
                        Select home and guest agent...
                    </Typography>
                    <TextField label="Home agent"
                               id="bot1"
                               value={props.bot1}
                               className={classes.rowSpan}
                               onChange={props.onValueChanged}
                               error={!!props.bot1Error}
                               helperText={props.bot1Error}
                               InputProps={{
                                   endAdornment: (
                                       <InputAdornment position="end">
                                           {props.bot1Error && <CloseIcon/>}
                                           {props.bot1Valid && <CheckIcon/>}
                                           {props.bot1Loading && <CircularProgress/>}
                                       </InputAdornment>
                                   ),
                               }}/>
                    <TextField label="Guest agent"
                               id="bot2"
                               value={props.bot2}
                               className={classes.rowSpan}
                               onChange={props.onValueChanged}
                               error={!!props.bot2Error}
                               helperText={props.bot2Error}
                               InputProps={{
                                   endAdornment: (
                                       <InputAdornment position="end">
                                           {props.bot2Error && <CloseIcon/>}
                                           {props.bot2Valid && <CheckIcon/>}
                                           {props.bot2Loading && <CircularProgress/>}
                                       </InputAdornment>
                                   ),
                               }}/>
                </Fragment>}
            <Button className={classes.button}
                    onClick={props.onBack}
                    startIcon={<ArrowBackIcon>back</ArrowBackIcon>}>
                Back
            </Button>
            <Button className={classes.button}
                    disabled={!isValid}
                    onClick={props.onSubmit}
                    endIcon={<ArrowForwardIcon>next</ArrowForwardIcon>}>
                Next step
            </Button>
        </Fragment>
    )
}

SelectGameAgentPanel.propTypes = {
    onSubmit: PropTypes.func,
    onBack: PropTypes.func,
    mode: PropTypes.string,
    bot: PropTypes.string,
    bot1: PropTypes.string,
    bot2: PropTypes.string,
    onValueChanged: PropTypes.func,
    botLoading: PropTypes.bool,
    bot1Loading: PropTypes.bool,
    bot2Loading: PropTypes.bool,
    botError: PropTypes.string,
    bot1Error: PropTypes.string,
    bot2Error: PropTypes.string,
    botValid: PropTypes.bool,
    bot1Valid: PropTypes.bool,
    bot2Valid: PropTypes.bool
}


function SelectResourcesPanel(props) {
    const classes = useStyles();
    const theme = useTheme()

    const toSelect = (props.mode === AGENT_VS_AGENT) + 1 - props.selectedWorkgroups.length

    return (
        <Fragment>
            {toSelect < 0 && <Typography className={classes.instructions}>
                Unselect excess resources
            </Typography>}
            {toSelect === 0 && <Typography className={classes.instructions}>
                Press next to go to summary
            </Typography>}
            {toSelect > 0 && <Typography className={classes.instructions}>
                Select {toSelect.toString()} more workgroups
            </Typography>}
            <Divider style={{marginBottom: theme.spacing(-2)}}/>
            <div className={classes.workgroupList}>
                <WorkgroupList active select={true}
                               selectedItems={props.selectedWorkgroups ?
                                   props.selectedWorkgroups.map(w => w.id) : []}
                               onClick={props.onWorkgroupSelected}
                               ageSize={20} available/>
            </div>
            <Divider style={{marginTop: theme.spacing(1)}}/>
            <Button className={classes.button}
                    onClick={props.onBack}
                    startIcon={<ArrowBackIcon>back</ArrowBackIcon>}>
                Back
            </Button>
            <Button className={classes.button}
                    disabled={!!toSelect}
                    onClick={props.onSubmit}
                    endIcon={<ArrowForwardIcon>next</ArrowForwardIcon>}>
                Next step
            </Button>
        </Fragment>
    )
}

SelectResourcesPanel.propTypes = {
    onSubmit: PropTypes.func,
    onBack: PropTypes.func,
    mode: PropTypes.string,
    selectedWorkgroups: PropTypes.array,
    onWorkgroupSelected: PropTypes.func
}

function SummaryPanel(props) {
    const classes = useStyles();
    const theme = useTheme()

    return (
        <Fragment>
            <Typography className={classes.instructions}
                        style={{marginBottom: theme.spacing(1)}}>
                Summary:
            </Typography>
            <Divider style={{
                marginTop: theme.spacing(0),
                marginBottom: theme.spacing(0)
            }}/>
            <TreeView
                className={classes.treeView}
                style={{
                    marginLeft: theme.spacing(3),
                    marginTop: theme.spacing(1)
                }}
                defaultCollapseIcon={<MapIcon/>}
                expanded={["1", "2"]}
                selected={[]}>
                <TreeItem nodeId="1" label="Selected map">
                    <TreeItem nodeId="2" label={props.map ? props.map : "Random"}/>
                </TreeItem>
            </TreeView>
            <TreeView
                className={classes.treeView}
                style={{
                    marginLeft: theme.spacing(3),
                    marginTop: theme.spacing(1)
                }}
                defaultCollapseIcon={<AdbIcon/>}
                expanded={["1", "2", "3", "4"]}
                selected={[]}>
                <TreeItem nodeId="1" label="Agents">
                    {props.mode === PLAYER_VS_AGENT && props.bot &&
                    <TreeItem nodeId="2" label={props.bot.name}/>}
                    {props.mode === AGENT_VS_AGENT && props.bot1 &&
                    <TreeItem nodeId="3" label={props.bot1.name}/>}
                    {props.mode === AGENT_VS_AGENT && props.bot2 &&
                    <TreeItem nodeId="4" label={props.bot2.name}/>}
                </TreeItem>
            </TreeView>
            <TreeView
                className={classes.treeView}
                style={{
                    marginLeft: theme.spacing(3),
                    marginTop: theme.spacing(1)
                }}
                defaultCollapseIcon={<DnsIcon/>}
                expanded={["1", "2", "3", "4", "5", "6"]}
                selected={[]}>
                <TreeItem nodeId="1" label="Workgroups">
                    <TreeItem nodeId="2" label={props.workgroups[0].workstation.name}>
                        <TreeItem nodeId="3" label={props.workgroups[0].id}/>
                        {props.workgroups.length > 1 &&
                        props.workgroups[0].workstation.id === props.workgroups[1].workstation.id &&
                        <TreeItem nodeId="4" label={props.workgroups[1].id}/>}
                    </TreeItem>
                    {props.workgroups.length > 1 &&
                    props.workgroups[0].workstation.id !== props.workgroups[1].workstation.id &&
                    <TreeItem nodeId="5" label={props.workgroups[1].workstation.name}>
                        <TreeItem nodeId="6" label={props.workgroups[1].id}/>
                    </TreeItem>}
                </TreeItem>
            </TreeView>
            <Button className={classes.button}
                    onClick={props.onBack}
                    startIcon={<ArrowBackIcon>back</ArrowBackIcon>}>
                Back
            </Button>
            <Button className={classes.button}
                    onClick={props.onSubmit}
                    endIcon={<CheckIcon>next</CheckIcon>}>
                Finish
            </Button>
        </Fragment>
    )
}

SummaryPanel.propTypes = {
    onSubmit: PropTypes.func,
    onBack: PropTypes.func,
    mode: PropTypes.string,
    bot: PropTypes.any,
    bot1: PropTypes.any,
    bot2: PropTypes.any,
    workgroups: PropTypes.array,
    map: PropTypes.string
}

/*const {loading: userLoading, error: userError, data: userData} = useQuery(Query.CURRENT_USER_QUERY)
if (userLoading) return
    <LoadingPage className={props.className}/>
if (userError) return
    <Error className={props.className} error={userError}/>
*/
function CustomGamePanel(props) {
    const classes = useStyles();
    let history = useHistory();
    const [activeStep, setActiveStep] = useState(0)
    const [gameMode, setGameMode] = useState(PLAYER_VS_AGENT)
    const [entrance, setEntrance] = useState(false)
    const [bot, setBot] = useState('')
    const [bot1, setBot1] = useState('')
    const [bot2, setBot2] = useState('')
    const [botValid, setBotValid] = useState(false)
    const [bot1Valid, setBot1Valid] = useState(false)
    const [bot2Valid, setBot2Valid] = useState(false)
    const [workgroups, setWorkgroups] = useState([])
    const [map, setMap] = useState(0);
    const [createPvEGame, {loading: createPvELoading, error: createPvEError}] = useMutation(Query.CREATE_PLAYER_VS_BOT_GAME);
    const [createEvEGame, {loading: createEvELoading, error: createEvEError}] = useMutation(Query.CREATE_BOT_VS_BOT_GAME);

    const resetBotValues = () => {
        const checkBot = botData && botData.bots.length
        const checkBot1 = bot1Data && bot1Data.bots.length
        const checkBot2 = bot2Data && bot2Data.bots.length

        if (checkBot) {
            setBotValid(true)
            setBot(botData.bots[0].name)
        }
        if (checkBot1) {
            setBot1Valid(bot2Valid ? bot1Data.bots[0].name !== bot2Data.bots[0].name : true)
            setBot1(bot1Data.bots[0].name)
        }
        if (checkBot2) {
            setBot2Valid(bot1Valid ? bot1Data.bots[0].name !== bot2Data.bots[0].name : true)
            setBot2(bot2Data.bots[0].name)
        }
    }

    const [getBot, {loading: botLoading, data: botData, error: botError}] =
        useLazyQuery(Query.BOTS_QUERY, {onCompleted: resetBotValues});
    const [getBot1, {loading: bot1Loading, data: bot1Data, error: bot1Error}] =
        useLazyQuery(Query.BOTS_QUERY, {onCompleted: resetBotValues});
    const [getBot2, {loading: bot2Loading, data: bot2Data, error: bot2Error}] =
        useLazyQuery(Query.BOTS_QUERY, {onCompleted: resetBotValues});

    const [typingTimeout, setTypingTimeout] = useState(0)

    useEffect(() => {
        setEntrance(true)
    }, [])

    const botGetters = {
        bot: getBot,
        bot1: getBot1,
        bot2: getBot2,
    }

    const botSetters = {
        bot: [setBotValid, setBot],
        bot1: [setBot1Valid, setBot1],
        bot2: [setBot2Valid, setBot2],
    }

    const handleGameModeChanged = e => {
        setGameMode(e.target.value)
    }

    const handleMapChange = (event) => {
        setMap(event.target.value);
    };

    const handleNext = e => {
        e.preventDefault()
        setActiveStep(activeStep + 1)
    }
    const handleBack = e => {
        setActiveStep(activeStep - 1)
    }

    const handleTypingStopped = e => {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        const search = botGetters[e.target.id]
        const value = e.target.value
        botSetters[e.target.id][0](false)
        botSetters[e.target.id][1](value)

        if (value !== '') {
            setTypingTimeout(setTimeout(() => {
                search({variables: {filterName: value}})
            }, 500))
        }
    }

    const handleWorkgroupSelected = workgroup => {
        const idx = workgroups.findIndex(w => w.id === workgroup.id)
        if (idx === -1) {
            setWorkgroups([...workgroups, workgroup])
            return
        }
        setWorkgroups([...workgroups.slice(0, idx), ...workgroups.slice(idx + 1)])
    }

    const createGame = e => {
        e.preventDefault()
        if (gameMode === PLAYER_VS_AGENT) {
            createPvEGame({variables: {map: map ? map : null, bot: botData.bots[0].id, workgroup: workgroups[0].id}})
                .then(req => {
                    history.push(`/game/${req.data.createGamePlayerVsBot.id}`)
                }).catch(e => {
                console.log(e.message)
            })
        } else {
            createEvEGame({
                variables: {
                    map: map ? map : null,
                    bot1: bot1Data.bots[0].id,
                    bot2: bot2Data.bots[0].id,
                    workgroup1: workgroups[0].id,
                    workgroup2: workgroups[1].id
                }
            }).then(req => {
                history.push(`/watch/${req.data.createGameBotVsBot.id}`)
            }).catch(e => {
                console.log(e.message)
            })
        }
    }

    if (createPvELoading || createPvELoading) return (
        <Paper className={classes.root} style={{textAlign: "center"}}>
            <CircularProgress/>
        </Paper>)
    if (createPvEError) return <Error className={props.className} error={createPvEError}/>
    if (createEvEError) return <Error className={props.className} error={createEvEError}/>

    return (
        <Zoom in={entrance} mountOnEnter unmountOnExit>
            <Paper className={classes.root}>
                <Stepper activeStep={activeStep}
                         alternativeLabel
                         className={classes.stepper}>
                    {["Select game mode", "Select agent", "Select resources"].map((label, index) => {
                        const stepProps = {};
                        const labelProps = {};
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>{label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                <div className={classes.content}>
                    {activeStep === 0 &&
                    <SelectGameModePanel value={gameMode}
                                         map={map}
                                         handleMapChange={handleMapChange}
                                         onGameModeChanged={handleGameModeChanged}
                                         onSubmit={handleNext}/>}
                    {activeStep === 1 &&
                    <SelectGameAgentPanel mode={gameMode}
                                          bot={bot}
                                          bot1={bot1}
                                          bot2={bot2}
                                          botLoading={botLoading}
                                          bot1Loading={bot1Loading}
                                          bot2Loading={bot2Loading}
                                          botError={botError || (botData && !botValid) ? "Invalid agent name" : null}
                                          bot1Error={bot1Error || (bot1Data && !bot1Valid) ? "Invalid agent name" : null}
                                          bot2Error={bot2Error || (bot2Data && !bot2Valid) ? "Invalid agent name" : null}
                                          botValid={botValid}
                                          bot1Valid={bot1Valid}
                                          bot2Valid={bot2Valid}
                                          onValueChanged={handleTypingStopped}
                                          onBack={handleBack}
                                          onSubmit={handleNext}/>}
                    {activeStep === 2 &&
                    <SelectResourcesPanel onSubmit={handleNext}
                                          onBack={handleBack}
                                          mode={gameMode}
                                          onWorkgroupSelected={handleWorkgroupSelected}
                                          selectedWorkgroups={workgroups}/>}
                    {activeStep === 3 &&
                    <SummaryPanel onBack={handleBack}
                                  mode={gameMode}
                                  map={map}
                                  bot={botData ? botData.bots[0] : null}
                                  bot1={bot1Data ? bot1Data.bots[0] : null}
                                  bot2={bot2Data ? bot2Data.bots[0] : null}
                                  workgroups={workgroups}
                                  onSubmit={createGame}/>}
                </div>
            </Paper>
        </Zoom>
    );
}

CustomGamePanel.propTypes = {
    className: PropTypes.string
}

export default CustomGamePanel