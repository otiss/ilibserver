var _ = require('lodash');

var wechat, baseurl;

exports.configure = function(config){
	wechat = config.webchat;
	baseurl = config.web.baseurl;
}


exports.itemdetail = function(item){
	var url = wechat.urls.authorize,
		itemurl = baseurl + 'items/' + (item.itemID || item._id);
	itemurl = encodeURIComponent(itemurl);
	url = url + '?' + ['scope=snsapi_base', 'response_type=code', 'appid=' + wechat.appID, 'state=' + wechat.state, 'redirect_uri=' + itemurl].join('&');
	url = url + '#wechat_redirect';
	return url;
}

exports.itemimage = function(item){
	var image = item.image;
	return _.isObject(image)?image.smallImageURL:image;
}

exports.operateorder = function(order){
    var url = wechat.urls.authorize,
        itemurl = baseurl + 'orders/' + order._id + '/operation';
    itemurl = encodeURIComponent(itemurl);
    url = url + '?' + ['scope=snsapi_base', 'response_type=code', 'appid=' + wechat.appID, 'state=' + wechat.state, 'redirect_uri=' + itemurl].join('&');
    url = url + '#wechat_redirect';
    return url;
}

exports.wrap = function(original){
    if(original.indexOf(baseurl) == -1){
        original = baseurl + original;
    }

    var url = wechat.urls.authorize;
    original = encodeURIComponent(original);
    url = url + '?' + ['scope=snsapi_base', 'response_type=code', 'appid=' + wechat.appID, 'state=' + wechat.state, 'redirect_uri=' + original].join('&');
    url = url + '#wechat_redirect';
    return url;
}

