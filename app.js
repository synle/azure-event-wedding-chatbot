const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const azure = require('botbuilder-azure');

// internal
const dao = require('./dao');
const util = require('./util')
const redisUtil = require('./redisUtil')


const _doWork = async function(){
    await Promise.all([
        redisUtil.clearAll(),
        dao.init(),
    ])
    console.log('Done Init Cache and DB...');
    console.log('Starting Server...');


    const server = express()

    // server.get('/', (req, res) => res.send('Hello World!'))
    const PORT = process.env.port || 8080;
    server.listen(PORT, () => console.log('Example app listening on port!', PORT))



    // the old bot approach...
    // middlewares
    server.engine('html', require('ejs').renderFile);


    //single entry for bots...
    server.get('/', function(req, res){
        res.render(
            path.join( __dirname + '/view/chatbot.html' ),
            {
                // username: req.session.username,
                BOT_URL: process.env.BOT_URL,
                MAIN_WEBAPP_URL: process.env.MAIN_WEBAPP_URL,
            }
        )
    })



    server.get('/powerbi_report.html', function(req, res){
        res.render(
            path.join( __dirname + '/view/powerbi_report.html' ),
            {
                POWER_BI_REPORT_URL: process.env.POWER_BI_REPORT_URL,
                MAIN_WEBAPP_URL: process.env.MAIN_WEBAPP_URL,
            }
        )
    })



    // // Create chat connector for communicating with the Bot Framework Service
    const builder = require('botbuilder');
    const connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });

    var documentDbOptions = {
        host: 'Your-Azure-DocumentDB-URI',
        masterKey: 'Your-Azure-DocumentDB-Key',
        database: 'botdocs',
        collection: 'botdata'
    }

    var docDbClient = new azure.DocumentDbClient(documentDbOptions);
    var cosmosStorage = new azure.AzureBotStorage({ gzipData: false }, docDbClient);


    // Listen for messages from users
    server.post('/api/messages', connector.listen());


    // This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
    var bot = new builder.UniversalBot(connector, [
        function (session) {
            console.log('step 1');
            session.send("Welcome to Wedding Event Booking Service.");

            if(!session.userData.current_user){
                session.beginDialog("showAuthentication");
            } else{
                session.send(`Welcome back, ${session.userData.current_user.firstname}`);
                session.replaceDialog("showEventInformation");
            }
        },
        async function (session, results) {
            console.log('step 2');
            session.replaceDialog("showEventInformation");
        },
    ])


    // bot.set('storage', cosmosStorage);

    // Do not persist userData
    // bot.set(`persistUserData`, false);

    // Do not persist conversationData
    // bot.set(`persistConversationData`, false);



    bot.dialog("showAuthentication", [
        // Step 1
        async function (session) {
            console.log('step 3');
            builder.Prompts.text(session, 'Hi! What is your username?');
        },
        async function (session, results) {
            console.log('step 4');
            session.dialogData.username = results.response;
            builder.Prompts.text(session, 'What is your password?');
        },
        async function (session, results) {
            console.log('step 5');

            session.dialogData.password = results.response;

            const {username, password} = session.dialogData;

            // look for users...
            try{
                const foundUser = await dao.User.findOne({
                    where: {
                        username,
                        password,
                    }
                })

                if(!foundUser){
                    throw 'not found...'
                }

                session.userData.current_user = foundUser;
                session.endDialog(`Welcome, ${session.userData.current_user.firstname}`);
            } catch(e){
                session.send('Invalid username or password... Please re-enter your username and password')
                session.replaceDialog("showAuthentication");
            }
        },
    ])



    bot.dialog("showEventInformation", [
        async function (session, args) {
            console.log('step 6');

            const username = session.userData.current_user.username;
            session.userData.cache_key = `event-list-${username}`;// cache key for redis

            let my_events = [];



            try{
                // get it from cache...
                my_events = await redisUtil.get(session.userData.cache_key);
                if(!my_events || my_events.length === 0){
                    throw 'data is not in cache...'
                }
            } catch(e){
                // get data from database and set it...
                console.log('look up data for users', session.userData.current_user.username);
                my_events = await dao.Event.findAll({
                    order: 'event_date ASC',
                    where: {
                        user_id: session.userData.current_user.username
                    }
                });

                // set the new value into cache
                await redisUtil.set(session.userData.cache_key, my_events);
            }
            session.userData.my_events = my_events


            session.userData.my_events.map((cur_event) => {
                cur_event.friendlyString = `${cur_event.event_date} ${cur_event.event_time} - ${cur_event.title} in ${cur_event.location}`;
            });

            // console.log(session.userData.my_events);

            builder.Prompts.choice(session, "Select one of the following events?", session.userData.my_events.map((cur_event, cur_idx) => {
                return [
                        cur_event.friendlyString,
                    ].join('\n');
            }));
        },
        async function (session, results) {
            console.log('step 7');

            var confidence_score = (results.response.score * 100).toFixed();
            // console.log(results)
            session.dialogData.selected_event = session.userData.my_events[results.response.index];

            session.send(`You selected "${session.dialogData.selected_event.friendlyString}" (Confidence score of ${confidence_score}%)`)

            session.send("Gathering information regarding this event.");

            session.dialogData.selected_event_photos = await dao.EventPhoto.findAll({
                where: {
                    event_id: session.dialogData.selected_event.event_id
                }
            });


            session.dialogData.selected_event_invitees = await dao.Invitee.findAll({
                where: {
                    event_id: session.dialogData.selected_event.event_id
                }
            });

            // console.log(session.dialogData.selected_event_photos);
            // console.log('session.dialogData.selected_event_photos', session.dialogData.selected_event_photos[0]);
            var cur_event = session.dialogData.selected_event;
            session.send([
                `Here is the information about this event`,
                `- ${cur_event.title}`,
                `- Date: ${cur_event.event_date} ${cur_event.event_time}`,
                `- Location: ${cur_event.location}`,
                `- Total Attendees: ${session.dialogData.selected_event_invitees.length}`
            ].join('\n'));


            var msg = new builder.Message(session)
                .attachments([{
                    contentType: "image/jpeg",
                    contentUrl: session.dialogData.selected_event_photos[0].s3url
                }]);
            session.send(msg);


            session.send(`Map for this event: https://www.google.com/maps/place/?q=${encodeURIComponent(cur_event.location)}`)


            builder.Prompts.confirm(session, "Should we show the attendee information...?");
        },
        async function (session, results) {
            console.log('step 8');

            console.log(results);
            if(results.response){
                session.send(
                    [
                        `Here is the attendee list of this event: (total=${session.dialogData.selected_event_invitees.length})`
                    ].concat(
                        session.dialogData.selected_event_invitees.map((cur_event_attendee) => {
                            return `- ${cur_event_attendee.guest_name} - ${cur_event_attendee.phone_number}`
                        })
                    )
                    .join('\n')
                );

                session.replaceDialog("showContinueLoopBackEvent");
            } else {
                session.replaceDialog("showContinueLoopBackEvent");
            }
        },
    ])



    bot.dialog("showContinueLoopBackEvent", [
        async function (session, results) {
            builder.Prompts.confirm(session, "Are you interested in other events...?");
        },
        async function (session, results) {
            if(results.response){
                // loop back...
                session.replaceDialog("showEventInformation");
            } else {
                session.endDialog("I hope you are happy with my service. Have a nice day...");
            }
        },
    ])

    bot.use({
        botbuilder: function (session, next) {
            if(session.message.text.toLowerCase() === 'logout'){
                // logout
                session.userData = {};
                return session.endDialog("You are logged out...")
            }
            else {
                // log this
            }

            next();
        },
        send: function (event, next) {
            // console.log('>> outgoing', event.text);
            next();
        }
    })
}


_doWork();
