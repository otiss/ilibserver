var curd = require('../../lib/restful'),
	acl = require('../../lib/acl'),
	passport = require('../../lib/passport'),
    mongo = require('../../lib/mongo'),
    acl = require('../../lib/acl'),
    validation = require('../../lib/validation'),
	path = require('../../utils/path');

module.exports = function(name, app, options){
	options = options || {};
	options.callbacks = options.callbacks || {};
    var sync = app.Sync;
    app.get(path.get(name),
    		passport.middleware(false),
    		validation.middleware(name, options.validator),
            mongo.middleware(name),
            sync.middleware(name),
    		curd.read(options.callbacks.found));
    app.put(path.put(name), 
    		passport.middleware(true), 
    		acl.middleware(name),
    		validation.middleware(name, options.validator),
            mongo.middleware(name),
            sync.middleware(name),
    		curd.update(options.callbacks.updated));
    app.post(path.post(name), 
    		passport.middleware(true), 
    		acl.middleware(name),
    		validation.middleware(name, options.validator),
    		mongo.middleware(name),
            sync.middleware(name),
            curd.create(options.callbacks.created));
    app.delete(path.delete(name), 
    		passport.middleware(true), 
    		acl.middleware(name),
    		validation.middleware(name, options.validator),
            mongo.middleware(name),
            sync.middleware(name),
    		curd.delete());
}