import PySimpleGUIQt as sg

from basic_agents import RecordedAgent


class UserAgent(RecordedAgent):
    def __init__(self, base_url='http://localhost:9080', record=False):
        super().__init__()
        self.record = record
        self.url = base_url
        self.keyboard_dict = {'w:25': 'w', 'a:38': 'a', 's:39': 's', 'd:40': 'd', 'special 16777235': 'rw',
                              'special 16777234': 'ra', 'special 16777236': 'rd', 'special 16777237': 'rs',
                              '0': '_', '1': 'mn', '2': 'mw', '3': 'mg', '4': 'mf'}
        self.available_actions = {'w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mw', 'mg', 'mf'}
        self.window = None

    def compute_action(self, player_id, state):
        event, values = self.window.read()
        action = event
        if action in self.keyboard_dict:
            action = self.keyboard_dict[event]
        elif action not in self.available_actions:
            action = '_'
        self.save_data(player_id, state, action)
        return action

    def save_data(self, player_id, state, action):
        if self.record:
            super().save_data(player_id, state, action)

    def on_game_starting(self, player_id, state):
        super().on_game_starting(player_id, state)
        # webbrowser.open_new_tab(self.url + '?gameId={}'.format(state['id']))
        sg.theme('DarkAmber')
        layout = [[sg.Text('Move actions')],
                  [sg.Button('Move Up', key='w'), sg.Button('Move Down', key='s'),
                   sg.Button('Move Left', key='a'), sg.Button('Move Right', key='d')],
                  [sg.Text('Attack actions')],
                  [sg.Button('Attack Up', key='rw'), sg.Button('Attack Down', key='rs'),
                   sg.Button('Attack Left', key='ra'), sg.Button('Attack Right', key='rd')],
                  [sg.Text('Transform actions')],
                  [sg.Button('Normal', key='mn'), sg.Button('Goblin', key='mw'), sg.Button('Scorpion', key='mg'),
                   sg.Button('Dragon', key='mf')],
                  [sg.Text('Special actions')],
                  [sg.Button('Do nothing', key='_')]]
        self.window = sg.Window('Player{}'.format(player_id + 1), layout, return_keyboard_events=True)

    def on_game_ended(self, player_id, state, winner_id):
        super().on_game_ended(player_id, state, winner_id)
        self.save_data(player_id, state, '_')
        self.window.close()
        self.window = None
