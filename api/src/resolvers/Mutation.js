const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {
    APP_SECRET, getUserId, checkApiKey, getRandomInt,
    workstationHandshake,
    mapActionEnumToActionCommand, mapActionCommandToActionEnum,

} = require('../utils')
const request = require('request-promise');

const GAME_ENDED_MSG = "Game has finished"

async function login(parent, args, context) {
    let user = await context.prisma.agent({name: args.name})
    if (!user) {
        user = await context.prisma.createAgent({name: args.name})
    }

    const token = jwt.sign({userId: user.id}, APP_SECRET)

    return {
        token,
        user,
    }
}

async function hostGame(parent, args, context) {
    const userId = getUserId(context)

    if (!args.map) {
        const maps = await context.prisma.gameMaps()
        const mapsCount = maps.length
        args.map = maps[getRandomInt(0, mapsCount - 1)].name
    }

    const firstPlayer = getRandomInt(0, 1)

    const gameId = context.gameId()

    await request({
        uri: `${process.env.GAME_SERVER_URL}/admin/createGame?gameId=${gameId}&playerOne=0&playerTwo=1&mapName=${args.map}`
    })

    return context.prisma.createGame({
        host: {connect: {id: userId}},
        gameId,
        map: {connect: {name: args.map}},
        playerOneId: firstPlayer === 0 ? userId : undefined,
        playerTwoId: firstPlayer === 1 ? userId : undefined
    })
}

async function joinGame(parent, args, context) {
    const userId = getUserId(context)

    const fragment = `
    fragment OpenGame on Game {
        status
        host {
            id
        }
        playerOneId
    }`

    const game = await context.prisma.game({id: args.id}).$fragment(fragment)

    if (game.status !== "OPEN")
        throw new Error('Can not join game that is not in opened state')
    if (game.host.id === userId)
        throw new Error('Can not join game that is hosted by same player')

    return context.prisma.updateGame({
        data: {
            guest: {connect: {id: userId}},
            status: "READY",
            playerOneId: game.playerOneId ? undefined : userId,
            playerTwoId: game.playerOneId ? userId : undefined
        },
        where: {id: args.id}
    })
}

async function rejoinGame(parent, args, context) {
    const userId = getUserId(context)

    const fragment = `
        fragment StartGame on Game {
            gameId
            status
            playerOneId
            playerTwoId
        }`
    const game = await context.prisma.game({id: args.id}).$fragment(fragment)

    if (game && (game.playerOneId === userId || game.playerTwoId === userId) && game.status === 'IN_PLAY') {
        let req
        if (game.playerOneId === userId && game.status === 'IN_PLAY') {
            req = await request({
                uri: `${process.env.GAME_SERVER_URL}/game/play?playerId=0&gameId=${game.gameId}`,
                json: true
            })

        } else {
            req = await request({
                uri: `${process.env.GAME_SERVER_URL}/game/play?playerId=1&gameId=${game.gameId}`,
                json: true
            })
        }
        const {map, player1, player2} = req.result
        player1.lastAction = player1.lastAction ? mapActionCommandToActionEnum[player1.lastAction] : null
        player2.lastAction = player2.lastAction ? mapActionCommandToActionEnum[player2.lastAction] : null
        map.tiles = [].concat(...map.tiles)

        return context.prisma.updateGame({
            data: {
                status: game.playerTwoId === userId ? "IN_PLAY" : undefined,
                state: {
                    create: {
                        playerTurn: userId,
                        map: {
                            create: {
                                tiles: {create: map.tiles},
                                width: map.width / 2,
                                height: map.height
                            }
                        },
                        player1: {
                            create: {
                                x: player1.x,
                                y: player1.y,
                                type: player1.type,
                                morphItems: {set: player1.morphItems},
                                health: player1.health,
                                lives: player1.lives,
                                lastAction: player1.lastAction
                            }
                        },
                        player2: {
                            create: {
                                x: player2.x,
                                y: player2.y,
                                type: player2.type,
                                morphItems: {set: player2.morphItems},
                                health: player2.health,
                                lives: player2.lives,
                                lastAction: player2.lastAction
                            }
                        }
                    }
                }
            },
            where: {
                id: args.id
            }
        })
    } else {
        throw new Error('Can not join game that is not in valid state')
    }
}

