var request = require("request");
var config = require("./config");
var fs = require("fs")
var url = require("url");
var async = require("async");
var dbhelper = require("./dbhelper");
var iconv = require("iconv-lite");
var init = require("./initdata");
var utils = require('./utils');
var Dictionary = require('dict');
var log = require("./logger").logger("infos");

var moviesCache30 = Dictionary({});
var isUpdating = false;

function getMoviesOnPage(pageIndex,callback) {
	var host = config.host + pageIndex;
		
	request(host,function (err,response,body) {
		if (!err && response.statusCode == 200) {
			var movieSummary = analyzePage(body);
			var movieRefs = [];
			for (var i = 0; i < movieSummary.length; i++) {
				var line = movieSummary[i];
				var movieRef = analyzeContent(line);
				movieRefs.push(movieRef);
			}
			collectMovie(movieRefs,function (movies) {
				callback(movies);
			});
		}else{
			callback([]);
		}
	});
}

function analyzePage(str) {
	var analyzeRegex = /<h3\s*class=\"title\"\s*>\s*<a\s*href=\"[^\"]+\"\s*rel=\"bookmark\"\s*target=\"_blank\"\s*>[^<]+<\/a>\s*<\/h3>/g
	var match = str.match(analyzeRegex);
	return match
}

function analyzeContent (str) {
	var analyzeLinkRegex = /href=\"[^\"]+\"/i;
	var data = {}
	var link = str.match(analyzeLinkRegex);
	if (link) {
		var linkString = link[0].replace("href=","").replace("\"","").replace("\"","");
		data.link = linkString;
	};
	var analyzeTitleRegex = /\s*>\s*[^<]+</;
	var content = str.match(analyzeTitleRegex);
	if (content) {
		var contentString = content[0].replace("<","").replace(">","");
		data.title = contentString
	};
	return data;
}

function getMovie(str,callback) {
	var analyzeRegex = /<a\s*id=\"down\"\s*href=\"[^\"]+\"\s*target=\"_blank\">\s*[^<]+<\/a>/g;
	var mayTVSeriseRegex = /var\s*filelist2=[^;]+;/i;
	var download_link_Regex = /href=\"[^\"]+\"/i;
	var tags_Regex = /rel=\"tag\">[^<]+<\/a>/g;
	var download_links_Desc_Regex = />[^<]+</i;
	var download_links = str.match(analyzeRegex);
	var tagsMatch = str.match(tags_Regex);
	var tags = [];
	var data = [];
	var isTvSerise = false;
	try{
		if (tagsMatch) {
			for (var i = 0; i < tagsMatch.length; i++) {
				var oneTagMatch = tagsMatch[i];
				var tag = oneTagMatch.replace("rel=\"tag\">","").replace("<\/a>","");
				if (tag === "电视剧") isTvSerise = true;
				tags.push(tag);
			};
		}
		
		if (isTvSerise) {
			var tvSerise = str.match(mayTVSeriseRegex);
			if (tvSerise) {
				var tvUrlsString = tvSerise[0].replace("var","").replace("filelist2=","").replace(";","");
				var tvUrls = JSON.parse(tvUrlsString);
				for (var i = 0; i < tvUrls.length; i++) {
					var oneTvSerise = {};
					oneTvSerise.version = "";
					oneTvSerise.link = tvUrls[i].url
					data.push(oneTvSerise);
				};
			}
		}else if(download_links){
			for (var i = 0; i < download_links.length; i++) {
				var oneDownload = {};
				var match = download_links[i].match(download_link_Regex)
				if (match) {
					var link = match[0].replace("href=","").replace("\"","").replace("\"","");
					var linkParse = url.parse(link,true);
					var queryString = JSON.stringify(linkParse.query);
					var cleanQueryString = queryString.replace("amp;f","f");
					var backToJson = JSON.parse(cleanQueryString);
					oneDownload.link = backToJson.f;
				};
				var descMatch = download_links[i].match(download_links_Desc_Regex);
				if (descMatch) {
					var descMatchContent = descMatch[0].replace("<","").replace(">","");
					oneDownload.version = descMatchContent;
				}
				data.push(oneDownload);
			}
			
		}
		if (data.length == 0) {
			callback(null);
		}else{
			var tagString = tags.join(",");
			var movie = {link:JSON.stringify(data),tag:tagString};
			callback(movie);
		}
	}
	catch(e){
		callback(null)
	}
}

