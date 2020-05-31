import datetime
import numpy as np
import process_data
import tensorflow as tf
import os
import logging
import matplotlib.pyplot as plt
import brainer_layers
from tensorflow.keras import layers, models
from tensorflow.keras.applications import imagenet_utils as utils

DATASET_PATH = '/home/dorian/Documents/aibg/data/'
SAVE_PATH = './models/supervised'
BATCH_SIZE = 32
L2_PENALTY = 1e-4
NUM_CLASS = 12
LEARNING_RATE = 8e-5
VERSION = '_v1'

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


def create_model():
    base_model = brainer_layers.brainer_net_V1(input_shape=(200, 355, 3))
    base_model.summary()
    model = tf.keras.Sequential([
        base_model,
        layers.Flatten(),
        layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Dense(64, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Dense(32, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Dense(NUM_CLASS, activation='softmax', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))
    ])

    model.compile(optimizer=tf.keras.optimizers.Adam(lr=LEARNING_RATE),
                  # loss="categorical_crossentropy",
                  loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                  metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])

    model.summary()

    return model


def preprocessing_fn(x, **kwargs):
    return utils.preprocess_input(x, mode='torch', **kwargs)


def train(model, data, epochs, save_path):
    # Define some useful callbacks.
    early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_loss',
                                                  mode='min',
                                                  verbose=1,
                                                  patience=20)
    csv_logger = tf.keras.callbacks.CSVLogger(save_path + '-brainer{}.csv'.format(VERSION), append=False)
    model_ckpt = tf.keras.callbacks.ModelCheckpoint(filepath=save_path + '-brainer{}.h5'.format(VERSION),
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
        steps_per_epoch=data['steps_per_epoch'],
        epochs=epochs,
        validation_data=data['validation_dataset'],
        validation_steps=data['validation_steps'],
        class_weight=data['class_weights'],
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
    best_model = tf.keras.models.load_model(save_path + '-brainer{}.h5'.format(VERSION))
    best_model.save(export_path, save_format='tf')
    logger.info('Exported SavedModel to {}'.format(save_path))


if __name__ == '__main__':
    logging.basicConfig()
    logger.setLevel(logging.INFO)
    model = create_model()
    data = process_data.get_dataset(DATASET_PATH, model.input_shape[1:3], BATCH_SIZE, preprocessing_fn, logger=logger)
    train(model, data, 100, SAVE_PATH)
    save_model(SAVE_PATH, VERSION)
