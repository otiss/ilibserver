var mongodb = require("../lib/mongo")();

exports.middleware = function(name){
    return function(req, res, next){
        mongodb.collection(name, function(err, collection, db){
            if(err){
                return next(err);
            }
            req.db = db;
            req.collection = collection;
            next();
        });
    }
}