async function startGame(parent, args, context) {
    const userId = getUserId(context)

    const fragment = `
        fragment StartGame on Game {
            gameId
            status
            host {
                id
            }
            guest {
                id
            }
            playerOneId
            playerTwoId
        }`
    const game = await context.prisma.game({id: args.id}).$fragment(fragment)

    if (game && (game.host.id === userId || game.guest.id === userId) && game.status === 'READY') {
        let req = null
        if (game.playerOneId === userId) {
            req = await request({
                uri: `${process.env.GAME_SERVER_URL}/game/play?playerId=0&gameId=${game.gameId}`,
                json: true
            })
        } else {
            req = await request({
                uri: `${process.env.GAME_SERVER_URL}/game/play?playerId=1&gameId=${game.gameId}`,
                json: true
            })
        }

        const {map, player1, player2} = req.result
        player1.lastAction = player1.lastAction ? mapActionCommandToActionEnum[player1.lastAction] : null
        player2.lastAction = player2.lastAction ? mapActionCommandToActionEnum[player2.lastAction] : null
        map.tiles = [].concat(...map.tiles)

        return context.prisma.updateGame({
            data: {
                status: game.playerTwoId === userId ? "IN_PLAY" : undefined,
                state: {
                    create: {
                        playerTurn: userId,
                        map: {
                            create: {
                                tiles: {create: map.tiles},
                                width: map.width / 2,
                                height: map.height
                            }
                        },
                        player1: {
                            create: {
                                x: player1.x,
                                y: player1.y,
                                type: player1.type,
                                morphItems: {set: player1.morphItems},
                                health: player1.health,
                                lives: player1.lives,
                                lastAction: player1.lastAction
                            }
                        },
                        player2: {
                            create: {
                                x: player2.x,
                                y: player2.y,
                                type: player2.type,
                                morphItems: {set: player2.morphItems},
                                health: player2.health,
                                lives: player2.lives,
                                lastAction: player2.lastAction
                            }
                        }
                    }
                }
            },
            where: {
                id: args.id
            }
        })
    } else {
        throw new Error('Can not start game that is not in ready state')
    }
}

async function leaveGame(parent, args, context) {
    const userId = getUserId(context)

    const fragment = `
        fragment StartGame on Game {
            gameId
            status
            host {
                id
            }
            guest {
                id
            }
            playerOneId
            playerTwoId
        }`
    const game = await context.prisma.game({id: args.id}).$fragment(fragment)

    if (game && game.host.id === userId && (game.status !== "CLOSED" || game.status !== "ENDED")) {
        return context.prisma.updateGame({
            data: {
                status: "CLOSED"
            },
            where: {
                id: args.id
            }
        })
    } else if (game && game.guest.id === userId && (game.status !== "CLOSED" || game.status !== "ENDED")) {
        if (game.status === "READY") {
            return context.prisma.updateGame({
                data: {
                    guest: {disconnect: true},
                    status: "OPEN",
                    playerOneId: userId === game.playerOneId ? null : undefined,
                    playerTwoId: userId === game.playerTwoId ? null : undefined
                },
                where: {
                    id: args.id
                }
            })
        } else {
            return context.prisma.updateGame({
                data: {
                    status: "CLOSED"
                },
                where: {
                    id: args.id
                }
            })
        }
    } else {
        throw new Error('Can not leave game that player is not part of')
    }
}

