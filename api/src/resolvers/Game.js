async function createdAt(parent, args, context) {
    return (await context.prisma.game({id: parent.id}).createdAt()).toString()
}

function map(parent, args, context) {
    return context.prisma.game({id: parent.id}).map()
}

function host(parent, args, context) {
    return context.prisma.game({id: parent.id}).host()
}

function guest(parent, args, context) {
    return context.prisma.game({id: parent.id}).guest()
}

function winner(parent, args, context) {
    return context.prisma.game({id: parent.id}).winner()
}

function moves(parent, args, context) {
    return context.prisma.game({id: parent.id}).moves()
}

function state(parent, args, context) {
    return context.prisma.game({id: parent.id}).state()
}

module.exports = {
    createdAt,
    map,
    host,
    guest,
    winner,
    moves,
    state
}