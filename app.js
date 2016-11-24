'use strict';

var _ = require('lodash');
var google = require('googleapis');

var express = require('express');
var app = express();

// set pretty json
app.set('json spaces', 2);

// use CORS headers
// TODO get the url from env vars
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// get the calendar events
app.get('/', function (req, res) {

  var key = require('./client_secret.json');
  var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

  var jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    SCOPES,
    'vintagechurchla@gmail.com'
  );

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return res.json('uh oh');
    }

    var calendar = google.calendar('v3');
    calendar.events.list({
      auth: jwtClient,
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function (err, resp) {

      if (err) {
        console.log('The API returned an error: ' + err);
        return res.json('uh oh');
      }

      var events = resp.items;

      if (events.length === 0) {
        console.log('No upcoming events found.');
        return res.json('No upcoming events found');
      }

      // handle err and response
      res.json(_.map(resp.items, buildUpEvent));
    });
  });
});

function buildUpEvent(event) {

  var uberEvent = {
    description: event.description,
    email: event.organizer.email,
    location: event.location,
    startTime: event.start.dateTime,
    endTime: event.end.dateTime,
    start: event.start.date,
    end: event.end.date,
    summary: event.summary
  };


  try {
    // check if the event contains meta data
    if (event.description && event.description.includes('--- MORE ---')) {
      var parts = event.description.split('--- MORE ---');

      var meta = new Buffer(parts.pop(), 'base64').toString('utf8');

      // decode base64
      uberEvent.meta = JSON.parse(meta);

      // update the description without meta information
      uberEvent.description = parts[0];

      // override the default email if set in the meta
      if (uberEvent.meta.email) {
        uberEvent.email = uberEvent.meta.email;
      }
    }
  }
  catch (e) {
    console.log(e);
  }

  return uberEvent;
}

app.listen(9000, function () {
  console.log('involved server running on port 9000!');
});