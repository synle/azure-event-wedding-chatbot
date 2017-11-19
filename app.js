const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')



const dao = require('./dao');
const util = require('./util')


const server = express()



// server.get('/', (req, res) => res.send('Hello World!'))
const PORT = process.env.port || 8080;
server.listen(PORT, () => console.log('Example app listening on port!', PORT))



// middlewares
server.engine('html', require('ejs').renderFile);
server.use(bodyParser.urlencoded({ extended: false }))// parse application/x-www-form-urlencoded
server.use(bodyParser.json())// parse application/json
server.use(cookieParser('S3CRE7'));
server.use(cookieSession({
    name: 'session',
    keys: ['S3CRE7'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours

}));

//


var _showLogin = function(req, res){
    if(req.session.username){
        res.redirect('/chatbot')
    } else{
        res.sendFile(
            path.join( __dirname+'/view/index.html' )
        )
    }
}


server.get('/', _showLogin)
server.get('/login', _showLogin)


server.get('/logout', function(req, res){
    req.session.username = null
    res.redirect('/')
})


// chat bot html...
server.get('/chatbot', function(req, res){
    if(req.session.username){
        res.render(
            path.join( __dirname + '/view/chatbot.html' ),
            {
                username: req.session.username,
                BOT_URL: process.env.BOT_URL,
            }
        )
    } else {
        res.redirect('/')
    }
})


// // do the auth here...
server.post('/login', async function(req, res){
    var {username, password} = req.body;

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


        req.session.username = username;

        res.redirect('/chatbot')
    } catch(e){
        console.log(e);
        res.redirect('/')
    }
})











// // Create chat connector for communicating with the Bot Framework Service
const builder = require('botbuilder');
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());


// This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    async function (session) {
        if(!session.userData.current_user){
            var username = 'sl';

            console.log('init the user...', username);

            session.userData.current_user = await dao.User.findOne({
                where: {
                    username: username
                }
            });
        } else {
            console.log('user data from before...', session.userData);
        }

        // console.log(session.userData.current_user);


        session.dialogData.my_events = await dao.Event.findAll({
            order: 'event_date ASC',
            where: {
                user_id: session.userData.current_user.id
            }
        });

        session.dialogData.my_events.map((cur_event) => {
            cur_event.friendlyString = `${cur_event.event_date} ${cur_event.event_time} - ${cur_event.title} in ${cur_event.location}`;
        });

        // console.log(session.dialogData.my_events);

        session.send("Welcome to Wedding Event Booking Service.");

        builder.Prompts.choice(session, "Select one of the following events?", session.dialogData.my_events.map((cur_event, cur_idx) => {
            return [
                    cur_event.friendlyString,
                ].join('\n');
        }));
    },
    // async function (session, results) {
    //     if(results.response.score <= 0.5){
    //     } else {
    //         session.dialogData.my_events[results.response.index];
    //     }
    //     // console.log(results.response.score)
    //     // { index: 3,
    //     // entity: '11/21/2017 4AM - Sophia & Jack Wedding in Calabasas, Los Angeles, CA',
    //     // score: 0.45 }
    // },
    async function (session, results) {
        var confidence_score = (results.response.score * 100).toFixed();
        console.log(results)
        session.dialogData.selected_event = session.dialogData.my_events[results.response.index];

        session.send(`You selected "${session.dialogData.selected_event.friendlyString}" (Confidence score of ${confidence_score}%)`)

        session.send("Gathering information regarding this event.");

        session.dialogData.selected_event_photos = await dao.EventPhoto.findAll({
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
        ].join('\n'));

        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: session.dialogData.selected_event_photos[0].s3url
            }]);
        session.send(msg);


        session.dialogData.selected_event_invitees = await dao.Invitee.findAll({
            where: {
                event_id: session.dialogData.selected_event.event_id
            }
        });


        // builder.Prompts.confirm(session, "Do you want to look at the latest comments?");
    },
    // async function (session, results) {
    //     if(results.response){
    //         // show the comments...
    //     } else {
    //         session.endDialog('I hope you are happy with my service');
    //     }
    // },
]);