function collectMovie (movieRefs,cb) {
	async.reduce(movieRefs,[],function (movies,ref,callback) {
		request(ref.link,function (err,response,body) {
			if (!err && response.statusCode == 200) {
				getMovie(body,function (movie) {
					if (movie != null) {
						var movieData = {address:ref.link,title:ref.title,link:movie.link,tag:movie.tag};
						movies.push(movieData);
					}
					callback(null,movies);
				});
			}else{
				callback(err,movies);
			}
		});
	},function (err,all) {
		cb(all);
	});
}

function getMaxPage (callback) {
	var host = config.host + "1";
	request(host,function (err,response,body) {
		if (!err && response.statusCode == 200) {
					/*fs.writeFile("data.dat",body,"utf8",function(err){
						callback()
					});*/
			var maxPage_Regex = /<a\s*href=\"[^\"]+\"\s*class=\"last\">/i;
			var href_Regex = /href=\"[^\"]+\"/i;
			var maxPage_match = body.match(maxPage_Regex);
			if (maxPage_match) {
				var matchString = maxPage_match[0];
				var href_Match = matchString.match(href_Match);
				if (href_Match) {
					var numberString = href_Match[0].replace("href=").replace("http://goxiazai.cc/page/").replace("\"");
					callback(int.parse(numberString));
				}else{
					callback(400);
				}
			}else{
				callback(400);
			}
		};
				
	});
}

function fillCache (callback) {
	dbhelper.getMoiveByPage({size:30,start:0},function (err,movies) {
		if (err) {
			callback(false);
			log.info("fill cache failed");
		}else{
			for (var i = 0; i < movies.length; i++) {
				var movie = movies[i];
				var data = movie.title + movie.link;
				var m = utils.md5(data);
				moviesCache30.set(m,movie.title);
			};
			callback(true);
		}
	});
}

function firstfilldb (callback) {
	init.createTables(function (success) {
		getMaxPage(function (maxPage) {
			var pages = [];
			for (var i = 1; i <= maxPage; i++) {
				pages.push(i);
			}
			async.eachSeries(pages,function (pageIndex,finishcb) {
				getMoviesOnPage(pageIndex,function (movies) {
					dbhelper.insertMovies(movies,function  (pageDone) {
						var info = pageDone ? " finished":" failed";
						log.info("Page index : " + pageIndex + info);
						log.info("Page index : " + pageIndex + " finished");
						finishcb(null);
					});
				});
			},function (err) {
				if (err) {
					log.info("getMoviesOnPage occured error " + err);
					callback(false);
				}else{
					log.info("all page done");
					callback(false);
				}
			});
		});
	});
}

function updateFirstPageMovie (callback) {
	fillCache(function (filled) {
		if (filled) {
			getMoviesOnPage(1,function (movies) {
				var vaildMovies = [];
				for (var i = 0; i < movies.length; i++) {
					var movie = movies[i];
					var data = movie.title + movie.link;
					var m = utils.md5(data);
					if (!moviesCache30.has(m)) {
						vaildMovies.push(movie);
					}
				}
				async.reduce(vaildMovies,[],function (shouldinsertMovies,vaildMovie,updateCallback) {
					dbhelper.getMovieByAddress(vaildMovie.address,function (err,gotmovies) {
						if (!err && gotmovies.length > 0) {
							log.info(vaildMovie)
							dbhelper.updateMovieByAddress(vaildMovie,function (updateerr,success) {
								if (updateerr) {
									log.error("update by address "+ vaildMovie.address +" failed: ", updateerr);
									shouldinsertMovies.push(vaildMovie);
								}else{
									log.info("update by address "+ vaildMovie.address +(success?" success":" failed"));
								}
								updateCallback(null,shouldinsertMovies);
							});
						}else{
							shouldinsertMovies.push(vaildMovie);
							updateCallback(null,shouldinsertMovies);
						}
					});
				},function (updateDoneError,allShouldinsertMovies) {
						log.info(allShouldinsertMovies)
						dbhelper.insertMovies(allShouldinsertMovies,function  (pageDone) {
						var info = pageDone ? " finished":" failed";
						log.info("Page index : " + 1 + info);
						log.info("update finished");
						callback(null);
					});
				});
			});
			
		}else{
			callback(false);
			log.info("update first page movie failed");
		}
	})
}

function scheduleUpdate (callback) {
	setInterval(function (){
		if (isUpdating) {
			log.info("updating...")
			callback(true);
		}else{
			isUpdating = true;
			log.info("do update")
			updateFirstPageMovie(function (updatedLoop) {
				isUpdating = false;
				callback(updatedLoop);
			});
		}
	},config.updatePeriod);
}

exports.firstfilldb = firstfilldb;
exports.scheduleUpdate = scheduleUpdate;

