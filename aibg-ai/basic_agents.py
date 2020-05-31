import NKBot
import random
import webbrowser

from abc import abstractmethod
from game import Agent
from game import Environment
from data_recorder import TrajectoryRecorder


class RecordedAgent(Agent):
    def __init__(self):
        self.recorder = None

    @abstractmethod
    def compute_action(self, player_id, state):
        pass

    def save_data(self, player_id, state, action):
        self.recorder.save_data(state, player_id, action)

    def on_game_starting(self, player_id, state):
        super().on_game_starting(player_id, state)
        self.recorder = TrajectoryRecorder()


class NKBotAgent(Agent):
    def compute_action(self, player_id, state):
        return NKBot.run(player_id, state)


class RandomAgent(Agent):
    def compute_action(self, player_id, state):
        return random.choice(['w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mf', 'mw', 'mg'])
