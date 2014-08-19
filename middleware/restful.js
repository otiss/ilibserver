var  _ = require('lodash'),
    acl = require('./acl'),
    debug = require('debug')('app:lib:restful');

var func_sync = function(req,event, payload){
    var msg = {
        action: (req.query && req.query.action) || req.method
    };
    if(_.isObject(payload)){
        msg.resource = payload;
        msg.resourceID = payload._id;
    }
    if(_.isString(payload)){
        msg.resourceID = payload;
    }
    req.sync && req.sync.emit(event, msg);
};

exports.read = function(callback){
	var test = ['l', 's', 'f', 'sk'],
    	fields = ['limit', 'sort', 'fields', 'skip'];
	
	var func_parseOptions = function(req){
		var options = req.params.options || {};
		for (o in req.query) {
	        if (test.indexOf(o) >= 0) {
	            options[fields[test.indexOf(o)]] = req.query[o];
	        }
	    }
	    if(options.fields){
	        options.fields = JSON.parse(options.fields);
	    }
	    if(options.sort){
	        options.sort = JSON.parse(options.sort);
	    }
	    
	    return options;
	},
	func_parseQuery = function(req){
		var query = req.query.q ? JSON.parse(req.query.q) : {};
	    if (req.params.id) {
	        query = {'_id': req.params.id};
	    }
	    return query;
	}
	
	return function(req, res){
		 var query = func_parseQuery(req);	
			countAs = req.query.c,
	        options = func_parseOptions(req);
        req.criteria = query;
	    var collection = req.collection;
		if (countAs) {
	        collection.count(query, function (err, total) {
	            res.send(total + '');
	        });
	    } else {
	        collection.find(query, options, function (err, cursor) {
	            cursor.toArray(function (err, docs) {
	                if(err){
                        return debug(err.type, err.message);
	                }
	                var result = [],
                        func = function(){
                            if (docs && req.params.id) {
                                if (docs.length > 0) {
                                    result = docs[0];
                                    res.header('Content-Type', 'application/json');
                                    res.send(result);
                                } else {
                                    res.send(404);
                                }
                            } else {
                                if (docs && docs.length > 0) {
                                    docs.forEach(function (doc) {
                                        result.push(doc);
                                    });
                                }
                                res.header('Content-Type', 'application/json');
                                res.send(result);
                            }
                        };
                    if(callback){
                        callback(docs, req, function(){
                            func();
                        });
                    }else{
                        func();
                    }
	            });
	        });
	    }
	}
}

exports.create = function(callback){
	return function(req, res){
		if (req.body) {
            var resource = Array.isArray(req.body) ? req.body[0] : req.body;
			req.collection.insert(resource, function (err, docs) {
                if(err){
                    return debug(err.type, err.message);
                }
                var doc = (docs && docs.length>0)?docs[0]:null;
                res.header('Location', '/app/' + req.params.collection + '/' + doc._id);
                res.header('Content-Type', 'application/json');
                callback && callback(doc, req);
                func_sync(req, 'created', doc);
                result = doc;
                res.send(result, 201);

                if(resource.userID){
                    acl.instance().allow('owner', resource._id, '*', function(err){
                        debug('add owner ACL rule to resource - %s', resource._id);
                    });
                }
            });
	    } else {
	        res.header('Content-Type', 'application/json');
	        res.send(400);
	    }
	}
}

exports.update = function(callback){
	return function (req, res) {
	    var spec = {'_id': req.params.id},
	    	action = req.query && req.query.action || req.method.toLowerCase(),
            resource = req.body;
	    req.collection.update(spec, resource, true, function (err, docs) {
	        if(err){
	            return debug(err.type, err.message);
	        }
	        var doc = (docs && docs.length>0)?docs[0]:(req.resource),
                updatedDoc = req.body.$set;
            updatedDoc = _.assign({}, doc, updatedDoc);
            callback && callback(action, updatedDoc, req);
            func_sync(req, 'updated', updatedDoc);
	        res.header('Content-Type', 'application/json');
            result = updatedDoc;
            res.send(result);

            if(resource.userID){
                acl.instance().allow('owner', resource._id, '*', function(err){
                    debug('add owner ACL rule to resource - %s', resource._id);
                });
            }
	    });
	};
}

exports.delete = function(callback){
	return function (req, res) {
	    var spec = {'_id': req.params.id};
	    req.collection.remove(spec, function (err, docs) {
	        if(err){
	            return debug(err.type, err.message);
	        }
	        callback && callback(req);
            func_sync(req, 'deleted', spec._id);
	        res.header('Content-Type', 'application/json');
	        res.send('{"ok":1}');
	    });
	}
}

