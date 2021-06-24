def TRACK_GAME_STATE(id):
    return '''
        subscription {
          trackGameStatus(id: "%s") {
            status
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
            winner {
                id
            }
          }
        }
    ''' % id


def START_GAME(id):
    return '''
            mutation {
                startGame(id: "%s") {
                    status
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
                }
            }
        ''' % id


def DO_ACTION(game_id, action):
    return '''
        mutation {
          doAction(id: "%s", action:%s) {
            status
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
            winner {
                id
            }
          }
        }
    ''' % (game_id, action)


def ALLOCATE_WORKGROUP(id):
    return '''
            mutation {
                allocateWorkgroup(id: "%s") {
                    id
                }
            }
        ''' % id
