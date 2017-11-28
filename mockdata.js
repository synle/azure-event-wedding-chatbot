const moment = require('moment');
const _ = require('lodash');

const dao = require('./dao')
const util = require('./util')

const NUM_MOCK_EVENTS = 1000;
const NUM_MOCK_INVITEES = 3000;
const BULK_CREATE_LIMITS = 100;
const NUM_BOT_CONFIDENCES = 6000;

let name_list,
    city_list,
    email_domain_list,
    time_day_diff_list = [],
    time_hour_diff_list = [],
    wedding_photo_url_list = [],
    user_list = []

async function doWork(){
    await dao.init();

    let __attendee_list = [];
    let __photo_list = [];

    // mocking events...
    const data_people = [{
        // userId:1,
        userId: 'syle',
        emailId:'syle@syle.com',
        phoneNumber:'4084084088',
        firstName:'Sy',
        lastName:'Le',
    },
    {
        // userId:2,
        userId: 'johndoe',
        firstName:'John',
        lastName:'Doe',
    },
    {
        // userId:3,
        userId: 'adam',
        emailId:'adam@mail.com',
        firstName:'Adam',
        lastName:'Woods',
    },
    {
        // userId:4,
        userId: 'sarita',
        firstName:'Sarita',
        lastName:'Chawla',
    },
    {
        // userId:5,
        userId: 'meghan',
        firstName:'Meghan',
        lastName:'Correa',
    },
    ];

    var initial_mocked_user_count = data_people.length - 1;
    var from_user_id = util.getRandomPosInteger(10000);
    for (let i = 0; i < NUM_MOCK_INVITEES; i++){
        const firstName = util.getRandomItem(name_list);
        const lastName = util.getRandomItem(name_list);

        data_people.push({
            firstName,
            lastName,
        })
    }


    data_people.forEach(function(cur_people){
        const firstName = cur_people.firstName;
        const lastName = cur_people.lastName;

        const phoneNumber = util.getRandomPhoneNumber();
        const emailDomain = util.getRandomItem(email_domain_list);
        const emailId = (firstName + '.' + lastName + emailDomain).toLowerCase();
        const guestName = firstName + ' ' + lastName;


        cur_people.userId = cur_people.userId || guestName.replace(' ', '.').toLowerCase() + '.' + phoneNumber
        cur_people.emailId = cur_people.emailId || emailId
        cur_people.phoneNumber = cur_people.phoneNumber || phoneNumber
        cur_people.guestName = cur_people.guestName || guestName
    });





    // generate random events...
    let cur_last_event_id = 0;
    try{
        const lastEvent = await dao.Event.findAll({
            order: 'event_id DESC',
            limit: 1,
        })
        cur_last_event_id = lastEvent[0].event_id;
    } catch(e){}

    const data_events = [];
    while(initial_mocked_user_count > 0){
        for (let i = 0; i < util.getRandomFromRange(6, 15); i++){
            const eventId = ++cur_last_event_id;

            const event_to_insert = {
                eventId,
                userId: data_people[i].userId,
            }

            data_events.push(event_to_insert);
        }

        initial_mocked_user_count--;
    }


    for (let i = 0; i < NUM_MOCK_EVENTS; i++){
        const eventOwner = util.getRandomItem(data_people);
        const eventId = ++cur_last_event_id;

        const event_to_insert = {
            eventId,
            userId: eventOwner.userId,
        }

        data_events.push(event_to_insert);
    }



    data_events.forEach((current_event, idx) =>{
        // add event nfo...
        const eventId = current_event.eventId;
        const spouse_1 = util.getRandomItem(data_people);
        const spouse_2 = util.getRandomItem(data_people);
        const location = util.getRandomItem(city_list);

        const title = `${spouse_1.firstName} & ${spouse_2.firstName} Wedding`;
        const description = title + ' in ' + location;

        const numDayInFuture = util.getRandomItem(time_day_diff_list);
        const numHourInFuture = util.getRandomItem(time_hour_diff_list);
        const eventDateObject = moment()
            .startOf('day')
            .add(numDayInFuture, 'day')
            .add(numHourInFuture, 'hour');
        const eventDate = eventDateObject.format('MM/DD/YYYY');
        const eventTime = eventDateObject.format('hA');
        // const eventTime = eventDateObject.format('hh:mm A');

        const eventOwner = util.getRandomItem(data_people);

        data_events[idx].title = title;
        data_events[idx].location = location;
        data_events[idx].eventDate = eventDate;
        data_events[idx].eventTime = eventTime;
        data_events[idx].description = description;
        data_events[idx].voice_invite_key = util.getRandomPhoneNumber();






        // add attendee
        let attendee_count = util.getRandomPosInteger(20);
        const attendee_list = [];
        while(attendee_count > 0){
            attendee_count--;
            const current_invitee = util.getRandomItem(data_people);
            attendee_list.push({
                eventId: eventId,
                emailId: current_invitee.emailId,
                phoneNumber: current_invitee.phoneNumber,
                guestName: current_invitee.guestName,
            });
        }
        __attendee_list = __attendee_list.concat(attendee_list);


        // add photo
        let photo_count = util.getRandomPosInteger(5);
        const photo_list = [];
        while(photo_count > 0){
            const current_photo = util.getRandomItem(wedding_photo_url_list);
            photo_list.push({
                eventId,
                photoUrl: current_photo,
                fileName: `${title}-${photo_count}.jpg`,
            });
            photo_count--;
        }
        __photo_list = __photo_list.concat(photo_list);
    })

    //
    // console.log(data_events)
    //




    // mock confidence score...
    const data_confidence = _.range(NUM_BOT_CONFIDENCES)
        .map(() => {
            const cur_user = util.getRandomItem(data_people);
            const cur_event =  util.getRandomItem(data_events);

            return {
                event_id: cur_event.eventId,
                username: cur_user.userId,
                score: util.getRandomPosInteger(100),
            };
        });


    console.log('=========');
    console.log('>> __attendee_list', __attendee_list.length);
    console.log('>> __photo_list', __photo_list.length);
    console.log('>> data_people', data_people.length);
    console.log('>> data_events', data_events.length);
    console.log('>> data_confidence', data_confidence.length);

    console.log('=========');








    // INSERT TO DATABASE
    // INSERT TO DATABASE
    // INSERT TO DATABASE
    // INSERT TO DATABASE
    // DATA PEOPLE
    db_records = data_people.map((item) => {
        return {
            // id: item.userId,
            username: item.userId,
            emailid: item.emailId,
            password: 'password',
            firstname: item.firstName,
            lastname: item.lastName,
            // active: true,
        };

        // console.log(item)
        // { emailId: 'grace.adam@gmail.com',
        //   phoneNumber: '4160826218',
        //   guestName: 'Grace Adam',
        //   firstName: 'Grace',
        //   lastName: 'Adam' }
    });
    try{
        console.log('User', db_records.length)
        // await dao.User.bulkCreate(db_records, BULK_CREATE_LIMITS);
        // await Promise.all(db_records.map(dao.User.create));

        const daoModel = dao.User;
        await Promise.all(db_records.map(item => {
            try{
                return daoModel.create(item)
            } catch(e1){}
        }));
    } catch(e){
        console.log('dao.User.bulkCreate(db_records)', e)
    }







    // DATA EVENTS
    db_records = data_events.map((item) => {
        return {
            event_id: item.eventId,
            title: item.title,
            location: item.location,
            event_date: item.eventDate,
            event_time: item.eventTime,
            description: item.description,
            user_id: item.userId,
            voice_invite_key: item.voice_invite_key,
        };

        // console.log(item)
        // { eventId: 1009,
        //   title: 'Jaxon & Aiden Wedding',
        //   location: 'Santa Fe Springs, Los Angeles, CA',
        //   eventDate: '01/09/2018',
        //   eventTime: '09:00 AM',
        //   description: 'Jaxon & Aiden Wedding in Santa Fe Springs, Los Angeles, CA' }
    });

    try{
        console.log('Event', db_records.length)
        // await dao.Event.bulkCreate(db_records, BULK_CREATE_LIMITS);
        // await Promise.all(db_records.map(dao.Event.create));

        const daoModel = dao.Event;
        await Promise.all(db_records.map(item => {
            try{
                return daoModel.create(item)
            } catch(e1){}
        }));
    } catch(e){
        console.log('dao.Event.bulkCreate(db_records)', e)
    }


    // event attendees
    // ATTENDEE LIST
    db_records = __attendee_list.map((item) => {
        return {
            event_id: item.eventId,
            email_id: item.emailId,
            phone_number: item.phoneNumber,
            guest_name: item.guestName,
        };

        // console.log(item)
        // { eventId: 1009,
        // emailId: 'maya.hunter@yahoo.com',
        // phoneNumber: '4876731745',
        // guestName: 'Maya Hunter' }
    });
    try{
        console.log('Invitee', db_records.length)
        await dao.Invitee.bulkCreate(db_records, BULK_CREATE_LIMITS);
    } catch(e){
        console.log('dao.Invitee.bulkCreate(db_records)', e)
    }


    // PHOTO LIST
    db_records = __photo_list.map((item) => {
        return {
            // id: item.id,
            event_id: item.eventId,
            s3url: item.photoUrl,
            s3thumb_nail_url: item.photoUrl,
            file_name: item.fileName,
        }

        // console.log(item)
        // { eventId: 1009,
        // photoUrl: 'http://heavensentweddings.com/File/Image/m/200/300/33c08cbe-e858-43b0-8eb1-24454c68c017' }
        // fileName: ''}
    });
    try{
        console.log('EventPhoto', db_records.length)
        await dao.EventPhoto.bulkCreate(db_records, BULK_CREATE_LIMITS);
        // await Promise.all(db_records.map(dao.EventPhoto.create));
    } catch(e){
        console.log('dao.EventPhoto.bulkCreate(db_records)', e)
    }





    // confidence score
    // DATA CONFIDENCE
    db_records = data_confidence.map((item) => {
        return {
            username: item.username,
            score: item.score,
            event_id: item.event_id,
        };
    });

    try{
        console.log('Confidence_Score', db_records.length)
        await dao.BotConfidence.bulkCreate(db_records, BULK_CREATE_LIMITS);
        // await Promise.all(db_records.map(dao.BotConfidence.create));
    } catch(e){
        console.log('dao.BotConfidence.bulkCreate(db_records)', e)
    }
}

