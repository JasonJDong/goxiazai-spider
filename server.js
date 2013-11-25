var express = require('express');
var dbhelper = require('./dbhelper');
var fs = require('fs');
var iconv = require("iconv-lite");

var app = express();

function encode2utf8 (str) {
	var buf = iconv.encode(str,"utf8");
	var utf8 = iconv.decode(buf,"utf8");
	return utf8;
}

app.get('/page/:index/:size',function (req,res) {
	res.setHeader('Content-type','text/html');
	res.setHeader('meta','utf8');
	var page = {size:req.params.size,start:req.params.index};
	dbhelper.getMoiveByPage(page,function (err,movies) {
		sendPage(movies,page,function (html) {
			res.end(html);
		});
	});
});

app.get('/search/:name',function (req,res) {
	res.setHeader('Content-type','text/html');
	res.setHeader('meta','utf8');
	var page = {size:10,start:0};
	dbhelper.getMovieByName(encode2utf8(req.params.name),page,function (err,movies) {
		sendPage(movies,page,function (html) {
			res.end(html);
		});
	});
});

app.get('/index.html',function (req,res) {
	res.setHeader('Content-type','text/html');
	res.setHeader('meta','utf8');
	var page = {size:10,start:0};
	dbhelper.getMoiveByPage(page,function (err,movies) {
		sendPage(movies,page,function (html) {
			res.end(html);
		});
	});
});


function sendPage (movies,page,callback) {
	fs.readFile('base.html','utf8',function (baseerr,baseData) {
		fs.readFile('list.html','utf8',function (listerr,listData) {
			fs.readFile('row.html','utf8',function (rowerr,rowData) {
				var rows = [];
				for (var i = 0; i < movies.length; i++) {
					var movie = movies[i];
					var list = []
					var movie_link = JSON.parse(movie.link);
					for (var j = 0; j < movie_link.length; j++) {
						var link = movie_link[j];
						var version = link.version || (j + 1);
						var link_item = "<li><a href=\"" + link.link + "\">" + version +"</a></li>";
						list.push(link_item);
					}
						var list_data = listData.replace("#items",list.join("\r\n"));
						var row = rowData.replace("#title",movie.title);
						row = row.replace("#link",list_data);
						row = row.replace("#tag",movie.tag);
						rows.push(row);
				}
				
				var html = baseData.replace("#rows",rows.join("\r\n"));
				var nextPage = ((parseInt(page.start) / parseInt(page.size) + 1)) * page.size;
				html = html.replace("#nextPage","http://192.168.1.227:3100/page/" + nextPage + "/" + page.size);
				callback(html);
			});
		});
	});
}

exports.startServer = function () {
	app.listen(3100);
}