var acl = require('acl'),
    MongoClient = require('mongodb').MongoClient,
    EventEmitter = require('events').EventEmitter;
var mongodb = require('./mongo')('acl');

var aclinstance, proxy = new EventEmitter();
exports.allow = function(){
	if(aclinstance){
        aclinstance.allow(arguments);
    }else{
        proxy.once('done', function(aclinst){
            aclinst.allow(arguments);
        });
        mongodb.database(function(database){
            var mongoBackend = new acl.mongodbBackend(database, 'acl_');
            aclinstance = new acl(mongoBackend);
            proxy.emit('done', aclinstance);
        });
    }
};

