/**
 * message handler for subscribe event
 */
var uuid = require('node-uuid'),
    async = require('async'),
    _ = require('lodash'),
    debug = require('debug')('app:messages:event.subscribe'),
    error = require('debug')('app:messages:event.subscribe:error');

var acl = require('../lib/acl'),
    infor = require('../wechat/info'),
    qrcode = require('../wechat/qrcode');

var func_refer = function(info, options, next){
    var QRCode = options.QRCode,
        prefix = 'qrscene_';

    if(info.param.eventKey){
        var sceneID = (info.param.eventKey.indexOf(prefix)>-1?info.param.eventKey.substring(prefix.length):info.param.eventKey);
        QRCode.find(sceneID, function(err, qr){
            options.referrerID = qr && qr.referID;
            next(null, info, options);
        });
    }else{
        next(null, info, options);
    }
}

var func_persist = function(info, options, next){
    var Customer = options.Customer,
        uid = info.uid;
    Customer.findOne({'wechat.openID': uid, type: 'library'}, '_id referral status', function(err, cus){
        if(err) return error(err);
        var referral;
        if(options.referrerID){
            referral = {referrerID: options.referrerID, status: 0, lastmodified: (new Date()).getTime()};
        }
        if(cus){
            if(!cus.status || cus.status != 'subscribe'){
                var updateBody = {status: 'subscribe', lastmodified: (new Date()).getTime()};
                if(options.info){
                    updateBody.wechat = {info: options.info};
                }
                if(referral && referral.referrerID && referral.referrerID != cus._id){
                    updateBody.referral = referral;
                }
                Customer.update({_id: cus._id}, {$set: updateBody}, function(err, res){
                    if(err) return error(err);
                    debug('update status to customer %s', cus._id);
                    next(null, info, options);
                });
            }else{
                next(null, info, options);
            }
        }else{
            var now = (new Date()).getTime(),
                newCus = new Customer({createdtime: now, lastmodified: now, status: 'subscribe'});
            newCus.wechat = {openID: uid};
            newCus._id = uuid.v4();
            if(info){
                newCus.wechat.info = info;
            }
            newCus.save(function(err, res){
                if(err) error(err);
                debug('save customer as %s at subscribe event handler', newCus.id);
                acl.allow('owner', newCus._id, '*', function(err){
                    debug('add owner ACL rule to customer - %s', newCus._id);
                    next(null, info, options);
                });
            });
        }
    });
};
var func_next = function(info, options, next){
    info.reply = '感谢你订阅小布丁图书馆 \n';
    next(null, info, options);
}

module.exports = function(webot, models, config) {
	var Customer = models.Customer;
    qrcode = qrcode(config, models);
	webot.set('subscribe', {
		pattern : function(info) {
			return info.is('event') && info.param.event === 'subscribe';
		},
		handler : function(info, next) {
            var tasks = [func_refer, func_persist, func_next],
                options = {Customer: Customer,  QRCode: qrcode.QRCode};
            tasks.unshift(function(next){
                infor.info(info.uid, function(wechatInfo){
                    next(null, info, _.assign({info: wechatInfo}, options));
                }, function(){
                    next(null, info, options);
                });
            });
            async.waterfall(tasks, function(){
                next();
            });
		}
	});
}