const {getUserId} = require('../utils')

async function gamesByPlayer(parent, args, context, info) {
    return (await context.prisma.games({
        where: {
            host: {name: args.player},
            ...args.filterOlderThen && {createdAt_lt: args.filterOlderThen},
            ...args.filterNewerThen && {createdAt_gt: args.filterNewerThen},
            ...args.filterStatus && {status: args.filterStatus},
            ...args.filterWinner && {winner: {id: args.filterWinner}}
        },
        after: args.after,
        first: args.first,
        orderBy: args.orderBy
    })).concat(await context.prisma.games({
        where: {
            guest: {name: args.player},
            ...args.filterOlderThen && {createdAt_lt: args.filterOlderThen},
            ...args.filterNewerThen && {createdAt_gt: args.filterNewerThen},
            ...args.filterStatus && {status: args.filterStatus},
            ...args.filterWinner && {winner: {id: args.filterWinner}}
        },
        after: args.after,
        first: args.first,
        orderBy: args.orderBy
    }))
}

function game(parent, args, context, info) {
    return context.prisma.game({id: args.id})
}

function games(parent, args, context, info) {
    return context.prisma.games({
        where: {
            ...args.ids && {id_in: args.ids},
            ...args.filterStatus && {status: args.filterStatus}
        },
        after: args.after,
        first: args.first,
        orderBy: args.orderBy
    })
}

async function currentUser(parent, args, context, info) {
    const userId = getUserId(context)
    return context.prisma.agent({id: userId})
}

async function user(parent, args, context, info) {
    if (await context.prisma.$exists.agent({
        id: args.id,
        script: null
    }))
        return context.prisma.agent({id: args.id})
    else
        return null
}

async function bot(parent, args, context, info) {
    if (await context.prisma.$exists.agent({
        id: args.id,
        script_not: null
    }))
        return context.prisma.agent({id: args.id})
    else
        return null
}

function bots(parent, args, context, info) {
    return context.prisma.agents({
        where: {
            ...args.filterName && {name_contains: args.filterName},
            script_not: null
        },
        after: args.after,
        first: args.first,
    })
}

function workstation(root, args, context, info) {
    return context.prisma.workstation({id: args.id})
}

function workstations(root, args, context, info) {
    return context.prisma.workstations({
        where: {
            ...args.filterName && {name_contains: args.filterName}
        },
        after: args.after,
        first: args.first,
    })
}

function workgroup(root, args, context, info) {
    return context.prisma.workgroup({id: args.id})
}

function workgroups(root, args, context, info) {
    return context.prisma.workgroups({
        where: {
            busy_not: args.filterAvailable
        },
        after: args.after,
        first: args.first,
    })
}

function maps(root, args, context, info) {
    return context.prisma.gameMaps({
        where: {
            ...args.filterName && {name_contains: args.filterName}
        },
        after: args.after,
        first: args.first,
    })
}

module.exports = {
    gamesByPlayer,
    game,
    games,
    currentUser,
    user,
    bot,
    bots,
    workstation,
    workstations,
    workgroup,
    workgroups,
    maps
}