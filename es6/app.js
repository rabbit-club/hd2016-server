var express = require('express');
var app = express();
var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');

app.get('/', (req, res) => {
    res.send('Hello!');
    callVoiceText('Hello');
});

app.get('/summarize', (req, res) => {
  var text = req.query.text;
  text = encodeURIComponent(text);
  var url = `http://127.0.0.1:8080/summarize?char_limit=50&text=${text}`;
  request(url, (error, response, body) => {
    if (error) return console.log(error);
      res.send(body);
  });
});

app.listen(3000);

var callVoiceText = text => {
  var fileName = "test.wav";
  var voice = new VoiceText('o2hf0u4z1ep3vspu:');
  voice
    .speaker(voice.SPEAKER.HIKARI)
    .format(voice.FORMAT.WAV)
    .speak(text, (e, buf) => {
    if (e) console.log(e);
    fs.writeFile(fileName, buf, 'binary', e => {
     console.log(e);
   });
  });
}