// mocks
for (let i = 0; i < 15; i++){
    time_day_diff_list.push(i);
}

for (let i = 0; i < 23; i++){
    time_hour_diff_list.push(i);
}

email_domain_list = [
    '@gmail.com',
    '@yahoo.com',
    '@aol.com',
    '@hotmail.com',
];

name_list = [
    'Emma',
    'Liam',
    'Olivia',
    'Noah',
    'Ava',
    'Logan',
    'Sophia',
    'Lucas',
    'Isabella',
    'Mason',
    'Mia',
    'Ethan',
    'Amelia',
    'Oliver',
    'Charlotte',
    'Elijah',
    'Harper',
    'Aiden',
    'Aria',
    'James',
    'Ella',
    'Benjamin',
    'Evelyn',
    'Sebastian',
    'Abigail',
    'Jackson',
    'Emily',
    'Alexander',
    'Avery',
    'Jacob',
    'Scarlett',
    'Carter',
    'Madison',
    'Michael',
    'Sofia',
    'Jayden',
    'Chloe',
    'Daniel',
    'Lily',
    'Luke',
    'Mila',
    'Matthew',
    'Layla',
    'William',
    'Riley',
    'Jack',
    'Ellie',
    'Grayson',
    'Zoey',
    'Wyatt',
    'Luna',
    'Gabriel',
    'Elizabeth',
    'Henry',
    'Grace',
    'Julian',
    'Victoria',
    'Levi',
    'Aubrey',
    'Owen',
    'Penelope',
    'Ryan',
    'Hannah',
    'Leo',
    'Nora',
    'Jaxon',
    'Camila',
    'Lincoln',
    'Addison',
    'Nathan',
    'Stella',
    'Samuel',
    'Bella',
    'Isaiah',
    'Natalie',
    'David',
    'Maya',
    'Adam',
    'Skylar',
    'Joseph',
    'Aurora',
    'Eli',
    'Lillian',
    'John',
    'Paisley',
    'Anthony',
    'Savannah',
    'Muhammad',
    'Brooklyn',
    'Isaac',
    'Hazel',
    'Caleb',
    'Lucy',
    'Dylan',
    'Audrey',
    'Josiah',
    'Aaliyah',
    'Hunter',
    'Zoe',
    'Joshua',
];


