import sys
import time
import os

from game import Environment
from basic_agents import NKBotAgent, RandomAgent
# from user_agent import UserAgent
from supervised_agent import SupervisedAgent

CREATE_GAME = True
GAME_ID = 0
NUMBER_OF_GAMES = 32

# 'http://192.168.1.22:9080'

if __name__ == '__main__':
    env = Environment(base_url=os.getenv('SERVER_ADDRESS', 'http://192.168.1.6:9080'), create_game=CREATE_GAME, starting_game_id=GAME_ID)
    # player1 = UserAgent(record=True)
    player1 = RandomAgent()
    # player1 = SupervisedAgent('v3')
    # player2 = UserAgent(record=False)
    player2 = NKBotAgent()
    # player2 = SupervisedAgent('v3')
    start = time.time()
    env.play(player1, player2, NUMBER_OF_GAMES, shuffle_ids=True)
    end = time.time()
    # print(f'Time passed: {end - start}')
    # player1.summary()
