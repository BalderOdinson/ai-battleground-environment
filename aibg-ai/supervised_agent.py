from collections import Counter

import numpy as np
import matplotlib.pyplot as plt

from game import Agent
from train_supervised_agent_v1 import load_inference_model


class SupervisedAgent(Agent):
    def __init__(self, version='v1'):
        self.version = version
        self.model = None
        self.actions = ['_', 'w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mf', 'mw', 'mg', 'empty']
        self.morphs = {'NEUTRAL': 0, 'FIRE': 1, 'WATER': 2, 'GRASS': 3}
        self.terrain = {'FIRE': (1, 0, 0), 'WATER': (0, 0, 1), 'GRASS': (0, 1, 0), 'OBSTACLE': (0.82, 0.41, 0.12)}
        self.actions_dict = {'_': 0, 'melee_w': 1, 'melee_a': 2, 'melee_s': 3, 'melee_d': 4, 'rw': 5, 'ra': 6, 'rs': 7,
                             'rd': 8, 'mn': 9, 'mf': 10, 'mw': 11, 'mg': 12, 'empty': 13, None: 0}
        self.win = 0
        self.draw = 0
        self.lose = 0

    def on_game_starting(self, player_id, state):
        super().on_game_starting(player_id, state)
        self.model = load_inference_model(self.version)

    def on_game_ended(self, player_id, state, winner_id):
        super().on_game_ended(player_id, state, winner_id)
        if player_id == winner_id:
            self.win += 1
        elif winner_id is None:
            self.draw += 1
        else:
            self.lose += 1

    def compute_action(self, player_id, state):
        prediction = self.model.predict(self.process_data(player_id, state))[0]
        index = np.argmax(prediction)
        probability = prediction[index]
        action = self.actions[index]
        # print('Action: {}, Probability: {}'.format(action, probability))
        return action

    def process_data(self, player_id, state):
        player_hp = np.zeros([1, 1], dtype=np.float32)
        enemy_hp = np.zeros([1, 1], dtype=np.float32)
        lives = np.zeros([1, 2], dtype=np.float32)
        player_morph = np.zeros([1, 4], dtype=np.float32)
        enemy_morph = np.zeros([1, 4], dtype=np.float32)
        last_enemy_move = np.zeros([1, 13], dtype=np.float32)
        player_gems = np.zeros([1, 3], dtype=np.float32)
        enemy_gems = np.zeros([1, 3], dtype=np.float32)
        player_position = np.zeros([1, 2], dtype=np.float32)
        enemy_position = np.zeros([1, 2], dtype=np.float32)
        terrain = np.zeros([1, 20, 20, 3], dtype=np.float32)
        terrain_objects = np.zeros([1, 20, 20, 3], dtype=np.float32)

        player = state['player1' if player_id == 0 else 'player2']
        enemy = state['player2' if player_id == 0 else 'player1']

        player_hp[0] = np.clip([player['health']], 0, 100)
        enemy_hp[0] = np.clip([enemy['health']], 0, 100)
        lives[0] = [player['lives'], enemy['lives']]
        player_morph[0] = np.eye(4)[self.morphs[player['type']]]
        enemy_morph[0] = np.eye(4)[self.morphs[enemy['type']]]
        last_enemy_move[0] = np.eye(13)[self.actions_dict[enemy['lastAction']]]
        player_items = Counter(player['morphItems'])
        player_gems[0] = [player_items['FIRE'], player_items['WATER'], player_items['GRASS']]
        enemy_items = Counter(enemy['morphItems'])
        enemy_gems[0] = [enemy_items['FIRE'], enemy_items['WATER'], enemy_items['GRASS']]
        player_position[0] = [player['x'], player['y']]
        enemy_position[0] = [enemy['x'], enemy['y']]

        tiles = state['map']['tiles']
        size = state['map']['height']

        for i in range(size):
            for j in range(size):
                if tiles[i][j]['type'] != 'NORMAL':
                    terrain[0, i, j, 0] = self.terrain[tiles[i][j]['type']][0]
                    terrain[0, i, j, 1] = self.terrain[tiles[i][j]['type']][1]
                    terrain[0, i, j, 2] = self.terrain[tiles[i][j]['type']][2]
                if tiles[i][j]['item'] is not None:
                    terrain_objects[0, i, j, 0] = self.terrain[tiles[i][j]['item']][0]
                    terrain_objects[0, i, j, 1] = self.terrain[tiles[i][j]['item']][1]
                    terrain_objects[0, i, j, 2] = self.terrain[tiles[i][j]['item']][2]

        return player_hp, enemy_hp, lives, player_morph, enemy_morph, last_enemy_move, player_gems, enemy_gems, \
               player_position, enemy_position, terrain, terrain_objects

    def summary(self):
        total = self.win + self.lose + self.draw
        print('Total games played: {}'.format(total))
        print('Games won: {}', self.win)
        print('Games drawn: {}', self.draw)
        print('Games lost: {}', self.lose)
        print('Win rate: {}%'.format((self.win / total) * 100))
