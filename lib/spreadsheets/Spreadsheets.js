/***/

var fs = require("fs"), querystring = require('querystring'), url = require("url");
var path = require("path"), $ = require("jquery");
var core = require("./core"), chain = require("./chain"), fork = require("./fork");

// extend jQuery
(function($) {
	$.fn.outerXml = function() {
		var xml = this.wrap("<root/>").parent().html();
		xml = xml.replace(/(<link[^\>]+>)/g, "$1</link>");
		return xml;
	};
})($);

module.exports = exports = spreadsheets;

function spreadsheets(auth, callback) {
	if(auth && $.isFunction(callback))
		clientLogin.call(this, auth, function(err, _auth) {
		  var sheet = !err && Spreadsheets(_auth);
		  callback(err, sheet);
		});
}

function clientLogin(auth, callback) {
	var self = this, _auth;
	
	fork.call(self, function(cb) {
	  _clientLogin("wise", cb);

	}, function(cb) {
	  _clientLogin("writely", cb);

	}, function(err, args) {
	  if(!err) {
	    _auth = {}, _auth["wise"] = {}, _auth["writely"] = {};
    	  _auth["wise"].Authorization = "GoogleLogin auth=" + args[0].Auth;
    	  _auth["writely"].Authorization = "GoogleLogin auth=" + args[1].Auth;
	  }
	  callback.call(self, err, _auth);

	});
	
	function _clientLogin(service, _callback) {
	  chain.call(self, function(next) {
	    var data = querystring.stringify({
	      accountType: "GOOGLE",
	      service: service,
	      Email: auth.Email,
	      Passwd: auth.Passwd
	    });
	    core.authenticate.call(self, null, data, next);
	    
	  }, function(info, next) {
	    var auth = {};
	    var i, line = info.split(/\n/);
	    for (i = line.length; i--;)
	      if(line[i]) {
	        var kv = line[i].split("=");
	        auth[kv[0]] = kv[1];
	      }
//	    _auth["wise"].Authorization = "GoogleLogin auth=" + auth.Auth;
	    next.call(self, null, auth);
	    
	  }, _callback);
	}

};

function Spreadsheets(auth) {
	var self = this;
	if(!(self instanceof Spreadsheets))
		return new Spreadsheets(auth);
	self._auth = auth, self._list = {};
}

