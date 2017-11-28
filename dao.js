const Sequelize = require('sequelize');
const _ = require('lodash');
const Table = require('sequelize-simple-adapter');


const sequelizeAdapter = !!process.env.MAIN_DB_HOST
    ? new Sequelize(
      process.env.MAIN_DB_NAME,
      process.env.MAIN_DB_USER,
      process.env.MAIN_DB_PASSWORD,
      {
        host: process.env.MAIN_DB_HOST,
        dialect: process.env.MAIN_DB_DIALECT,
        logging: false,
        pool: {
          max: 5,
          min: 0,
        },
        dialectOptions: {
          encrypt: true
        },
      }
    )
    : new Sequelize(
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
    'event',
    {
        event_id: { type: Sequelize.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        title: { type: Sequelize.DataTypes.STRING, field: 'title' },
        location: { type: Sequelize.DataTypes.STRING, field: 'location' },
        event_date: { type: Sequelize.DataTypes.STRING, field: 'event_date' },
        event_time: { type: Sequelize.DataTypes.STRING, field: 'event_time' },
        description: { type: Sequelize.DataTypes.STRING, field: 'description' },
        user_id: { type: Sequelize.DataTypes.STRING, field: 'user_id' },
        voice_invite_key: { type: Sequelize.DataTypes.STRING, field: 'voice_invite_key' },
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);




var EventPhoto = sequelizeAdapter.define(
    'event_photo',
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
    'invitee',
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
    'event_users',
    {
        username: { type: Sequelize.DataTypes.STRING, field: 'user_id', primaryKey: true},
        firstname: { type: Sequelize.DataTypes.STRING, field: 'first_name' },
        lastname: { type: Sequelize.DataTypes.STRING, field: 'last_name' },
        emailid: { type: Sequelize.DataTypes.STRING, field: 'mail_id'},
        password: { type: Sequelize.DataTypes.STRING, field: 'password'},
    },
    {
        freezeTableName: true,
        timestamps: false,
    }
);



var BotConfidence = sequelizeAdapter.define(
    'bot_confidence',
    {
        id: { type: Sequelize.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        username: { type: Sequelize.DataTypes.STRING, field: 'user_id'  },
        score: { type: Sequelize.DataTypes.FLOAT },
        event_id: { type: Sequelize.DataTypes.STRING },
    },
    {
        freezeTableName: true,
    }
);


// private
// might only need to run for init call...
var promiseSequelizeInit = sequelizeAdapter.sync().then(
  function (argument) {
    console.log('Database ORM Synced... Ready to use', process.env.MAIN_DB_HOST);
  }
);


module.exports = {
    init: async () => {
        await promiseSequelizeInit;
    },
    sequelizeAdapter,
    User: new Table(User, promiseSequelizeInit),
    Event: new Table(Event, promiseSequelizeInit),
    EventPhoto: new Table(EventPhoto, promiseSequelizeInit),
    Invitee: new Table(Invitee, promiseSequelizeInit),
    BotConfidence: new Table(BotConfidence, promiseSequelizeInit),
}
