import pandas as pd
import random
import numpy as np
import tensorflow as tf
import os
from abc import abstractmethod
from glob import glob


class BaseDataLoader:
    def __init__(self, path):
        self.path = path
        self.ACTIONS = ['_', 'w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mf', 'mw', 'mg']
        self.ACTIONS_WITH_EMPTY = ['_', 'w', 'a', 's', 'd', 'rw', 'ra', 'rs', 'rd', 'mn', 'mf', 'mw', 'mg', 'empty']
        self.MORPHS = ['NEUTRAL', 'FIRE', 'WATER', 'GRASS']
        self.ACTION_TYPES = ['move', 'collect', 'transform', 'attack', 'restore_hp', 'wait']
        self.ACTION_TYPES_WITH_EMPTY = ['move', 'collect', 'transform', 'attack', 'restore_hp', 'wait', 'empty']

    @abstractmethod
    def get_dataset(self, batch_size, validation_split, **kwargs):
        pass

    @staticmethod
    def find_path_by_index(mappings, idx):
        current = 0
        while current + 1 < len(mappings) and idx >= mappings[current + 1][0]:
            current += 1
        return mappings[current]

    @staticmethod
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


class BaseSequenceDataLoader(BaseDataLoader):
    @abstractmethod
    def extract_features_and_labels(self, df):
        pass

    def dataset_generator(self, batch_size=32, subset='train', validation_split=0.2, shuffle=False):
        stats_paths = glob(os.path.join(self.path, '*.*'), recursive=True)

        dataset_size = len(stats_paths)

        validation_size = int(dataset_size * validation_split)
        train_size = dataset_size - validation_size

        begin = 0 if subset == 'train' else train_size
        end = train_size if subset == 'train' else dataset_size

        indices = list(range(begin, end))
        if shuffle:
            random.shuffle(indices)

        for index in range(0, len(indices), batch_size):
            batch_features = []
            batch_labels = []

            for i in range(index, index + min(batch_size, end - (index + begin))):
                s = stats_paths[indices[i]]
                df = pd.read_csv(s)
                df['player_morph'] = pd.Categorical(df['player_morph'],
                                                    categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                    ordered=True)
                df['player_morph'] = df.player_morph.cat.codes
                df['enemy_morph'] = pd.Categorical(df['enemy_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                   ordered=True)
                df['enemy_morph'] = df.enemy_morph.cat.codes
                df['enemy_last_action'] = pd.Categorical(df['enemy_last_action'],
                                                         categories=self.ACTIONS,
                                                         ordered=True)
                df['enemy_last_action'] = df.enemy_last_action.cat.codes
                df['next_action_type'] = pd.Categorical(df['next_action_type'],
                                                        categories=self.ACTION_TYPES,
                                                        ordered=True)
                df['next_action_type'] = df.next_action_type.cat.codes
                df['next_action'] = pd.Categorical(df['next_action'],
                                                   categories=self.ACTIONS,
                                                   ordered=True)
                df['next_action'] = df.next_action.cat.codes

                data_frame = {
                    'player_hp': np.expand_dims(df.pop('player_health').clip(0, 100).to_numpy(), -1),
                    'enemy_hp': np.expand_dims(df.pop('enemy_health').clip(0, 100).to_numpy(), -1),
                    'player_life': np.expand_dims(df.pop('player_lives').to_numpy(), -1),
                    'enemy_life': np.expand_dims(df.pop('enemy_lives').to_numpy(), -1),
                    'player_morph': np.eye(len(self.MORPHS), dtype=np.float32)[df.pop('player_morph').to_numpy()],
                    'enemy_morph': np.eye(len(self.MORPHS), dtype=np.float32)[df.pop('enemy_morph').to_numpy()],
                    'last_enemy_action': np.eye(len(self.ACTIONS), dtype=np.float32)[
                        df.pop('enemy_last_action').to_numpy()],
                    'player_gems': pd.DataFrame([df.pop('player_red_gems'), df.pop('player_blue_gems'),
                                                 df.pop('player_green_gems')]).T.to_numpy(),
                    'enemy_gems': pd.DataFrame(
                        [df.pop('enemy_red_gems'), df.pop('enemy_blue_gems'), df.pop('enemy_green_gems')]).T.to_numpy(),
                    'player_position': pd.DataFrame([df.pop('player_x'), df.pop('player_y')]).T.to_numpy(),
                    'enemy_position': pd.DataFrame([df.pop('enemy_x'), df.pop('enemy_y')]).T.to_numpy(),
                    'terrain': self.get_images(df.pop('terrain'), 0),
                    'terrain_items': self.get_images(df.pop('items'), 0),
                    'next_action_type': np.eye(len(self.ACTION_TYPES), dtype=np.float32)[df.pop('next_action_type')],
                    'next_action': np.eye(len(self.ACTIONS), dtype=np.float32)[df.pop('next_action')]
                }

                features, labels = self.extract_features_and_labels(data_frame)

                if not batch_features:
                    for j in range(len(features)):
                        batch_features.append([])
                    for j in range(len(labels)):
                        batch_labels.append([])

                for j in range(len(features)):
                    batch_features[j].append(features[j])

                for j in range(len(labels)):
                    batch_labels[j].append(labels[j])

            for i in range(len(batch_features)):
                batch_features[i] = tf.keras.preprocessing.sequence.pad_sequences(batch_features[i], padding='post',
                                                                                  value=-1.)
            for i in range(len(batch_labels)):
                batch_labels[i] = tf.keras.preprocessing.sequence.pad_sequences(batch_labels[i], padding='post',
                                                                                value=0.)

            batch_features = batch_features[0] if len(batch_features) == 1 else batch_features
            batch_labels = batch_labels[0] if len(batch_labels) == 1 else batch_labels
            yield batch_features, batch_labels


class BaseSingleDataLoader(BaseDataLoader):
    @abstractmethod
    def extract_features_and_labels(self, df):
        pass

    def dataset_generator(self, batch_size=32, subset='train', validation_split=0.2, shuffle=False,
                          limit_dataset_size=None):
        stats_paths = glob(os.path.join(self.path, '*.*'), recursive=True)

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
            batch_features = []
            batch_labels = []
            for i in range(index, index + min(batch_size, end - (index + begin))):
                idx = indices[i]

                mapping = self.find_path_by_index(index_mappings, idx)

                s = mapping[1]
                df = pd.read_csv(s).iloc[idx - mapping[0]]
                df['player_morph'] = pd.Categorical(df['player_morph'],
                                                    categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                    ordered=True)
                df['player_morph'] = df.player_morph.codes[0]
                df['enemy_morph'] = pd.Categorical(df['enemy_morph'], categories=['NEUTRAL', 'FIRE', 'WATER', 'GRASS'],
                                                   ordered=True)
                df['enemy_morph'] = df.enemy_morph.codes[0]
                df['enemy_last_action'] = pd.Categorical(df['enemy_last_action'],
                                                         categories=self.ACTIONS,
                                                         ordered=True)
                df['enemy_last_action'] = df.enemy_last_action.codes[0]

                df['next_action_type'] = pd.Categorical(df['next_action_type'],
                                                        categories=self.ACTION_TYPES,
                                                        ordered=True)
                df['next_action_type'] = df.next_action_type.codes[0]
                df['next_action'] = pd.Categorical(df['next_action'],
                                                   categories=self.ACTIONS,
                                                   ordered=True)
                df['next_action'] = df.next_action.codes[0]

                data_frame = {
                    'player_hp': np.expand_dims(df.pop('player_health').clip(0, 100), -1),
                    'enemy_hp': np.expand_dims(df.pop('enemy_health').clip(0, 100), -1),
                    'player_life': np.expand_dims(df.pop('player_lives'), -1),
                    'enemy_life': np.expand_dims(df.pop('enemy_lives'), -1),
                    'player_morph': np.eye(len(self.MORPHS), dtype=np.float32)[df.pop('player_morph')],
                    'enemy_morph': np.eye(len(self.MORPHS), dtype=np.float32)[df.pop('enemy_morph')],
                    'last_enemy_action': np.eye(len(self.ACTIONS), dtype=np.float32)[df.pop('enemy_last_action')],
                    'player_gems': pd.DataFrame(
                        [df.pop('player_red_gems'), df.pop('player_blue_gems'), df.pop('player_green_gems')]),
                    'enemy_gems': pd.DataFrame(
                        [df.pop('enemy_red_gems'), df.pop('enemy_blue_gems'), df.pop('enemy_green_gems')]),
                    'player_position': pd.DataFrame([df.pop('player_x'), df.pop('player_y')]),
                    'enemy_position': pd.DataFrame([df.pop('enemy_x'), df.pop('enemy_y')]),
                    'terrain': self.get_images(df.pop('terrain'), 0)[0],
                    'terrain_items': self.get_images(df.pop('items'), 0)[0],
                    'next_action_type': np.eye(len(self.ACTION_TYPES), dtype=np.float32)[df.pop('next_action_type')],
                    'next_action': np.eye(len(self.ACTIONS), dtype=np.float32)[df.pop('next_action')]
                }

                features, labels = self.extract_features_and_labels(data_frame)

                if not batch_features:
                    for j in range(len(features)):
                        batch_features.append([])
                    for j in range(len(labels)):
                        batch_labels.append([])

                for j in range(len(features)):
                    batch_features[j].append(features[j])

                for j in range(len(labels)):
                    batch_labels[j].append(labels[j])

            batch_features = batch_features[0] if len(batch_features) == 1 else batch_features
            batch_labels = batch_labels[0] if len(batch_labels) == 1 else batch_labels
            yield batch_features, batch_labels


class AeBV1DL(BaseSingleDataLoader):
    def extract_features_and_labels(self, df):
        x = np.concatenate((df['player_hp'], df['enemy_hp'], df['player_life'], df['enemy_life'], df['player_morph'],
                            df['enemy_morph'], df['last_enemy_action'], df['player_gems'], df['enemy_gems'],
                            df['player_position'], df['enemy_position'], np.reshape(df['terrain'], [1200]),
                            np.reshape(df['terrain_items']), [1200]))

        return [x], [x]

    def get_dataset(self, batch_size, validation_split, **kwargs):
        io_type = tf.float32
        o_types = (io_type, io_type)

        io_shape = (tf.TensorShape([None, 2435]))
        o_shapes = (io_shape, io_shape)

        train_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='train', shuffle=True,
                                                     limit_dataset_size=kwargs.get('limit_train', None)),
            output_types=o_types,
            output_shapes=o_shapes)

        validation_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='validation', shuffle=False,
                                                     limit_dataset_size=kwargs.get('limit_validation', None)),
            output_types=o_types,
            output_shapes=o_shapes)

        return {
            'train_dataset': train_dataset,
            'validation_dataset': validation_dataset
        }


