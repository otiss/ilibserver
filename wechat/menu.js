var  rest = require('restler'),
    tokener = require('./tokener');

var appID, appSecret, urls_menu;

exports.init = function(config){
    appID = config.webchat.appID;
    appSecret = config.webchat.appSecret;
    urls_menu = config.webchat.urls.menu;
}


exports.create = function(body, success, fail){
    var url = urls_menu.create;

    tokener.access(function(token){
        url = url + '?access_token=' + token;
        console.log('sumbit menus as %j', body);
        rest.postJson(url, body).on('success', function(data, res){
            console.log("the response for create menu - %j", data);
            if(data.errcode){
                fail && fail(new Error(data.errcode));
            }else{
                success && success();
            }
        }).on('error', function(err){
                console.error('fail to  as', err);
                fail && fail(err);
            });
    }, function(err){
        fail && fail(err);
    });
}