/**
 * Created by Otis on 14-3-2.
 */
var mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var User = mongoose.model('users', mongoose.Schema({
    _id: String,
    email: String,
    password: String,
    weixin: String,
    role: String,
    roles: [String],
    type: {type: String, default: 'customer'}
}));

passport.use(new LocalStrategy({
        usernameField: 'userID',
        passwordField: 'openID'
    },
    function(userID, openID, done) {
        User.findOne({'_id': userID, 'type':'customer'}, function(error, user){
            if(error) return done(error);
            if(user){
            	if(user.weixin === openID){
            		done(null, user);
            	}else{
            		done(null, false, 'invalid openID');
            	}
            }else{
                done(null, false, 'user not found');
            }
        });
    }
));


exports.init = function(config){
    mongoose.connect('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.name);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
}

exports.middleware = function(auth){
   if(auth){
	   return passport.authenticate('local', { session: false })
   }else{
	   return function(req, res, next){
		   var userID = req.query.userID;
		   if(userID){
			   User.findOne({'_id': userID, 'type':'customer'}, function(error, user){
		            if(error) return next();
		            req.user = user;
		            next();
		        });
		   }else{
			   next();
		   }
	   }
   }
}