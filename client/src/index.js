import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import {ApolloProvider} from '@apollo/react-hooks';
import {ApolloClient} from 'apollo-client';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {createHttpLink, HttpLink} from 'apollo-link-http';
import {setContext} from "apollo-link-context";
import {BrowserRouter as Router} from "react-router-dom";
import {MuiThemeProvider} from "@material-ui/core/styles";
import {AUTH_TOKEN} from "./constants/auth";
import Mutation from "./resolvers/Mutation";
import {typeDefs} from "./schema";
import {WebSocketLink} from "apollo-link-ws";
import {split} from "apollo-link";
import {getMainDefinition} from "apollo-utilities";


const httpLink = createHttpLink({
    uri: process.env.REACT_APP_HTTP_SERVER_URL
});

const authLink = setContext((_, {headers}) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem(AUTH_TOKEN);
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    }
});

const wsLink = new WebSocketLink({
    uri: process.env.REACT_APP_WS_SERVER_URL,
    options: {
        reconnect: true,
        connectionParams: {
            authToken: localStorage.getItem(AUTH_TOKEN),
        }
    }
})

const link = split(
    ({ query }) => {
        const { kind, operation } = getMainDefinition(query)
        return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    authLink.concat(httpLink)
)

const cache = new InMemoryCache()

const client = new ApolloClient({
    cache: cache,
    link: link,
    typeDefs,
    resolvers: {
        Mutation
    }
})

cache.writeData({
    data: {
        isLoggedIn: !!localStorage.getItem(AUTH_TOKEN),
    },
});

ReactDOM.render(
    <React.StrictMode>
        <Router>
            <ApolloProvider client={client}>
                <App/>
            </ApolloProvider>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
