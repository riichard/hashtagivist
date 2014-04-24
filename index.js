var express = require('express'),
  app = express(),
  swig = require('swig'),
  nib = require('nib'),
  mongojs = require('mongojs'),
  stylus = require('stylus'),
  async= require('async'),
  extend= require('extend'),
  yaml = require('yamljs'),
  people;

console.log(process.env.MONGO_ADDRESS);

const db = mongojs("127.0.0.1/hashtagivist", ['hashtags'])

function compile(str, path){
    return stylus(str).set('filename',path).use(nib())
}

var settings = yaml.load("settings.yml");

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(stylus.middleware({
    src : __dirname + '/public',
    compile : compile
}));

app.use(express.static(__dirname + '/public'));

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(express.multipart());

console.log(settings);

// To disable Swig's cache, do the following:
swig.setDefaults({ 
    cache: false
});

// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

var layouts = {};

app.get('/', function (req, res) {
    var lists =[];
    var columns = [
        { title : "New hashtags", icon : "time" },
        { title : "Trending hashtags", icon : "bullhorn", query : { state : "trending" }},
        { title : "Successful", icon : "ok", query : { state : "success" }}
    ];

    var category = req.query.category || false;

    async.map(columns, function(column, done){
        var query = extend({}, column.query || {});
        if(category) query.category = category;
        db.hashtags.find(query).sort(column.sort || { epoch : -1 }).limit(10, function(err, hashtags){
            column.hashtags = hashtags;
            done(null, column);
        });
    }, function(err, columns){
        console.log(JSON.stringify(columns, 0, '   '));

        res.render('index', { 
            active : category,
            lists : columns,
            categories : settings.categories
        });
    });
});
app.get('/submit', function(req, res){
    res.render("submit", { categories : settings.categories });
});

app.post('/submit', function(req, res){
    console.log(req.body);
    db.hashtags.insert({
        hashtag         : req.body.hashtag,
        category        : req.body.category,
        creator         : req.body.creator,
        campaign_leader : req.body.campaign_leader,
        tweet           : req.body.tweet,
        description     : req.body.description
    }, function(err, data){
        res.render('submit-success');
    });
});

app.get('/hashtag/*', function(req, res){
    db.hashtags.findOne({ 
        hashtag : req.params[0]
    }, function(err, hashtag){
        console.log(hashtag);
        res.render('hashtag', {
            hashtag : hashtag 
        }); 
    });

});

app.listen(80);
console.log('Application Started on http://localhost:1337/')