async function doAction(root, args, context) {
    const userId = getUserId(context)

    const action = args.action ? mapActionEnumToActionCommand[args.action] : "_"

    if (await context.prisma.$exists.game({
        id: args.id,
        state: {playerTurn: userId},
        status_in: ["READY", "IN_PLAY"]
    })) {
        const fragment = `
        fragment OpenGame on Game {
            gameId
            playerOneId
            playerTwoId
            state {
                playerTurn
                map {
                    tiles {
                      type
                      item
                    }
                    width
                    height
                }
                player1 {
                    x, y, type, morphItems, health, lives, lastAction
                },
                player2 {
                    x, y, type, morphItems, health, lives, lastAction
                }
            }
        }`
        const game = await context.prisma.game({id: args.id}).$fragment(fragment)

        await context.prisma.createMove({
            game: {connect: {id: args.id}},
            player: {connect: {id: userId}},
            action: args.action,
            actionType: args.actionType,
            state: {
                create: {
                    ...game.state,
                    map: {
                        create: {
                            ...game.state.map,
                            tiles: {create: game.state.map.tiles}
                        }
                    },
                    player1: {
                        create: {
                            ...game.state.player1,
                            morphItems: {
                                set: game.state.player1.morphItems
                            }
                        }
                    },
                    player2: {
                        create: {
                            ...game.state.player2,
                            morphItems: {
                                set: game.state.player2.morphItems
                            }
                        }
                    }
                }
            }
        })

        const playerId = game.playerOneId === userId ? 0 : 1

        const req = await request({
            uri: `${process.env.GAME_SERVER_URL}/doAction?playerId=${playerId}&gameId=${game.gameId}&action=${action}`,
            json: true
        })

        if (req.result === undefined && req.message === GAME_ENDED_MSG) {
            return context.prisma.updateGame({
                data: {
                    status: "ENDED"
                },
                where: {
                    id: args.id
                }
            })
        }

        const {winner, map, player1, player2} = req.result
        player1.lastAction = player1.lastAction ? mapActionCommandToActionEnum[player1.lastAction] : null
        player2.lastAction = player2.lastAction ? mapActionCommandToActionEnum[player2.lastAction] : null
        map.tiles = [].concat(...map.tiles)

        return context.prisma.updateGame({
            data: {
                status: winner ? 'ENDED' : undefined,
                winner: winner && winner !== 0 ?
                    {
                        connect: {id: (winner === 1 ? game.playerOneId : game.playerTwoId)}
                    } : undefined,
                state: {
                    create: {
                        playerTurn: userId,
                        map: {
                            create: {
                                tiles: {create: map.tiles},
                                width: map.width / 2,
                                height: map.height
                            }
                        },
                        player1: {
                            create: {
                                x: player1.x,
                                y: player1.y,
                                type: player1.type,
                                morphItems: {set: player1.morphItems},
                                health: player1.health,
                                lives: player1.lives,
                                lastAction: player1.lastAction
                            }
                        },
                        player2: {
                            create: {
                                x: player2.x,
                                y: player2.y,
                                type: player2.type,
                                morphItems: {set: player2.morphItems},
                                health: player2.health,
                                lives: player2.lives,
                                lastAction: player2.lastAction
                            }
                        }
                    }
                }
            },
            where: {
                id: args.id
            }
        })
    } else if (await context.prisma.$exists.game({
        id: args.id,
        playerOneId: userId,
        status_in: ["IN_PLAY", "ENDED"]
    }) || await context.prisma.$exists.game({
        id: args.id,
        playerTwoId: userId,
        status_in: ["IN_PLAY", "ENDED"]
    })) {
        return context.prisma.game({id: args.id})
    } else {
        throw new Error('Can not make a move in a game that player is not part of')
    }
}

function addBot(root, args, context) {
    return context.prisma.createAgent({
        name: args.name,
        script: args.script,
        className: args.className
    })
}

function addMap(root, args, context) {
    return context.prisma.createGameMap({
        name: args.name
    })
}

