const express = require('express');
const bodyParser = require('body-parser');
const {GraphQLServer} = require('graphql-yoga')
const {prisma} = require('./generated/prisma-client')
const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')
const Subscription = require('./resolvers/Subscription')
const Agent = require('./resolvers/Agent')
const Game = require('./resolvers/Game')
const Move = require('./resolvers/Move')
const Workgroup = require('./resolvers/Workgroup')
const Workstation = require('./resolvers/Workstation')

const resolvers = {
    Query,
    Mutation,
    Subscription,
    Agent,
    Game,
    Move,
    Workgroup,
    Workstation
}

let gameId = -1

const updateGameId = () => {
    return (gameId += 1)
}

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
    context: request => {
        return {
            gameId: updateGameId,
            ...request,
            prisma,
        }
    },
})
server.start(() => console.log(`Server is running on http://localhost:4000`))