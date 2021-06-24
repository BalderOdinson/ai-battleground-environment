from abc import abstractmethod

from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

from .query import START_GAME, DO_ACTION
from .types import GameStatus, Action


class Agent:
    @abstractmethod
    def compute_action(self, player_id: str, state: dict) -> Action:
        pass

    def on_game_starting(self, player_id: str, state: dict):
        pass

    def on_game_ended(self, player_id: str, state: dict, winner_id: str):
        pass


class Environment:
    def __init__(self, url: str):
        self.url = url

    def play(self, agent: Agent, game_id: str, player_id: str, player_token: str):
        http_transport = RequestsHTTPTransport(
            url=self.url,
            headers={'Authorization': player_token},
            verify=False,
            retries=3
        )

        with Client(transport=http_transport,
                    fetch_schema_from_transport=True) as session:
            winner = None
            result = session.execute(gql(START_GAME(game_id)))
            result = result['startGame']
            state = result['state']
            while True:
                result = session.execute(gql(DO_ACTION(game_id,
                                                       agent.compute_action(
                                                           0 if result['playerOneId'] == player_id else 1,
                                                           state))))
                result = result['doAction']
                state = result['state']

                if result['status'] == GameStatus.ENDED:
                    winner = None if result['winner'] is None else 0 if result['winner']['id'] == result[
                        'playerOneId'] else 1
                    break
                if result['status'] == GameStatus.CLOSED:
                    break

            agent.on_game_ended(player_id, state, winner)
