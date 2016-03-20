import "babel-polyfill";

var request = require('request');
var VoiceText = require('voicetext');
var fs = require('fs');
var xml2js = require('xml2js');
var Entities = require('html-entities').AllHtmlEntities;
var co = require('co');
var sox = require('sox');

const FORMAT_TYPE_OGG = 'ogg';
const FORMAT_TYPE_WAV = 'wav';

var callVoiceText = (fileName, text, formatType) => {
  return new Promise((resolve, reject) => {
    var voice = new VoiceText('o2hf0u4z1ep3vspu:');
    var format;
    var filePath;
    if (formatType == FORMAT_TYPE_OGG) {
      format = voice.FORMAT.OGG;
      filePath = __dirname + `/../public/${fileName}.ogg`;
    } else if (formatType == FORMAT_TYPE_WAV) {
      filePath = __dirname + `/../public/${fileName}.wav`;
      format = voice.FORMAT.WAV;
    }
    voice
      .speaker(voice.SPEAKER.HIKARI)
      .format(format)
      .emotion(voice.EMOTION.HAPPINESS)
      .speak(text, (e, buf) => {
      if (e) console.log(e);
        fs.writeFile(filePath, buf, 'binary', e => {
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

var wav2mp3 = fileName => {
  return new Promise((resolve, reject) => {
    var wavFilePath = __dirname + `/../public/${fileName}.wav`;
    var mp3FilePath = __dirname + `/../public/${fileName}.mp3`;
    var job = sox.transcode(wavFilePath, mp3FilePath, {
      sampleRate: 44100,
      format: 'mp3',
      channelCount: 2,
      bitRate: 192 * 1024,
      compressionQuality: 5,
    });
    job.on('error', function(err) {
      console.log(err);
      reject(err);
    });
    job.on('end', function() {
      resolve(true);
    });
    job.start();
  });
}

var getSummarize = text => {
  return new Promise((resolve, reject) => {
    text = encodeURIComponent(text);
    var url = `http://127.0.0.1:8080/summarize?char_limit=156&text=${text}`;
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

var getFiveFilter = url => {
  return new Promise((resolve, reject) => {
    var baseUrl = 'http://ftr.fivefilters.org/makefulltextfeed.php?url=';
    url = baseUrl + encodeURIComponent(url);
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

var getRequest = options => {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

co(function* () {
  console.log('start ybatch');
  try {
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
    var options = {
      // ua偽装しないとはてブ取得できない
      url: 'http://b.hatena.ne.jp/entrylist?sort=hot&threshold=3&url=http://headlines.yahoo.co.jp/&mode=rss',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
      }
    };
    var articles = [];
    var yrssXml = yield getRequest(options);
    // var xmlData = yield readFile(__dirname + '/../rss.xml');
    var json = yield getParseJson(yrssXml);
    var baseUrl = 'http://210.140.161.190:3000/';
    for (var i in json['rdf:RDF'].item) {
      var url = json['rdf:RDF'].item[i].link[0];
      var title = json['rdf:RDF'].item[i].title[0];

      // 不要文字削除
      title = title.replace(/ - Yahoo!ニュース/g, '');
      title = title.replace(/(\(|（).*(\)|）)/g, '');

      var description = json['rdf:RDF'].item[i].description[0];
      description = description.replace(/(\(|（|【).*(\)|）|】)/g, '');
      // description = description.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');
      // var descriptions = description.split(/\s+/g);
//        descriptions = descriptions.filter(v => {
//          return v.match(/。/);
//        });
      // description = descriptions.join('');
      var body = yield getSummarize(description);
      body = JSON.parse(body);
      var shortDescription = '';
      try {
        body.summary.forEach(sentence => {
          if (sentence.match(/。/)) {
            shortDescription += sentence;
          }
        });
      } catch (er) {
        console.error(er);
        continue;
      }
      if (shortDescription == '') {
        continue;
      }
      var titleDescription = `${title}。${shortDescription}`;
      var fileName = `ytest${i}`;
      yield callVoiceText(fileName, titleDescription, FORMAT_TYPE_OGG);
      yield callVoiceText(fileName, titleDescription, FORMAT_TYPE_WAV);
      yield wav2mp3(fileName);
      // var imagePath = json.rss.channel[0].item[i]['og:image'][0];
      var content = json['rdf:RDF'].item[i]['content:encoded'][0];
      content = content.match(/http:\/\/cdn-ak.b.st-hatena.com\/entryimage\/.*jpg/);
      var imagePath = "";
      if (content != null) {
        imagePath = content[0];
      }
      if (imagePath == "") {
        imagePath = 'http://i.yimg.jp/images/jpnews/cre/common/all/images/fbico_ogp_1200x630.png';
      }
      var article = {
        url: url,
        title: title,
        // description: json.rss.channel[0].item[i].description[0],
        shortDescription: titleDescription,
        imagePath: imagePath,
        voicePathOgg: `${baseUrl}${fileName}.ogg`,
        voicePathWav: `${baseUrl}${fileName}.wav`,
        voicePathMp3: `${baseUrl}${fileName}.mp3`
      };
      articles.push(article);
    }
    yield writeFile(__dirname + '/../yresult.json', JSON.stringify(articles));
    console.log('end ybatch');
  } catch (e) {
    console.error(e);
  }
});
