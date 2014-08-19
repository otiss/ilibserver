var _ = require('lodash'),
    util = require('util'),
    moment = require('moment');

var links = require('../utils/links');


var Replyer = function(){};
Replyer.prototype.message = function(next){
    next(null, '非法关键字.');
};
Replyer.prototype.reply = function(info, next){
    this.message(info.text, function(err, msg){
       if(err){
           info.reply = '系统出错，请稍后重试.(ERR:' + err + ')';
       }else{
           if(_.isArray(msg)){
               if(msg.length == 1){
                   msg = msg[0];
               }
           }
           info.reply = msg;
       }
        next(null);
    });
}

var Dispatcher = function(models){
    this._cache = {};
    this._models = models;
};
Dispatcher.prototype.dispatch = function(info, next){
    var self = this, state = self._cache[info.uid];
    //TODO:
}

module.exports = function(webot, models) {
    var dis = new Dispatcher(models);
	webot.set('text', {
		pattern : function(info) {
            return info.is('text');
        },
		handler : function(info, next) {
            info.reply = {type: 'transfer_customer_service', content: 'transfer_customer_service'};
            next();
		}
	});
}