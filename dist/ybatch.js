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
    var url = 'http://127.0.0.1:8080/summarize?char_limit=156&text=' + text;
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

var getRequest = function getRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
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
  var options, articles, yrssXml, json, baseUrl, i, url, title, description, body, shortDescription, titleDescription, fileName, content, imagePath, article;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log('start ybatch');
          _context.prev = 1;

          // var urls = [
          //   'http://news.yahoo.co.jp/pickup/domestic/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/world/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/economy/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/entertainment/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/sports/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/computer/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/science/rss.xml',
          //   'http://news.yahoo.co.jp/pickup/local/rss.xml'
          // ];
          options = {
            // ua偽装しないとはてブ取得できない
            url: 'http://b.hatena.ne.jp/entrylist?sort=hot&threshold=3&url=http://headlines.yahoo.co.jp/&mode=rss',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
            }
          };
          articles = [];
          _context.next = 6;
          return getRequest(options);

        case 6:
          yrssXml = _context.sent;
          _context.next = 9;
          return getParseJson(yrssXml);

        case 9:
          json = _context.sent;
          baseUrl = 'http://210.140.161.190:3000/';
          _context.t0 = regeneratorRuntime.keys(json['rdf:RDF'].item);

        case 12:
          if ((_context.t1 = _context.t0()).done) {
            _context.next = 52;
            break;
          }

          i = _context.t1.value;
          url = json['rdf:RDF'].item[i].link[0];
          title = json['rdf:RDF'].item[i].title[0];

          // 不要文字削除

          title = title.replace(/ - Yahoo!ニュース/g, '');
          title = title.replace(/(\(|（).*(\)|）)/g, '');

          description = json['rdf:RDF'].item[i].description[0];

          description = description.replace(/(\(|（|【).*(\)|）|】)/g, '');
          // description = description.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
          // var descriptions = description.split(/\s+/g);
          //        descriptions = descriptions.filter(v => {
          //          return v.match(/。/);
          //        });
          // description = descriptions.join('');
          _context.next = 22;
          return getSummarize(description);

        case 22:
          body = _context.sent;

          body = JSON.parse(body);
          shortDescription = '';
          _context.prev = 25;

          body.summary.forEach(function (sentence) {
            if (sentence.match(/。/)) {
              shortDescription += sentence;
            }
          });
          _context.next = 33;
          break;

        case 29:
          _context.prev = 29;
          _context.t2 = _context['catch'](25);

          console.error(_context.t2);
          return _context.abrupt('continue', 12);

        case 33:
          if (!(shortDescription == '')) {
            _context.next = 35;
            break;
          }

          return _context.abrupt('continue', 12);

        case 35:
          titleDescription = title + '。' + shortDescription;
          fileName = 'ytest' + i;
          _context.next = 39;
          return callVoiceText(fileName, titleDescription, FORMAT_TYPE_OGG);

        case 39:
          _context.next = 41;
          return callVoiceText(fileName, titleDescription, FORMAT_TYPE_WAV);

        case 41:
          _context.next = 43;
          return wav2mp3(fileName);

        case 43:
          // var imagePath = json.rss.channel[0].item[i]['og:image'][0];
          content = json['rdf:RDF'].item[i]['content:encoded'][0];

          content = content.match(/http:\/\/cdn-ak.b.st-hatena.com\/entryimage\/.*jpg/);
          imagePath = "";

          if (content != null) {
            imagePath = content[0];
          }
          if (imagePath == "") {
            imagePath = 'http://i.yimg.jp/images/jpnews/cre/common/all/images/fbico_ogp_1200x630.png';
          }
          article = {
            url: url,
            title: title,
            // description: json.rss.channel[0].item[i].description[0],
            shortDescription: titleDescription,
            imagePath: imagePath,
            voicePathOgg: '' + baseUrl + fileName + '.ogg',
            voicePathWav: '' + baseUrl + fileName + '.wav',
            voicePathMp3: '' + baseUrl + fileName + '.mp3'
          };

          articles.push(article);
          _context.next = 12;
          break;

        case 52:
          _context.next = 54;
          return writeFile(__dirname + '/../yresult.json', JSON.stringify(articles));

        case 54:
          console.log('end ybatch');
          _context.next = 60;
          break;

        case 57:
          _context.prev = 57;
          _context.t3 = _context['catch'](1);

          console.error(_context.t3);

        case 60:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this, [[1, 57], [25, 29]]);
}));