var uuid = require('node-uuid'),
    util = require('util'),
    _ = require('lodash'),
    debug = require('debug')('app:routes:sso'),
    error = require('debug')('app:routes:sso:error');
var oauthor = require('../wechat/oauthor'),
    links = require('../utils/links'),
    acl = require('../lib/acl');

var func_render = function(res, user){
        var renderUser = {};
        if(user){
            renderUser._id = _.pick(user, '_id', 'name', 'username', 'password');
            renderUser.openID = user.wechat.openID;
        }
        res.render('index', { 'currentUser': renderUser});
    }, func_error = function(res, err){
        console.error('error at sso:', err);
        func_render(res);
    },
    func_cookie = function(res, user){
        res.cookie('currentUser', user, {signed: true});
        func_render(res, user);
    },
    fields = "_id name username password wechat";

module.exports = function(config, models){
    var Customer = models.Customer;

    return function(req, res){
        if(req.signedCookies && req.signedCookies.currentUser){
            debug('found customer from cookie: ', req.signedCookies.currentUser);
            return func_render(res, req.signedCookies.currentUser);
        }

        if(req.query.userID){
            debug('sso as internal: userID - %s', req.query.userID);
            Customer.findById(req.query.userID, fields, function(err, cus){
                if(err) return func_error(res, err);
                debug('found customer from DB: ', cus);
                func_cookie(res, cus && cus.toJSON());
            });
        }else if(req.query.code){
            var code = req.query.code || '', state =  req.query.state || '';
            debug('sso from wechat: code - %s, state - %s', code, state);
            oauthor.accessToken(code, function(json){
                Customer.findOne({'wechat.openID': json.openid}, fields, function(err, cus){
                    if(err) return func_error(res, err);
                    debug('found customer from DB:', cus);
                    if(cus){
                        func_cookie(res, cus && cus.toJSON());
                    }else{
                        var now = (new Date()).getTime(),
                            cus = new Customer({createdtime: now, lastmodified: now});
                        cus.wechat = {openID: json.openid};
                        cus._id = uuid.v4();
                        cus.save(function(err){
                            if(err) return func_error(err);
                            debug('save customer as %s.', cus._id);
                            acl.allow('owner', cus._id, '*', function(err){
                                func_cookie(res, cus && cus.toJSON());
                            });
                        });
                    }
                });
            },function(err){
                if(util.isError(err)){
                    error('access code fail as %s',JSON.stringify(err, ['code', 'message'], 2));
                    var redurl = req.url, conext = '/index/';
                    if(redurl.indexOf(conext) == 0){
                        redurl = redurl.substring(redurl.indexOf(conext) + conext.length, redurl.indexOf('?'));
                    }
                    var pairs = _.pairs(req.query);
                    pairs = _.filter(pairs, function(pair){
                        return pair && pair.length > 0 && ['state', 'code'].indexOf(pair[0]) == -1;
                    });
                    if(pairs && pairs.length > 0){
                        pairs = _.map(pairs, function(pair){
                            return pair.join('=');
                        });
                        redurl = redurl + '?' + pairs.join('&');
                    }
                    redurl = links.wrap(redurl);
                    debug('try to redirect to %s automatically.', redurl);
                    res.redirect(redurl);
                }else{
                    func_render(res);
                }
            });
        }else{
            func_render(res);
        }
    }
};