city_list = [
    'Agoura Hills, Los Angeles, CA',
    'Alhambra, Los Angeles, CA',
    'Arcadia, Los Angeles, CA',
    'Artesia, Los Angeles, CA',
    'Avalon, Los Angeles, CA',
    'Azusa, Los Angeles, CA',
    'Baldwin Park, Los Angeles, CA',
    'Bell, Los Angeles, CA',
    'Bell Gardens, Los Angeles, CA',
    'Bellflower, Los Angeles, CA',
    'Beverly Hills, Los Angeles, CA',
    'Bradbury, Los Angeles, CA',
    'Burbank, Los Angeles, CA',
    'Calabasas, Los Angeles, CA',
    'Carson, Los Angeles, CA',
    'Cerritos, Los Angeles, CA',
    'Claremont, Los Angeles, CA',
    'Commerce, Los Angeles, CA',
    'Compton, Los Angeles, CA',
    'Covina, Los Angeles, CA',
    'Cudahy, Los Angeles, CA',
    'Culver City, Los Angeles, CA',
    'Diamond Bar, Los Angeles, CA',
    'Downey, Los Angeles, CA',
    'Duarte, Los Angeles, CA',
    'El Monte, Los Angeles, CA',
    'El Segundo, Los Angeles, CA',
    'Gardena, Los Angeles, CA',
    'Glendale, Los Angeles, CA',
    'Glendora, Los Angeles, CA',
    'Hawaiian Gardens, Los Angeles, CA',
    'Hawthorne, Los Angeles, CA',
    'Hermosa Beach, Los Angeles, CA',
    'Hidden Hills, Los Angeles, CA',
    'Huntington Park, Los Angeles, CA',
    'Industry, Los Angeles, CA',
    'Inglewood, Los Angeles, CA',
    'Irwindale, Los Angeles, CA',
    'La Cañada Flintridge, Los Angeles, CA',
    'La Habra Heights, Los Angeles, CA',
    'La Mirada, Los Angeles, CA',
    'La Puente, Los Angeles, CA',
    'La Verne, Los Angeles, CA',
    'Lakewood, Los Angeles, CA',
    'Lancaster, Los Angeles, CA',
    'Lawndale, Los Angeles, CA',
    'Lomita, Los Angeles, CA',
    'Long Beach, Los Angeles, CA',
    'County seat, Los Angeles, CA',
    'Lynwood, Los Angeles, CA',
    'Malibu, Los Angeles, CA',
    'Manhattan Beach, Los Angeles, CA',
    'Maywood, Los Angeles, CA',
    'Monrovia, Los Angeles, CA',
    'Montebello, Los Angeles, CA',
    'Monterey Park, Los Angeles, CA',
    'Norwalk, Los Angeles, CA',
    'Palmdale, Los Angeles, CA',
    'Palos Verdes Estates, Los Angeles, CA',
    'Paramount, Los Angeles, CA',
    'Pasadena, Los Angeles, CA',
    'Pico Rivera, Los Angeles, CA',
    'Pomona, Los Angeles, CA',
    'Rancho Palos Verdes, Los Angeles, CA',
    'Redondo Beach, Los Angeles, CA',
    'Rolling Hills, Los Angeles, CA',
    'Rolling Hills Estates, Los Angeles, CA',
    'Rosemead, Los Angeles, CA',
    'San Dimas, Los Angeles, CA',
    'San Fernando, Los Angeles, CA',
    'San Gabriel, Los Angeles, CA',
    'San Marino, Los Angeles, CA',
    'Santa Clarita, Los Angeles, CA',
    'Santa Fe Springs, Los Angeles, CA',
    'Santa Monica, Los Angeles, CA',
    'Sierra Madre, Los Angeles, CA',
    'Signal Hill, Los Angeles, CA',
    'South El Monte, Los Angeles, CA',
    'South Gate, Los Angeles, CA',
    'South Pasadena, Los Angeles, CA',
    'Temple City, Los Angeles, CA',
    'Torrance, Los Angeles, CA',
    'Vernon, Los Angeles, CA',
    'Walnut, Los Angeles, CA',
    'West Covina, Los Angeles, CA',
    'West Hollywood, Los Angeles, CA',
    'Westlake Village, Los Angeles, CA',
    'Whittier, Los Angeles,, CA',
    'Atherton, San Mateo, CA',
    'Belmont, San Mateo, CA',
    'Brisbane, San Mateo, CA',
    'Burlingame, San Mateo, CA',
    'Colma, San Mateo, CA',
    'Daly City, San Mateo, CA',
    'East Palo Alto, San Mateo, CA',
    'Foster City, San Mateo, CA',
    'Half Moon Bay, San Mateo, CA',
    'Hillsborough, San Mateo, CA',
    'Menlo Park, San Mateo, CA',
    'Millbrae, San Mateo, CA',
    'Pacifica, San Mateo, CA',
    'Portola Valley, San Mateo, CA',
    'Redwood CityCounty seat, San Mateo, CA',
    'San Bruno, San Mateo, CA',
    'San Carlos, San Mateo, CA',
    'South San Francisco, San Mateo, CA',
    'Woodside, San Mateo, CA',
]


