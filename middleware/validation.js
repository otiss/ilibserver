

exports.init = function(config){
	
}


exports.middleware = function(resource, validator){
	
	return function(req, res, next){
		var errors,
			docID, 
			colID = resource,
			method = req.method.toLowerCase(),
			action = req.query && req.query.action;
		
		var url = req.url.split('?')[0];
		docID = url.substring(url.indexOf(resource) + resource.length + 1);
		
		var body = req.body;
		if(method === 'post'){
			errors = validator && validator(action || method, body, req);
		}
		
		if(method === 'put'){
			if('$set' in body){
				body = body['$set'];
			}
			errors = validator && validator(action || method, body, req);
		}
		
		if(errors && errors.length > 0){
			var msg = {
				"ok": "0",
				"errors": errors
			};
			res.send(400, msg);
		}else{
			//res.send(500);
			next();
		}
	}
}