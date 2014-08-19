var rest = require('restler');

var appID, appSecret, url_accessToken;

exports.init = function(config){
    appID = config.webchat.appID;
    appSecret = config.webchat.appSecret;
    url_accessToken = config.webchat.urls.accessToken;
}


exports.accessToken = function(code, success, fail){
    var url = url_accessToken + '?' + ['grant_type=authorization_code', 'appid=' + appID, 'secret=' + appSecret, 'code=' + code].join('&');
    rest.get(url).on('success', function(body){
        console.log("response as string: %s", body);
        var json = JSON.parse(body);
        if(json.errcode){
            var err = new Error(json.errmsg);
            err.code = json.errcode;
            fail && fail(err);
        }else{
            success && success(json);
        }
    }).on('error', function(err) {
            console.error('fail to access token as', err);
            fail && fail(err)
        });
}