wedding_photo_url_list = [
    'http://heavensentweddings.com/File/Image/m/200/300/1891e717-ccdb-4870-b7c3-46e7be9e0bd4',
    'http://heavensentweddings.com/File/Image/m/200/300/24b40f5c-bc8b-441f-a22e-8c1badaa94e3',
    'http://heavensentweddings.com/File/Image/m/200/300/d22661ec-5421-4179-89e6-3b92fa3abc20',
    'http://heavensentweddings.com/File/Image/m/200/300/9408a78b-a415-45a6-b124-3d42c05c5878',
    'http://heavensentweddings.com/File/Image/m/200/300/b73b5494-5fb8-4938-bc4f-46480a97c5b4',
    'http://heavensentweddings.com/File/Image/m/200/300/89a7a88a-1d40-44f8-86e5-21c0d2a30f1c',
    'http://heavensentweddings.com/File/Image/m/200/300/4b1cac6f-09dd-4d2a-944f-17338087e0f1',
    'http://heavensentweddings.com/File/Image/m/200/300/fa17f7de-deb7-4566-b03a-8ed26e5b543e',
    'http://heavensentweddings.com/File/Image/m/200/300/78db83b9-944b-424d-bd40-1f892a6d843b',
    'http://heavensentweddings.com/File/Image/m/200/300/4c6fc9ea-887c-44f1-9dde-db4b41590bfc',
    'http://heavensentweddings.com/File/Image/m/200/300/b7d943a2-148d-440c-9d2a-ce3cb389db6e',
    'http://heavensentweddings.com/File/Image/m/200/300/def105ae-dad5-4762-8b1a-106f90b84052',
    'http://heavensentweddings.com/File/Image/m/200/300/c328f3ac-b7c8-462e-b8e7-811582e2a7df',
    'http://heavensentweddings.com/File/Image/m/200/300/3e1c6380-f86d-4b9a-9485-c148abebd55f',
    'http://heavensentweddings.com/File/Image/m/200/300/4b690329-1663-473d-aeab-bbd7c4684976',
    'http://heavensentweddings.com/File/Image/m/200/300/3dce6eef-38a2-42b2-9f71-e51e9f06f27a',
    'http://heavensentweddings.com/File/Image/m/200/300/20a58d91-b9bd-451b-92eb-a2ca5b996717',
    'http://heavensentweddings.com/File/Image/m/200/300/3c3f8f60-5543-4b37-a258-b5f057c69360',
    'http://heavensentweddings.com/File/Image/m/200/300/33c08cbe-e858-43b0-8eb1-24454c68c017',
    'http://heavensentweddings.com/File/Image/m/200/300/60cb01da-904a-450b-80a4-43363623fea0',
    'http://heavensentweddings.com/File/Image/m/200/300/d67264fa-dfc7-420d-ae02-d11b1f859463',
    'http://heavensentweddings.com/File/Image/m/200/300/33f49faf-4a52-4b5b-97ed-96f3873bab2f',
    'http://heavensentweddings.com/File/Image/m/200/300/33090f06-2ef0-448d-b869-4b9b047d96aa',
    'http://heavensentweddings.com/File/Image/m/200/300/e1923152-c4d0-4ed7-9825-63c0e541e872',
    'http://heavensentweddings.com/File/Image/m/200/300/ad57997e-a173-471e-948c-80bb3d9f0302',
    'http://heavensentweddings.com/File/Image/m/200/300/b7ac18de-54db-4621-ae35-b4817a310e1f',
    'http://heavensentweddings.com/File/Image/m/200/300/56e6f427-e833-4cc6-aff5-d6e12075a0d9',
    'http://heavensentweddings.com/File/Image/m/200/300/ff99f3e9-5d04-4745-a4ec-cd404e872947',
    'http://heavensentweddings.com/File/Image/m/200/300/8d4bb4cf-9ac1-4e6e-917d-cbafff23fb14',
    'http://heavensentweddings.com/File/Image/m/200/300/ac1540fe-07e9-42ee-92eb-7e0d4ab00ee8',
    'http://heavensentweddings.com/File/Image/m/200/300/99ee1c75-49e7-4a34-af07-e2f7b29ac5f5',
    'http://heavensentweddings.com/File/Image/m/200/300/36902eb1-ec7b-449e-a52c-15ab76c9f0db',
    'http://heavensentweddings.com/File/Image/m/200/300/17582f06-9b16-4c8a-ba4f-354cb77326d1',
    'http://heavensentweddings.com/File/Image/m/200/300/17536c00-3d33-4a2b-8297-754e5b5ca4bf',
    'http://heavensentweddings.com/File/Image/m/200/300/a60e0576-8d96-407e-958d-51836caa37f0',
    'http://heavensentweddings.com/File/Image/m/200/300/bebbdcc2-60cb-47c1-a763-58b5c1eeaba8',
    'http://heavensentweddings.com/File/Image/m/200/300/8d4bb4cf-9ac1-4e6e-917d-cbafff23fb14',
    'http://heavensentweddings.com/File/Image/m/200/300/66343b21-d919-4da6-ae2c-2ca28381a4f2',
    'http://heavensentweddings.com/File/Image/m/200/300/db36bc4f-272c-4a70-bcb6-c8006a9e4e81',
    'http://heavensentweddings.com/File/Image/m/200/300/336fb0b3-768a-48d7-9bf5-084091e3ac04',
    'http://heavensentweddings.com/File/Image/m/200/300/b2ee533b-2640-4eff-be5a-6cc080bd3893',
    'http://heavensentweddings.com/File/Image/m/200/300/af159ab3-ecc3-43fd-b2db-ec6ee88cdd66',
    'http://heavensentweddings.com/File/Image/m/200/300/22d6a618-cfae-4ef2-bf95-4c6ce2380947',
    'http://heavensentweddings.com/File/Image/m/200/300/274407b9-7f0e-4fef-b70c-dc9bfae39dcb',
    'http://heavensentweddings.com/File/Image/m/200/300/08baf136-bbfa-44b7-9874-ce08a7498744',
    'http://heavensentweddings.com/File/Image/m/200/300/9c5567d3-0c36-4bc4-8124-d9ec822bc720',
    'http://heavensentweddings.com/File/Image/m/200/300/39cdcd1d-11fd-4aa2-aa9e-41d918e04c69',
    'http://heavensentweddings.com/File/Image/m/200/300/a7efd4fe-247e-4ba1-a3b4-5e0b8363ede9',
    'http://heavensentweddings.com/File/Image/m/200/300/9ed3f8a8-a1f4-4c07-b221-521cd5a39141',
    'http://heavensentweddings.com/File/Image/m/200/300/271f1895-4f41-478f-a6a5-fef34f4558d1',
    'http://heavensentweddings.com/File/Image/m/200/300/b9df83a3-9f37-4763-a632-83380e8e1b6c',
    'http://heavensentweddings.com/File/Image/m/200/300/46d36e1b-e625-4067-b096-ebb5419a47fd',
    'http://heavensentweddings.com/File/Image/m/200/300/22ea37a8-5987-4feb-89f8-d86f830e5835',
    'http://heavensentweddings.com/File/Image/m/200/300/4c812a99-cea4-4ad9-9c56-e52afb4bb465',
    'http://heavensentweddings.com/File/Image/m/200/300/2d0f943e-d3b0-47be-8dce-a8b79da9f4aa',
]

doWork();
