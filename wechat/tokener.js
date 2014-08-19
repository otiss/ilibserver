var rest = require('restler'),
    async = require('async');

var appID, appSecret, url_token;

exports.init = function(config){
	appID = config.webchat.appID;
	appSecret = config.webchat.appSecret;
	url_token = config.webchat.urls.token;
}

var func_callback = function(err, token){
    waitings.unshift(function(next){
        next(null, err, token);
    });
    async.waterfall(waitings, function(){
        waitings = [];
    });
}

var func = function(url, success, fail){
    loading = true;
	rest.json(url).on('success',function(body) {
		console.log("access token response as json: %j", body);
        loading = false;
		if (body.errcode) {
			var err = Error(body.errcode);
            func_callback(err,null);
		} else {
			var now = (new Date()).getTime();
			cache = {
					token: body.access_token,
					expires: (now + body.expires_in * 1000)
			};
            func_callback(null,body.access_token);
		}
	}).on('error', function(err) {
			console.error('fail to access token as', err);
            loading = false;
            func_callback(err,null);
	});
}

var cache, loading, waitings = [];

exports.access = function(success, fail, enforce) {
	var now = (new Date()).getTime();
	if(enforce){
        console.log('access token by enforce.');
        var url = url_token + '?' + ['grant_type=client_credential', 'appid=' + appID, 'secret=' + appSecret].join('&');
        func(url, success, fail);
    }else if(cache && cache.expires > now){
		console.log('from cache: now - %s, expires - %s', now, cache.expires);
		success && success(cache.token, function(success, fail){
            func(url, success, fail);
        });
	}else{
        console.log('access token as expire.');
        waitings.push(function(err, token, next){
            if(err){
                fail && fail(err);
            }else{
                success && success(token);
            }
            next(null, err, token);
        });
		if(!loading){
            var url = url_token + '?' + ['grant_type=client_credential', 'appid=' + appID, 'secret=' + appSecret].join('&');
            func(url, success, fail);
        }
	}
}