async function createGamePlayerVsBot(root, args, context) {
    const userId = getUserId(context)

    if (await context.prisma.$exists.agent({id: args.bot}) &&
        await context.prisma.$exists.workgroup({
            id: args.workgroup,
            busy: false
        })) {
        if (!args.map) {
            const maps = await context.prisma.gameMaps()
            const mapsCount = maps.length
            args.map = maps[getRandomInt(0, mapsCount - 1)].name
        }

        const workstation = (await context.prisma.workstations({
            where: {
                workgroups_some: {
                    id: args.workgroup
                }
            }
        }))[0]

        // TODO: Update private key if needed.
        await workstationHandshake(workstation.url)

        const bot = await context.prisma.agent({
            id: args.bot
        })

        const firstPlayer = getRandomInt(0, 1)
        const players = [userId, args.bot]

        const token = 'Bearer ' + jwt.sign({userId: bot.id}, APP_SECRET)

        const gameId = context.gameId()

        await request({
            uri: `${process.env.GAME_SERVER_URL}/admin/createGame?gameId=${gameId}&playerOne=0&playerTwo=1&mapName=${args.map}`
        })

        const game = await context.prisma.createGame({
            gameId,
            host: {connect: {id: userId}},
            guest: {connect: {id: args.bot}},
            map: {connect: {name: args.map}},
            playerOneId: players[firstPlayer],
            playerTwoId: players[1 - firstPlayer],
            status: "READY"
        })

        request({
            uri: workstation.url + "/workgroups/scheduleGame",
            method: 'POST',
            headers: {
                'Authorization': workstation.privateKey
            },
            body: {
                worker_id: args.workgroup,
                script: bot.script,
                className: bot.className,
                args: {
                    game_id: game.id,
                    player_id: bot.id,
                    player_token: token
                }
            },
            json: true
        }).then(async res => {
            await context.prisma.updateWorkgroup({
                data: {
                    busy: false
                },
                where: {
                    id: args.workgroup
                }
            })
        })

        return game
    } else {
        throw Error('Invalid parameters')
    }
}

async function createGameBotVsBot(root, args, context) {
    if (args.bot1 !== args.bot2 &&
        await context.prisma.$exists.agent({id: args.bot1}) &&
        await context.prisma.$exists.agent({id: args.bot2}) &&
        await context.prisma.$exists.workgroup({
            id: args.workgroup1,
            busy: false
        }) &&
        await context.prisma.$exists.workgroup({
            id: args.workgroup2,
            busy: false
        })) {
        if (!args.map) {
            const maps = await context.prisma.gameMaps()
            const mapsCount = maps.length
            args.map = maps[getRandomInt(0, mapsCount - 1)].name
        }

        const workstations = (await context.prisma.workstations({
            where: {
                workgroups_some: {
                    id_in: [args.workgroup1, args.workgroup2]
                }
            }
        }))

        const workstation1 = workstations[0]
        // TODO: Update private key if needed.
        await workstationHandshake(workstation1.url)
        let workstation2 = workstation1
        if (workstations.length > 1) {
            workstation2 = workstations[1]
            // TODO: Update private key if needed.
            await workstationHandshake(workstation2.url)
        }

        const bots = await context.prisma.agents({
            where: {
                id_in: [args.bot1, args.bot2]
            }
        })

        const bot1 = bots[0]
        const bot2 = bots.length > 1 ? bots[1] : bot1

        const token1 = 'Bearer ' + jwt.sign({userId: bot1.id}, APP_SECRET)
        const token2 = 'Bearer ' + jwt.sign({userId: bot2.id}, APP_SECRET)

        const firstPlayer = getRandomInt(0, 1)
        const players = [args.bot1, args.bot2]

        const gameId = context.gameId()

        await request({
            uri: `${process.env.GAME_SERVER_URL}/admin/createGame?gameId=${gameId}&playerOne=0&playerTwo=1&mapName=${args.map}`
        })

        const game = await context.prisma.createGame({
            gameId,
            host: {connect: {id: args.bot1}},
            guest: {connect: {id: args.bot2}},
            map: {connect: {name: args.map}},
            playerOneId: players[firstPlayer],
            playerTwoId: players[1 - firstPlayer],
            status: "READY"
        })

        request({
            uri: workstation1.url + "/workgroups/scheduleGame",
            method: 'POST',
            headers: {
                'Authorization': workstation1.privateKey
            },
            body: {
                worker_id: args.workgroup1,
                script: bot1.script,
                className: bot1.className,
                args: {
                    game_id: game.id,
                    player_id: bot1.id,
                    player_token: token1
                }
            },
            json: true
        }).then(async res => {
            await context.prisma.updateWorkgroup({
                data: {
                    busy: false
                },
                where: {
                    id: args.workgroup1
                }
            })
        })

        request({
            uri: workstation2.url + "/workgroups/scheduleGame",
            method: 'POST',
            headers: {
                'Authorization': workstation2.privateKey
            },
            body: {
                worker_id: args.workgroup2,
                script: bot2.script,
                className: bot2.className,
                args: {
                    game_id: game.id,
                    player_id: bot2.id,
                    player_token: token2
                }
            },
            json: true
        }).then(async res => {
            await context.prisma.updateWorkgroup({
                data: {
                    busy: false
                },
                where: {
                    id: args.workgroup2
                }
            })
        })

        return game
    } else {
        throw Error('Invalid parameters')
    }
}

