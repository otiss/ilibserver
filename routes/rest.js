var debug = require('debug')('app:routes:rest'),
    error = require('debug')('app:routes:rest:error');
var mongodb = require('../lib/mongo')();


module.exports = function(app, config){
    /**
     * Query
     */
    app.get('/databases/:db/collections/:collection/:id?', function (req, res) {
        var query = req.query.q ? JSON.parse(req.query.q) : {};
        if (req.params.id) {
            query = {'_id': req.params.id};
        }
        var test = ['l', 's', 'f', 'sk'],
            fields = ['limit', 'sort', 'fields', 'skip'],
            countAs = req.query.c,
            options = req.params.options || {};

        for (o in req.query) {
            if (test.indexOf(o) >= 0) {
                options[fields[test.indexOf(o)]] = req.query[o];
            }
        }
        if(options.fields){
            options.fields = JSON.parse(options.fields);
        }
        if(options.sort){
            options.sort = JSON.parse(options.sort);
        }

        mongodb.collection(req.params.collection, function (err, db, collection) {
            if(err) {
                error('fail to collection', err);
                return res.send(500);
            }
            if (countAs) {
                collection.count(query, function (err, total) {
                    if(err) return res.send(500);
                    res.send(total + '');
                });
            } else {
                collection.find(query, options, function (err, cursor) {
                    if(err) {
                        error('fail to query', err);
                        return res.send(500);
                    }
                    cursor.toArray(function (err, docs) {
                        if(err) {
                            error('fail to toArray', err);
                            return res.send(500);
                        }
                        var result = [];
                        if (docs && req.params.id) {
                            if (docs.length > 0) {
                                result = docs[0];
                                res.header('Content-Type', 'application/json');
                                res.send(result);
                            } else {
                                res.send(404);
                            }
                        } else {
                            if (docs && docs.length > 0) {
                                docs.forEach(function (doc) {
                                    result.push(doc);
                                });
                            }
                            res.header('Content-Type', 'application/json');
                            res.send(result);
                        }
                    });
                });
            }
        });

    });

    /**
     * Insert
     */
    app.post('/databases/:db/collections/:collection', function (req, res) {
        if (req.body) {
            mongodb.collection(req.params.collection, function (err, db, collection) {
                if(err) {
                    error('fail to collection', err);
                    return res.send(500);
                }
                collection.insert(Array.isArray(req.body) ? req.body[0] : req.body, function (err, docs) {
                    if(err) {
                        error('fail to insert', err);
                        return res.send(500);
                    }
                    res.header('Location', '/' + req.params.db + '/' + req.params.collection + '/' + docs[0]._id);
                    res.header('Content-Type', 'application/json');
                    res.send('{"ok":1}', 201);
                });
            });
        } else {
            res.header('Content-Type', 'application/json');
            res.send('{"ok":0}', 200);
        }
    });

    /**
     * Update
     */
    app.put('/databases/:db/collections/:collection/:id', function (req, res) {
        var spec = {'_id': req.params.id};
        mongodb.collection(req.params.collection, function (err, db, collection) {
            if(err) {
                error('fail to collection', err);
                return res.send(500);
            }
            collection.update(spec, req.body, true, function (err) {
                if(err) {
                    error('fail to update', err);
                    return res.send(500);
                }
                res.header('Content-Type', 'application/json');
                res.send('{"ok":1}');
            });
        });
    });

    /**
     * Delete
     */
    app.del('/databases/:db/collections/:collection/:id', function (req, res) {
        var spec = {'_id': req.params.id};
        mongodb.collection(req.params.collection, function (err, db, collection) {
            if(err) {
                error('fail to collection', err);
                return res.send(500);
            }
            collection.remove(spec, function (err, docs) {
                if(err) {
                    error('fail to remove', err);
                    return res.send(500);
                }
                res.header('Content-Type', 'application/json');
                res.send('{"ok":1}');
            });
        });
    });
}
