
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
        session.beginDialog('askForDomain');
    },
    function (session, results) {
        session.dialogData.domain = results.response;
        console.log(session.dialogData.domain)

        switch(session.dialogData.domain){
            case 'events':
                session.send('Below is the list of latest Events')
                var my_events = all_events;
                all_events.forEach(
                    function(cur_event, cur_idx){
                        session.send([
                            `Event #${cur_idx}`,
                            `- Title: ${cur_event.title}`,
                            `- Date: ${cur_event.eventDate} ${cur_event.eventTime}`,
                            `- Location: ${cur_event.location}`,
                            // `Description: ${cur_event.description}`,
                        ].join('\n'));
                    }
                )
                break;
            case 'comments':
                session.send('Below is the list of latest Comments')
                break;
        }
    },
]);



bot.dialog('askForDomain', [
    function (session) {
        builder.Prompts.choice(session, "How can I help?", ["Wedding Event", "Comment"]);
    },
    function (session, results) {
        var domain = '';

        switch(results.response.index){
            case 0:
                domain = 'events';
                break;
            case 1:
                domain = 'comments';
                break;
        }


        session.endDialogWithResult({
            response: domain
        });
    }
]);


