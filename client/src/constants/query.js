import gql from "graphql-tag";

export const LOGIN_USER = gql`
    mutation LoginUser($username: String!) {
        login(name: $username) {
            token
        }
    }`

export const CURRENT_USER_QUERY = gql`
    query {
        currentUser {
            id
            name
            isBot
            gamesPlayed
            gamesWon
            gamesDraw
            gamesLost
        }
    }`

export const AVAILABLE_MAPS_QUERY = gql`
    query {
        maps {
            id
            name
        }
    }`

export const BOTS_QUERY = gql`
    query botsQuery($filterName: String, $after: ID, $first: Int) {
        bots(filterName: $filterName, after: $after, first: $first) {
            id
            name
        }
    }
`

export const ADD_BOT = gql`
    mutation addBot($name: String!, $script: String!, $className: String!) {
        addBot(name: $name, script: $script, className: $className) {
            id
            name
        }
    }
`

export const GAME_QUERY = gql`
    query game($id: ID!) {
        game(id: $id) {
            id
            gameId
            host {
                id
                name
                isBot
            }
            guest {
                id
                name
                isBot
            }
            playerOneId
            playerTwoId
            status
        }
    }`

export const GAMES_QUERY = gql`
    query fetchGames($ids: [ID!], $filterStatus: GameStatus, $after: ID, $first: Int, $orderBy: GameOrderByInput) {
        games(ids: $ids, filterStatus: $filterStatus,
            after: $after, first: $first, orderBy: $orderBy) {
            id
            gameId
            createdAt
            host {
                id
                name
                isBot
            }
            guest {
                id
                name
                isBot
            }
            playerOneId
            playerTwoId
            map {
                name
            }
            status
            winner {
                id
                name
                isBot
            }
        }
    }`

export const HOST_GAME = gql`
    mutation hostGame($map: String) {
        hostGame(map: $map) {
            id
        }
    }`

export const CREATE_PLAYER_VS_BOT_GAME = gql`
    mutation createPlayerVsBot($map: String, $bot: ID!, $workgroup: ID!) {
        createGamePlayerVsBot(map: $map, bot: $bot, workgroup: $workgroup) {
            id
        }
    }`

export const CREATE_BOT_VS_BOT_GAME = gql`
    mutation createBotVsBot($map: String, $bot1: ID!, $bot2: ID!, $workgroup1: ID!, $workgroup2: ID!) {
        createGameBotVsBot(map: $map, bot1: $bot1, bot2: $bot2, workgroup1: $workgroup1, workgroup2: $workgroup2) {
            id
        }
    }`

export const SUBSCRIBE_GAMES_CHANGE = gql`
    subscription {
        trackGames {
            id
            gameId
            createdAt
            host {
                id
                name
                isBot
            }
            guest {
                id
                name
                isBot
            }
            playerOneId
            playerTwoId
            map {
                name
            }
            status
            winner {
                id
                name
                isBot
            }
        }
    }`

export const SUBSCRIBE_GAME_CHANGE = gql`
    subscription trackGameStatus($id: ID!){
        trackGameStatus(id: $id) {
            id
            gameId
            createdAt
            host {
                id
                name
                isBot
            }
            guest {
                id
                name
                isBot
            }
            playerOneId
            playerTwoId
            map {
                name
            }
            status
            winner {
                id
                name
                isBot
            }
        }
    }`

export const WORKSTATIONS_QUERY = gql`
    query fetchWorkstations($filterName: String, $after: ID, $first: Int) {
        workstations(filterName: $filterName,
            after: $after, first: $first) {
            id
            name
            url
            workgroups {
                id
            }
        }
    }`

export const ADD_WORKSTATION = gql`
    mutation addWorkstation($name: String!, $url: String!, $amount: Int!) {
        addWorkstation(name: $name, url: $url, numberOfWorkgroups: $amount) {
            id
            url
        }
    }`

export const UPDATE_WORKSTATION = gql`
    mutation updateWorkstation($id: ID!, $url: String!, $upAmount: Int!, $downAmount: Int!) {
        updateWorkstation(id: $id, url: $url) {
            id
            url
        }
        scaleUpWorkstation(id: $id, amount: $upAmount) {
            id
            workgroups {
                id
            }
        }
        scaleDownWorkstation(id: $id, amount: $downAmount) {
            id
            workgroups {
                id
            }
        }
    }`

export const REMOVE_WORKSTATION = gql`
    mutation removeWorkstation($id: ID!) {
        removeWorkstation(id: $id) {
            id
        }
    }`

export const WORKGROUPS_QUERY = gql`
    query fetchWorkgroups($filterAvailable: Boolean, $after: ID, $first: Int) {
        workgroups(filterAvailable: $filterAvailable,
            after: $after, first: $first) {
            id
            busy
            workstation {
                id
                name
            }
        }
    }`

export const SUBSCRIBE_WORKGROUP_CHANGE = gql`
    subscription {
        trackWorkgroupStatus {
            id
            busy
            workstation {
                id
                name
            }
        }
    }`


