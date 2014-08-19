var rest = require('restler'),
    uuid = require('node-uuid'),
    tokener = require('./tokener'),
    debug = require('debug')('app:lib:qrcode');

var QRCode = function(id, type){
    this.referID = id;
    this.type = type;
}

QRCode.prototype.exists = function(next){
    var self = this;
    QRCode.models.WeChatScene.findOne({referID: self.referID, sp:QRCode.sp, type:self.type}, function(err, res){
        if(err) return next && next(err);
        if(res){
            self.scene = res.scene;
            self.ticket = res.ticket;
        }
        next && next(null, res && res.ticket);
    });
};

QRCode.prototype.generateID = function(next){
    var self = this;
    QRCode.models.WeChatScene.find({sp:QRCode.sp}).sort('-scene').limit(1).exec(function(err, res){
        if(err) return next && next(err);
        var nextsceneID = res && res.length>0?(res[0].scene + 1):1;
        next && next(null, nextsceneID);
    });
};

QRCode.prototype.ticket = function(scene, next){
    var self = this;
    tokener.access(function(token){
        var url = QRCode.url_qrcode + '?access_token=' + token,
            body = {
                'action_name': 'QR_LIMIT_SCENE',
                'action_info': {
                    'scene': {
                        'scene_id': scene
                    }
                }
            };
        rest.postJson(url, body).on('success', function(data){
            debug("the response for create qrcode - %j", data);
            if(data.errcode){
                next && next(new Error(data.errcode));
            }else{
                next && next(null, data.ticket);
            }
        });
    }, function(err){
        next && next(err);
    });
};

QRCode.prototype.save = function(next){
    var self = this,
        now = new Date(),
        scene = new QRCode.models.WeChatScene({_id: uuid.v4(),
            sp:QRCode.sp,
            createdtime: now.getTime(),
            lastmodified: now.getTime(),
            referID: self.referID,
            type: self.type});
    self.generateID(function(err, sceneID){
        if(err) return next(err);
        scene.scene = sceneID;
        self.ticket(scene.scene, function(err, ticket){
            if(err) return next(err);
            scene.ticket = ticket;
            scene.save(function(err, res){
                if(err) return next(err);
                self.scene = sceneID;
                self.ticket = ticket;
                next(null, QRCode.url_showqrcode + '?ticket=' + ticket);
            });
        });
    });
};

QRCode.prototype.qrcode = function(next){
    var self = this;
    self.exists(function(err, ticket){
        if(err) return next(err);
        var func = function(url){
            next(null, {
                url: url,
                scene: self.scene,
                ticket: self.ticket
            });
        }
        if(ticket){
            func(QRCode.url_showqrcode + '?ticket=' + ticket);
        }else{
            self.save(function(err, url){
                if(err) return next(err);
                func(url);
            });
        }
    });
}

QRCode.find = function(sceneID, next){
    QRCode.models.WeChatScene.findOne({scene: sceneID, sp:QRCode.sp}, function(err, res){
        if(err) return next && next(err);
        if(res){
            next(null, new QRCode(res.referID, res.type));
        }else{
            next(null, null);
        }
    });
}

module.exports = function(config, models){
    config = config || {};
    config.webchat = config.webchat || {};
    config.webchat.urls = config.webchat.urls || {};

    QRCode.models = QRCode.models || models;
    QRCode.sp = QRCode.sp || config.webchat.openID;
    QRCode.url_qrcode = QRCode.url_qrcode || config.webchat.urls.qrcode;
    QRCode.url_showqrcode = QRCode.url_showqrcode || config.webchat.urls.showqrcode;

    return {
        QRCode: QRCode
    }
}