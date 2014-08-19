var mongo = require("mongodb"),
	MongoClient = mongo.MongoClient;
var config,
	db;

exports.init = function(conf){
    config = conf.db;
}

var func_connect = function(success, fail){
	MongoClient.connect('mongodb://' + config.host + ':' + config.port + '/' + config.name, function(err, database) {
	  if(err) return fail && fail(err);
	  db = database;
	  success && success();
	});
}

exports.open = function(callback){
    if(db){
    	callback && callback(db);
    }else{
    	func_connect(function(){
    		 callback && callback(db);
    	});
    }
    
}

exports.db = function(success, fail){
    if(db){
        success(db);
    }else{
        func_connect(function(){
            success(db);
        }, function(err){
            fail(err);
        });
    }
}

exports.collection = function(name, success, fail){
    exports.db(function(db){
        db.collection(name, function (err, collection) {
            if(err) return fail(err);
            success(collection,db);
        });
    }, function(err){
        fail(err);
    });
}


exports.middleware = function(name){
    return function(req, res, next){
        exports.collection(name, function(collection, db){
            req.db = db;
            req.collection = collection;
            next();
        }, function(err){
            next(err);
        })
    }
}