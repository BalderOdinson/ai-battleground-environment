const jwt = require('jsonwebtoken')
const APP_SECRET = 'px3U4g!BdA9rWR!5Tyg$i&WTHi%KWa86bCdoVq2Q'
const request = require('request-promise');

function getUserId(context) {
    const Authorization = context.request.get('Authorization')
    if (Authorization) {
        const token = Authorization.replace('Bearer ', '')
        const { userId } = jwt.verify(token, APP_SECRET)
        return userId
    }

    throw new Error('Not authenticated')
}

function checkApiKey(context) {
    const Authorization = context.request.get('Authorization')
    if (!Authorization && Authorization !== process.env.SERVER_PRIVATE_KEY)
        throw new Error('Not authenticated')
}

async function workstationHandshake(url) {
    const step1 = await request({
        uri: `${url}/connect/step1`,
        headers: {
            'Authorization': process.env.AI_PUBLIC_KEY
        },
        json: true
    })
    const {PUBLIC_KEY, PRIVATE_KEY} = step1
    if (PUBLIC_KEY !== process.env.SERVER_PUBLIC_KEY)
        throw Error('Invalid server url')
    await request({
        uri: `${url}/connect/step2`,
        method: 'POST',
        headers: {
            'Authorization': PRIVATE_KEY
        },
        body: {
            PRIVATE_KEY: process.env.SERVER_PRIVATE_KEY
        },
        json: true
    })

    return PRIVATE_KEY
}

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const mapActionEnumToActionCommand = {
    MOVE_UP: "w",
    MOVE_LEFT: "a",
    MOVE_DOWN: "s",
    MOVE_RIGHT: "d",
    ATTACK_UP: "rw",
    ATTACK_LEFT: "ra",
    ATTACK_DOWN: "rs",
    ATTACK_RIGHT: "rd",
    TRANSFORM_NORMAL: "mn",
    TRANSFORM_FIRE: "mf",
    TRANSFORM_WATER: "mw",
    TRANSFORM_GRASS: "mg"
}

const mapActionCommandToActionEnum = {
    melee_w: "MOVE_UP",
    melee_a: "MOVE_LEFT",
    melee_s: "MOVE_DOWN",
    melee_d: "MOVE_RIGHT",
    rw: "ATTACK_UP",
    ra: "ATTACK_LEFT",
    rs: "ATTACK_DOWN",
    rd: "ATTACK_RIGHT",
    mn: "TRANSFORM_NORMAL",
    mf: "TRANSFORM_FIRE",
    mw: "TRANSFORM_WATER",
    mg: "TRANSFORM_GRASS",
    _: null
}

module.exports = {
    APP_SECRET,
    getUserId,
    checkApiKey,
    getRandomInt,
    workstationHandshake,
    mapActionEnumToActionCommand,
    mapActionCommandToActionEnum
}