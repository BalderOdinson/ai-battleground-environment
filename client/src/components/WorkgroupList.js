import React, {Component, Fragment, useState} from 'react';
import {makeStyles, useTheme} from "@material-ui/core/styles";
import Workgroup from "./Workgroup";
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
    if (index === data.workgroups.length) return <CircularProgress className={classes.progress}/>
    return <Workgroup style={style}
                      key={data.workgroups[index].id}
                      workgroup={data.workgroups[index]}
                      button={data.button}
                      select={data.select}
                      selectedItems={data.selectedItems}
                      onClick={data.onClick}/>
}

const ListClass = "MuiList-rootMuiList-dense MuiList-padding MuiList-subheader"

function WorkgroupList(props) {
    const classes = useStyles()
    const theme = useTheme()
    const [cursor, setCursor] = useState()
    const [hasMore, setHasMore] = useState(false)
    const [fetchMoreError, setFetchMoreError] = useState()
    const [fetchMoreLoading, setFetchMoreLoading] = useState(false)
    const {loading, error, data, fetchMore, subscribeToMore} = useQuery(Query.WORKGROUPS_QUERY,
        {
            variables: {
                filterAvailable: props.available,
                ...props.pageSize && {first: props.pageSize}
            },
            onCompleted: d => {
                setCursor(data.workgroups.length ?
                    data.workgroups[data.workgroups.length - 1].id : null)
                setHasMore(props.pageSize && data.workgroups.length === props.pageSize)
                subscribeToMore({
                    document: Query.SUBSCRIBE_WORKGROUP_CHANGE,
                    updateQuery: (prev, {subscriptionData}) => {
                        if (!subscriptionData.data) return prev;

                        const workgroup = subscriptionData.data.trackWorkgroupStatus
                        const idx = prev.workgroups.findIndex(w => w.id === workgroup.id)
                        if (idx === -1) {
                            let shouldAdd = false
                            if (props.available && !workgroup.busy) shouldAdd = true;
                            if (!props.available && workgroup.busy) shouldAdd = true;
                            if (props.available === undefined) shouldAdd = true;

                            if (!shouldAdd) return prev;

                            return {
                                ...prev,
                                workgroups: [
                                    workgroup,
                                    ...prev.workgroups
                                ]
                            }
                        } else {
                            let shouldRemove = true
                            if (props.available && !workgroup.busy) shouldRemove = false;
                            if (!props.available && workgroup.busy) shouldRemove = false;
                            if (props.available === undefined) shouldRemove = false;

                            if (shouldRemove) {
                                return {
                                    ...prev,
                                    workgroups: [
                                        ...prev.workgroups.slice(0, idx), ...prev.workgroups.slice(idx + 1)
                                    ]
                                }
                            } else {
                                return {
                                    ...prev,
                                    workgroups: [
                                        ...prev.workgroups.map((item, index) => {
                                            if (index !== idx) return item;
                                            return workgroup
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
                    itemCount={data.workgroups.length + hasMore}
                    loadMoreItems={() => {
                        if (!hasMore) return
                        setFetchMoreLoading(true)
                        fetchMore({
                            variables: {
                                after: cursor,
                                ...props.pageSize && {first: props.pageSize},
                                ...props.available && {filterAvailable: props.available},
                            },
                            updateQuery: (prev, {fetchMoreResult, ...rest}) => {
                                setFetchMoreLoading(false)
                                if (!fetchMoreResult) return prev;
                                if (fetchMoreResult.workgroups.length)
                                    setCursor(fetchMoreResult.workgroups[fetchMoreResult.workgroups.length - 1].id)
                                if (fetchMoreResult.workgroups.length < props.pageSize)
                                    setHasMore(false)
                                return {
                                    ...prev,
                                    workgroups: [
                                        ...prev.workgroups,
                                        ...fetchMoreResult.workgroups,
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
                              itemSize={66}
                              itemCount={data.workgroups.length}
                              onItemsRendered={onItemsRendered}
                              ref={ref}
                              itemData={{
                                  ...data,
                                  button: props.active,
                                  onClick: props.onClick,
                                  select: props.select,
                                  selectedItems: props.selectedItems
                              }}
                              className={clsx(ListClass, classes.root, props.className)}>
                            {Item}
                        </List>
                    )}
                </InfiniteLoader>
            )}
        </AutoSizer>
    );
}

WorkgroupList.propTypes = {
    className: PropTypes.string,
    available: PropTypes.bool,
    pageSize: PropTypes.number,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    select: PropTypes.bool,
    selectedItems: PropTypes.arrayOf(PropTypes.string)
}

export default WorkgroupList;