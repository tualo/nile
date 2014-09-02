var exec = require('child_process').exec;

var create = function() {
	return new convert();
};

var convert = function() {
	this.options = [];
	this._output = null;
	this._input = null;
	this.command = 'convert';
};
convert.prototype.useGM = function() {
	this.command = 'gm convert';
	return this;
}

convert.prototype.inputFile = function(file) {
	this._input = file;
	return this;
}

convert.prototype.outputFile = function(file) {
	this._output = file;
	return this;
}

convert.prototype.exec = function(callback) {
	var self = this;

	if (!this._input) return callback("Please specify input");
	if (!this._output) return callback("Please specify output");

	var args = this.options.join(' ');
	var child = exec(this.command + ' +antialias -background transparent ' +this._input +' -resize 256x256 ' +this._output, function(err, stdout, stderr) {
		child.kill('SIGHUP');
		callback(err, stdout, stderr);
	});
};

module.exports = create;
