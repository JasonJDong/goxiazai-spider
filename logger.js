var log4js = require('log4js');
var fs = require("fs");

fs.lstat('logs',function (err,stat) {
	var canLog = false;
	if (err) {
		fs.mkdir("logs",function (err) {
			if(!err){
				canLog = true;
			}
		});
	}else if(!err && stat.isDirectory()){
		canLog = true;
	}
	if (canLog) {
		log4js.configure({
			appenders:[
				{type:"console"},
				{
					type:"file",
					filename:"logs/log.log",
					maxLogSize:10240,
					backups:3,
					catagory:'infos'
				}
			],
			replaceConsole:true
		});
	}
});


exports.logger = function (name) {
	var log = log4js.getLogger(name);
	log.setLevel('INFO');
	return log;	
};