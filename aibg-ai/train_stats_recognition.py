import os
import pandas as pd
import logging
import tensorflow as tf
import datetime
import brainer_layers
from train_nn import preprocessing_fn
from train_nn import plot_two_and_save
from tensorflow.keras import layers, models

LEFT_DATA = 'data/left/data.csv'
RIGHT_DATA = 'data/left/data.csv'
SAVE_PATH = './models/supervised'
NUM_CLASS = 7
BATCH_SIZE = 32
L2_PENALTY = 1e-4
LEARNING_RATE = 1e-4
VERSION = '_stats_v1'

logger = logging.getLogger(__name__)


def get_dataframe(dataset, seed=None, shuffle=True, logger=None):
    df = pd.read_csv(dataset)
    df['morph'] = pd.Categorical(df['morph'])
    df['morph'] = df.morph.cat.codes

    for i in range(len(df)):
        df['input'][i] = os.path.abspath(df['input'][i])

    df *= 1

    if shuffle:
        df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    return df


def get_dataset(dataset, input_size, batch_size, preprocessor, logger=None, validation_split=0.2, data_augment=False,
                seed=None):
    df = get_dataframe(dataset, seed, logger=logger)

    test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        validation_split=validation_split,
        preprocessing_function=preprocessor)

    validation_generator = test_datagen.flow_from_dataframe(
        df,
        subset='validation',
        shuffle=False,
        x_col='input',
        y_col=['is_player', 'health', 'lives', 'red_gems', 'blue_gems', 'green_gems', 'morph'],
        class_mode='raw',
        target_size=input_size,
        batch_size=batch_size,
        seed=seed)

    if data_augment:
        train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
            validation_split=validation_split,
            preprocessing_function=preprocessor,
            rotation_range=40,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest')
    else:
        train_datagen = test_datagen

    train_generator = train_datagen.flow_from_dataframe(
        df,
        subset='training',
        shuffle=True,
        x_col='input',
        y_col=['is_player', 'health', 'lives', 'red_gems', 'blue_gems', 'green_gems', 'morph'],
        class_mode='raw',
        target_size=input_size,
        batch_size=batch_size,
        seed=seed)

    if logger is not None:
        logger.info('Generating validation dataset.')
    validation_dataset = tf.data.Dataset.from_generator(
        generator=lambda: validation_generator,
        output_types=(tf.float32, tf.float32),
        output_shapes=(tf.TensorShape([None, input_size[0], input_size[1], 3]),
                       tf.TensorShape([None, NUM_CLASS])))

    if logger is not None:
        logger.info('Generating train dataset.')

    train_dataset = tf.data.Dataset.from_generator(
        generator=lambda: train_generator,
        output_types=(tf.float32, tf.float32),
        output_shapes=(tf.TensorShape([None, input_size[0], input_size[1], 3]),
                       tf.TensorShape([None, NUM_CLASS])))

    if logger is not None:
        logger.info('Number of training samples: {}'.format(train_generator.samples))
        logger.info('Number of validation samples: {}'.format(validation_generator.samples))

    # Training data is unbalanced so use class weighting.
    # Ref: https://datascience.stackexchange.com/questions/13490/how-to-set-class-weights-for-imbalanced-classes-in-keras
    # Ref: https://stackoverflow.com/questions/42586475/is-it-possible-to-automatically-infer-the-class-weight-from-flow-from-directory

    steps_per_epoch = train_generator.samples // train_generator.batch_size
    validation_steps = validation_generator.samples // validation_generator.batch_size
    if logger is not None:
        logger.info('Steps per epoch: {}'.format(steps_per_epoch))
        logger.info('Validation steps: {}'.format(validation_steps))

    return {
        'train_dataset': train_dataset,
        'steps_per_epoch': steps_per_epoch,
        'validation_dataset': validation_dataset,
        'validation_steps': validation_steps
    }


def create_model():
    inputs = layers.Input(shape=[200, 355, 3])
    x = brainer_layers.conv2d_stats_block(inputs, ((0, 0), (0, 155)), stats_block='l_s')
    x = layers.Flatten()(x)
    x = layers.Dense(256, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(128, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(x)
    x = layers.Dense(64, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(x)
    x = layers.Dense(32, activation='relu', kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(x)
    x = layers.Dense(NUM_CLASS, kernel_regularizer=tf.keras.regularizers.l2(L2_PENALTY))(x)
    model = models.Model(inputs, x)

    model.compile(optimizer=tf.keras.optimizers.RMSprop(lr=LEARNING_RATE),
                  loss="mse",
                  metrics=['mae', 'mse'])

    model.summary()

    return model


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
        verbose=1,
        workers=4,
        use_multiprocessing=True,
        callbacks=[early_stop, model_ckpt, csv_logger, tensorboard_callback])

    # Plot and save results.
    mae = history.history['mae']
    val_mae = history.history['val_mae']
    loss = history.history['loss']
    val_loss = history.history['val_loss']
    epochs = range(len(mae))

    plot_two_and_save(epochs, mae, val_mae, 'Smoothed training mae', 'Smoothed validation mae',
                      'Training and validation mae', save_path + '-train-mae.png')
    plot_two_and_save(epochs, loss, val_loss, 'Smoothed training loss', 'Smoothed validation loss',
                      'Training and validation loss', save_path + '-train-loss.png')


def save_model(save_path, version):
    export_path = os.path.join(save_path, str(version))
    if not os.path.exists(export_path):
        os.makedirs(export_path)
    best_model = tf.keras.models.load_model(save_path + '-brainer{}.h5'.format(VERSION))
    best_model.save(export_path, save_format='tf')
    best_model_no_weights = models.Model(inputs=best_model.input, outputs=best_model.layers[-2].output)
    best_model_no_weights.save(export_path + '_no_weights', save_format='tf')
    best_model_no_weights.save(export_path + '_no_weights.h5')
    logger.info('Exported SavedModel to {}'.format(save_path))


def test_model(image_path):
    img = tf.io.read_file(image_path)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.resize(img, [200, 355])
    img = tf.image.convert_image_dtype(img, tf.float32)
    img = tf.reshape(img, [1, *img.shape])
    img = preprocessing_fn(img)

    model = tf.keras.models.load_model(SAVE_PATH + '-brainer{}.h5'.format(VERSION))
    print(model.predict(img))


if __name__ == '__main__':
    # dataset = get_dataset(LEFT_DATA, [200, 355], 32, preprocessing_fn, logger=logger)
    # print(dataset)
    # logging.basicConfig()
    # logger.setLevel(logging.INFO)
    # model = create_model()
    # train(model, dataset, 100, SAVE_PATH)
    # save_model(SAVE_PATH, VERSION)
    test_model('data/input/1ec3199b1a744faba8a623ef9d1ca5d1.png')
