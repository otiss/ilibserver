var acl = require('acl'),
    _ = require('lodash'),
    mongodb = require('mongodb'),
    MongoClient = mongodb.MongoClient;

var mongo = require('../lib/mongo');

var config, aclinstance;

var func_init = function(next){
        var uri = 'mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.acl;
        console.log('acl connect to mongodb', uri);
        MongoClient.connect(uri, function(err, database) {
            var mongoBackend = new acl.mongodbBackend(database, 'acl_');
            aclinstance = new acl(mongoBackend);

            aclinstance.allow('admin', ['users', 'activities', 'categories', 'items'], '*');
            aclinstance.allow('customer', ['users', 'activities', 'categories', 'items'], 'get');
            aclinstance.allow('customer', ['consignees', 'markItems', 'orders', 'appointments', 'appointmentOrders'], '*');

            next && next(aclinstance);
        });
    },func_check = function(aclinst, scene, roles, next){
        var resource = scene.resource,
            resourceInstatnce = scene.resourceInstatnce,
            userID = scene.userID,
            action = scene.action;

        if(resourceInstatnce){
            aclinst.allow('owner', resourceInstatnce, '*');
        }
        aclinst.areAnyRolesAllowed(roles, resourceInstatnce || resource, action, function(err, allowed){
            console.log('User %s is %s to %s %s', userID, (allowed?'allowed':'not allowed'),action, resourceInstatnce?(resource + '/' + resourceInstatnce):resource);
            next(allowed);
        });
    },func_find = function(name, id, success, fail){
        mongo.collection(name, function(collection){
            collection.find({_id: id}, {}, function (err, cursor){
                cursor.toArray(function (err, docs) {
                    if(err) return fail(err);
                    if(docs && docs.length > 0){
                        success(docs[0]);
                    }else{
                        fail(Error('no resource instance'));
                    }
                });
            });
        }, function(err){
            fail(err);
        });
    },func = function(scene, roles, next){
        if(aclinstance){
            func_check(aclinstance, scene, roles,next);
        }else{
            func_init(function(instance){
                func_check(instance, scene, roles,next);
            })
        }
};

exports.init = function(conf){
    config = conf;
    func_init();
}

exports.instance = function(){
	return aclinstance;
};

exports.middleware = function(resource){
	
	return function(req, res, next){
		var userID,
			action,
			resourceInstatnce;	
		
		action = req.method.toLowerCase();
		if(req.query && req.query.action){
			action = req.query.action;
		}
		
		var url = req.url.split('?')[0];
		resourceInstatnce = url.substring(url.indexOf(resource) + resource.length + 1);

		var roles = [], user = req.user,
            scene = {
                resource: resource,
                action: action
        };

        var func_next = function(allowed){
            if(allowed){
                next();
            }else{
                res.send(403);
            }
        }
        if(user){
            var userID = scene.userID = user._id;
			roles.push(user.type);
			if(user.role){
				roles.push(user.role);
			}
            if(user.roles){
                _.forEach(user.roles, function(role){
                    if(role){
                        roles.push(role);
                    }
                });
            }
			if(resourceInstatnce){
                scene.resourceInstatnce = resourceInstatnce;
				func_find(resource, resourceInstatnce, function(doc){
                    req.resource = doc;
                    if(req.resource.userID && userID === req.resource.userID){
                        roles.push('owner');
                    }
                    if(req.resource._id && userID === req.resource._id){
                        roles.push('owner');
                    }
                    func(scene, roles, func_next);
				}, function(err){
                    next(err);
                })
			}else{
                func(scene, roles, func_next);
			}
		}else{
			roles.push('guest');
            func(scene, roles, func_next);
		}
	}
}