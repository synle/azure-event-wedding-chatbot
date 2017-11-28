// clear all the caches
const redisUtil = require('./redisUtil')

async function _doWork(){
    await redisUtil.clearAll();
    console.log('Done...');
    process.exit();
};

_doWork();


// manual nuke sql...
/*
DELETE FROM `event_photo` WHERE id > 5;
DELETE FROM `invitee` WHERE id > 5;
DELETE FROM `event` WHERE user_id != 'adam';
DELETE FROM `event_users` WHERE user_id != 'adam';
 */
