import requests
import uuid
import imgkit
import csv
import os
from collections import Counter
from PIL import Image

DATA_FOLDER = 'data/'
LEFT_STATS_OUTPUT_FOLDER = DATA_FOLDER + 'left/'
LEFT_STATS_OUTPUT_FILE = LEFT_STATS_OUTPUT_FOLDER + 'data.csv'
RIGHT_STATS_OUTPUT_FOLDER = DATA_FOLDER + 'right/'
RIGHT_STATS_OUTPUT_FILE = RIGHT_STATS_OUTPUT_FOLDER + 'data.csv'
MAP_OUTPUT_FOLDER = DATA_FOLDER + 'map/'
INPUT_OUTPUT_FOLDER = DATA_FOLDER + 'input/'
MAP_OUTPUT_FILE = MAP_OUTPUT_FOLDER + 'data.csv'
LEFT_STATS = 'player1'
RIGHT_STATS = 'player2'
STATS_COLUMNS = ['input', 'is_player', 'health', 'lives', 'red_gems', 'blue_gems', 'green_gems', 'morph']
MAP_COLUMNS = ['input', 'normal_tiles', 'fire_tiles', 'water_tiles', 'grass_tiles', 'obstacle', 'red_gem', 'blue_gem',
               'green_gem', 'player_pos', 'enemy_pos']
COMMANDS = ['w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mf', 'mg', 'mn', 'mw']

url = 'http://localhost:9080'


def get_map_output_file():
    return '{}{}.png'.format(MAP_OUTPUT_FOLDER, uuid.uuid4().hex)


def get_input_output_file():
    return '{}{}.png'.format(INPUT_OUTPUT_FOLDER, uuid.uuid4().hex)


def save_input(game_id, player_id):
    first_script = "document.getElementById('player1-avatar').parentElement.children[1].innerHTML = '{}';".format(
        'player' if player_id is 0 else 'enemy')
    second_script = "document.getElementById('player2-avatar').parentElement.children[1].innerHTML = '{}';".format(
        'enemy' if player_id is 0 else 'player')

    file = get_input_output_file()

    imgkit.from_url(url + '/?gameId={}'.format(game_id), file,
                    options={
                        'width': 1920,
                        'height': 1080,
                        'run-script': first_script + second_script
                    })

    img = Image.open(file)
    img.resize((355, 200), resample=Image.BOX).save(file)

    return file


def ensure_stats_exists(output):
    if not os.path.exists(output):
        with open(output, mode='w') as csv_file:
            csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            csv_writer.writerow(STATS_COLUMNS)


def ensure_map_data_exists(output):
    if not os.path.exists(output):
        with open(output, mode='w') as csv_file:
            csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            csv_writer.writerow(MAP_COLUMNS)


def save_stats(stats, is_player, input_name, output):
    ensure_stats_exists(output)
    with open(output, mode='a') as csv_file:
        csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        items = Counter(stats['morphItems'])
        csv_writer.writerow(
            [input_name, is_player, stats['health'], stats['lives'], items['FIRE'], items['WATER'], items['GRASS'],
             stats['type']])


def save_channel(predicate, width, height, output):
    image = Image.new("1", (width, height))
    pixels = image.load()
    for x in range(width):
        for y in range(height):
            pixels[x, y] = predicate(x, y)
    image.save(output)


def save_map(game_map, player_pos, enemy_pos, input_name):
    width = int(game_map['width'] / 2)
    height = game_map['height']
    tiles = game_map['tiles']

    # Save Normal tiles
    normal_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['type'] == 'NORMAL', width, height, normal_name)

    # Save Fire tiles
    fire_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['type'] == 'FIRE', width, height, fire_name)

    # Save Water tiles
    water_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['type'] == 'WATER', width, height, water_name)

    # Save Grass tiles
    grass_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['type'] == 'GRASS', width, height, grass_name)

    # Save Obstacle items
    obstacle_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['item'] == 'OBSTACLE', width, height, obstacle_name)

    # Save Red gem items
    red_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['item'] == 'FIRE', width, height, red_name)

    # Save Blue gem items
    blue_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['item'] == 'WATER', width, height, blue_name)

    # Save Grass gem items
    green_name = get_map_output_file()
    save_channel(lambda x, y: tiles[y][x]['item'] == 'GRASS', width, height, green_name)

    # Save player position
    player_pos_name = get_map_output_file()
    save_channel(lambda x, y: (x, y) == player_pos, width, height, player_pos_name)

    # Save enemy position
    enemy_pos_name = get_map_output_file()
    save_channel(lambda x, y: (x, y) == enemy_pos, width, height, enemy_pos_name)

    ensure_map_data_exists(MAP_OUTPUT_FILE)

    with open(MAP_OUTPUT_FILE, mode='a') as csv_file:
        csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        csv_writer.writerow(
            [input_name, normal_name, fire_name, water_name, grass_name, red_name, blue_name, green_name,
             player_pos_name, enemy_pos_name])


def save_data(game, player_id):
    input_name = save_input(game['id'], player_id)
    save_stats(game[LEFT_STATS], player_id == '0', input_name, LEFT_STATS_OUTPUT_FILE)
    save_stats(game[RIGHT_STATS], player_id == '1', input_name, RIGHT_STATS_OUTPUT_FILE)
    player_pos = (game['player1']['x'], game['player1']['y']) if player_id == 0 else (
        game['player2']['x'], game['player2']['y'])
    enemy_pos = (game['player2']['x'], game['player2']['y']) if player_id == 0 else (
        game['player1']['x'], game['player1']['y'])
    save_map(game['map'], player_pos, enemy_pos, input_name)


def ensure_dir_exists():
    os.makedirs(INPUT_OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(LEFT_STATS_OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(RIGHT_STATS_OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(MAP_OUTPUT_FOLDER, exist_ok=True)
