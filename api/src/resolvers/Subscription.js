function trackGameStatusSubscribe(parent, args, context, info) {
    return context.prisma.$subscribe.game({
        mutation_in: ["CREATED", "UPDATED"],
        node: {
            id: args.id,
        },
    }).node()
}

function trackWorkgroupStatusSubscribe(parent, args, context, info) {
    return context.prisma.$subscribe.workgroup({
        mutation_in: ["CREATED", "UPDATED"]
    }).node()
}

function trackGamesSubscribe(parent, args, context, info) {
    return context.prisma.$subscribe.game({
        mutation_in: ["CREATED", "UPDATED"],
    }).node()
}

const trackGameStatus = {
    subscribe: trackGameStatusSubscribe,
    resolve: payload => {
        return payload
    },
}

const trackWorkgroupStatus = {
    subscribe: trackWorkgroupStatusSubscribe,
    resolve: payload => {
        return payload
    },
}

const trackGames = {
    subscribe: trackGamesSubscribe,
    resolve: payload => {
        return payload
    },
}

module.exports = {
    trackGameStatus,
    trackWorkgroupStatus,
    trackGames
}