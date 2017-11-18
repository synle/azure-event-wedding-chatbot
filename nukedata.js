const dao = require('./dao')

async function doWork(){
    await dao.init();
    console.log('Nuking DB...')
    await dao.sequelizeAdapter.drop();
}

doWork();
