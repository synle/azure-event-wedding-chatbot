// clear all the caches
const redisUtil = require('./redisUtil')

async function _doWork(){
    await redisUtil.clearAll();
};

_doWork();
