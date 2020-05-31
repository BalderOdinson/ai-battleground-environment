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


def find_path_by_index(mappings, idx):
    current = 0
    while current + 1 < len(mappings) and idx >= mappings[current + 1][0]:
        current += 1
    return mappings[current]


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


def dataset_generator(path, batch_size=32, subset='train', validation_split=0.2, shuffle=False,
                      limit_dataset_size=None):
    stats_paths = glob(path + '**/*.*', recursive=True)

    dataset_size = 0
    index_mappings = []

    for path in stats_paths:
        index_mappings.append((dataset_size, path))
        dataset_size += len(pd.read_csv(path))

    validation_size = int(dataset_size * validation_split)
    train_size = dataset_size - validation_size

    begin = 0 if subset == 'train' else train_size
    end = train_size if subset == 'train' else dataset_size

    indices = list(range(begin, end))
    if shuffle:
        random.shuffle(indices)

    if subset == 'train' and limit_dataset_size is not None and limit_dataset_size > 0:
        indices = indices[:limit_dataset_size]

    if subset == 'validation' and limit_dataset_size is not None and limit_dataset_size > 0:
        indices = np.linspace(begin, end - 1, limit_dataset_size, dtype=np.int32)

    for index in range(0, len(indices), batch_size):
        batch = None
        for i in range(index, index + min(batch_size, end - (index + begin))):
            idx = indices[i]

            mapping = find_path_by_index(index_mappings, idx)

            s = mapping[1]
            df = pd.read_csv(s).iloc[idx - mapping[0]]
            df['player_morph'] = pd.Categorical(df['player_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                ordered=True)
            df['player_morph'] = df.player_morph.codes[0]
            df['enemy_morph'] = pd.Categorical(df['enemy_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                               ordered=True)
            df['enemy_morph'] = df.enemy_morph.codes[0]
            df['enemy_last_move'] = pd.Categorical(df['enemy_last_move'],
                                                   categories=ACTION_CATEGORIES,
                                                   ordered=True)
            df['enemy_last_move'] = df.enemy_last_move.codes[0]
            df['next_move'] = pd.Categorical(df['next_move'],
                                             categories=ACTION_CATEGORIES,
                                             ordered=True)
            df['next_move'] = df.next_move.codes[0]

            player_hp = np.expand_dims(df.pop('player_health').clip(0, 100), -1)
            enemy_hp = np.expand_dims(df.pop('enemy_health').clip(0, 100), -1)
            life = np.array([df.pop('player_lives'), df.pop('enemy_lives')])
            player_morph = np.eye(len(MORPHS_CATEGORIES), dtype=np.float32)[df.pop('player_morph')]
            enemy_morph = np.eye(len(MORPHS_CATEGORIES), dtype=np.float32)[df.pop('enemy_morph')]
            last_enemy_move = np.eye(len(ACTION_CATEGORIES) - 1, dtype=np.float32)[df.pop('enemy_last_move')]
            player_gem = np.array([df.pop('player_red_gems'), df.pop('player_blue_gems'), df.pop('player_green_gems')])
            player_position = np.array([df.pop('player_x'), df.pop('player_y')])
            enemy_position = np.array([df.pop('enemy_x'), df.pop('enemy_y')])
            terrain_sample = np.reshape(get_images([df.pop('terrain')], 0)[0], [1200])
            terrain_objects_sample = np.reshape(get_images([df.pop('items')], 0)[0], [1200])
            df.pop('next_move')
            enemy_gem = df.to_numpy(dtype=np.float32)

            x = np.concatenate((player_hp, enemy_hp, life, player_morph, enemy_morph, last_enemy_move, player_gem,
                                enemy_gem, player_position, enemy_position, terrain_sample, terrain_objects_sample))

            if batch is None:
                batch = np.expand_dims(x, 0)
            else:
                batch = np.append(batch, np.expand_dims(x, 0), axis=0)

        yield batch, batch


def get_dataset(path, batch_size=32, validation_split=0.2, limit_train=None, limit_validation=None):
    io_type = tf.float32
    o_types = (io_type, io_type)

    io_shape = (tf.TensorShape([None, 2435]))
    o_shapes = (io_shape, io_shape)

    train_dataset = tf.data.Dataset.from_generator(
        generator=lambda: dataset_generator(path, batch_size=batch_size, validation_split=validation_split,
                                            subset='train', shuffle=True, limit_dataset_size=limit_train),
        output_types=o_types,
        output_shapes=o_shapes)

    validation_dataset = tf.data.Dataset.from_generator(
        generator=lambda: dataset_generator(path, batch_size=batch_size, validation_split=validation_split,
                                            subset='validation', shuffle=False, limit_dataset_size=limit_validation),
        output_types=o_types,
        output_shapes=o_shapes)

    return {
        'train_dataset': train_dataset,
        'validation_dataset': validation_dataset
    }


if __name__ == '__main__':
    # for input, label in dataset_generator('data/stats/', 32, subset='validation'):
    #     print('Pass')
    dataset = get_dataset('data/stats/', batch_size=32, validation_split=0.2)
    for input, output in dataset['validation_dataset'].take(1):
        print(input)
        print(output)
