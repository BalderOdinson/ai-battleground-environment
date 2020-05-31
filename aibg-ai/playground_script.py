import tensorflow as tf
import numpy as np
from tensorflow.keras import layers, models


def main():
    np.random.seed(100)
    tf.random.set_seed(100)

    input_x = layers.Input(batch_shape=(2, 50))
    input_y = layers.Input(batch_shape=(2, 15, 15, 1))

    x = layers.Masking(-1)(input_x)
    x = input_x
    x = layers.Dense(5, activation='relu')(x)
    y = layers.Masking(-1)(input_y)
    y = input_y
    y = layers.Conv2D(2, (10, 10), activation='relu')(y)
    y = layers.Flatten()(y)
    y = layers.Dense(5, activation='relu')(y)

    z = layers.Concatenate()([x, y])
    z = layers.RepeatVector(1)(z)

    out = layers.LSTM(8, stateful=True)(z)
    out = layers.Dense(1, activation='sigmoid')(out)

    model = models.Model([input_x, input_y], out)

    model.summary()

    a11 = np.random.random((1, 50))
    b11 = np.random.random((1, 15, 15, 1))
    a12 = np.random.random((1, 50))
    b12 = np.random.random((1, 15, 15, 1))
    a21 = np.random.random((1, 50))
    b21 = np.random.random((1, 15, 15, 1))

    batch_a1 = np.append(a11, a21, axis=0)
    batch_b1 = np.append(b11, b21, axis=0)

    batch_a2 = np.append(a12, np.repeat(-1, 50).reshape((1, 50)), axis=0)
    batch_b2 = np.append(b12, np.repeat(-1, 225).reshape((1, 15, 15, 1)), axis=0)

    print(model.predict([batch_a1, batch_b1]))
    print(model.predict([batch_a2, batch_b2]))
    print(model.predict([batch_a2, batch_b2]))


def create_train_model():
    input_x = layers.Input(shape=(None, 15, 15, 1))
    x = layers.TimeDistributed(layers.Conv2D(2, (10, 10)))(input_x)
    x = layers.TimeDistributed(layers.Flatten())(x)
    x = layers.TimeDistributed(layers.Dense(4))(x)

    # x = layers.TimeDistributed(layers.Conv2D(2, (10, 10), activation='relu'))(input_x)
    # x = layers.TimeDistributed(layers.MaxPooling2D((2, 2)))(x)
    # x = layers.TimeDistributed(layers.Flatten())(x)
    # x = layers.TimeDistributed(layers.Dense(4))(x)

    input_y = layers.Input(shape=(None, 5))
    y = layers.TimeDistributed(layers.Dense(4))(input_y)

    out = layers.Concatenate()([x, y])
    out = layers.LSTM(8, return_sequences=True)(out)
    out = layers.TimeDistributed(layers.Dense(5, activation='sigmoid'))(out)

    return models.Model([input_x, input_y], out)


def crete_inference_model(train_model):
    input_x = layers.Input(batch_shape=(1, 15, 15, 1))
    x = layers.Conv2D(2, (10, 10))(input_x)
    x = layers.Flatten()(x)
    x = layers.Dense(4)(x)

    # x = layers.TimeDistributed(layers.Conv2D(2, (10, 10), activation='relu'))(input_x)
    # x = layers.TimeDistributed(layers.MaxPooling2D((2, 2)))(x)
    # x = layers.TimeDistributed(layers.Flatten())(x)
    # x = layers.TimeDistributed(layers.Dense(4))(x)

    input_y = layers.Input(batch_shape=(1, 5))
    y = layers.Dense(4)(input_y)

    out = layers.Concatenate()([x, y])
    out = layers.RepeatVector(1)(out)
    out = layers.LSTM(8, stateful=True)(out)
    out = layers.Dense(5, activation='sigmoid')(out)

    model = models.Model([input_x, input_y], out)
    model.set_weights(train_model.get_weights())

    return model


def main1():
    np.random.seed(100)
    tf.random.set_seed(100)

    model = create_train_model()

    model.compile(optimizer=tf.keras.optimizers.Adam(),
                  # loss="categorical_crossentropy",
                  loss=tf.keras.losses.BinaryCrossentropy(label_smoothing=0.1),
                  metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])

    model.summary()

    da1 = np.random.random((251, 15, 15, 1))
    db1 = np.random.random((251, 5))
    dy1 = np.random.randint(low=1, high=5, size=(251,))
    dy1 = np.eye(5)[dy1]

    da2 = np.random.random((220, 15, 15, 1))
    db2 = np.random.random((220, 5))
    dy2 = np.random.randint(low=1, high=5, size=(220,))
    dy2 = np.eye(5)[dy2]

    da2_ext = np.append(da2, np.repeat(-1, 6975).reshape((31, 15, 15, 1)), axis=0)
    db2_ext = np.append(db2, np.repeat(-1, 155).reshape((31, 5)), axis=0)
    dy2_ext = np.append(dy2, np.eye(5)[np.zeros(31, dtype=np.int)], axis=0)

    da = np.append(da1.reshape((1, 251, 15, 15, 1)), da2_ext.reshape((1, 251, 15, 15, 1)), axis=0)
    db = np.append(db1.reshape((1, 251, 5)), db2_ext.reshape((1, 251, 5)), axis=0)
    dy = np.append(dy1.reshape((1, 251, 5)), dy2_ext.reshape((1, 251, 5)), axis=0)

    x_train = [da, db]
    y_train = dy

    model.fit(x_train, y_train, epochs=1000, workers=4, use_multiprocessing=True)

    m = crete_inference_model(model)

    print(np.argmax(m.predict([da2_ext, db2_ext], batch_size=1), axis=1))

    print(np.argmax(dy2_ext, axis=1))


if __name__ == '__main__':
    main1()
