import datetime
import numpy as np
import autoencoder_data_processor as adp
import tensorflow as tf
import os
import logging
import matplotlib.pyplot as plt
from tensorflow.keras import layers, models

DATASET_PATH = 'data/stats'
SAVE_PATH = 'models/autoencoder'
BATCH_SIZE = 512
FINE_TUNE_BATCH_SIZE = 32
L2_PENALTY = 1e-4
NUM_CLASS = 14
LEARNING_RATE = 1e-4
FINE_TUNE_LR = 1e-4
MOMENTUM = 0.9
EPOCHS = 10
FINE_TUNE_EPOCHS = 50
PATIENCE = 5
VERSION = 'v1'

class AutoencoderBrainerV1:
    def __init__(self, load_weights):


def create_train_model(learning_rate=LEARNING_RATE, load_last=False):
    encoder = models.Sequential([
        layers.Dense(1024, input_shape=(2435,), kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(512, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(256, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(128, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('sigmoid')
    ])

    autoencoder = models.Sequential([
        encoder,
        layers.Dense(256, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(512, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(1024, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)),
        layers.Activation('relu'),
        layers.Dense(2435, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))
    ])

    autoencoder.compile(optimizer=tf.keras.optimizers.Adam(lr=learning_rate),
                        loss=tf.keras.losses.MeanSquaredError())
    # metrics=['mse'])

    autoencoder.summary()

    if load_last:
        autoencoder.load_weights(SAVE_PATH + '-brainer_{}.h5'.format(VERSION))

    return encoder, autoencoder


def train(model, data, epochs, save_path, initial_epoch=0):
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
        epochs=initial_epoch + epochs,
        validation_data=data['validation_dataset'],
        verbose=1,
        workers=4,
        use_multiprocessing=True,
        initial_epoch=initial_epoch,
        callbacks=[early_stop, model_ckpt, csv_logger, tensorboard_callback])

    # Plot and save results.
    # mse = history.history['mse']
    # val_mse = history.history['val_mse']
    loss = history.history['loss']
    val_loss = history.history['val_loss']
    epochs = range(len(loss))

    # plot_two_and_save(epochs, mse, val_mse, 'Smoothed training mse', 'Smoothed validation mse',
    #                  'Training and validation mse', save_path + '-train-mse.png')
    plot_two_and_save(epochs, loss, val_loss, 'Smoothed training loss', 'Smoothed validation loss',
                      'Training and validation loss', save_path + '-train-loss.png')


def get_encoder():
    encoder, ae = create_train_model(LEARNING_RATE, True)
    return encoder


def save_model(save_path, version):
    export_path = os.path.join(save_path, str(version))
    if not os.path.exists(export_path):
        os.makedirs(export_path)
    best_model = tf.keras.models.load_model(save_path + '-brainer_{}.h5'.format(VERSION))
    best_model.save(export_path, save_format='tf')
    logger.info('Exported SavedModel to {}'.format(save_path))


def main(load_previous_model, initial_epoch, fine_tune):
    logging.basicConfig()
    logger.setLevel(logging.INFO)
    encoder, ae = create_train_model(learning_rate=LEARNING_RATE if not fine_tune else FINE_TUNE_LR,
                                     load_last=load_previous_model)
    limit = None if not fine_tune else 1024
    batch_size = BATCH_SIZE if not fine_tune else FINE_TUNE_BATCH_SIZE
    data = adp.get_dataset(DATASET_PATH, batch_size, validation_split=0.2, limit_train=limit, limit_validation=limit)

    train(ae, data, EPOCHS if not fine_tune else FINE_TUNE_EPOCHS, SAVE_PATH, initial_epoch)
    # save_model(SAVE_PATH, VERSION)


if __name__ == '__main__':
    main(True, 274, True)
