import React, {Component, Fragment, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import GameItem from "./GameItem";
import {useQuery} from '@apollo/react-hooks';
import CircularProgress from "@material-ui/core/CircularProgress";
import Error from "./Error";
import PropTypes from 'prop-types'
import {FixedSizeList as List} from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import * as Query from "../constants/query"
import clsx from "clsx";
import {Paper} from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        display: 'flex'
    },
    progress: {
        margin: "auto",
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    }
}));

const LoadingPage = props => {
    const classes = useStyles()
    return (
        <Paper elevation={0} className={clsx(classes.root, props.className)}>
            <CircularProgress className={classes.progress}/>
        </Paper>
    )
}

const Item = (props) => {
    const classes = useStyles()
    const {index, style, data} = props;
    if (index === data.games.length) return <CircularProgress className={classes.progress}/>
    return <GameItem style={style}
                     key={data.games[index].id}
                     game={data.games[index]}
                     button={data.button}
                     onClick={data.onClick}/>
}

const ListClass = "MuiList-rootMuiList-dense MuiList-padding MuiList-subheader"

function GameList(props) {
    const classes = useStyles()
    const theme = useTheme()
    const [cursor, setCursor] = useState()
    const [hasMore, setHasMore] = useState(false)
    const [fetchMoreError, setFetchMoreError] = useState()
    const [fetchMoreLoading, setFetchMoreLoading] = useState(false)
    const {loading, error, data, fetchMore, subscribeToMore} = useQuery(Query.GAMES_QUERY,
        {
            variables: {
                filterStatus: props.gameStatus,
                ids: props.ids,
                ...props.pageSize && {first: props.pageSize},
                orderBy: props.orderBy
            },
            onCompleted: d => {
                setCursor(data.games.length ?
                    data.games[data.games.length - 1].id : null)
                setHasMore(props.pageSize && data.games.length === props.pageSize)
                subscribeToMore({
                    document: Query.SUBSCRIBE_GAMES_CHANGE,
                    updateQuery: (prev, {subscriptionData}) => {
                        console.log("Entered")
                        if (!subscriptionData.data) return prev;

                        const game = subscriptionData.data.trackGames
                        const idx = prev.games.findIndex(g => g.id === game.id)
                        if (idx === -1) {
                            let shouldAdd = false
                            if (props.gameStatus === game.status) shouldAdd = true;
                            if (props.gameStatus === undefined) shouldAdd = true;

                            if (!shouldAdd) return prev;

                            return {
                                ...prev,
                                games: [
                                    game,
                                    ...prev.games
                                ]
                            }
                        } else {
                            let shouldRemove = true
                            if (props.gameStatus === game.status) shouldRemove = false;
                            if (props.gameStatus === undefined) shouldRemove = false;

                            if (shouldRemove) {
                                return {
                                    ...prev,
                                    games: [
                                        ...prev.games.slice(0, idx), ...prev.games.slice(idx + 1)
                                    ]
                                }
                            } else {
                                return {
                                    ...prev,
                                    games: [
                                        ...prev.games.map((item, index) => {
                                            if (index !== idx) return item;
                                            return game
                                        })
                                    ]
                                }
                            }
                        }
                    }
                })
            }
        });

    if (loading) return <LoadingPage className={props.className}/>
    if (fetchMoreError) return <Error error={fetchMoreError}/>
    if (error) return <Error error={error}/>

    return (
        <AutoSizer>
            {({height, width}) => (
                <InfiniteLoader
                    isItemLoaded={() => fetchMoreLoading}
                    itemCount={data.games.length + hasMore}
                    loadMoreItems={() => {
                        if (!hasMore) return
                        setFetchMoreLoading(true)
                        fetchMore({
                            variables: {
                                after: cursor,
                                filterStatus: props.gameStatus,
                                ids: props.ids,
                                ...props.pageSize && {first: props.pageSize},
                                orderBy: props.orderBy
                            },
                            updateQuery: (prev, {fetchMoreResult, ...rest}) => {
                                setFetchMoreLoading(false)
                                if (!fetchMoreResult) return prev;
                                if (fetchMoreResult.games.length)
                                    setCursor(fetchMoreResult.games[fetchMoreResult.games.length - 1].id)
                                if (fetchMoreResult.games.length < props.pageSize)
                                    setHasMore(false)
                                return {
                                    ...prev,
                                    games: [
                                        ...prev.games,
                                        ...fetchMoreResult.games,
                                    ],
                                };
                            },
                        }).catch(e => {
                            setFetchMoreLoading(false)
                            setFetchMoreError(e)
                        })
                    }}>
                    {({onItemsRendered, ref}) => (
                        <List height={height}
                              width={width}
                              itemSize={180}
                              itemCount={data.games.length}
                              onItemsRendered={onItemsRendered}
                              ref={ref}
                              itemData={{...data, button: props.active, onClick: props.onClick}}
                              className={clsx(ListClass, classes.root, props.className)}>
                            {Item}
                        </List>
                    )}
                </InfiniteLoader>
            )}
        </AutoSizer>
    );
}

GameList.propTypes = {
    className: PropTypes.string,
    gameStatus: PropTypes.string,
    pageSize: PropTypes.number,
    orderBy: PropTypes.string,
    ids: PropTypes.arrayOf(PropTypes.string),
    active: PropTypes.bool,
    onClick: PropTypes.func
}

export default GameList;