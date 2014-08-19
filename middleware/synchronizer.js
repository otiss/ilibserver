var events = require('events'),
    util = require('util'),
    _ = require('lodash'),
    debug = require('debug')('app:synchronizer');
var async = require('async'),
    mongo = require("./mongo");

var config;

var func_orders = function(callback){
    mongo.collection('orders', function(col){
        callback && callback(col);
    });
}

var Order = function(order, sync){
    if(_.isObject(order)){
        this._orderID = order._id;
        this._order = order;
    }else{
        this._orderID = order;
    }
    this._sync = sync;
}
util.inherits(Order, events.EventEmitter);
Order.prototype.completed = function(data, options){
    var _this = this, externalD = data.clientID, orderID = data.serverID,
        updateData = {status: 1, externalD: externalD, lastsynced: (new Date()).getTime()};
    func_orders(function(collection){
    	debug('update order %s sync status', orderID);
        collection.update({_id: orderID}, {'$set': {sync: updateData}}, function(err, res){
        	debug('$s orders sync status are updated', res);
            _this.emit('updated', options);
            _this._sync.completed(orderID);
        });
    });
};

var OrderSync = function(){
    this._cache = {};
}
util.inherits(OrderSync, events.EventEmitter);

var func_error = function(err, options){
	this.emit((options && options.event)?(options.event + '.'):'' + 'error', err, options);
},
func_info = function(info, options){
	this.emit((options && options.event)?(options.event + '.'):'' + 'info', info, options);
};

OrderSync.prototype.new = function(order){
    return new Order(order, this);
}
OrderSync.prototype.load = function(id){
    return this._cache[id];
}
OrderSync.prototype.confirm = function(order){
    var _this = this;
    var payload = _this.new(order);
    _this._cache[order._id] = payload;
    _this.emit('new',  payload);
};
OrderSync.prototype.reload = function(since, options){
	since = since || (new Date()).getTime();
    var _this = this,
    	query = {'$and': [{'$or': [{sync: {'$exists': false}}, {'sync.status': 0}]}, {'lastmodified': {'$gt': since}}]};
    func_orders(function(collection){
        collection.find(query, function(err, cursor){
            if(err) return func_error.call(_this, err, options);
            cursor.toArray(function(err, orders){
                if(err) return func_error.call(_this, err, options);
                if(orders && orders.length > 0){
                    async.eachSeries(orders, function(order, next){
                        var payload = _this.new(order);
                        _this._cache[order._id] = payload;
                        _this.emit('load', payload, options);
                        next();
                    });
                }else{
                    func_info.call(_this, 'no existing orders to sync', options);
                }
            });
        });
    });
};
OrderSync.prototype.attempt = function(orderID, options){
	var _this = this;
	options = options || {};
    func_orders(function(collection){
        collection.find({_id: orderID}, function(err, cursor){
            if(err) return func_error.call(_this, err, options);
            cursor.toArray(function(err, orders){
                if(err) return func_error.call(_this, err, options);
                if(orders && orders.length > 0){
                    var order = orders[0];
                    if((options && options.omitCheckStatus) || (!order.sync || order.sync.status === 0)){
                        var payload = _this.new(order);
                        _this._cache[order._id] = payload;
                        _this.emit(options.event || 'load', payload, options);
                    }else{
                        if(_this._cache[order._id]){
                            delete _this._cache[order._id];
                        }
                        func_error.call(_this, new Error('order ' + orderID + ' is synced.'), options);
                    }
                }else{
                    func_error.call(_this, new Error('no order for ' + orderID), options);
                }
            });
        });
    });
}

OrderSync.prototype.completed = function(orderID){
	var _this = this;
	if(_this._cache[orderID]){
	   delete _this._cache[orderID];
   }
}

var syncCache = {};
var Sync = function(name){
    this._name = name;
}
util.inherits(Sync, events.EventEmitter);

Sync.load = function(name){
    var ins = syncCache[name];
    if(!ins){
        ins = new Sync(name);
        syncCache[name] = ins;
    }
    return ins;
};

Sync.middleware = function(name){
    return function(req, res, next){
        req.sync = Sync.load(name);
        next();
    }
}

module.exports = function(conf){
    config = conf;
    return {
        Order: new OrderSync(),
        Sync: Sync
    }
}
