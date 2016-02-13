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
  callVoiceText('米Googleは2月12日（現地時間）、写真共有サービス「Picasa」を5月1日に終了すると発表した。この「フォト」は、2015年5月に発表した新たな写真編集・保存・共有サービス「Photos（日本では「フォト」）」に統合された。');
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
       console.log("title:" + json.rss.channel[0].item[i].title);
       console.log("description:" + json.rss.channel[0].item[i].description);
       articles.push(json.rss.channel[0].item[i]);
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

var callVoiceText = text => {
  var fileName = "test05.ogg";
  var voice = new VoiceText('o2hf0u4z1ep3vspu:');
  voice
    .speaker(voice.SPEAKER.HIKARI)
    .format(voice.FORMAT.OGG)
    .speak(text, (e, buf) => {
    if (e) console.log(e);
    fs.writeFile(fileName, buf, 'binary', e => {
     console.log(e);
   });
  });
}
