var express = require('express'),
  app = express(),
  swig = require('swig'),
  nib = require('nib'),
  mongojs = require('mongojs'),
  stylus = require('stylus'),
  people;

const db = mongojs("127.0.0.1/hashtagivist", ['hashtags'])

function compile(str, path){
    return stylus(str).set('filename',path).use(nib())
}

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
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

var layouts = {};

app.get('/', function (req, res) {
    var lists =[];

    db.hashtags
    .find({ stage : "trending", category : 0 })
    .sort({ epoch : -1 }, function(err, data){
        console.log(data);

        lists.push({
            title : "New hashtags",
            hashtags : data
        });
        console.log("res responding");

        res.render('index', { 
            hi : "richard",
            lists : lists
        });

    });
});

app.listen(1337);
console.log('Application Started on http://localhost:1337/')