class SBV3PretrainDL(BaseSequenceDataLoader):
    def __init__(self, path, encoder, features_count=128):
        super().__init__(path)
        self.encoder = encoder
        self.features_count = features_count

    def extract_features_and_labels(self, df):
        x = np.concatenate((df['player_hp'], df['enemy_hp'], df['player_life'], df['enemy_life'], df['player_morph'],
                            df['enemy_morph'], df['last_enemy_action'], df['player_gems'], df['enemy_gems'],
                            df['player_position'], df['enemy_position'], np.reshape(df['terrain'], [-1, 1200]),
                            np.reshape(df['terrain_items']), [-1, 1200]))
        x = self.encoder.predict(x)
        y = df['next_action_type']

        return [x], [y]

    def get_dataset(self, batch_size, validation_split, **kwargs):
        io_type = tf.float32
        o_types = (io_type, io_type)

        i_shape = tf.TensorShape([None, self.features_count])
        o_shape = tf.TensorShape([None, len(self.ACTION_TYPES)])
        o_shapes = (i_shape, o_shape)

        train_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='train', shuffle=True),
            output_types=o_types,
            output_shapes=o_shapes)

        validation_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='validation', shuffle=False),
            output_types=o_types,
            output_shapes=o_shapes)

        return {
            'train_dataset': train_dataset,
            'validation_dataset': validation_dataset
        }


