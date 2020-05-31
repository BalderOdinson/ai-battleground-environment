import React, {Component, Fragment} from 'react';
import {makeStyles} from "@material-ui/core/styles";
import PropTypes from 'prop-types'
import Typography from "@material-ui/core/Typography";


const useStyles = makeStyles(theme => ({
    error: {
        margin: theme.spacing(1),
        color: theme.palette.error.main
    }
}));

export const getErrorString = error => {
    if (error.graphQLErrors && error.graphQLErrors.length) {
        return error.graphQLErrors[0].message
    } else if (error.networkError && error.networkError.result) {
        return error.networkError.result.errors[0]
    } else if(error.networkError) {
        return error.networkError.message
    }
    else {
        return error
    }
}

function Error(props) {
    const classes = useStyles(props);
    let renderQLErrors = false
    let renderNetworkErrors = false
    let renderErrorMessage = false

    if (props.error.graphQLErrors && props.error.graphQLErrors.length) {
        renderQLErrors = true
    } else if (props.error.networkError) {
        renderNetworkErrors = true
    } else {
        renderErrorMessage = true
    }

    return (
        <Fragment>
            {renderQLErrors && props.error.graphQLErrors.map(({message}, i) => (
                <Typography key={i} className={classes.error}> {message} </Typography>
            ))}
            {renderNetworkErrors && props.error.networkError.result && props.error.networkError.result.errors.map(({message}, i) => (
                <Typography key={i} className={classes.error}> {message} </Typography>
            ))}
            {renderNetworkErrors && !props.error.networkError.result &&
            <Typography className={classes.error}> {props.error.networkError.message} </Typography>}
            {renderErrorMessage &&
            <Typography className={classes.error}> {props.error} </Typography>}
        </Fragment>
    );
}

export default Error;