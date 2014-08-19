/**
 * Created by Otis on 14-2-25.
 */

var mongoose = require('mongoose'),
    _ = require('lodash');

module.exports = function(){
    var Schema = mongoose.Schema,
        commonFields = {
    		_id: String,
    		removed: String,
            createdtime: Number,
            lastmodified: Number
        };
    var customerSchema = new Schema(_.assign({
            username: String,
            password: String,
            name: String,
            status: String,
            roles: [String],
            wechat: {
                openID: String,
                info: Schema.Types.Mixed
            },
            referral: {
                referrerID: String,
                status: Number,
                lastmodified: Number
            },
            type: {type: String, 'default': 'library'}
        }, commonFields), { _id: false, collection: 'users'});

    var locationSchema = new Schema(_.assign({
        messageID: String,
        openid: String,
        type: {type: String, 'default': 'location'},
        location: {
        	lat: Number,
        	lng: Number,
        	scale: String,
        	label: String
        }
    }, commonFields), { collection: 'wechat_messages'});
    
    var sceneSchema = new Schema(_.assign({
    	sp: String,
    	scene: Number,
    	referID: String,
        type: {type: String, 'default': 'item'},
        ticket: String
    }, commonFields), { collection: 'wechat_scenes'});

    return {
        Customer:mongoose.model('Customer', customerSchema),
        WeChatLocation: mongoose.model('WeChatLocation', locationSchema),
        WeChatScene: mongoose.model('WeChatScene', sceneSchema)
    };
}