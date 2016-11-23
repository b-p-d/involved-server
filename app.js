'use strict';

var _ = require('lodash');
var google = require('googleapis');

var express = require('express');
var app = express();

app.set('json spaces', 2);

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');

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
    start: event.start.dateTime || event.start.date,
    summary: event.summary
  };

  // check if the event has attachments
  // TODO - check if the attachment ends in a know file format
  if (event.attachments && event.attachments.length > 0) {
    uberEvent.image = event.attachments[0].fileUrl;
  }

  // TODO - check if the description contains base64 info
  if (event.description.includes('--- MORE ---')) {
    var parts = event.description.split('--- MORE ---');

    var meta = new Buffer(parts[1], 'base64').toString('utf8');

    // decode base64
    uberEvent.meta = JSON.parse(meta);

    uberEvent.description = parts[0];

    if (uberEvent.meta.image) {
      uberEvent.image = uberEvent.meta.image;
    }
  }

  return uberEvent;
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});