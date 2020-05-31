import React, {Component} from 'react';
import {Redirect, Route} from "react-router-dom";
import gql from "graphql-tag";
import {useQuery} from "@apollo/react-hooks";

const IS_LOGGED_IN = gql`
    query IsUserLoggedIn {    
        isLoggedIn @client  
    }`;

function PrivateRoute({children, ...rest}) {
    const { data } = useQuery(IS_LOGGED_IN);
    return (
        <Route
            {...rest}
            render={({location}) =>
                data.isLoggedIn ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: "/login",
                            state: {from: location}
                        }}
                    />
                )
            }
        />
    );
}

export default PrivateRoute;