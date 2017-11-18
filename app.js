
var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users
server.post('/api/messages', connector.listen());



var all_events = [
    {
        title: 'Peter & Mary Wedding',
        location: 'NestDown, Los Gatos, CA',
        eventDate: '11/20/2017',
        eventTime: '6PM',
        description: 'Peter & Mary wedding in NestDown',
    },
    {
        title: 'Bob & Connie Wedding',
        location: 'Saratoga Country winery, Saratoga, CA',
        eventDate: '11/21/2017',
        eventTime: '7PM',
        description: 'Bob & Connie Wedding in Saratoga Country winery',
    }
]

// This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Welcome to Wedding Event Booking Service.");
        session.dialogData.my_events = all_events;
        builder.Prompts.choice(session, "Select one of the following event?", session.dialogData.my_events.map((cur_event, cur_idx) => {
            return [
                    `${cur_event.title}`,
                ].join('\n');
        }));
    },
    function (session, results) {
        session.dialogData.selected_event = session.dialogData.my_events[results.response.index];
        builder.Prompts.choice(session, "What do you want to know about the events?", ["Details / Information", "Comments"]);
    },
    function (session, results) {
        session.dialogData.domain = results.response.index === 0 ? "information" : "comment";
        console.log(session.dialogData.domain)

        switch(session.dialogData.domain){
            case 'information':
                var cur_event = session.dialogData.selected_event;
                session.send(`Here is the information about this event`);
                session.send([
                    `${cur_event.title}`,
                    `- Date: ${cur_event.eventDate} ${cur_event.eventTime}`,
                    `- Location: ${cur_event.location}`,
                ].join('\n'));
                break;
            case 'comment':
                session.send('Below is the list of latest Comments')
                break;
        }
    },
]);


