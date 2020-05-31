import random
from .game import Agent
from ..types import Action


class RandomAgent(Agent):
    def compute_action(self, player_id, state):
        return random.choice([Action.ATTACK_DOWN, Action.ATTACK_LEFT, Action.ATTACK_RIGHT, Action.ATTACK_UP,
                              Action.MOVE_DOWN, Action.MOVE_LEFT, Action.MOVE_RIGHT, Action.MOVE_DOWN,
                              Action.TRANSFORM_FIRE, Action.TRANSFORM_GRASS, Action.TRANSFORM_NORMAL,
                              Action.TRANSFORM_WATER])
