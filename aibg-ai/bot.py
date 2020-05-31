import requests
import numpy as np
import tensorflow as tf
import shutil
import imgkit
import sys
from train_nn import preprocessing_fn

_game = None
_game_id = None
_player_id = None
_model = None
url = 'http://192.168.1.7:9080'

VERSION = '_v1'
SUPERVISED_PATH = 'models/supervised-brainer{}.h5'.format(VERSION)
TEMP_FILE_PATH = 'input.png'


def action_to_string(action):
    if action == 0:
        return 'rs'
    if action == 1:
        return 'ra'
    if action == 2:
        return 'rd'
    if action == 3:
        return 'rw'
    if action == 4:
        return 's'
    if action == 5:
        return 'a'
    if action == 6:
        return 'd'
    if action == 7:
        return 'w'
    if action == 8:
        return 'mf'
    if action == 9:
        return 'mw'
    if action == 10:
        return 'mn'
    if action == 11:
        return 'mg'


def get(url):
    r = requests.get(url)
    res = r.json()
    return res


def join(player_id, game_id):
    global _game, _game_id
    res = get(url + '/game/play?playerId=' + str(player_id) + '&gameId=' + str(game_id))
    _game = res['result']
    _gameId = _game['id']
    print("Game id: " + str(_gameId))
    return res


def run():
    global _game, _player_id, _game_id
    move = calculate(_game, _game_id, _player_id)
    # After we send an action - we wait for response
    _game = do_action(_player_id, _game_id, move)['result']
    # Other player made their move - we send our move again
    run()


def calculate(game, game_id, player_id):
    predictions = _model.predict(get_input(game_id, player_id))
    action = np.argmax(predictions[0])
    print('Action: %s(%f%%)' % (action_to_string(action), predictions[0][action] * 100))
    return action_to_string(action)


def do_action(player_id, game_id, action):
    return get(url + '/doAction?playerId=' + str(player_id) + '&gameId=' + str(game_id) + '&action=' + action)


def load_model(filename):
    model = tf.keras.models.load_model(filename)
    return model


def get_input(game_id, player_id):
    first_script = "document.getElementById('player1-avatar').parentElement.children[1].innerHTML = '{}';".format(
        'player' if player_id is 0 else 'enemy')
    second_script = "document.getElementById('player2-avatar').parentElement.children[1].innerHTML = '{}';".format(
        'enemy' if player_id is 0 else 'player')

    imgkit.from_url(url + '/?gameId={}'.format(game_id), TEMP_FILE_PATH,
                    options={
                        'width': 1920,
                        'height': 1080,
                        'run-script': first_script + second_script
                    })

    img = tf.io.read_file(TEMP_FILE_PATH)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.resize(img, [200, 355])
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.reshape(img, [1, *img.shape])
    img = preprocessing_fn(img)
    return img


if __name__ == '__main__':
    _model = load_model(SUPERVISED_PATH)
    _game_id = int(sys.argv[1])
    _player_id = int(sys.argv[2])
    join(_player_id, _game_id)
    run()
