const dao = require('./dao')

async function doWork(){
    await dao.init();
    await dao.sequelizeAdapter.drop();
}

doWork();
