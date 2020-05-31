function game(parent, args, context) {
    return context.prisma.move({id: parent.id}).game()
}

function player(parent, args, context) {
    return context.prisma.move({id: parent.id}).player()
}

function action(parent, args, context) {
    return context.prisma.move({id: parent.id}).action()
}

function state(parent, args, context) {
    return context.prisma.move({id: parent.id}).state()
}

module.exports = {
    game,
    player,
    action,
    state
}