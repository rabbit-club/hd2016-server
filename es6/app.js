var express = require('express');
var app = express();
var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');
var xml2js = require('xml2js');
var Entities = require('html-entities').AllHtmlEntities;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/articles', (req, res) => {
  // var mode = req.query.mode;
  // var q = req.query.q;
  // var sort = req.query.sort;
  // var hatenaUrl = `http://b.hatena.ne.jp/search/tag?mode=${mode}&q=${q}&sort=${sort}`;
  // hatenaUrl = encodeURIComponent(hatenaUrl);
  // var fivefiltersUrl = `http://ftr.fivefilters.org/makefulltextfeed.php?url=${hatenaUrl}`;
  // var fivefiltersUrl = 'http://ftr.fivefilters.org/makefulltextfeed.php?url=http%3A%2F%2Fb.hatena.ne.jp%2Fsearch%2Ftag%3Fmode%3Drss%26q%3D%25E3%2582%25B2%25E3%2583%25BC%25E3%2583%25A0&max=10';
  // var parser = new xml2js.Parser();
  // request(fivefiltersUrl, (error, response, body) => {
  //   if (error) return console.log(error);
  //   parser.parseString(body, (err, json) => {
  //     // json = JSON.parse(json);
  //     console.log(json.rss.channel.item);
  //     var entities = new Entities();
  //     for (var i in json.rss.channel.item) {
  //       console.log("title:" + entities.decode(json.rss.channel.item[i].title));
  //       console.log("description:" + entities.decode(json.rss.channel.item[i].description));
  //     }
  //   });
  // });
  var articles = [];
  var parser = new xml2js.Parser();
  fs.readFile('rss.xml', (err, data) => {
    parser.parseString(data, (err, json) => {
      for (var i in json.rss.channel[0].item) {
        var title = json.rss.channel[0].item[i].title[0];
        var shortDescription = json.rss.channel[0].item[i].shortDescription[0];
        var titleDescription = `${title}。${shortDescription}`;
        var fileName = `public/test0${i}.wav`;
        callVoiceText(fileName, titleDescription);
        var article = {
          url: json.rss.channel[0].item[i].url[0],
          title: title,
          // description: json.rss.channel[0].item[i].description[0],
          shortDescription: titleDescription,
          imagePath: json.rss.channel[0].item[i].imagePath[0],
          voicePath: json.rss.channel[0].item[i].voicePath[0],
        };
        articles.push(article);
      }
    });
    return res.json(articles);
  });
});

app.get('/summarize', (req, res) => {
  var text = req.query.text;
  text = encodeURIComponent(text);
  var url = `http://127.0.0.1:8080/summarize?char_limit=150&text=${text}`;
  request(url, (error, response, body) => {
    if (error) return console.log(error);
      res.send(body);
  });
});

app.listen(3000);

var callVoiceText = (fileName, text) => {
  var voice = new VoiceText('o2hf0u4z1ep3vspu:');
  voice
    .speaker(voice.SPEAKER.HIKARI)
    .format(voice.FORMAT.WAV)
    .emotion(voice.EMOTION.HAPPINESS)
    .speak(text, (e, buf) => {
    if (e) console.log(e);
    fs.writeFile(fileName, buf, 'binary', e => {
     console.log(e);
   });
  });
}