async function addWorkstation(root, args, context) {
    const workgroups = {
        create: []
    }
    for (let i = 0; i < args.numberOfWorkgroups; ++i)
        workgroups.create.push({})

    const privateKey = await workstationHandshake(args.url)

    return context.prisma.createWorkstation({
        name: args.name,
        url: args.url,
        privateKey,
        workgroups
    })
}

async function scaleUpWorkstation(root, args, context) {
    const workgroups = {
        create: []
    }
    for (let i = 0; i < args.amount; ++i)
        workgroups.create.push({})

    await context.prisma.updateWorkstation({
        data: {
            workgroups
        },
        where : {
            id: args.id
        }
    })

    return context.prisma.workstation({
        id: args.id
    })
}

async function scaleDownWorkstation(root, args, context) {
    const workgroups = await context.prisma.workgroups({
        where: {
            busy: false,
            workstation: {
                id: args.id
            }
        }
    })

    await context.prisma.deleteManyWorkgroups({
        id_in: workgroups.slice(0, args.amount).map(w => w.id)
    })

    return context.prisma.workstation({
        id: args.id
    })
}

async function updateWorkstation(root, args, context) {
    const privateKey = await workstationHandshake(args.url)

    return context.prisma.updateWorkstation({
        data: {
            url: args.url,
        },
        where : {
            id: args.id
        }
    })
}

async function removeWorkstation(root, args, context) {
    await context.prisma.deleteManyWorkgroups({
        workstation: {id: args.id}
    })
    return context.prisma.deleteWorkstation({
        id: args.id
    })
}

function allocateWorkgroup(root, args, context) {
    checkApiKey(context)
    return context.prisma.updateWorkgroup({
        data: {
            busy: true
        },
        where: {
            id: args.id
        }
    })
}

async function terminateWorkgroup(root, args, context) {
    return context.prisma.updateWorkgroup({
        data: {
            busy: false
        },
        where: {
            id: args.id
        }
    })
}

function terminateWorkstation(root, args, context) {
    return context.prisma.updateWorkstation({
        data: {
            workgroups: {
                updateMany: {
                    data: {
                        busy: false
                    },
                    where: {
                        busy: true
                    }
                }
            }
        },
        where: {
            id: args.id
        }
    })
}

module.exports = {
    login,
    hostGame,
    joinGame,
    rejoinGame,
    startGame,
    leaveGame,
    doAction,
    addBot,
    addMap,
    createGamePlayerVsBot,
    createGameBotVsBot,
    addWorkstation,
    scaleUpWorkstation,
    scaleDownWorkstation,
    updateWorkstation,
    removeWorkstation,
    allocateWorkgroup,
    terminateWorkgroup,
    terminateWorkstation
}