var dbhelper = require("./dbhelper");
var fs = require("fs")

var tableName = "createTable.sql"

function createTables (callback) {
	fs.exists(tableName,function(exists){
		if (exists) {
			fs.readFile(tableName,"utf8",function(err,data){
				if (err) {
					callback(false);
				}else{
					dbhelper.createTables(data,function(success){
						callback(success);
					});
				}
			});
		}else{
			callback(false);
		}
	});
}

function initData (data,callback) {
	dbhelper.moviesNumber(function (err,number) {
		if (err || number == -1) {
			callback(false);
		}else{
			if(number == 0){
				dbhelper.insertMovies(data,function(success){
					callback(success);
				});
			}else{
				callback(true);
			}
		}
	})
}

exports.createTables = createTables;
