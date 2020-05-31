import matplotlib.pyplot as plt


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
