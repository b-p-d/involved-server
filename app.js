'use strict';

var google = require('googleapis');

var express = require('express');
var app = express();

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

      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }

      // handle err and response
      res.send('involved api');
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});