
exports.create = function(dbName) {

    var mongodb  = require('mongodb');

    var server   = new mongodb.Server("127.0.0.1", 27017, {});

    var ObjectID = mongodb.ObjectID;

    var rest = {

        db: null,

        //Find documents
        find: function(req, res) {
            var name    = req.params.name;
            var query   = req.query.query;   // has to be an object
            var fields  = req.query.fields;  // has to an array
            var options = req.query.options; // has to be an object
            var collection = new mongodb.Collection(this.db, name);
            collection.find({}, {limit:10}).toArray(function(err, docs) {
                if(err){
                    res.send("Oops!: " + err);
                } else {
                    if (req.query.var) {
                        var script = req.query.var + " = " + JSON.stringify(docs) + ";";
                        res.send(script);
                    } else {
                        res.send(docs);
                    }
                }
            });
        },

        //Find a specific document
        findOne: function(req, res) {
            var name = req.params.name;
            var id   = req.params.id;
            var collection = new mongodb.Collection(this.db, name);
            collection.find({ "_id" : new ObjectID(id) }, { limit:1 }).nextObject(function(err, doc){
                    if(err){
                        res.send("Oops! " + err);
                    }
                    res.send(doc);
                }
            );
        },

        //Create new document(s)
        create: function(req, res) {
            var name = req.params.name;
            var doc  = req.body[name];
            var collection = new mongodb.Collection(this.db, name);
            collection.insert(
                doc,
                {safe:true},
                function(err, docs) {
                    if(err) {
                        res.send("Oops!: " + err);
                        if (err.message.indexOf('E11000 ') !== -1) {
                            // this _id was already inserted in the database
                        }
                    } else {
                        res.send(docs);
                    }
                }
            );
        },

        //Update a document
        save: function(req, res) {
            var name = req.params.name;
            var doc  = req.body[name];
            var id   = req.params.id;
            var collection = new mongodb.Collection(this.db, name);
            collection.update(
                { "_id" : new ObjectID(id) },
                doc,
                {safe:true, upsert:true},
                function(err, n) {
                    if(err) {
                        res.send("Oops!: " + err);
                    } else {
                        res.send(n);
                    }
                }
            );
        },

        //Delete a contact
        delete: function(req, res) {
            var name = req.params.name;
            var id   = req.params.id;
            var collection = new mongodb.Collection(this.db, name);
            collection.remove({ "_id" : new ObjectID(id) }, {safe:true}, function(err, n){
                    if(err){
                        res.send("Oops! " + err);
                    }
                    res.send(n);
                }
            );
        }
    };

    new mongodb.Db(dbName, server, {w: 1}).open(function (error, client) {
        if (error) throw error;
        rest.db = client;
    });

    return rest;
};