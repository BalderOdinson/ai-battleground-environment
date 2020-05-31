import tensorflow as tf
from tensorflow.keras import layers, models, initializers


def identity_block(x, f, filters, stage, block):
    """
    Implementation of the identity block as defined in Figure 3

    Arguments:
    x -- input tensor of shape (m, n_H_prev, n_W_prev, n_C_prev)
    f -- integer, specifying the shape of the middle CONV's window for the main path
    filters -- python list of integers, defining the number of filters in the CONV layers of the main path
    stage -- integer, used to name the layers, depending on their position in the network
    block -- string/character, used to name the layers, depending on their position in the network

    Returns:
    x -- output of the identity block, tensor of shape (n_H, n_W, n_C)
    """

    # defining name basis
    conv_name_base = 'res' + str(stage) + block + '_branch'
    bn_name_base = 'bn' + str(stage) + block + '_branch'

    # Retrieve Filters
    f1, f2, f3 = filters

    # Save the input value. You'll need this later to add back to the main path. 
    x_shortcut = x

    # first component of main path
    x = layers.Conv2D(filters=f1, kernel_size=(1, 1), strides=(1, 1), padding='valid', name=conv_name_base + '2a',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2a')(x)
    x = layers.Activation('relu')(x)

    # Second component of main path (≈3 lines)
    x = layers.Conv2D(filters=f2, kernel_size=(f, f), strides=(1, 1), padding='same', name=conv_name_base + '2b',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2b')(x)
    x = layers.Activation('relu')(x)

    # Third component of main path (≈2 lines)
    x = layers.Conv2D(filters=f3, kernel_size=(1, 1), strides=(1, 1), padding='valid', name=conv_name_base + '2c',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2c')(x)

    # Final step: Add shortcut value to main path, and pass it through a RELU activation (≈2 lines)
    x = layers.Add()([x, x_shortcut])
    x = layers.Activation('relu')(x)

    return x


def convolutional_block(x, f, filters, stage, block, s=2):
    """
    Implementation of the convolutional block as defined in figure 4

    Arguments:
    x -- input tensor of shape (m, n_H_prev, n_W_prev, n_C_prev)
    f -- integer, specifying the shape of the middle CONV's window for the main path
    filters -- python list of integers, defining the number of filters in the CONV layers of the main path
    stage -- integer, used to name the layers, depending on their position in the network
    block -- string/character, used to name the layers, depending on their position in the network
    s -- Integer, specifying the stride to be used

    Returns:
    x -- output of the convolutional block, tensor of shape (n_H, n_W, n_C)
    """

    # defining name basis
    conv_name_base = 'res' + str(stage) + block + '_branch'
    bn_name_base = 'bn' + str(stage) + block + '_branch'

    # Retrieve filters
    f1, f2, f3 = filters

    # Save the input value
    x_shortcut = x

    # MAIN PATH
    # first component of main path
    x = layers.Conv2D(f1, (1, 1), strides=(s, s), name=conv_name_base + '2a',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2a')(x)
    x = layers.Activation('relu')(x)

    # Second component of main path (≈3 lines)
    x = layers.Conv2D(filters=f2, kernel_size=(f, f), strides=(1, 1), padding='same', name=conv_name_base + '2b',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2b')(x)
    x = layers.Activation('relu')(x)

    # Third component of main path (≈2 lines)
    x = layers.Conv2D(filters=f3, kernel_size=(1, 1), strides=(1, 1), padding='valid', name=conv_name_base + '2c',
                      kernel_initializer=initializers.glorot_uniform(seed=0))(x)
    x = layers.BatchNormalization(axis=3, name=bn_name_base + '2c')(x)

    # SHORTCUT PATH (≈2 lines)
    x_shortcut = layers.Conv2D(filters=f3, kernel_size=(1, 1), strides=(s, s), padding='valid',
                               name=conv_name_base + '1',
                               kernel_initializer=initializers.glorot_uniform(seed=0))(x_shortcut)
    x_shortcut = layers.BatchNormalization(axis=3, name=bn_name_base + '1')(x_shortcut)

    # Final step: Add shortcut value to main path, and pass it through a RELU activation (≈2 lines)
    x = layers.Add()([x, x_shortcut])
    x = layers.Activation('relu')(x)

    return x


def conv2d_map_block(input_layer, padding):
    x = layers.ZeroPadding2D(padding, name='crop_map')(input_layer)
    x = layers.Conv2D(8, (5, 5), (2, 2), name='conv2d_map')(x)
    x = layers.BatchNormalization(name='batchnorm_map')(x)
    x = layers.MaxPool2D((2, 2))(x)

    x = convolutional_block(x, 3, [8, 8, 16], 2, 'm_a', s=1)
    x = identity_block(x, 3, [8, 8, 16], 2, 'm_b')
    x = identity_block(x, 3, [8, 8, 16], 2, 'm_c')

    x = convolutional_block(x, 3, [16, 16, 32], 3, 'm_a', s=2)
    x = identity_block(x, 3, [16, 16, 32], 3, 'm_b')
    x = identity_block(x, 3, [16, 16, 32], 3, 'm_c')
    x = identity_block(x, 3, [16, 16, 32], 3, 'm_d')

    x = convolutional_block(x, 3, [32, 32, 64], 4, 'm_a', s=2)
    x = identity_block(x, 3, [32, 32, 64], 4, 'm_b')
    x = identity_block(x, 3, [32, 32, 64], 4, 'm_c')
    x = identity_block(x, 3, [32, 32, 64], 4, 'm_d')

    x = convolutional_block(x, 3, [64, 64, 64], 5, 'm_a', s=2)
    x = identity_block(x, 3, [64, 64, 64], 5, 'm_b')
    x = identity_block(x, 3, [64, 64, 64], 5, 'm_c')
    x = identity_block(x, 3, [64, 64, 64], 5, 'm_d')

    return layers.AveragePooling2D((2, 2))(x)


def conv2d_stats_block(input_layer, cropping, stats_block):
    x = layers.Cropping2D(cropping, name='crop_' + stats_block)(input_layer)
    x = layers.Conv2D(8, (5, 5), (2, 2), name='conv2d_' + stats_block)(x)
    x = layers.BatchNormalization(name='batchnorm_' + stats_block)(x)
    x = layers.MaxPool2D((2, 2))(x)

    x = convolutional_block(x, 3, [8, 8, 16], 2, stats_block + '_a', s=1)
    x = identity_block(x, 3, [8, 8, 16], 2, stats_block + '_b')
    x = identity_block(x, 3, [8, 8, 16], 2, stats_block + '_c')

    x = convolutional_block(x, 3, [16, 16, 32], 3, stats_block + '_a', s=2)
    x = identity_block(x, 3, [16, 16, 32], 3, stats_block + '_b')
    x = identity_block(x, 3, [16, 16, 32], 3, stats_block + '_c')
    x = identity_block(x, 3, [16, 16, 32], 3, stats_block + '_d')

    x = convolutional_block(x, 3, [32, 32, 64], 4, stats_block + '_a', s=2)
    x = identity_block(x, 3, [32, 32, 64], 4, stats_block + '_b')
    x = identity_block(x, 3, [32, 32, 64], 4, stats_block + '_c')
    x = identity_block(x, 3, [32, 32, 64], 4, stats_block + '_d')

    return layers.AveragePooling2D((3, 3))(x)


def brainer_net_V1(input_shape=None):
    if input_shape is None:
        input_shape = [200, 355, 3]
    height = input_shape[0]
    width = input_shape[1]
    diff_w_h = width - height
    up = int(diff_w_h / 2)
    down = up if up * 2 == diff_w_h else up + 1
    inputs = layers.Input(shape=input_shape)
    x = conv2d_stats_block(inputs, ((0, 0), (0, diff_w_h)), stats_block='l_s')
    y = conv2d_map_block(inputs, ((up, down), (0, 0)))
    z = conv2d_stats_block(inputs, ((0, 0), (diff_w_h, 0)), stats_block='r_s')
    out = layers.Add()([x, y, z])
    return models.Model(inputs, layers.AveragePooling2D((2, 2))(out), name='brainer_net_V1')


class Sampling(layers.Layer):
    def call(self, inputs, **kwargs):
        mean, log_var = inputs
        epsilon = tf.keras.backend.random_normal(tf.shape(mean))
        return mean + tf.exp(0.5 * log_var) * epsilon
