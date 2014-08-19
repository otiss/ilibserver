/**
 * message handler for subscribe event
 */
var uuid = require('node-uuid');

module.exports = function(webot, models, handlers) {
	var Customer = models.Customer;
	
	webot.set('unsubscribe', {
		pattern : function(info) {
			return info.is('event') && info.param.event === 'unsubscribe';
		},
		handler : function(info, next) {
			handlers.query({message: info.type, event: info.param.event}, function(handler){
				info.reply = handler?handler.render():'亲!谢谢你的关注。';
				next();
			});
		}
	});
}