Spreadsheets.prototype.list = function(callback) {
	var self = this, opt = {
		headers: self._auth["wise"]
	};
	chain.call(self, function(next) {
		core.list.call(self, opt, "", next);

	}, function(xml, next) {
		var $entries = $("entry", xml), list = self._list = {};
		$entries.each(function() {
			var $this = $(this), $id = $("id", $this);
			var sp = $id.text().split(/\//), key = sp[sp.length - 1];
			var ss = Spreadsheet(key, self._auth);
			ss._xml = $this.outerXml();
			list[key] = ss;
		});
		next.call(null, null, list);

	}, callback);
};

Spreadsheets.prototype.createSpreadsheet = function(settings, callback) {
  if($.isFunction(settings))
    callback = settings, settings = {};
  var self = this, opt = {
      headers: self._auth["writely"]
  };
  
  chain.call(self, function(next) {
    var xml = $(fs.readFileSync("xml/docentry.xml").toString());
    $("title", xml).text(settings.title || "untitled");
    var data = xml.outerXml();
    core.createSpreadsheet.call(self, opt, data, next);

  }, function(xml, next) {
    var $xml = $(xml);
    var id = $("id", $xml).text();
    var sp = id.split(/spreadsheet%3A/), key = sp[1];
    var ss = Spreadsheet(key, self._auth);
    ss._xml = $xml.outerXml();
    self._list[key] = ss;
    
    next.call(self, null, ss);
    
  }, callback);
};

Spreadsheets.prototype.downloadSpreadsheet = function(key, format, out, callback) {
  var self = this;
  
  chain.call(self, function(next) {
    self.getSpreadsheet(key, next);

  }, function(ss, next) {
    ss.download(format, out, next);

  }, callback);
};

Spreadsheets.prototype.moveToTrash = function(key, callback) {
  var self = this;
  
  chain.call(self, function(next) {
    self.getSpreadsheet(key, next);
    
  }, function(ss, next) {
    ss.trash(next);
    
  }, callback);
};

Spreadsheets.prototype.deleteSpreadsheet = function(key, callback) {
  var self = this;
  
  chain.call(self, function(next) {
    self.getSpreadsheet(key, next);
    
  }, function(ss, next) {
    ss["delete"](next);
    
  }, callback);
};

Spreadsheets.prototype.getSpreadsheet = function(key, callback) {
  var self = this, list = self._list, opt = {
    path: "/feeds/default/private/full/" + key,
    headers: self._auth["writely"]
  };

  chain.call(self, function(next) {
    key in list ? next.call(null, null, list[key]): core.getSpreadsheet.call(self, opt, "", next);

  }, function(xml, next) {
    var ss = Spreadsheet(key, self._auth);
    ss._xml = xml;
    next.call(self, null, ss);

  }, callback);
};

/**
 * Spreadsheet
 */
function Spreadsheet(key, auth) {
	var self = this;
	if(!(self instanceof Spreadsheet))
		return new Spreadsheet(key, auth);
	self._key = key, self._auth = auth["wise"], self._docauth = auth["writely"];
  self._list = {}, self._titles = {};
}

Spreadsheet.prototype.worksheet = function(callback) {
	var self = this, opt = {
		path: "/feeds/worksheets/" + self._key + "/private/full",
		headers: self._auth
	};

	chain.call(self, function(next) {
		core.worksheet.call(self, opt, "", next);

	}, function(xml, next) {
		var $entries = $("entry", xml);
		var list = self._list = {}, titles = self._titles = {};
		$entries.each(function() {
			var $this = $(this);
			var id = $("id", $this), name = $("title", $this).text();
			var sp = id.text().split(/\//), key = sp[sp.length - 1];
			var ws = Worksheet(key, name, self);
			ws._xml = $this.outerXml();
//			list[key] = ws;
//			titles[name] = ws;
		});
		next.call(self, null, list);

	}, callback);
};

Spreadsheet.prototype.addWorksheet = function(settings, callback) {
	if($.isFunction(settings))
		callback = settings, settings = {};
	var self = this, opt = {
		path: "/feeds/worksheets/" + self._key + "/private/full",
		headers: self._auth
	};
	var xml = $(fs.readFileSync("xml/worksheetentry.xml").toString());// TODO
	// async
	$("title", xml).text(settings.title || "untitled");
	$("gs\\:rowCount", xml).text(settings.row || 100);
	$("gs\\:colCount", xml).text(settings.col || 20);
	var data = xml.outerXml();
	// TODO Any bug depending on jquery will lurk...
	data = data.replace(/count/g, "Count");

	chain.call(self, function(next) {
		core.addWorksheet.call(self, opt, data, next);

	}, function(xml, next) {
		var $xml = $(xml);
		var id = $("id", $xml).text(), name = $("title", $xml).text();
		var sp = id.split(/\//), key = sp[sp.length - 1];
		var ws = self._list[key] = Worksheet(key, name, self);
		ws._xml = $xml.outerXml();
		next.call(self, null, ws);

	}, callback);
};

/**
 * format values: [xls, csv, pdf, ods, tsv, html]
 */
Spreadsheet.prototype.download = function(format, out, callback) {
  if("function" === typeof format)
    callback = format, format = "xls", out = ".";
  
  else if("function" === typeof out)
    callback = out, out = ".";

  var self = this;
  var $content = $("content", self._xml).eq(0), src = $content.attr("src");
  var _url = url.parse(src);
  
  if("string" === typeof out)
    out = _create(out);

  var opt = {
    host: _url["hostname"],
    path: _url["pathname"] + "?" + _url["query"] + "&exportFormat=" + format,
    headers: self._auth,
    outputStream: out
  };  
  core.download.call(self, opt, "", callback);

  function _create(pathname) {    
    if(fs.existsSync(pathname))
      if(fs.statSync(pathname).isDirectory())
        return _create(path.join(pathname, $("title", self._xml).text() + "." + format));
      else {
        var s, splits = pathname.split(/\./), len = splits.length;
        var index = 2 <= len ? len - 2: 0, fname = splits[index];
        if(s = fname.match(/\((\d+)\)$/))
          splits[index] = fname.replace(/\(\d+\)$/, "(" + (+s[1] + 1) + ")");
        else
          splits[index] += "(1)";
        return _create(splits.join("."));
      }
    else
      return fs.createWriteStream(pathname);  
  }
};

Spreadsheet.prototype.trash = function(callback) {
  _delete.call(this, false, callback);
};

Spreadsheet.prototype["delete"] = function(callback) {
  _delete.call(this, true, callback);
};

function _delete(flg, callback) {
  var self = this, key = self._key;
  var opt = {
      path: "/feeds/default/private/full/" + key + "?delete=" + flg,
      headers: $.extend({
        "If-None-Match": "W/\"" + key + ".\""
      }, self._docauth)
  }; 
  core.deleteSpreadsheet.call(self, opt, "", callback);
}

/**
 * Worksheet
 */
function Worksheet(key, title, spreadsheet) {
	var self = this;
	if(!(self instanceof Worksheet))
		return new Worksheet(key, title, spreadsheet);
	self._key = key, self._title = title, self._parent = spreadsheet;
	spreadsheet._list[key] = spreadsheet._titles[title] = self;
}

Worksheet.prototype.row = function(callback) {
	var self = this, opt = {
		path: "/feeds/list/" + self._parent._key + "/" + self._key
				+ "/private/full",
		headers: self._parent._auth
	};

	chain.call(self, function(next) {
		core.row.call(self, opt, "", next);

	}, function(xml, next) {
		var $entries = $("entry", xml), list = self._list = {};
		$entries.each(function() {
			var $this = $(this), $id = $("id", $this);
			var sp = $id.text().split(/\//), key = sp[sp.length - 1];
			var row = Row(key, self);
			row._xml = $this.outerXml();
			list[key] = row;
		});
		next.call(self, null, list);

	}, callback);
};

Worksheet.prototype.cell = function(query, callback) {
	if($.isFunction(query))
		callback = query, query = "";
	if(typeof query !== "string" && !(query instanceof String))
		query = querystring.stringify(query);
	if(!!query && /^[^\?]/.test(query))
		query = "?" + query;
	var self = this, opt = {
		path: "/feeds/cells/" + self._parent._key + "/" + self._key
				+ "/private/full" + query,
		headers: self._parent._auth
	};

	chain.call(self, function(next) {
		core.cell.call(self, opt, "", next);

	}, function(xml, next) {
		var $entries = $("entry", xml), list = self._list = self._list || {};
		$entries.each(function() {
			var $this = $(this), $id = $("id", $this);
			var name = $("title", $this).text(), val = $("content", $this).text();
			var sp = $id.text().split(/\//), key = sp[sp.length - 1];
			var cell = Cell(key, name, val, self);
			cell._xml = $this.outerXml();
			list[key] = cell;
		});
		next.call(self, null, list);

	}, callback);
};

Worksheet.prototype.getCell = function(key, callback) {
	var self = this;
	var cell = Cell(key, null, null, self);
	cell._get(callback);
};

var Style = require("./action9");
Worksheet.prototype.style = function(range, callback) {
	var self = this;
	callback.call(self, null, Style(range, self));
};

/**
 * vals = [[row, col, inputValue], ...]
 */
Worksheet.prototype.updateCells = function(vals, callback) {
	var self = this, p = self._parent;
	var path = "/feeds/cells/" + p._key + "/" + self._key + "/private/full";
	var id = "https://spreadsheets.google.com" + path;

	var $feed;
	chain.call(self, function(next) {
		fs.readFile("xml/batchfeed.xml", "utf8", next);
	}, function(buf, next) {
		$feed = $(buf.toString());
		$("id", $feed).text(id);
		fs.readFile("xml/batchcellentry.xml", "utf8", next);
	}, function(buf, next) {
		var xml = buf.toString(), opt = {
			path: path + "/batch",
			headers: $.extend({
				"If-None-Match": "W/\"" + p._key + ".\""
			}, p._auth)
		}, i, newCells = vals;
		for (i = newCells.length; i--;) {
			var $entry = $(xml), cell = newCells[i];
			var _id = id + "/R" + cell[0] + "C" + cell[1];
			$("batch\\:id", $entry).text("A" + i);
			$("title", $entry).text("A" + i);
			$("id", $entry).text(_id);
			$("link", $entry).attr({
				href: _id + "/1"
			});
			$("gs\\:cell", $entry).attr({
				row: cell[0],
				col: cell[1],
				inputValue: cell[2]
			});
			$feed.append($entry);
		}
		core.updateCells.call(self, opt, $feed.outerXml(), next);
	}, function(xml, next) {
		var err = /error/i.test(xml) ? new Error(xml): null;
		next.call(self, err);

	}, callback);
};

/**
 * TODO Row
 */
function Row(key, worksheet) {
	var self = this;
	if(!(self instanceof Row))
		return new Row(key, worksheet);
	self._key = key;
	self._parent = worksheet;
}

/**
 * Cell
 */
function Cell(key, title, val, worksheet) {
	var self = this;
	if(!(self instanceof Cell))
		return new Cell(key, worksheet);
	var rc = (new RegExp("^R(\\d+)C(\\d+)$")).exec(key);
	self._key = key, self._row = +rc[1], self._col = +rc[2];
	self._title = title, self._value = val, self._parent = worksheet;
}

Cell.prototype.style = function(callback) {
	var self = this, range = {};
	range.scol = range.ecol = self._col;
	range.srow = range.erow = self._row;
	self._parent.style(range, callback);
};

Cell.prototype.changeValue = function(val, callback) {
	var self = this, p = self._parent, gp = p._parent;
	var path = "/feeds/cells/" + gp._key + "/" + p._key + "/private/full/"
			+ self._key;

	chain.call(self, function(next) {
		fs.readFile("xml/cellentry.xml", "utf8", next);
	}, function(buf, next) {
		var $xml = $(buf.toString());
		var id = "https://spreadsheets.google.com" + path;
		$("id", $xml).text(id);
		$("link", $xml).attr({
			href: id
		});
		$("gs\\:cell", $xml).attr({
			row: self._row,
			col: self._col,
			inputValue: val
		});
		var data = $xml.outerXml(), opt = {
			path: path,
			headers: $.extend({
				"If-None-Match": "W/\"" + gp._key + ".\""
			}, gp._auth)
		};
		core.changeCell.call(self, opt, data, next);

	}, function(xml, next) {
		self._xml = $(xml).outerXml();
		next.call(self, null, self);

	}, callback);
};

Cell.prototype.getValue = function(callback) {
	var self = this, p = self._parent, key = self._key;
	chain.call(self, self._get, function(cell, next) {
		callback.call(self, null, cell ? cell._value: null);
	});
};

Cell.prototype._get = function(callback) {
	var self = this, p = self._parent;
	var query = {};
	chain.call(self, function(next) {
		query["min-row"] = query["max-row"] = self._row;
		query["min-col"] = query["max-col"] = self._col;
		p.cell(query, next);

	}, function(cells) {
		var key = self._key, cell = cells[key] = cells[key]
				|| Cell(key, null, null, p);
		p._list[key] = cell;
		callback.call(self, null, cell);
	});
};
