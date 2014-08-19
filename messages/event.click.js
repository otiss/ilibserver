/**
 * message handler for subscribe event
 */
var uuid = require('node-uuid'),
    _ = require('lodash'),
    moment = require('moment'),
    debug = require('debug')('app:messages:event.click');
var links = require('../utils/links'),
    qrcode = require('../wechat/qrcode');

var Handler = function(opt){
    this._options = opt;
}
Handler.prototype.send = function(info, next){
    var self = this;
    self.handleMessage(info,function(message){
        info.reply = message;
        next();
    });
}
Handler.prototype.handleMessage = function(info, send){
    send && send('这是我的便利家。');
}
var func_error = function(next, content){
    var content = content || '亲!系统出错，请稍后重试。';
    next && next(content);
};

var ReferHandler = function(opt){
    Handler.call(this, opt);
}
ReferHandler.prototype.__proto__ = Handler.prototype;
var func_sendReferral = function(next, qrcode){
    next({
        picUrl: qrcode,
        title: '推荐二维码',
        url: '',
        description: '亲，通过微信扫描此二维码。'
    });
}
ReferHandler.prototype.handleMessage = function(info, send){
    var self = this,
        Customer = self._options.Customer,
        QRCode = self._options.QRCode;
    Customer.findOne({'wechat.openID': info.uid}, function(err, cus){
        if(err) return func_error(send);
        if(cus){
            var qrcode = cus.rcode && cus.rcode.qrcode;
            if(qrcode){
                func_sendReferral(send, qrcode);
            }else{
                (new QRCode(cus._id, 'user')).qrcode(function(err, code){
                    if(err) res.send(500, err);
                    var updateBody = {
                        sceneID: code.scene,
                        ticket: code.ticket,
                        qrcode: code.url
                    };
                    Customer.update({_id: cus._id}, {$set: {rcode: updateBody, lastmodified: (new Date()).getTime()}}, function(err, res){
                        if(err) debug(err);
                        debug('update rcode to customer %s', cus._id);
                        qrcode = code.url;
                        func_sendReferral(send, qrcode);
                    });
                });
            }
        }else{
            func_error(send);
        }
    })
}

module.exports = function(webot, models, config) {
    var opt = {
        Customer: models.Customer
    };
    qrcode = qrcode(config, models);
    var defaultHandler = new Handler(opt),
        referHandler = new ReferHandler(_.assign({QRCode: qrcode.QRCode}, opt));
    webot.set('click', {
        pattern : function(info) {
            return info.is('event') && info.param.event === 'CLICK';
        },
        handler : function(info, next) {
            if(info.param.eventKey){
                switch(info.param.eventKey){
                    case 'referralCode':
                        referHandler.send(info, next);
                        break;
                    default:
                        defaultHandler.send(info, next);
                }

            }

        }
    });

}