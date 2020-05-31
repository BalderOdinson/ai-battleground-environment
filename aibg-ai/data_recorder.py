import uuid
import csv
import os
from collections import Counter
from PIL import Image

DATA_FOLDER = 'data/'
STATS_FOLDER = DATA_FOLDER + 'stats/'
MAP_FOLDER = DATA_FOLDER + 'map/'
STATS_COLUMNS = ['terrain', 'items', 'player_x', 'player_y', 'player_health', 'player_lives', 'player_red_gems',
                 'player_blue_gems', 'player_green_gems', 'player_morph', 'enemy_x', 'enemy_y', 'enemy_health',
                 'enemy_lives', 'enemy_red_gems', 'enemy_blue_gems', 'enemy_green_gems', 'enemy_morph',
                 'enemy_last_action', 'next_action_type', 'next_action']

RED_COLOR = (255, 0, 0)
BLUE_COLOR = (0, 0, 255)
GREEN_COLOR = (0, 255, 0)
BLACK_COLOR = (0, 0, 0)
BROWN_COLOR = (210, 105, 30)


class TrajectoryRecorder:
    def __init__(self):
        self.game_uuid = uuid.uuid4().hex
        self.ensure_dir_exists()

    @staticmethod
    def get_map_output_file():
        return '{}{}.png'.format(MAP_FOLDER, uuid.uuid4().hex)

    @staticmethod
    def transform_action(action):
        transform_dict = {'melee_w': 'w', 'melee_a': 'a', 'melee_s': 's', 'melee_d': 'd', None: '_'}
        return action if action not in transform_dict else transform_dict[action]

    def save_input(self, game_map):
        tiles = game_map['tiles']
        size = game_map['height']

        terrain_path = self.get_map_output_file()
        items_path = self.get_map_output_file()

        terrain_image = Image.new("RGB", (size, size))
        items_image = Image.new("RGB", (size, size))
        terrain_pixels = terrain_image.load()
        items_pixels = items_image.load()
        for x in range(size):
            for y in range(size):
                if tiles[y][x]['type'] == 'FIRE':
                    terrain_pixels[x, y] = RED_COLOR
                elif tiles[y][x]['type'] == 'WATER':
                    terrain_pixels[x, y] = BLUE_COLOR
                elif tiles[y][x]['type'] == 'GRASS':
                    terrain_pixels[x, y] = GREEN_COLOR
                if tiles[y][x]['item'] == 'OBSTACLE':
                    items_pixels[x, y] = BROWN_COLOR
                elif tiles[y][x]['item'] == 'FIRE':
                    items_pixels[x, y] = RED_COLOR
                elif tiles[y][x]['item'] == 'WATER':
                    items_pixels[x, y] = BLUE_COLOR
                elif tiles[y][x]['item'] == 'GRASS':
                    items_pixels[x, y] = GREEN_COLOR
        terrain_image.save(terrain_path)
        items_image.save(items_path)

        return terrain_path, items_path

    @staticmethod
    def ensure_stats_exists(output):
        if not os.path.exists(output):
            with open(output, mode='w') as csv_file:
                csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
                csv_writer.writerow(STATS_COLUMNS)

    def save_stats(self, player_stats, enemy_stats, terrain_path, items_path, next_action_type, next_action,
                   output_file):
        self.ensure_stats_exists(output_file)
        with open(output_file, mode='a') as csv_file:
            csv_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            player_items = Counter(player_stats['morphItems'])
            enemy_items = Counter(enemy_stats['morphItems'])
            csv_writer.writerow(
                [terrain_path, items_path,
                 player_stats['x'], player_stats['y'], player_stats['health'], player_stats['lives'],
                 player_items['FIRE'], player_items['WATER'], player_items['GRASS'], player_stats['type'],
                 enemy_stats['x'], enemy_stats['y'], enemy_stats['health'], enemy_stats['lives'],
                 enemy_items['FIRE'], enemy_items['WATER'], enemy_items['GRASS'], enemy_stats['type'],
                 self.transform_action(enemy_stats['lastAction']), next_action_type, next_action])

    def save_data(self, game, player_id, next_action_type, next_action):
        self.save_stats(game['player1' if player_id == 0 else 'player2'],
                        game['player2' if player_id == 0 else 'player1'],
                        *self.save_input(game['map']), next_action_type, next_action,
                        os.path.join(STATS_FOLDER, self.game_uuid + '.csv'))

    @staticmethod
    def ensure_dir_exists():
        os.makedirs(STATS_FOLDER, exist_ok=True)
        os.makedirs(MAP_FOLDER, exist_ok=True)
