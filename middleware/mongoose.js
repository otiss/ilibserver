var  mongoose = require('mongoose'),
    debug = require('debug')('app:middleware:mongoose'),
    EventEmitter = require('events').EventEmitter;
var mongodb = require('../lib/mongo')();

var proxy = new EventEmitter(), connected;
module.exports = function(){
	return function(req, res, next){
        if(connected){
            next();
        }else{
            proxy.once('done', function(){
                debug('callback next');
                next();
            });
            mongodb.database(function(db){
                debug('set database to mongoose\'s connection');
                mongoose.connection = db;
                connected = true;
                proxy.emit('done');
            });
        }
    }
}