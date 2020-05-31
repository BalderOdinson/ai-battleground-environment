function workgroups(parent, args, context) {
    return context.prisma.workstation({id: parent.id}).workgroups()
}

module.exports = {
    workgroups,
}