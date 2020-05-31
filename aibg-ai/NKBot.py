import requests
import copy
import queue
import os

_wr = True
_game = None
_gameId = None
_playerIndex = None
_playerId = None
res = None
url = os.getenv('SERVER_ADDRESS', 'http://localhost:9080')
transformisao_se = False

poseceni_pow = []

morph_counters = {'FIRE': 'WATER', 'WATER': 'GRASS', 'GRASS': 'FIRE'}
p_type_l = None
p_type_cnt = 0

e_type_l = None
e_type_cnt = 0

x_move = (1, -1, 0, 0)
y_move = (0, 0, 1, -1)
tren_hp = 5
etren_hp = 5
prev_x = 0
prev_y = 0


def napuniSusede(heur, i, j, vred, w, h, q):
    dx = [1, 0, -1, 0]
    dy = [0, 1, 0, -1]
    a = 0
    for k in range(0, 4):
        if i + dx[k] >= 0 and i + dx[k] < w and j + dy[k] >= 0 and j + dy[k] < h and heur[dx[k] + i][dy[k] + j] in [-4,
                                                                                                                    0]:
            if heur[dx[k] + i][dy[k] + j] == -4:
                q.put([i + dx[k], j + dy[k]])
                return -1
            heur[i + dx[k]][j + dy[k]] = vred - 1
            q.put([i + dx[k], j + dy[k]])
            a += 1
    return a


def get(url):
    global res
    r = requests.get(url)
    res = r.json()
    return res


def random_game(playerId):
    global _game, _gameId, _playerIndex, res
    res = get(url + '/train/random?playerId=' + str(playerId))
    _game = res['result']
    _gameId = _game['id']
    print("Game id: " + str(_gameId))
    _playerIndex = res['playerIndex']
    return res


def join(playerId, gameId):
    global _game, _gameId, _playerIndex, res, _playerId
    res = get(url + '/game/play?playerId=' + str(playerId) + '&gameId=' + str(gameId))
    _game = res['result']
    _gameId = _game['id']
    _playerId = playerId
    print("Game id: " + str(_gameId))
    _playerIndex = res['playerIndex']
    return res


def run(playerId, game):
    global _game, _playerIndex, _playerId, _gameId, _wr, res

    _game = game
    _playerId = playerId
    _playerIndex = playerId + 1
    res = {'success': True, 'result': game, 'playerIndex': _playerIndex}

    return calculate(_game, _playerIndex)


