'use strict';

var _ = require('lodash');
var google = require('googleapis');

var express = require('express');
var app = express();

app.set('json spaces', 2);

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
      }

      var events = resp.items;

      if (events.length === 0) {
        console.log('No upcoming events found.');
      }

      // handle err and response
      res.json(_.map(resp.items, square));
    });
  });
});

function square(event) {
  return {
    description: event.description,
    email: event.organizer.email,
    location: event.location,
    start: event.start.dateTime || event.start.date,
    summary: event.summary
  };
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});