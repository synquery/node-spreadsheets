/***/

var querystring = require("querystring"), core = require("./core"), chain = require("./chain");

module.exports = exports = Style;

function Style(range, worksheet) {
	var self = this;
	if(!(self instanceof Style))
		return new Style(range, worksheet);
	self.range(range), self._ws = worksheet, self._id = worksheet._id;
	self._gid = worksheet._gid, self._auth = worksheet._parent._auth;
}

Style.FONT = {
	Normal: "arial,sans,sans-serif",
	"Normal/serif": "times new roman,serif",
	CourierNew: "courier new,monospace",
	Georgia: "georgia",
	TrebuchetMS: "trebuchet ms",
	Verdana: "verdana"
};
Style.TEXT = ["underline", "line-through", "none"];

var fn, fns = {
	format: 8, // TODO
	font: 9, // Stryle.FONT
	fontsize: 10, // 6pt
	bold: 11, // bold or normal
	italic: 12, // italic or normal
	line: 13, // underline, line-through or none
	wrap: 14, // nowrap or normal
	align: 15, // left/center/right
	valign: 16, // top/middle/bottom
	color: 17, // #ff0000
	bgColor: 31, // #ffffff
	drawLines: 32, // 111111 top/left/bottom/right/holizontal/vertical
	fixRow: 40,
	rowHeight: 41, // number
	columnWidth: 42, // number
	joinCells: 43, // null
	fixColumn: 45,
	insertAbove: 61, // number
	insertLeft: 63, // number
	insertBelow: 68, // number
	insertRight: 69, // number
	rangeNames: 91,
	comment: 501,
	uncomment: 502
};

for (fn in fns)
	Style.prototype[fn] = reflect(fns[fn]);

function reflect(num) {
	return function(val, callback) {
		_query.call(this, num, val, callback);
	};
}

Style.prototype.initialize = function(callback) {
	var self = this;

	if(self._id && self._gid)
		return callback.call(self, null);

	var key = self._ws._parent._key, auth = self._auth, titles = self._ws._parent._titles;

	chain.call(self, function(next) {
		var opt = {
			path: "/spreadsheet/ccc?&key=" + key,
			headers: auth
		};
		core.ccc.call(self, opt, "", next);

	}, function(info, next) {
		var ser = (new RegExp(key + "\\.\\d+\\.\\d+")).exec(info);
		self._id = self._ws._id = ser[0];
		var i, s = (new RegExp("{structure: \\({action:0, a:(\\[[^\\]]*\\])"))
				.exec(info)[1];
		var sheets = JSON.parse(s);
		for (i = sheets.length; i--;)
			titles[sheets[i]["g"]]._gid = sheets[i]["i"];
		self._gid = self._ws._gid;
		next.call(self, null);

	}, callback);

};

/**
 * @deprecated
 * @param range
 */
Style.prototype.range = function(range) {
	this._range = range;
};

function _query(num, val, callback) {
	var self = this;

	var fncs = [self.initialize, function(next) {
		var r = self._range;
		r.action = 9;
		r.atyp = num;
		r.gid = self._gid;
		r.v = val;
		var data = querystring.stringify(r);
		var opt = {
			path: "/spreadsheet/edit/action9?&id=" + self._id,
			headers: self._auth
		};
		core.action9.call(self, opt, data, next);
	}, callback];
	chain.apply(self, fncs);
}

// var ex = {};
//
// ex[8] = function format() {
// // v=%24%23%2C%23%230.00
// // v=0.00%25
// };
