/**
 * Created by Otis on 14-3-2.
 */

exports.get = function(name){
    return '/cvsapi/' + name + '/:id?'
}

exports.post = function(name){
    return '/cvsapi/' + name;
}

exports.delete = exports.put = function(name){
    return '/cvsapi/' + name + '/:id';
}