class SBV3TrainDL(BaseSequenceDataLoader):
    def __init__(self, path, encoder, features_count=128):
        super().__init__(path)
        self.encoder = encoder
        self.features_count = features_count

    def extract_features_and_labels(self, df):
        x = np.concatenate((df['player_hp'], df['enemy_hp'], df['player_life'], df['enemy_life'], df['player_morph'],
                            df['enemy_morph'], df['last_enemy_action'], df['player_gems'], df['enemy_gems'],
                            df['player_position'], df['enemy_position'], np.reshape(df['terrain'], [-1, 1200]),
                            np.reshape(df['terrain_items']), [-1, 1200]))
        x = self.encoder.predict(x)
        y = df['next_action']

        return [x], [y]

    def get_dataset(self, batch_size, validation_split, **kwargs):
        io_type = tf.float32
        o_types = (io_type, io_type)

        i_shape = tf.TensorShape([None, self.features_count])
        o_shape = tf.TensorShape([None, len(self.ACTIONS)])
        o_shapes = (i_shape, o_shape)

        train_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='train', shuffle=True),
            output_types=o_types,
            output_shapes=o_shapes)

        validation_dataset = tf.data.Dataset.from_generator(
            generator=lambda: self.dataset_generator(batch_size=batch_size, validation_split=validation_split,
                                                     subset='validation', shuffle=False),
            output_types=o_types,
            output_shapes=o_shapes)

        return {
            'train_dataset': train_dataset,
            'validation_dataset': validation_dataset
        }
