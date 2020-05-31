async function isBot(parent, args, context) {
    return !!await context.prisma.agent({id: parent.id}).script()
}

async function gamesPlayed(parent, args, context) {
    return await context.prisma.gamesConnection({
            where: {
                host: {
                    id: parent.id
                },
                status: "ENDED"
            }
        }).aggregate().count()
        + await context.prisma.gamesConnection({
            where: {
                guest: {
                    id: parent.id
                },
                status: "ENDED"
            }
        }).aggregate().count()
}

function gamesWon(parent, args, context) {
    return context.prisma.gamesConnection({
        where: {
            winner: {
                id: parent.id
            }
        }
    }).aggregate().count()
}

async function gamesDraw(parent, args, context) {
    return await context.prisma.gamesConnection({
            where: {
                host: {
                    id: parent.id
                },
                status: "ENDED",
                winner: null
            }
        }).aggregate().count()
        + await context.prisma.gamesConnection({
            where: {
                guest: {
                    id: parent.id
                },
                status: "ENDED",
                winner: null
            }
        }).aggregate().count()
}

async function gamesLost(parent, args, context) {
    return await gamesPlayed(parent, args, context)
        - await gamesWon(parent, args, context)
        - await gamesDraw(parent, args, context)
}


module.exports = {
    isBot,
    gamesPlayed,
    gamesWon,
    gamesDraw,
    gamesLost
}