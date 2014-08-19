/**
 * message handler for subscribe event
 */
var uuid = require('node-uuid'),
    debug = require('debug')('app:messages:event.location');

module.exports = function(webot, models) {
	var Message = models.WeChatLocation;
	
	webot.set('location', {
		pattern : function(info) {
			return info.is('event') && info.param.event === 'LOCATION';
		},
		handler : function(info) {
			var now = (new Date()).getTime(),
				msg = new Message({createdtime: now, lastmodified: now, messageID: info.id});
			msg.openid = info.uid;
			msg._id = uuid.v4();
			msg.location = info.param;
			msg.save(function(err, res){
				if(err) return console.error(err);
                debug('save location message as %s', res._id);
			});
			info.noReply = true;
			return;
		}
	});
}