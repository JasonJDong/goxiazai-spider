var sqlite = require("sqlite3").verbose();
var iconv = require("iconv-lite");
var log = require("./logger").logger("infos");
var util = require('util');

function opendb() {
	return new sqlite.Database("movies.db");
}

function closedb (db) {
	if (db) {
		db.close();
	}
}

function createTables (createSql,callback) {
	if (createSql) {
			var db = null;
		try{
			db = opendb();
			db.exec(createSql);
			callback(true);
		}
		catch(e){
			callback(false);
		}
		finally{
			closedb(db);
		}
	}
}

function encode2utf8 (str) {
	var buf = iconv.encode(str,"utf8");
	var utf8 = iconv.decode(buf,"utf8");
	return utf8;
}

function moviesNumber (callback) {
	var db = null;
	try{
		db = opendb();
		var sql = "SELECT COUNT(id) AS number FROM movies";
		db.get(sql,function(err,row){
			if (!err && row) {
				var number = int.parse(row.number);
				callback(null,number);
			}else{
				callback(err,-1);
			}
		});
	}
	catch(e){
		callback(err,-1);
	}
	finally{
		closedb(db);
	}
}

function insertMovies(data,callback) {
	if (data && data.length > 0) {
		var db = opendb();
		try{
			//id,address,title,link,tag
			var stmt = db.prepare("INSERT INTO movies VALUES(NULL,?,?,?,?)");
			for (var i = 0; i < data.length; i++) {
				var one = data[i];
				stmt.run([one.address,one.title,one.link,one.tag]);
			};
			stmt.finalize(function(){
				callback(true);
			});
		}
		catch(e){
			callback(false);
		}
		finally{
			closedb(db);
		}
	}else{
		callback(true);
	}
	
}

function getMovieByTag (tag,page,callback) {
	if (tag) {
		var db = null;
		try{
			db = opendb();
			var sql = "SELECT address,link,title,tag FROM movies WHERE tag LIKE '%" + tag + "%' LIMIT " 
			+ page.size + " OFFSET " + page.start;
			db.all(sql,function(err,rows){
				if (!err && rows) {
					var movies = [];
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						movies.push({address:row.address,title:row.title,link:row.link,tag:row.tag});
					}
					callback(null,movies);
				}else{
					callback(err,[]);
				}
			});
		}
		catch(e){
			callback(e,[]);
		}
		finally{
			closedb();
		}
	}else{
		callback(null,[]);
	}

}

function getMovieByName (name,page,callback) {
	if (name) {
		var db = null;
		try{
			db = opendb();
			var sql = "SELECT address,link,title,tag FROM movies WHERE title LIKE '%" + name + "%' LIMIT " 
			+ page.size + " OFFSET " + page.start;
			
			db.all(sql,function(err,rows){
				if (!err && rows) {
					var movies = [];
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						movies.push({address:row.address,title:row.title,link:row.link,tag:row.tag});
					}
					callback(null,movies);
				}else{
					callback(err,[]);
				}
			});
		}
		catch(e){
			callback(e,[]);
		}
		finally{
			closedb();
		}
	}else{
		callback(null,[]);
	}
}

function getMovieByAddress (address,callback) {
	if (address) {
		var db = null;
		try{
			db = opendb();
			var sql = "SELECT address,link,title,tag FROM movies WHERE address = ?";
			db.all(sql,[address],function(err,rows){
				if (!err && rows) {
					var movies = [];
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						movies.push({address:row.address,title:row.title,link:row.link,tag:row.tag});
					}
					callback(null,movies);
				}else{
					callback(err,[]);
				}
			});
		}
		catch(e){
			callback(e,[]);
		}
		finally{
			closedb();
		}
	}else{
		callback(null,[]);
	}
}

function getMoiveByPage (page,callback) {
	if (page) {
		var db = null;
		try{
			db = opendb();
			var sql = "SELECT address,link,title,tag FROM movies LIMIT " 
			+ page.size + " OFFSET " + page.start;
			db.all(sql,function(err,rows){
				if (!err && rows) {
					var movies = [];
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						movies.push({address:row.address,title:row.title,link:row.link,tag:row.tag});
					}
					callback(null,movies);
				}else{
					callback(err,[]);
				}
			});
		}
		catch(e){
			callback(e,[]);
		}
		finally{
			closedb();
		}
	}else{
		callback(null,[]);
	}
}

function updateMovieByAddress (movie,callback) {
	if (movie) {
		var db = null;
		try{
			db = opendb();
			var stmt = db.prepare("UPDATE movies SET title = ?, link = ?, tag = ? WHERE address = ?");
			stmt.run([movie.title,movie.link,movie.tag,movie.address]);
			stmt.finalize(function () {
				callback(null,true);
			});
		}
		catch(e){
			callback(e,false);
		}finally{
			closedb();
		}
	}else{
		callback(null,false);
	}

}

exports.createTables = createTables;
exports.insertMovies = insertMovies;
exports.moviesNumber = moviesNumber;
exports.getMovieByTag = getMovieByTag;
exports.getMovieByName = getMovieByName;
exports.getMoiveByPage = getMoiveByPage;
exports.getMovieByAddress = getMovieByAddress;
exports.updateMovieByAddress = updateMovieByAddress;
