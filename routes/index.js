var _ = require('lodash');

var passport = require('../lib/passport'),
    mongo = require('../lib/mongo'),
    acl = require('../lib/acl'),
	validation = require('../lib/validation');

module.exports = function(app, config){
    app.use(require('passport').initialize());
    passport.init(config);
    mongo.init(config);
    acl.init(config);
    validation.init(config);

    require('./user')(app);
}