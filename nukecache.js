// clear all the caches
const redisUtil = require('./redisUtil')

async function _doWork(){
    await redisUtil.clearAll();
    console.log('Done...');
    process.exit();
};

_doWork();
