var MongoClient = require("mongodb").MongoClient,
    _ = require('lodash'),
    debug = require('debug')('app:lib:mongo'),
    error = require('debug')('app:lib:mongo:error'),
    EventEmitter = require('events').EventEmitter;
var proxy = new EventEmitter(),
    databases = {};

var func_connect = function(){
	var self = this;
    MongoClient.connect('mongodb://' + self.host + ':' + self.port + '/' + self.name, function(err, database) {
	  if(err) {
          error('fail to connect [%s] database', self.name);
          return proxy.emit('error', err);
      }
      debug('connect [%s] database successfully', self.name);
      self.db = database;
      proxy.emit('done', database);
	});
}

var Database = function(config){
    var self = this;
    _.extend(self, config);
}
Database.configuration = {host: 'localhost', port: 27017, name: 'ibooks', username: 'admin', password: 'pass'};
Database.prototype.database = function(callback){
    var self = this;
    if(self.db){
    	callback(self.db);
    }else{
        proxy.once('done', function(db){
            debug('callback database');
            callback(db);
        });
    	func_connect.apply(self);
    }
};
Database.prototype.collection = function(name, callback){
    var self = this;
    self.database(function(db){
        db.collection(name, function (err, collection) {
            if(err) {
                error('fail to connect to collection', err);
                return callback(err);
            }
            callback(null, db, collection);
        });
    })
};

exports = module.exports = function(name){
    name = name || Database.configuration.name;
    var db = databases[name];
    if(!db){
        var conf = _.extend({name: name}, Database.configuration);
        db = databases[name] = new Database(conf);
    }
    return db;
};

exports.configure = function(conf){
    _.extend(Database.configuration, conf.db);
};
exports.Database = Database;

