var redis = require('redis');

var shouldUseCloud = process.env.CACHE_HOST
    && process.env.CACHE_PASSWORD;

if(shouldUseCloud){
    console.log('use redis cache from cloud', process.env.CACHE_HOST)

    var client = redis.createClient(
        6380,
        process.env.CACHE_HOST,
        {
                auth_pass: process.env.CACHE_PASSWORD,
                tls: { servername: process.env.CACHE_HOST }
        }
    );

    module.exports = {
        clear: function(ckey){
            return new Promise(function(resolve, reject) {
                    client.set(ckey, "null", function(err, reply) {
                            if(err){
                                    return reject(err)
                            }
                            resolve();
                    });
            })
        },
        set: function(ckey, cval){
            console.log('set cache value', ckey, cval)
            return new Promise(function(resolve, reject) {
                    client.set(ckey, JSON.stringify(cval), function(err, reply) {
                            if(err){
                                    return reject(err)
                            }
                            resolve();
                    });
            })
        },
        get: function(ckey){
            console.log('get cache value by key', ckey)

            return new Promise(function(resolve, reject){
                    client.get(ckey, function(err, reply) {
                            if(err){
                                    return reject(err)
                            }

                            try{
                                    return resolve(JSON.parse(reply));
                            }catch(e){};

                            resolve(reply);
                    });
            })
        }
    }
} else {
    console.log('use local cache');

    var localCache = {}

    module.exports = {
        clear: function(ckey){
                delete localCache[ckey];
                return Promise.resolve();
        },
        set: function(ckey, cval){
            console.log('set cache value', ckey, cval)
                localCache[ckey] = JSON.stringify(cval);
                return Promise.resolve();
        },
        get: function(ckey){
            console.log('get cache value by key', ckey)

                try{
                        return resolve(JSON.parse(localCache[ckey]));
                } catch(e){}
                return Promise.resolve(localCache[ckey])
        }
    }
}
