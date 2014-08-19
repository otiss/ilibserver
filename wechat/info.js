var rest = require('restler'),
    _ = require('lodash'),
    tokener = require('./tokener');

var info_url;
exports.init = function(config){
    info_url = config.webchat.urls.info;
}

var func_info = function(token, openID, success, fail){
    var url = info_url + '?access_token=' + token + '&&lang=zh_CN';
    url = url + '&openID=' + openID;
    rest.json(url).on('success',function(body) {
        console.log("info response as json: %j", body);
        if (body.errcode) {
            fail && fail(new Error(body.errcode));
        } else {
            success && success(_.pick(body, 'openid', 'nickname', 'headimgurl', 'sex', 'country', 'province', 'city'));
        }
    }).on('error', function(err) {
            console.error('fail to access token as', err);
            fail && fail(err);
        });
}

exports.info = function(openID, success, fail){
    tokener.access(function(token){
        func_info(token, openID, success, fail);
    }, function(err){
        fail && fail(err);
    });
}