const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')


const dao = require('./dao');
const util = require('./util')


const server = express()



// server.get('/', (req, res) => res.send('Hello World!'))
const PORT = process.env.port || 8080;
server.listen(PORT, () => console.log('Example app listening on port!', PORT))



// middlewares
server.use(bodyParser.urlencoded({ extended: false }))// parse application/x-www-form-urlencoded
server.use(bodyParser.json())// parse application/json
//


var _showLogin = function(req, res){
    res.sendFile(
        path.join( __dirname+'/view/index.html' )
    )
}


server.get('/', _showLogin)
server.get('/login', _showLogin)


// chat bot html...
server.get('/chatbot', function(req, res){
    res.sendFile(
        path.join( __dirname+'/view/chatbot.html' )
    )
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

        res.send('ok...' + username);
    } catch(e){
        console.log(e);
        res.send('failed...' + username)
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
        var username = 'sl';


        session.dialogData.current_user = await dao.User.findOne({
            where: {
                username: username
            }
        });

        // console.log(session.dialogData.current_user);


        session.dialogData.my_events = await dao.Event.findAll({
            order: 'event_date ASC',
            where: {
                user_id: session.dialogData.current_user.id
            }
        });

        // console.log(session.dialogData.my_events);

        session.send("Welcome to Wedding Event Booking Service.");

        builder.Prompts.choice(session, "Select one of the following events?", session.dialogData.my_events.map((cur_event, cur_idx) => {
            return [
                    `${cur_event.event_date} ${cur_event.event_time} - ${cur_event.title} in ${cur_event.location}`,
                ].join('\n');
        }));
    },
    async function (session, results) {
        var cur_event = session.dialogData.my_events[results.response.index];;
        session.dialogData.selected_event = cur_event;

        session.send("Gathering information regarding this event.");

        session.dialogData.selected_event_photos = await dao.EventPhoto.findAll({
            where: {
                event_id: session.dialogData.selected_event.event_id
            }
        });

        // console.log(session.dialogData.selected_event_photos);
        // console.log('session.dialogData.selected_event_photos', session.dialogData.selected_event_photos[0]);

        session.send([
            `Here is the information about this event`,
            `${cur_event.title}`,
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
