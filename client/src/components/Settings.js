import React, {Component, Fragment, useEffect, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import Typography from "@material-ui/core/Typography";
import {Paper} from "@material-ui/core";
import clsx from "clsx";
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import {useHistory} from "react-router-dom";
import {useLazyQuery, useMutation, useQuery} from "@apollo/react-hooks";
import * as Query from "../constants/query";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import AgentAvatar from "./AgentAvatar";
import IconButton from "@material-ui/core/IconButton";
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import Zoom from "@material-ui/core/Zoom";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Skeleton from "@material-ui/lab/Skeleton";
import DnsIcon from "@material-ui/icons/Dns";
import AdbIcon from "@material-ui/icons/Adb";
import InputAdornment from "@material-ui/core/InputAdornment";
import CloseIcon from "@material-ui/icons/Close";
import CheckIcon from "@material-ui/icons/Check";
import TextField from "@material-ui/core/TextField";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import Snackbar from "@material-ui/core/Snackbar";


const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        backgroundColor: theme.palette.background.default,
        margin: "auto",
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(2),
    },
    paddingDiv: {
        margin: theme.spacing(2),
        "&>*": {
            marginTop: theme.spacing(2)
        }
    },
    heading: {
        marginLeft: theme.spacing(1)
    },
    rowSpan: {
        display: "block"
    },
    rootForm: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    input: {
        width: 42,
    },
    button: {
        margin: theme.spacing(1),
        marginRight: 0,
        marginBottom: 0
    },
    deleteButton: {
        margin: theme.spacing(1),
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,
        "&:hover": {
            backgroundColor: theme.palette.error.dark,
        }
    }
}));

