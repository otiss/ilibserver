
module.exports = function(accessControl){
   var handle = function(req, res, next) {
        if (req.header('Origin')) {
            if (accessControl.allowOrigin) {
                res.header('Access-Control-Allow-Origin', accessControl.allowOrigin);
            }
            if (accessControl.allowMethods) {
                res.header('Access-Control-Allow-Methods', accessControl.allowMethods);
            }
            if (req.header('Access-Control-Request-Headers')) {
                res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
            }
        }
        return next();
    }
    return {
        handle: handle
    }
}
