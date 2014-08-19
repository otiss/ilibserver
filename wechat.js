var express = require('express'),
	webot = require('weixin-robot'),
    ejs = require('ejs'),
    fs = require("fs"),
    http = require('http'),
    path = require('path'),
    debug = require('debug')('app:main');

var config = JSON.parse(fs.readFileSync(__dirname + "/config.json")),
    models = require('./lib/datamodel')(),
    app = express();
app.configuration = config;
app.models = models;

require('./lib/mongo').configure(config);
require('./utils/links').configure(config);

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('.html', ejs.__express);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.logger('dev'));

app.use(require('./middleware/mongoose')());

//wechat message robot
require('./messages')(config, webot, models);
webot.watch(app, { token: config.webchat.token, path: '/wechat/messages' });

app.use(express.json());
app.use(express.cookieParser('secret'));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

//routes
app.get('/index/*', require('./routes/sso')(config, models));

//development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var instance = http.createServer(app);
instance.listen(config.servers.wechat.port, function() {
    debug('Express wechat server listening on port ' + config.servers.wechat.port);
});

