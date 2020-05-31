import threading
import requests


def join():
    responds = []
    for _ in range(10):
        r = requests.get('http://192.168.1.22:5000/api/requestGame')
        responds.append(r.json())
    print(responds)


if __name__ == '__main__':
    t = []
    for _ in range(10):
        t.append(threading.Thread(target=join))

    for i in range(10):
        t[i].start()

    for i in range(10):
        t[i].join()
