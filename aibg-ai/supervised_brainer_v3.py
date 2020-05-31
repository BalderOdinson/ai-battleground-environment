import datetime
import numpy as np
import data_processor
import tensorflow as tf
import os
import logging
import utils
from brainer_layers import Sampling
from data_processing import SBV3PretrainDL, SBV3TrainDL
from tensorflow.keras import layers, models

DATASET_PATH = os.getenv('DATASET_PATH', 'data/stats')
SAVE_PATH = os.getenv('SAVE_PATH', 'models/supervised')
BATCH_SIZE = 4
VALIDATION_SPLIT = 0.2
L2_PENALTY = 1e-4
NUM_CLASS = 13
LEARNING_RATE = 1e-4
MOMENTUM = 0.9
EPOCHS = 1000
PATIENCE = 10
VERSION = 'v3'


class SupervisedBrainerV3:
    class Type:
        PRETRAIN = 0
        TRAIN = 1
        FINE_TUNE = 2
        INFERENCE = 3

    def __init__(self, net_type: Type = Type.INFERENCE):
        ###############################################################
        # Create base model
        ###############################################################
        x = layers.Input(shape=(None, 128))

        y = layers.TimeDistributed(layers.Masking(-1))(x)
        y = layers.LSTM(256, return_sequences=True, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(y)
        mean, log_var = tf.split(y, num_or_size_splits=2, axis=1)
        kl_loss = - 0.5 * tf.reduce_mean(
            log_var - tf.square(mean) - tf.exp(log_var) + 1)
        y = Sampling()((mean, log_var))
        y = layers.TimeDistributed(
            layers.Dense(64, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))(y)
        self.base_model = models.Model(x, y)
        self.base_model.add_loss(kl_loss)
        ###############################################################

        ###############################################################
        # Create pretrain model
        ###############################################################
        num_of_classes = 6  # move, collect, transform, attack, restore hp, wait
        self.pretrain_model = models.Sequential([
            self.base_model,
            layers.TimeDistributed(
                layers.Dense(num_of_classes, activation='softmax',
                             kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))
        ])
        if net_type is SupervisedBrainerV3.Type.TRAIN:
            self.pretrain_model.load_weights(SAVE_PATH + '-pretrain-brainer_{}.h5'.format(VERSION))
        ###############################################################

        ###############################################################
        # Create train model
        ###############################################################
        num_of_classes = 13  # all possible actions
        self.model = models.Sequential([
            self.base_model,
            layers.TimeDistributed(
                layers.Dense(num_of_classes, activation='softmax',
                             kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY)))
        ])
        if SupervisedBrainerV3.Type.FINE_TUNE:
            self.model.load_weights(SAVE_PATH + '-brainer_{}.h5'.format(VERSION))
            ###############################################################

        ###############################################################
        # Create inference model
        ###############################################################
        self.autoencoder = None  # TODO: load autoencoder
        num_of_classes = 13  # all possible actions
        x = layers.Input(batch_shape=(1, 128))

        y = layers.Masking(-1)(x)
        y = layers.RepeatVector(1)(y)
        y = layers.LSTM(256, stateful=True)(y)

        mean, log_var = tf.split(y, num_or_size_splits=2, axis=1)
        y = Sampling()((mean, log_var))

        y = layers.Dense(64, activation='relu')(y)
        y = layers.Dense(num_of_classes, activation='softmax')(y)

        self.inference_model = models.Model(x, y)

        self.inference_model_with_ae = models.Sequential([
            self.autoencoder.get_encoder(),
            self.inference_model
        ])

        if SupervisedBrainerV3.Type.INFERENCE:
            self.inference_model.load_weights(self.model.get_weights())
        ###############################################################

    def pretrain(self, learning_rate=1e-4, epochs=1000, batch_size=BATCH_SIZE, validation_split=VALIDATION_SPLIT):
        data_loader = SBV3PretrainDL(DATASET_PATH, self.autoencoder.get_encoder())
        data = data_loader.get_dataset(batch_size, validation_split)

        self.pretrain_model.compile(optimizer=tf.keras.optimizers.Adam(lr=learning_rate),
                                    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                                    metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
        self.pretrain_model.summary()
        self._train_model(self.pretrain_model, data, epochs, os.path.join(SAVE_PATH, '-pretrain'))

        return self.pretrain_model

    def train(self, learning_rate=1e-4, epochs=1000, batch_size=BATCH_SIZE, validation_split=VALIDATION_SPLIT):
        data_loader = SBV3TrainDL(DATASET_PATH, self.autoencoder.get_encoder())
        data = data_loader.get_dataset(batch_size, validation_split)

        # Train output layer
        self.base_model.trainable = False
        self.model.compile(optimizer=tf.keras.optimizers.Adam(lr=learning_rate),
                           loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                           metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
        self.model.summary()
        self._train_model(self.model, data, epochs, SAVE_PATH)

        return self.model

    def fine_tune(self, learning_rate=1e-5, epochs=100, batch_size=BATCH_SIZE, validation_split=VALIDATION_SPLIT):
        data_loader = SBV3TrainDL(DATASET_PATH, self.autoencoder.get_encoder())
        data = data_loader.get_dataset(batch_size, validation_split)

        # Fine-tune model
        self.base_model.trainable = True
        self.model.compile(optimizer=tf.keras.optimizers.Adam(lr=learning_rate),
                           loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
                           metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
        self._train_model(self.model, data, epochs, SAVE_PATH)

    @staticmethod
    def _train_model(model, data, epochs, save_path):
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

        utils.plot_two_and_save(epochs, acc, val_acc, 'Smoothed training acc', 'Smoothed validation acc',
                                'Training and validation acc', save_path + '-train-acc.png')
        utils.plot_two_and_save(epochs, loss, val_loss, 'Smoothed training loss', 'Smoothed validation loss',
                                'Training and validation loss', save_path + '-train-loss.png')


def main():
    model = create_train_model()
    data = data_processor.get_encoded_dataset(DATASET_PATH, BATCH_SIZE, validation_split=0.2)
    train(model, data, EPOCHS, SAVE_PATH)


if __name__ == '__main__':
    main()
