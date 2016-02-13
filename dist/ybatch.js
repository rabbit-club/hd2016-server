'use strict';

require('babel-polyfill');

var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');
var xml2js = require('xml2js');
var Entities = require('html-entities').AllHtmlEntities;
var co = require('co');
var sox = require('sox');

var FORMAT_TYPE_OGG = 'ogg';
var FORMAT_TYPE_WAV = 'wav';

var callVoiceText = function callVoiceText(fileName, text, formatType) {
  return new Promise(function (resolve, reject) {
    var voice = new VoiceText('o2hf0u4z1ep3vspu:');
    var format;
    var filePath;
    if (formatType == FORMAT_TYPE_OGG) {
      format = voice.FORMAT.OGG;
      filePath = __dirname + ('/../public/' + fileName + '.ogg');
    } else if (formatType == FORMAT_TYPE_WAV) {
      filePath = __dirname + ('/../public/' + fileName + '.wav');
      format = voice.FORMAT.WAV;
    }
    voice.speaker(voice.SPEAKER.HIKARI).format(format).emotion(voice.EMOTION.HAPPINESS).speak(text, function (e, buf) {
      if (e) console.log(e);
      fs.writeFile(filePath, buf, 'binary', function (e) {
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

var wav2mp3 = function wav2mp3(fileName) {
  return new Promise(function (resolve, reject) {
    var wavFilePath = __dirname + ('/../public/' + fileName + '.wav');
    var mp3FilePath = __dirname + ('/../public/' + fileName + '.mp3');
    var job = sox.transcode(wavFilePath, mp3FilePath, {
      sampleRate: 44100,
      format: 'mp3',
      channelCount: 2,
      bitRate: 192 * 1024,
      compressionQuality: 5
    });
    job.on('error', function (err) {
      console.log(err);
      reject(err);
    });
    job.on('end', function () {
      resolve(true);
    });
    job.start();
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

var getFiveFilter = function getFiveFilter(url) {
  return new Promise(function (resolve, reject) {
    var baseUrl = 'http://ftr.fivefilters.org/makefulltextfeed.php?url=';
    url = baseUrl + encodeURIComponent(url);
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

co(regeneratorRuntime.mark(function _callee() {
  var urls, articles, j, url, yrssXml, json, baseUrl, i, title, description, descriptions, body, shortDescription, titleDescription, fileName, article;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          urls = ['http://deno-blog.com/RSS/yahoo-news-domestic.xml', 'http://deno-blog.com/RSS/yahoo-news-world.xml', 'http://deno-blog.com/RSS/yahoo-news-economy.xml', 'http://deno-blog.com/RSS/yahoo-news-entertainment.xml', 'http://deno-blog.com/RSS/yahoo-news-sports.xml', 'http://deno-blog.com/RSS/yahoo-news-computer.xml', 'http://deno-blog.com/RSS/yahoo-news-science.xml', 'http://deno-blog.com/RSS/yahoo-news-local.xml'];
          articles = [];
          _context.t0 = regeneratorRuntime.keys(urls);

        case 3:
          if ((_context.t1 = _context.t0()).done) {
            _context.next = 41;
            break;
          }

          j = _context.t1.value;
          url = urls[j];
          _context.next = 8;
          return getFiveFilter(url);

        case 8:
          yrssXml = _context.sent;
          _context.next = 11;
          return getParseJson(yrssXml);

        case 11:
          json = _context.sent;
          baseUrl = 'http://210.140.161.190:3000/';
          _context.t2 = regeneratorRuntime.keys(json.rss.channel[0].item);

        case 14:
          if ((_context.t3 = _context.t2()).done) {
            _context.next = 39;
            break;
          }

          i = _context.t3.value;
          url = json.rss.channel[0].item[i].link[0];
          title = json.rss.channel[0].item[i].title[0];
          description = json.rss.channel[0].item[i].description[0];

          description = description.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
          descriptions = description.split(/\s+/g);

          descriptions = descriptions.filter(function (v) {
            return v.match(/。/);
          });
          description = descriptions.join('');
          _context.next = 25;
          return getSummarize(description);

        case 25:
          body = _context.sent;

          body = JSON.parse(body);
          shortDescription = '';

          body.summary.forEach(function (sentence) {
            shortDescription += sentence;
          });
          titleDescription = title + '。' + shortDescription;
          fileName = 'ytest' + j + i;
          _context.next = 33;
          return callVoiceText(fileName, titleDescription, FORMAT_TYPE_OGG);

        case 33:
          _context.next = 35;
          return callVoiceText(fileName, titleDescription, FORMAT_TYPE_WAV);

        case 35:
          // yield wav2mp3(fileName);
          article = {
            url: url,
            title: title,
            // description: json.rss.channel[0].item[i].description[0],
            shortDescription: titleDescription,
            // imagePath: json.rss.channel[0].item[i].imagePath[0],
            imagePath: 'http://livedoor.4.blogimg.jp/jin115/imgs/c/b/cb8e2cba-s.jpg',
            voicePathOgg: '' + baseUrl + fileName + '.ogg',
            voicePathWav: '' + baseUrl + fileName + '.wav'
          };

          articles.push(article);
          _context.next = 14;
          break;

        case 39:
          _context.next = 3;
          break;

        case 41:
          _context.next = 43;
          return writeFile(__dirname + '/../yresult.json', JSON.stringify(articles));

        case 43:
          return _context.abrupt('return', _context.sent);

        case 44:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));