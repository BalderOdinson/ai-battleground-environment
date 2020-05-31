import datetime
import numpy as np
import data_processor
import tensorflow as tf
import os
import logging
import matplotlib.pyplot as plt
from tensorflow.keras import layers, models
from tensorflow.keras.applications import imagenet_utils as utils

DATASET_PATH = 'data/stats'
SAVE_PATH = 'models/supervised'
BATCH_SIZE = 4
L2_PENALTY = 1e-4
NUM_CLASS = 14
LEARNING_RATE = 1e-4
MOMENTUM = 0.9
EPOCHS = 1000
PATIENCE = 100
VERSION = 'v2'

logger = logging.getLogger(__name__)


def smooth_curve(points, factor=0.8):
    smoothed_points = []
    for point in points:
        if smoothed_points:
            previous = smoothed_points[-1]
            smoothed_points.append(previous * factor + point * (1 - factor))
        else:
            smoothed_points.append(point)
    return smoothed_points


def plot_two_and_save(x, y1, y2, label1, label2, title, save_name, smooth=True):
    plt.figure()
    plt.plot(x, (y1, smooth_curve(y1))[smooth], 'bo', label=label1)
    plt.plot(x, (y2, smooth_curve(y2))[smooth], 'b', label=label2)
    plt.title(title)
    plt.legend()
    plt.savefig(save_name)
    plt.show()
    plt.clf()
    plt.close()
    return


def create_train_model():
    player_position = layers.Input(shape=(None, 2))
    enemy_position = layers.Input(shape=(None, 2))
    terrain = layers.Input(shape=(None, 20, 20, 3))
    terrain_flatten = layers.TimeDistributed(layers.Flatten())(terrain)
    terrain_objects = layers.Input(shape=(None, 20, 20, 3))
    terrain_objects_flatten = layers.TimeDistributed(layers.Flatten())(terrain_objects)
    player_hp = layers.Input(shape=(None, 1))
    enemy_hp = layers.Input(shape=(None, 1))
    lives = layers.Input(shape=(None, 2))
    player_morph = layers.Input(shape=(None, 4))
    enemy_morph = layers.Input(shape=(None, 4))
    last_enemy_move = layers.Input(shape=(None, 13))
    player_gems = layers.Input(shape=(None, 3))
    enemy_gems = layers.Input(shape=(None, 3))

    out = layers.Concatenate()(
        [player_position, enemy_position, terrain_flatten, terrain_objects_flatten, player_hp, enemy_hp, lives,
         player_morph, enemy_morph, last_enemy_move, player_gems, enemy_gems])
    out = layers.TimeDistributed(layers.Masking(-1))(out)
    out = layers.TimeDistributed(
        layers.Dense(1024, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))(out)
    out = layers.LSTM(512, return_sequences=True, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(out)
    out = layers.TimeDistributed(
        layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))(out)
    out = layers.TimeDistributed(layers.Dropout(0.2))(out)
    out = layers.TimeDistributed(
        layers.Dense(NUM_CLASS, activation='softmax', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))(out)

    model = models.Model(
        [player_hp, enemy_hp, lives, player_morph, enemy_morph, last_enemy_move,
         player_gems, enemy_gems, player_position, enemy_position, terrain, terrain_objects], out)

    model.compile(optimizer=tf.keras.optimizers.Adam(lr=LEARNING_RATE),
                  loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                  metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])

    model.summary()

    return model


def load_inference_model(version):
    player_position = layers.Input(batch_shape=(1, 2))
    p_pos = layers.Dense(400, activation='softmax')(player_position)
    p_pos = layers.Reshape((20, 20, 1))(p_pos)

    enemy_position = layers.Input(batch_shape=(1, 2))
    e_pos = layers.Dense(400, activation='softmax')(enemy_position)
    e_pos = layers.Reshape((20, 20, 1))(e_pos)

    terrain = layers.Input(batch_shape=(1, 20, 20, 3))
    x = layers.Add()([layers.Multiply()([terrain, p_pos]), layers.Multiply()([terrain, e_pos])])
    x = layers.Conv2D(8, (9, 9), activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Flatten()(x)
    x = layers.Dense(128, activation='relu')(x)

    terrain_objects = layers.Input(batch_shape=(1, 20, 20, 3))
    y = layers.Add()([layers.Multiply()([terrain_objects, p_pos]), layers.Multiply()([terrain_objects, e_pos])])
    y = layers.Conv2D(8, (9, 9), activation='relu')(y)
    y = layers.BatchNormalization()(y)
    y = layers.MaxPooling2D((2, 2))(y)
    y = layers.Flatten()(y)
    y = layers.Dense(128, activation='relu')(y)

    stats = layers.Input(batch_shape=(1, 13))
    z = layers.Dense(128, activation='relu')(stats)

    out = layers.Concatenate()([x, y, z])
    out = layers.RepeatVector(1)(out)
    out = layers.LSTM(256, stateful=True)(out)
    out = layers.Dropout(0.2)(out)
    out = layers.Dense(NUM_CLASS, activation='softmax')(out)

    train_model = tf.keras.models.load_model(SAVE_PATH + '-brainer_{}.h5'.format(version))

    model = models.Model([player_position, enemy_position, terrain, terrain_objects, stats], out)
    model.set_weights(train_model.get_weights())

    return model


def train(model, data, epochs, save_path):
    # Define some useful callbacks.
    early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss',
                                                  mode='min',
                                                  verbose=1,
                                                  patience=PATIENCE)
    csv_logger = tf.keras.callbacks.CSVLogger(save_path + '-brainer_{}.csv'.format(VERSION), append=False)
    model_ckpt = tf.keras.callbacks.ModelCheckpoint(filepath=save_path + '-brainer_{}.h5'.format(VERSION),
                                                    monitor='val_loss',
                                                    verbose=1,
                                                    save_best_only=True)

    log_dir = save_path + "/logs/test/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

    # Actual training.
    history = model.fit(
        x=data['train_dataset'],
        epochs=epochs,
        validation_data=data['validation_dataset'],
        verbose=1,
        workers=4,
        use_multiprocessing=True,
        callbacks=[early_stop, model_ckpt, csv_logger, tensorboard_callback])

    # Plot and save results.
    acc = history.history['accuracy']
    val_acc = history.history['val_accuracy']
    loss = history.history['loss']
    val_loss = history.history['val_loss']
    epochs = range(len(acc))

    plot_two_and_save(epochs, acc, val_acc, 'Smoothed training acc', 'Smoothed validation acc',
                      'Training and validation acc', save_path + '-train-acc.png')
    plot_two_and_save(epochs, loss, val_loss, 'Smoothed training loss', 'Smoothed validation loss',
                      'Training and validation loss', save_path + '-train-loss.png')


def save_model(save_path, version):
    export_path = os.path.join(save_path, str(version))
    if not os.path.exists(export_path):
        os.makedirs(export_path)
    best_model = tf.keras.models.load_model(save_path + '-brainer_{}.h5'.format(VERSION))
    best_model.save(export_path, save_format='tf')
    logger.info('Exported SavedModel to {}'.format(save_path))


if __name__ == '__main__':
    logging.basicConfig()
    logger.setLevel(logging.INFO)
    model = create_train_model()
    data = data_processor.get_dataset(DATASET_PATH, BATCH_SIZE, validation_split=0.2)
    train(model, data, EPOCHS, SAVE_PATH)
    save_model(SAVE_PATH, VERSION)
