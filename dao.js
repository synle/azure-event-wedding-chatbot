const Sequelize = require('sequelize');
const _ = require('lodash');
const Table = require('sequelize-simple-adapter');


// const sequelizeAdapter = new Sequelize(
//   process.env.MAIN_DB_NAME,
//   process.env.MAIN_DB_USER,
//   process.env.MAIN_DB_PASSWORD,
//   {
//     host: process.env.MAIN_DB_HOST,
//     dialect: 'mssql',
//     logging: false,
//     pool: {
//       max: 5,
//       min: 0,
//     },
//     dialectOptions: {
//       encrypt: true
//     },
//   }
// );


const sequelizeAdapter = new Sequelize(
    'db_user', // 'database',
    '', // 'username',
    '', // 'password',
    {
        dialect: 'sqlite',
        storage: './db.sqlite3',
        logging: false
    }
);

var Event = sequelizeAdapter.define(
    'Event',
    {
        event_id: { type: Sequelize.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        title: { type: Sequelize.DataTypes.STRING },
        location: { type: Sequelize.DataTypes.STRING },
        event_date: { type: Sequelize.DataTypes.STRING },
        event_time: { type: Sequelize.DataTypes.STRING },
        description: { type: Sequelize.DataTypes.STRING },
        user_id: { type: Sequelize.DataTypes.STRING },
        voice_invite_key: { type: Sequelize.DataTypes.STRING },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);




var EventPhoto = sequelizeAdapter.define(
    'EventPhoto',
    {
        id: { type: Sequelize.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        event_id: { type: Sequelize.DataTypes.BIGINT },
        s3url: { type: Sequelize.DataTypes.STRING },
        s3thumb_nail_url: { type: Sequelize.DataTypes.STRING },
        file_name: { type: Sequelize.DataTypes.STRING },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);



var Invitee = sequelizeAdapter.define(
    'Invitee',
    {
        id: { type: Sequelize.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        event_id: { type: Sequelize.DataTypes.BIGINT },
        email_id: { type: Sequelize.DataTypes.STRING },
        phone_number: { type: Sequelize.DataTypes.STRING },
        guest_name: { type: Sequelize.DataTypes.STRING },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);



var User = sequelizeAdapter.define(
    'User',
    {
        username: { type: Sequelize.DataTypes.STRING, primaryKey: true  },
        password: { type: Sequelize.DataTypes.STRING },
        firstname: { type: Sequelize.DataTypes.STRING },
        lastname: { type: Sequelize.DataTypes.STRING },
        active: { type: Sequelize.DataTypes.STRING },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);


// private
// might only need to run for init call...
var promiseSequelizeInit = sequelizeAdapter.sync().then(
  function (argument) {
    console.log('Database ORM Synced... Ready to use');
  }
);


module.exports = {
    init: async () => {
        await promiseSequelizeInit;
    },
    User: new Table(User, promiseSequelizeInit),
    Event: new Table(Event, promiseSequelizeInit),
    EventPhoto: new Table(EventPhoto, promiseSequelizeInit),
    Invitee: new Table(Invitee, promiseSequelizeInit),
    // FileUpload: new Table(FileUpload, promiseSequelizeInit),
}
