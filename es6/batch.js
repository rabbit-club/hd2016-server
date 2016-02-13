import "babel-polyfill";

var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');
var xml2js = require('xml2js');
var Entities = require('html-entities').AllHtmlEntities;
var co = require('co');

var callVoiceText = (fileName, text) => {
  return new Promise((resolve, reject) => {
    var voice = new VoiceText('o2hf0u4z1ep3vspu:');
    voice
      .speaker(voice.SPEAKER.HIKARI)
      .format(voice.FORMAT.OGG)
      .emotion(voice.EMOTION.HAPPINESS)
      .speak(text, (e, buf) => {
      if (e) console.log(e);
        fs.writeFile(fileName, buf, 'binary', e => {
          if (e) {
            console.log(e);
            reject(e);
          } else {
            resolve(true);
          }
       });
    });
  });
}

var getSummarize = text => {
  return new Promise((resolve, reject) => {
    text = encodeURIComponent(text);
    var url = `http://127.0.0.1:8080/summarize?char_limit=150&text=${text}`;
    request(url, (error, response, body) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

var getParseJson = data => {
  return new Promise((resolve, reject) => {
    var parser = new xml2js.Parser();
    parser.parseString(data, (err, json) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

var readFile = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

var writeFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data , err => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

co(function* () {
  var xmlData = yield readFile('rss.xml');
  var json = yield getParseJson(xmlData);
  var articles = [];
  for (var i in json.rss.channel[0].item) {
    var title = json.rss.channel[0].item[i].title[0];
    var description = json.rss.channel[0].item[i].description[0];
    var body = yield getSummarize(description);
    body = JSON.parse(body);
    var shortDescription = '';
    body.summary.forEach(sentence => {
      shortDescription += sentence;
    });
    var titleDescription = `${title}。${shortDescription}`;
    var fileName = `public/test0${i}.ogg`;
    yield callVoiceText(fileName, titleDescription);
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
  return yield writeFile('result.json', JSON.stringify(articles));
});
