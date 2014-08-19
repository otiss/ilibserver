var fs = require("fs"),
    debug = require('debug')('cvsapi:main');
var http = require('http'),
    express = require('express');

var config = JSON.parse(fs.readFileSync(__dirname + "/config.json")), app = express();
app.configuration = config;

app.use(require('./middleware/accesscontrol')(config.accessControl).handle);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(express.logger());

app.set('views', __dirname + '/views');
app.set('view engine', 'html');

require('./lib/mongo').configure(config);

require('./routes/rest')(app, config);

var instance = http.createServer(app);
instance.listen(config.servers.api.port, function() {
	debug('Express api server listening on port ' + config.servers.api.port);
});
