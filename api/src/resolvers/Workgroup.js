function workstation(parent, args, context) {
    return context.prisma.workgroup({id: parent.id}).workstation()
}

module.exports = {
    workstation
}