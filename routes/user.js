var _ = require('lodash'),
    validator = require('../utils/validator')();
var passport = require('../lib/passport'),
    mongo = require('../lib/mongo'),
    acl = require('../lib/acl'),
	validation = require('../lib/validation');
var common = require('./lib/common'),
    restrict = require('./lib/restrict');

module.exports = function(app){
    var options = {};
    options.callbacks = {};
    options.callbacks.created = function(resource){
    	acl.instance().allow('owner', resource._id, '*', function(err){
    		console.log('add owner ACL rule to resource - %s', resource._id);
    	});
    };
    common('users', app, _.assign({
    	validator: function(action, doc){
    		var errors = [];
    		validator(errors, 'lastmodified', doc.lastmodified).isRequired().isInt();
    		if(action === 'consignee'){
    			validator(errors, 'consignee', doc.consignee).isRequired();
    			validator(errors, 'consignee.address', doc.consignee.address).isRequired();
    			validator(errors, 'consignee.name', doc.consignee.name).isRequired();
    			validator(errors, 'consignee.phone', doc.consignee.phone).isRequired();
    		}
    		return errors;
    	}
    }, options));

}