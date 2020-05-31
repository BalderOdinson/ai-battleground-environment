from abc import abstractmethod

import queue
import threading
import requests
import random


PLAYER1_ID = 0
PLAYER2_ID = 1


class Agent:
    @abstractmethod
    def compute_action(self, player_id, state):
        pass

    def on_game_starting(self, player_id, state):
        pass

    def on_game_ended(self, player_id, state, winner_id):
        if winner_id is None:
            print('Match is draw!')
        else:
            print('Winner is player{}'.format(1 if winner_id == PLAYER1_ID else 2))


class Environment:
    def __init__(self, base_url='http://localhost:9080', starting_game_id=0, create_game=True,
                 map_id=None):
        self.game_id = starting_game_id
        self.create_game = create_game
        self.map_id = map_id
        self.url = base_url
        self.winner = None
        self.state = None

    def play(self, player1: Agent = None, player2: Agent = None, number_of_games=1, shuffle_ids=False):
        starting_id = self.game_id
        for i in range(number_of_games):
            self.reset(starting_id + i)

            if shuffle_ids:
                players = [player1, player2]
                random.shuffle(players)
                player1, player2 = players[0], players[1]

            threads = queue.Queue(2)
            if player1 is not None:
                player1.on_game_starting(PLAYER1_ID, self.state)
                t = threading.Thread(target=self.join, args=[PLAYER1_ID])
                t.start()
                threads.put(t)
            if player2 is not None:
                player2.on_game_starting(PLAYER2_ID, self.state)
                t = threading.Thread(target=self.join, args=[PLAYER2_ID])
                t.start()
                threads.put(t)

            while True:
                if player1 is not None:
                    threads.get().join()
                    if self.winner is not None:
                        break
                    action = player1.compute_action(PLAYER1_ID, self.state)
                    t = threading.Thread(target=self.do_action, args=[PLAYER1_ID, action])
                    t.start()
                    threads.put(t)

                if player2 is not None:
                    threads.get().join()
                    if self.winner is not None:
                        break
                    action = player2.compute_action(PLAYER2_ID, self.state)
                    t = threading.Thread(target=self.do_action, args=[PLAYER2_ID, action])
                    t.start()
                    threads.put(t)

            if player1 is not None:
                player1.on_game_ended(PLAYER1_ID, self.state, [None, PLAYER1_ID, PLAYER2_ID][self.winner])
            if player2 is not None:
                player2.on_game_ended(PLAYER2_ID, self.state, [None, PLAYER1_ID, PLAYER2_ID][self.winner])

    @staticmethod
    def get(url):
        r = requests.get(url)
        res = r.json()
        return res

    def join(self, player_id):
        self.state = self.get(self.url + '/game/play?playerId={}&gameId={}'.format(player_id, self.game_id))['result']
        return True

    def do_action(self, player_id, action):
        self.state = self.get(
            self.url + '/doAction?playerId={}&gameId={}&action={}'.format(player_id, self.game_id, action))['result']
        self.winner = self.state['winner']
        return True if self.winner is None else False

    def reset(self, game_id):
        self.game_id = game_id
        self.winner = None
        self.state = None

        if self.create_game:
            self.state = self.get(
                self.url + '/admin/createGame?gameId={}&playerOne=0&playerTwo=1&mapName=mapConfig{}'.format(
                    self.game_id, self.map_id if self.map_id is not None else random.randint(1, 6)))['result']
        else:
            self.state = self.get(self.url + '/game?gameId={}'.format(game_id))
