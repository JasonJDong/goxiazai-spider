var filter = require('./filter');
var fs = require('fs');
var log = require("./logger").logger("infos");
var cluster = require('cluster');
var server = require('./server');

function start () {
	fs.exists('movies.db',function (exists) {
		if (!exists) {
			filter.firstfilldb(function (success) {
				log.info("first install db " + success?"success":"failed");
			});
		}else{
			filter.scheduleUpdate(function (updated) {
				log.info("update db " + updated?"success":"failed");
			});
		}
	})
}

if (cluster.isMaster) {
	log.info("master start")
	cluster.fork();
	start();
}else{
	log.info("worker start")
	server.startServer();
}
