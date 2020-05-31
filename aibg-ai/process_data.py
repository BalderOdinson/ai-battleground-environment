import pandas as pd
import os
import tensorflow as tf
from collections import Counter
from glob import glob


def get_dataframe(dataset, seed=None, logger=None, shuffle=True,
                  alt_subfolder='no_faces', alt_label='Unknown', use_alt=False):
    """
    Generate a dataframe containing labeled image paths.
    Labels are extracted from folder names in dataset.
    Images in subfolders can be labled differently from parent.

    Parameters:
    dataset - (str) path to dataset contains images in named folders.
    seed - (int) seed for random operations.
    shuffle - (boolean) to randomly shuffle rows of dataframe.
    alt_subfolder - (str) subfolder with images that can have alternate labels.
    alt_label - (str) alternate label.
    use_alt - (boolean) to use alt images with an alt label.
    Returns:
    df - dataframe containing labeled image paths as rows.
    """
    if logger is not None:
        logger.info(f'Getting dataframe with alt_label: {use_alt}.')
    image_paths = glob(dataset + '**/*.*', recursive=True)
    filenames = []
    labels = []

    for imagePath in image_paths:
        filename = os.path.abspath(imagePath)
        filenames.append(filename)
        label = imagePath.split(os.path.sep)[-2]
        # if alt subfolder name is found...
        if label == alt_subfolder:
            if use_alt:  # ...label as alt
                label = alt_label
            else:  # ...label as parent folder name
                label = imagePath.split(os.path.sep)[-3]
        labels.append(label)

    d = {'filename': filenames, 'class': labels}
    df = pd.DataFrame(data=d)

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
        target_size=input_size,
        batch_size=batch_size,
        seed=seed)

    if logger is not None:
        logger.info('Generating validation dataset.')
    validation_dataset = tf.data.Dataset.from_generator(
        generator=lambda: validation_generator,
        output_types=(tf.float32, tf.float32),
        output_shapes=(tf.TensorShape([None, input_size[0], input_size[1], 3]),
                       tf.TensorShape([None, len(train_generator.class_indices)])))

    if logger is not None:
        logger.info('Generating train dataset.')

    train_dataset = tf.data.Dataset.from_generator(
        generator=lambda: train_generator,
        output_types=(tf.float32, tf.float32),
        output_shapes=(tf.TensorShape([None, input_size[0], input_size[1], 3]),
                       tf.TensorShape([None, len(train_generator.class_indices)])))

    if logger is not None:
        logger.info('Class dict: {}'.format(train_generator.class_indices))
        logger.info('Number of training samples: {}'.format(train_generator.samples))
        logger.info('Number of validation samples: {}'.format(validation_generator.samples))

    # Training data is unbalanced so use class weighting.
    # Ref: https://datascience.stackexchange.com/questions/13490/how-to-set-class-weights-for-imbalanced-classes-in-keras
    # Ref: https://stackoverflow.com/questions/42586475/is-it-possible-to-automatically-infer-the-class-weight-from-flow-from-directory
    counter = Counter(train_generator.classes)
    max_val = float(max(counter.values()))
    class_weights = {class_id: max_val / num_images for class_id, num_images in counter.items()}
    if logger is not None:
        logger.info('Class weights: {}'.format(class_weights))

    steps_per_epoch = train_generator.samples // train_generator.batch_size
    validation_steps = validation_generator.samples // validation_generator.batch_size
    if logger is not None:
        logger.info('Steps per epoch: {}'.format(steps_per_epoch))
        logger.info('Validation steps: {}'.format(validation_steps))

    return {
        'train_dataset': train_dataset,
        'steps_per_epoch': steps_per_epoch,
        'validation_dataset': validation_dataset,
        'validation_steps': validation_steps,
        'class_weights': class_weights
    }


if __name__ == '__main__':
    print(get_dataset('F:/Documents/MedoGameData/'))