function Settings(props) {
    const classes = useStyles(props);
    const theme = useTheme()
    const [addBot, {loading: botLoading, error: botError}] = useMutation(Query.ADD_BOT)
    const [addWorkstation, {loading: addWorkstationLoading, error: addWorkstationError}] = useMutation(Query.ADD_WORKSTATION)
    const [updateWorkstation, {loading: updateWorkstationLoading, error: updateWorkstationError}] = useMutation(Query.UPDATE_WORKSTATION)
    const [removeWorkstation, {loading: removeWorkstationLoading, error: removeWorkstationError}] = useMutation(Query.REMOVE_WORKSTATION)

    const [entrance, setEntrance] = useState(false)
    const [expandedWorkstation, setExpandedWorkstation] = useState(false);
    const [expandedAgent, setExpandedAgent] = useState(false);
    const [workstation, setWorkstation] = useState('')
    const [workstationFound, setWorkstationFound] = useState(false)
    const [workstationUrl, setWorkstationUrl] = useState('')
    const [workgroupsAmount, setWorkgroupsAmount] = useState(0)
    const [bot, setBot] = useState('')
    const [script, setScript] = useState('')
    const [cls, setCls] = useState('')
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')

    const [getWorkstation, {loading: workstationLoading, data: workstationData, error: workstationError}] =
        useLazyQuery(Query.WORKSTATIONS_QUERY, {
            onCompleted: d => {
                if (d && d.workstations.length) {
                    setWorkstationFound(true)
                    setWorkstation(d.workstations[0].name)
                    setWorkstationUrl(d.workstations[0].url)
                    setWorkgroupsAmount(Math.round(Math.log2(d.workstations[0].workgroups.length) * 10) / 10)
                }
            }
        });

    const handleWorkstationExpandChange = () => {
        setExpandedWorkstation(!expandedWorkstation);
    };
    const handleAgentExpandChange = () => {
        setExpandedAgent(!expandedAgent);
    };
    const handleUrlChange = e => {
        setWorkstationUrl(e.target.value)
    }
    const handleWorkgroupsAmount = (e, v) => {
        setWorkgroupsAmount(v)
    }

    const handleSnackbar = (e, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    }

    const handleUpdateWorkstation = e => {
        e.preventDefault()
        const amount = Math.round(workgroupsAmount ? 2 ** workgroupsAmount : 1)
        const upAmount = amount - workstationData.workstations[0].workgroups.length
        updateWorkstation({
            variables: {
                id: workstationData.workstations[0].id,
                url: workstationUrl,
                upAmount: upAmount > 0 ? upAmount : 0,
                downAmount: upAmount < 0 ? -upAmount : 0
            }
        }).then(d => {
            setWorkstationFound(false)
            setWorkstation('')
            setWorkgroupsAmount(0)
            setWorkstationUrl('')
            setMessage('Updated successfully')
            setOpen(true)
        }).catch(e => console.log(e.message))
    }
    const handleRemoveWorkstation = () => {
        removeWorkstation({
            variables: {
                id: workstationData.workstations[0].id
            }
        }).then(d => {
            setWorkstationFound(false)
            setWorkstation('')
            setWorkgroupsAmount(0)
            setWorkstationUrl('')
            setMessage('Removed successfully')
            setOpen(true)
        }).catch(e => console.log(e.message))
    }

    const handleAddWorkstation = () => {
        const amount = Math.round(workgroupsAmount ? 2 ** workgroupsAmount : 1)
        addWorkstation({
            variables: {
                name: workstation,
                url: workstationUrl,
                amount
            }
        }).then(d => {
            setWorkstationFound(false)
            setWorkstation('')
            setWorkgroupsAmount(0)
            setWorkstationUrl('')
            setMessage('Added successfully')
            setOpen(true)
        }).catch(e => console.log(e.message))
    }

    const handleWorkstationChange = e => {
        setWorkstationFound(false)
        setWorkstation(e.target.value)
    }

    const handleFocusChange = e => {
        if (workstation !== '') {
            getWorkstation({variables: {filterName: workstation}})
        }
    }

    const handleBotChange = e => {
        setBot(e.target.value)
    }

    const handleScriptChange = e => {
        setScript(e.target.value)
    }

    const handleClsChange = e => {
        setCls(e.target.value)
    }

    const handleAddBot = e => {
        e.preventDefault()
        addBot({
            variables: {
                name: bot,
                script,
                className: cls
            }
        }).then(d => {
            setBot('')
            setScript('')
            setCls('')
            setMessage('Added successfully')
            setOpen(true)
        })
    }

    useEffect(() => {
        setEntrance(true)
    }, [])


    return (
        <Zoom in={entrance} mountOnEnter unmountOnExit>
            <Paper className={classes.root}>
                <div className={classes.paddingDiv}>
                    <ExpansionPanel expanded={expandedWorkstation}
                                    onChange={handleWorkstationExpandChange}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <DnsIcon/>
                            <Typography className={classes.heading}>Workstation options</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <form className={classes.rootForm} onSubmit={handleUpdateWorkstation}>
                                <TextField label="Workstation name"
                                           value={workstation}
                                           className={classes.rowSpan}
                                           onChange={handleWorkstationChange}
                                           onBlur={handleFocusChange}
                                           InputProps={{
                                               endAdornment: (
                                                   <InputAdornment position="end">
                                                       {!workstationFound && workstation !== '' && <AddIcon/>}
                                                       {workstationFound && <CheckIcon/>}
                                                       {workstationLoading && <CircularProgress/>}
                                                   </InputAdornment>
                                               ),
                                           }}/>
                                <TextField label="Workstation url"
                                           value={workstationUrl}
                                           className={classes.rowSpan}
                                           onChange={handleUrlChange}/>
                                <FormControl style={{width: "100%"}}>
                                    <FormHelperText>Number of available workgroups</FormHelperText>
                                    <Slider value={workgroupsAmount}
                                            valueLabelDisplay="auto"
                                            step={0.1}
                                            scale={(x) => Math.round(x ? 2 ** x : 1)}
                                            min={0}
                                            max={10}
                                            onChange={handleWorkgroupsAmount}/>
                                </FormControl>
                                {workstationFound &&
                                <div>
                                    <Button className={classes.deleteButton}
                                            disabled={!workstationFound}
                                            onClick={handleRemoveWorkstation}
                                            variant="contained"
                                            startIcon={<DeleteIcon>delete</DeleteIcon>}>
                                        Delete
                                    </Button>
                                    <Button className={classes.button}
                                            disabled={!workstationFound}
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            endIcon={<ArrowUpwardIcon>update</ArrowUpwardIcon>}>
                                        Update
                                    </Button>
                                </div>}
                                {!workstationFound &&
                                <Button className={classes.button}
                                        disabled={workstation === '' || workstationUrl === ''}
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddWorkstation}
                                        endIcon={<AddIcon>add</AddIcon>}>
                                    Add
                                </Button>}
                            </form>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    <ExpansionPanel expanded={expandedAgent}
                                    onChange={handleAgentExpandChange}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <AdbIcon/>
                            <Typography className={classes.heading}>Agent options</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <form className={classes.rootForm} onSubmit={handleAddBot}>
                                <TextField label="Agent name"
                                           value={bot}
                                           className={classes.rowSpan}
                                           onChange={handleBotChange}/>
                                <TextField label="Script"
                                           value={script}
                                           className={classes.rowSpan}
                                           onChange={handleScriptChange}/>
                                <TextField label="Class name"
                                           value={cls}
                                           className={classes.rowSpan}
                                           onChange={handleClsChange}/>
                                <Button className={classes.button}
                                        disabled={bot === '' || script === '' || cls === ''}
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddBot}
                                        endIcon={<AddIcon>add</AddIcon>}>
                                    Add
                                </Button>
                            </form>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    <Snackbar anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                              open={open}
                              autoHideDuration={4000}
                              onClose={handleSnackbar}
                              message={message}
                              action={
                                  <React.Fragment>
                                      <IconButton size="small"
                                                  color="inherit"
                                                  onClick={handleSnackbar}>
                                          <CloseIcon fontSize="small"/>
                                      </IconButton>
                                  </React.Fragment>
                              }/>
                </div>
            </Paper>
        </Zoom>
    );
}

Settings.propTypes = {
    className: PropTypes.string
}

export default Settings;