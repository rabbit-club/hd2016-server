'use strict';

require('babel-polyfill');

var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');
var xml2js = require('xml2js');
var Entities = require('html-entities').AllHtmlEntities;
var co = require('co');

var callVoiceText = function callVoiceText(fileName, text) {
  return new Promise(function (resolve, reject) {
    var voice = new VoiceText('o2hf0u4z1ep3vspu:');
    voice.speaker(voice.SPEAKER.HIKARI).format(voice.FORMAT.OGG).emotion(voice.EMOTION.HAPPINESS).speak(text, function (e, buf) {
      if (e) console.log(e);
      fs.writeFile(fileName, buf, 'binary', function (e) {
        if (e) {
          console.log(e);
          reject(e);
        } else {
          resolve(true);
        }
      });
    });
  });
};

var getSummarize = function getSummarize(text) {
  return new Promise(function (resolve, reject) {
    text = encodeURIComponent(text);
    var url = 'http://127.0.0.1:8080/summarize?char_limit=150&text=' + text;
    request(url, function (error, response, body) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
};

var getParseJson = function getParseJson(data) {
  return new Promise(function (resolve, reject) {
    var parser = new xml2js.Parser();
    parser.parseString(data, function (err, json) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
};

var readFile = function readFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, function (err, data) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

var writeFile = function writeFile(filePath, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, data, function (err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

co(regeneratorRuntime.mark(function _callee() {
  var xmlData, json, articles, i, title, description, body, shortDescription, titleDescription, fileName, article;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return readFile('rss.xml');

        case 2:
          xmlData = _context.sent;
          _context.next = 5;
          return getParseJson(xmlData);

        case 5:
          json = _context.sent;
          articles = [];
          _context.t0 = regeneratorRuntime.keys(json.rss.channel[0].item);

        case 8:
          if ((_context.t1 = _context.t0()).done) {
            _context.next = 26;
            break;
          }

          i = _context.t1.value;
          title = json.rss.channel[0].item[i].title[0];
          description = json.rss.channel[0].item[i].description[0];
          _context.next = 14;
          return getSummarize(description);

        case 14:
          body = _context.sent;

          body = JSON.parse(body);
          shortDescription = '';

          body.summary.forEach(function (sentence) {
            shortDescription += sentence;
          });
          titleDescription = title + '。' + shortDescription;
          fileName = 'public/test0' + i + '.ogg';
          _context.next = 22;
          return callVoiceText(fileName, titleDescription);

        case 22:
          article = {
            url: json.rss.channel[0].item[i].url[0],
            title: title,
            // description: json.rss.channel[0].item[i].description[0],
            shortDescription: titleDescription,
            imagePath: json.rss.channel[0].item[i].imagePath[0],
            voicePath: json.rss.channel[0].item[i].voicePath[0]
          };

          articles.push(article);
          _context.next = 8;
          break;

        case 26:
          _context.next = 28;
          return writeFile('result.json', JSON.stringify(articles));

        case 28:
          return _context.abrupt('return', _context.sent);

        case 29:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));