def is_valid(x, y, map_w, map_h):
    if x < 0 or x > (map_w // 2 - 1):
        return False

    if y < 0 or y > (map_h - 1):
        return False

    return True


def bfs(heuristics, map_h, map_w, e_x, e_y):
    global poseceni_pow
    q = queue.Queue()
    skinuti = 0
    dodano = 0
    for i in range(map_h):
        for j in range(map_w // 2):
            if heuristics[i][j] == -2 and (i, j) not in poseceni_pow:
                heuristics[i][j] = 100
                q.put([i, j])
                skinuti += 1
    if skinuti == 0:
        q.put([e_y, e_x])
        heuristics[e_y][e_x] = 100

    while (not q.empty()):
        ind = q.get()
        vred = heuristics[ind[0]][ind[1]]
        if skinuti == 0:
            skinuti = dodano
            dodano = 0
            vred -= 1
        skinuti -= 1

        o = dodano
        dodano += napuniSusede(heuristics, ind[0], ind[1], vred, map_w // 2, map_h, q)
        if o - dodano == 1:
            break
    return heuristics


def get_heuristics(res, map_h, map_w, p_y, p_x, e_y, e_x):
    heuristics = [[copy.deepcopy(0) for x in range(map_h)] for y in range(map_w)]

    if res and res.get('success'):
        tiles = res.get('result').get('map').get('tiles')
        for i in range(map_h):
            for j in range(map_w // 2):
                if i == p_y and j == p_x:
                    heuristics[i][j] = -4
                elif i == e_y and j == e_x:
                    heuristics[i][j] = -3
                elif tiles[i][j].get('item') == 'OBSTACLE':
                    heuristics[i][j] = -1
                elif tiles[i][j].get('item') is None:
                    heuristics[i][j] = 0
                else:
                    heuristics[i][j] = -2
    return heuristics


def in_range(p_x, p_y, e_x, e_y):
    if abs(p_x - e_x) <= 3 and abs(p_y - e_y) == 0:
        return True
    elif abs(p_y - e_y) <= 3 and abs(p_x - e_x) == 0:
        return True
    return False


def counter(p_morfs, e_morfs):
    cnt = len(p_morfs)
    for p_morf, e_morf in zip(p_morfs, e_morfs):
        if p_morf == 'GRASS':
            if e_morf == 'WATER':
                cnt -= 1
        elif p_morf == 'WATER':
            if e_morf == 'FIRE':
                cnt -= 1
        else:
            if e_morf == 'GRASS':
                cnt -= 1
    return True if cnt > 0 else False


def counter_type(p_type, e_type):
    if p_type == 'GRASS':
        if e_type == 'WATER':
            return False
        return True
    elif p_type == 'WATER':
        if e_type == 'FIRE':
            return False
        return True
    else:
        if e_type == 'GRASS':
            return False
        return True


def calculate(game, playerIndex):
    global _wr, _playerIndex, transformisao_se, res, prev_x, prev_y, p_type_l, p_type_cnt, e_type_l, e_type_cnt, x_move, y_move, poseceni_pow, tren_hp, etren_hp

    if not res.get('success'):
        return 'a'

    _playerIndex = res.get('playerIndex')
    p_string = 'player' + str(_playerIndex)
    e_string = 'player' + ('2' if _playerIndex == 1 else '1')
    p_hp = res.get('result').get(p_string).get('health')
    e_hp = res.get('result').get(e_string).get('health')
    if p_hp < tren_hp:
        tren_hp -= 1
        poseceni_pow = []
    if e_hp < etren_hp:
        etren_hp -= 1
        poseceni_pow = []
    p_x = 0
    p_y = 0
    e_x = 0
    e_y = 0
    map_w = 0
    map_h = 0

    p_x = res.get('result').get(p_string).get('x')
    p_y = res.get('result').get(p_string).get('y')

    if abs(prev_x - p_x) > 1 or abs(prev_y - p_y) > 1:
        poseceni_pow = []

    if res and res.get('success'):
        map_w = res.get('result').get('map').get('width')
        map_h = res.get('result').get('map').get('height')

    if res and res.get('success'):
        p_x = res.get('result').get(p_string).get('x')
        p_y = res.get('result').get(p_string).get('y')
        p_hp = res.get('result').get(p_string).get('health')
        p_la = res.get('result').get(p_string).get('lastAction')
        p_type = res.get('result').get(p_string).get('type')
        p_morphs = res.get('result').get(p_string).get('morphItems')
        p_lives = res.get('result').get(p_string).get('lives')
        if not p_type == p_type_l:
            p_type_l = p_type
            p_type_cnt = 0
        else:
            p_type_cnt += 1

        e_x = res.get('result').get(e_string).get('x')
        e_y = res.get('result').get(e_string).get('y')
        e_hp = res.get('result').get(e_string).get('health')
        e_la = res.get('result').get(e_string).get('lastAction')
        e_type = res.get('result').get(e_string).get('type')
        e_morphs = res.get('result').get(e_string).get('morphItems')
        e_lives = res.get('result').get(e_string).get('lives')
        if not e_type == e_type_l:
            e_type_l = e_type
            e_type_cnt = 0
        else:
            e_type_cnt += 1

    tiles = res.get('result').get('map').get('tiles')

    heuristics = get_heuristics(res, map_h, map_w, p_y, p_x, e_y, e_x)

    morf_count = 0
    for i in range(map_h):
        for j in range(map_w // 2):
            if heuristics[i][j] == -2:
                morf_count += 1

    p_morfs = res.get('result').get(p_string).get('morphItems')
    e_morfs = res.get('result').get(e_string).get('morphItems')
    p_type = res.get('result').get(p_string).get('type')
    e_type = res.get('result').get(e_string).get('type')

    if map_h == 2 and not transformisao_se:
        return 'mn'
        transformisao_se = True
    else:
        if p_x == e_x + 1 or p_x == e_x - 1 or p_y == e_y - 1 or p_y == e_y + 1:
            if (p_x < e_x and p_y == e_y):
                return 'd'
            if (p_x > e_x and p_y == e_y):
                return 'a'
            if (p_x == e_x and p_y < e_y):
                return 's'
            if (p_x == e_x and p_y > e_y):
                return 'w'

    if not p_type == 'NEUTRAL' and in_range(p_x, p_y, e_x, e_y):
        if (p_x < e_x and p_y == e_y):
            return 'rd'
        if (p_x > e_x and p_y == e_y):
            return 'ra'
        if (p_x == e_x and p_y < e_y):
            return 'rs'
        if (p_x == e_x and p_y > e_y):
            return 'rw'
    elif in_range(p_x, p_y, e_x, e_y):
        t_type = tiles[p_y][p_x].get('type')
        if t_type in p_morfs and p_type_cnt >= 7:
            if t_type == 'WATER' and not e_type == 'GRASS':
                p_type_cnt == 0
                return 'mw'
            if t_type == 'FIRE' and not e_type == 'WATER':
                p_type_cnt == 0
                return 'mf'
            if t_type == 'GRASS' and not e_type == 'FIRE':
                p_type_cnt == 0
                return 'mg'
        if t_type == 'NORMAL' and p_type_cnt >= 7:
            if not e_type == 'NEUTRAL' and morph_counters[e_type] in p_morfs:
                p_type_cnt == 0
                if morph_counters[e_type] == 'WATER':
                    return 'mw'
                elif morph_counters[e_type] == 'FIRE':
                    return 'mf'
                elif morph_counters[e_type] == 'GRASS':
                    return 'mg'
            elif e_type in p_morfs:
                p_type_cnt == 0
                if e_type == 'WATER':
                    return 'mw'
                elif e_type == 'FIRE':
                    return 'mf'
                elif e_type == 'GRASS':
                    return 'mg'
        else:
            heuristics = bfs(heuristics, map_h, map_w, e_x, e_y)
    elif len(p_morfs) == 0 and len(e_morfs) == 0:
        if p_x == e_x + 1 or p_x == e_x - 1 or p_y == e_y - 1 or p_y == e_y + 1:
            if p_hp > e_hp:
                if (p_x < e_x and p_y == e_y):
                    return 'd'
                if (p_x > e_x and p_y == e_y):
                    return 'a'
                if (p_x == e_x and p_y < e_y):
                    return 's'
                if (p_x == e_x and p_y > e_y):
                    return 'w'
            else:
                if (p_x < e_x and p_y == e_y):
                    return 'a'
                if (p_x > e_x and p_y == e_y):
                    return 'd'
                if (p_x == e_x and p_y < e_y):
                    return 'w'
                if (p_x == e_x and p_y > e_y):
                    return 's'
        else:
            heuristics = bfs(heuristics, map_h, map_w, e_x, e_y)
    elif len(p_morfs) > 0 and p_type_cnt == 7:
        t_type = tiles[p_y][p_x].get('type')
        if t_type in p_morfs:
            if t_type == 'WATER':
                p_type_cnt == 0
                return 'mw'
            if t_type == 'FIRE':
                p_type_cnt == 0
                return 'mf'
            if t_type == 'GRASS':
                p_type_cnt == 0
                return 'mg'
        else:
            p_type_cnt == 0
            return 'mn'
    else:
        heuristics = bfs(heuristics, map_h, map_w, e_x, e_y)

    dir_h = 'd'
    max_h = -9999
    for i in range(4):
        new_x = p_x + x_move[i]
        new_y = p_y + y_move[i]
        if (is_valid(new_x, new_y, map_w, map_h)):
            if heuristics[new_y][new_x] >= max_h:
                poseceni_pow.append((new_y, new_x))
                prev_x = p_x
                prev_y = p_y
                max_h = heuristics[new_y][new_x]
                if new_x < p_x and new_y == p_y:
                    dir_h = 'a'
                elif new_x > p_x and new_y == p_y:
                    dir_h = 'd'
                elif new_y < p_y and new_x == p_x:
                    dir_h = 'w'
                elif new_y > p_y and new_x == p_x:
                    dir_h = 's'
                else:
                    print('LOLWUT?')

    return dir_h


def do_action(playerId, gameId, action):
    return get(url + '/doAction?playerId=' + str(playerId) + '&gameId=' + str(gameId) + '&action=' + action)


def start(player_id, game_id):
    join(player_id, game_id)
    run()
