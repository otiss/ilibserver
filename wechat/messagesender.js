var rest = require('restler'),
	_ = require('lodash'),
	tokener = require('./tokener');

var urls;

exports.init = function(config){
	urls = config.webchat.urls;
}

var func_send = function(url, body, next, fail, retry){
	rest.postJson(url, body).on('success', function(data, res){
		console.log("the response for send message - %j", data);
		if(data.errcode){
			if(data.errcode == 45015){
				next && next();
			}else if(data.errcode == 40001 && retry){
                console.log('retry to access token');
                retry(function(token){
                    var url = urls.sendMessage + '?access_token=' + token;
                    func_send(url, body, next, fail);
                });
            }else{
				fail && fail(Error(data.errcode));
			}
		}else{
			next && next();
		}
	}).on('eror', function(err){
		 console.error('fail to  as', err);
		 fail && fail(err);
	})
}

exports.send = function(openIDs, data, success, fail){
	tokener.access(function(token, retry){
		var url = urls.sendMessage + '?access_token=' + token,
			body;

        if(_.isArray(data)){
            body = {'msgtype': 'news', 'news': {'articles': data}};
        }else if(_.isObject(data)){
			body = {'msgtype': 'news', 'news': {'articles': [data]}};
		}else{
			body = {'msgtype': 'text', 'text': {'content': data}};
		}

		if(_.isArray(openIDs)){
			var func = function(index){
				console.log('try to send message to %s', openIDs[index]);
				func_send(url, _.assign({'touser': openIDs[index]}, body), function(){
					if(++index < openIDs.length){
						func(index);
					}else{
						success && success();
					}
				}, fail, retry);
			}
			func(0);
		}else{
			func_send(url, _.assign({'touser': openIDs}, body), success, fail, retry);
		}

	}, function(err){
		fail && fail(err);
	});
}