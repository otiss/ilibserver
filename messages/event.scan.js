/**
 * message handler for subscribe event
 */
var _ = require('lodash'),
    debug = require('debug')('app:messages:event.scan'),
    error = require('debug')('app:messages:event.scan:error');

var links = require('../utils/links'),
    qrcode = require('../wechat/qrcode');

var Scaner = function(options){
    this.options = options;
    this.handlers = {};
};
Scaner.prototype.add = function(type, handler){
    this.handlers[type] = handler;
}
Scaner.prototype.query = function(sceneID, next){
    var self = this;
    self.options.QRCode.find(sceneID, function(err, qr){
        next(err, qr && qr.referID, qr && qr.type);
    });
};
Scaner.prototype.message = function(id, type, info, next){
    var handler = this.handlers[type];
    debug('handler for id[%s] and type[%s]', id, type);
    if(handler){
        handler(id, info.uid, next);
    }else{
        error('no handler for id[%s] and type[%s]', id, type);
        next(Error('no handler'));
    }
};
Scaner.prototype.reply = function(info, next){
    var self = this,
        prefix = 'qrscene_',
        sceneID = info.param.eventKey.indexOf(prefix)>-1?info.param.eventKey.substring(prefix.length):info.param.eventKey;
    self.query(sceneID, function(err, id, type){
        if(err){
            info.reply = '系统出错，请稍后重试.(ERR:' + err + ')';
            next(null);
        }else{
            if(id){
                self.message(id, type, info, function(err, content){
                    info.reply = err!=null?'系统出错，请稍后重试.(ERR:' + err + ')':content;
                    next(null);
                })
            }else{
                info.reply = '无效的二维码.';
                next(null);
            }
        }
    });
}

module.exports = function(webot, models, config) {
	qrcode = qrcode(config, models);

    var Item = models.Item,
        Customer = models.Customer;
    var scaner = new Scaner({
        QRCode: qrcode.QRCode
    });
    scaner.add('users', function(id, openID, send){
        Customer.find({'$or': [{_id: id}, {'wechat.openID': openID}]}, function(err, customers){
            if(err) return send(err);
            if(customers){
                var scaner = _.find(customers, function(cus){return cus._id == id;}),
                    curUser = _.find(customers, function(cus){return cus.weixin == openID;});
                if(curUser && scaner){
                    if(curUser.roles && curUser.roles.indexOf('assistant') > -1){
                        send(null, '扫描成功。');
                    }else{
                        send(null, '感谢扫描二维码名片。');
                    }
                }else{
                    send(null, '找不到用户。');
                }
            }else{
                send(null, '找不到用户。');
            }
        })
    });
	webot.set('scan', {
		pattern : function(info) {
			return info.is('event') && info.param.event === 'SCAN';
		},
		handler : function(info, next) {
			debug('event.scan handler - sp: %s, scene: %s', info.sp, info.param.eventKey);
            scaner.reply(info, next);
		}
	});
}