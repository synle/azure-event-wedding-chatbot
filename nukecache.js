// clear all the caches
const redisUtil = require('./redisUtil')

async function _doWork(){
    redisUtil.clearAll();
};

_doWork();
