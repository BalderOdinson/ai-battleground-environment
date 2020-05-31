import pandas as pd
import os
import random
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from collections import Counter
from glob import glob

ACTION_CATEGORIES = ['_', 'w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mf', 'mw', 'mg', 'empty']
MORPHS_CATEGORIES = ['NEUTRAL', 'FIRE', 'WATER', 'GRASS']


def get_images(paths, fill_count):
    images = None
    for path in paths:
        img = tf.image.decode_png(tf.io.read_file(path), channels=3)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = img.numpy()
        if images is None:
            images = np.expand_dims(img, 0)
        else:
            images = np.append(images, np.expand_dims(img, 0), axis=0)

    if fill_count > 0:
        images = np.append(images, -1 * np.ones([fill_count, *images.shape[1:]], dtype=np.float32), axis=0)

    return images


def dataset_generator(path, batch_size=32, subset='train', validation_split=0.2, shuffle=False):
    stats_paths = glob(path + '**/*.*', recursive=True)

    dataset_size = len(stats_paths)

    validation_size = int(dataset_size * validation_split)
    train_size = dataset_size - validation_size

    begin = 0 if subset == 'train' else train_size
    end = train_size if subset == 'train' else dataset_size

    indices = list(range(begin, end))
    if shuffle:
        random.shuffle(indices)

    for index in range(0, len(indices), batch_size):
        terrain = None
        terrain_objects = None
        player_positions = None
        enemy_positions = None
        player_hps = None
        enemy_hps = None
        lives = None,
        player_morphs = None
        enemy_morphs = None
        player_gems = None
        enemy_gems = None
        last_enemy_moves = None
        labels = None
        max_moves = 0
        for i in range(index, index + min(batch_size, end - (index + begin))):
            s = stats_paths[indices[i]]
            df = pd.read_csv(s)
            max_moves = max(max_moves, len(df))

        for i in range(index, index + min(batch_size, end - (index + begin))):
            s = stats_paths[indices[i]]
            df = pd.read_csv(s)
            df['player_morph'] = pd.Categorical(df['player_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                ordered=True)
            df['player_morph'] = df.player_morph.cat.codes
            df['enemy_morph'] = pd.Categorical(df['enemy_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                               ordered=True)
            df['enemy_morph'] = df.enemy_morph.cat.codes
            df['enemy_last_move'] = pd.Categorical(df['enemy_last_move'],
                                                   categories=ACTION_CATEGORIES,
                                                   ordered=True)
            df['enemy_last_move'] = df.enemy_last_move.cat.codes
            df['next_move'] = pd.Categorical(df['next_move'],
                                             categories=ACTION_CATEGORIES,
                                             ordered=True)
            df['next_move'] = df.next_move.cat.codes

            fill_count = max_moves - len(df)

            player_hp = np.expand_dims(df.pop('player_health').clip(0, 100).to_numpy(), -1)
            enemy_hp = np.expand_dims(df.pop('enemy_health').clip(0, 100).to_numpy(), -1)
            life = pd.DataFrame([df.pop('player_lives'), df.pop('enemy_lives')]).T.to_numpy()
            player_morph = np.eye(len(MORPHS_CATEGORIES), dtype=np.float32)[df.pop('player_morph').to_numpy()]
            enemy_morph = np.eye(len(MORPHS_CATEGORIES), dtype=np.float32)[df.pop('enemy_morph').to_numpy()]
            last_enemy_move = np.eye(len(ACTION_CATEGORIES) - 1, dtype=np.float32)[df.pop('enemy_last_move').to_numpy()]
            player_gem = pd.DataFrame(
                [df.pop('player_red_gems'), df.pop('player_blue_gems'), df.pop('player_green_gems')]).T.to_numpy()
            player_position = pd.DataFrame([df.pop('player_x'), df.pop('player_y')]).T.to_numpy()
            enemy_position = pd.DataFrame([df.pop('enemy_x'), df.pop('enemy_y')]).T.to_numpy()
            terrain_sample = get_images(df.pop('terrain'), fill_count)
            terrain_objects_sample = get_images(df.pop('items'), fill_count)
            label = df.pop('next_move').to_numpy()
            enemy_gem = df.to_numpy(dtype=np.float32)

            if fill_count > 0:
                player_position = np.append(player_position,
                                            -1 * np.ones([fill_count, *player_position.shape[1:]], dtype=np.float32),
                                            axis=0)
                enemy_position = np.append(enemy_position,
                                           -1 * np.ones([fill_count, *enemy_position.shape[1:]], dtype=np.float32),
                                           axis=0)
                player_hp = np.append(player_hp,
                                      -1 * np.ones([fill_count, *player_hp.shape[1:]], dtype=np.float32),
                                      axis=0)
                enemy_hp = np.append(enemy_hp,
                                     -1 * np.ones([fill_count, *enemy_hp.shape[1:]], dtype=np.float32),
                                     axis=0)
                life = np.append(life,
                                 -1 * np.ones([fill_count, *life.shape[1:]], dtype=np.float32),
                                 axis=0)
                player_morph = np.append(player_morph, np.zeros([fill_count, *player_morph.shape[1:]], dtype=np.int8),
                                         axis=0)
                enemy_morph = np.append(enemy_morph, np.zeros([fill_count, *enemy_morph.shape[1:]], dtype=np.int8),
                                        axis=0)
                last_enemy_move = np.append(last_enemy_move,
                                            np.zeros([fill_count, *last_enemy_move.shape[1:]], dtype=np.int8),
                                            axis=0)
                player_gem = np.append(player_gem,
                                       -1 * np.ones([fill_count, *player_gem.shape[1:]], dtype=np.float32),
                                       axis=0)
                enemy_gem = np.append(enemy_gem,
                                      -1 * np.ones([fill_count, *enemy_gem.shape[1:]], dtype=np.float32),
                                      axis=0)
                label = np.append(label,
                                  (len(ACTION_CATEGORIES) - 1) * np.ones([fill_count, *label.shape[1:]], dtype=np.int8),
                                  axis=0)

            if terrain is None:
                player_positions = np.expand_dims(player_position, 0)
                enemy_positions = np.expand_dims(enemy_position, 0)
                player_hps = np.expand_dims(player_hp, 0)
                enemy_hps = np.expand_dims(enemy_hp, 0)
                lives = np.expand_dims(life, 0)
                player_morphs = np.expand_dims(player_morph, 0)
                enemy_morphs = np.expand_dims(enemy_morph, 0)
                last_enemy_moves = np.expand_dims(last_enemy_move, 0)
                player_gems = np.expand_dims(player_gem, 0)
                enemy_gems = np.expand_dims(enemy_gem, 0)
                terrain = np.expand_dims(terrain_sample, 0)
                terrain_objects = np.expand_dims(terrain_objects_sample, 0)
                labels = np.expand_dims(np.eye(len(ACTION_CATEGORIES), dtype=np.float32)[label], 0)
            else:
                player_positions = np.append(player_positions, np.expand_dims(player_position, 0), axis=0)
                enemy_positions = np.append(enemy_positions, np.expand_dims(enemy_position, 0), axis=0)
                player_hps = np.append(player_hps, np.expand_dims(player_hp, 0), axis=0)
                enemy_hps = np.append(enemy_hps, np.expand_dims(enemy_hp, 0), axis=0)
                lives = np.append(lives, np.expand_dims(life, 0), axis=0)
                player_morphs = np.append(player_morphs, np.expand_dims(player_morph, 0), axis=0)
                enemy_morphs = np.append(enemy_morphs, np.expand_dims(enemy_morph, 0), axis=0)
                last_enemy_moves = np.append(last_enemy_moves, np.expand_dims(last_enemy_move, 0), axis=0)
                player_gems = np.append(player_gems, np.expand_dims(player_gem, 0), axis=0)
                enemy_gems = np.append(enemy_gems, np.expand_dims(enemy_gem, 0), axis=0)
                terrain = np.append(terrain, np.expand_dims(terrain_sample, 0), axis=0)
                terrain_objects = np.append(terrain_objects, np.expand_dims(terrain_objects_sample, 0), axis=0)
                labels = np.append(labels, np.expand_dims(np.eye(len(ACTION_CATEGORIES), dtype=np.float32)[label], 0),
                                   axis=0)

        yield (player_hps, enemy_hps, lives, player_morphs, enemy_morphs, last_enemy_moves, player_gems, enemy_gems,
               player_positions, enemy_positions, terrain, terrain_objects), labels


def get_dataset(path, batch_size=32, validation_split=0.2):
    train_dataset = tf.data.Dataset.from_generator(
        generator=lambda: dataset_generator(path, batch_size=batch_size, validation_split=validation_split,
                                            subset='train', shuffle=True),
        output_types=((tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32,
                       tf.float32, tf.float32, tf.float32, tf.float32), tf.float32),
        output_shapes=((tf.TensorShape([None, None, 1]),
                        tf.TensorShape([None, None, 1]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 4]),
                        tf.TensorShape([None, None, 4]),
                        tf.TensorShape([None, None, 13]),
                        tf.TensorShape([None, None, 3]),
                        tf.TensorShape([None, None, 3]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 20, 20, 3]),
                        tf.TensorShape([None, None, 20, 20, 3])),
                       tf.TensorShape([None, None, 14])))

    validation_dataset = tf.data.Dataset.from_generator(
        generator=lambda: dataset_generator(path, batch_size=batch_size, validation_split=validation_split,
                                            subset='validation', shuffle=False),
        output_types=((tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32, tf.float32,
                       tf.float32, tf.float32, tf.float32, tf.float32), tf.float32),
        output_shapes=((tf.TensorShape([None, None, 1]),
                        tf.TensorShape([None, None, 1]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 4]),
                        tf.TensorShape([None, None, 4]),
                        tf.TensorShape([None, None, 13]),
                        tf.TensorShape([None, None, 3]),
                        tf.TensorShape([None, None, 3]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 2]),
                        tf.TensorShape([None, None, 20, 20, 3]),
                        tf.TensorShape([None, None, 20, 20, 3])),
                       tf.TensorShape([None, None, 14])))

    return {
        'train_dataset': train_dataset,
        'validation_dataset': validation_dataset
    }


if __name__ == '__main__':
    for input, label in dataset_generator('data/stats/', 4, subset='validation'):
        print('Pass')
    dataset = get_dataset('data/stats/', batch_size=1, validation_split=0.5)
    for input, label in dataset['validation_dataset'].take(1):
        print(input)
        print(label)
