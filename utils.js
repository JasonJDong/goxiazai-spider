var crypto = require('crypto');
exports.md5 = function (str) {
	var md5crypt = crypto.createHash('md5');
	md5crypt.update(str);
	return md5crypt.digest('hex');
}