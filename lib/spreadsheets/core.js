/***/
var http = require("http"), https = require("https"), querystring = require("querystring");
var $ = require("jquery");

var VERSION = "3.0";

var core = {
	_default: {
		opt: function(opt) {
			return opt;
		},
		success: 200
	},
	authenticate: {
		opt: function() {
			return {
				host: "www.google.com",
				path: "/accounts/ClientLogin",
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				}
			};
		},
		success: 200
	},

	list: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				path: "/feeds/spreadsheets/private/full",
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	worksheet: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	addWorksheet: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "POST",
				headers: {
					"Content-Type": "application/atom+xml",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 201
	},

	changeCell: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "PUT",
				headers: {
					"Content-Type": "application/atom+xml",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	updateCells: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "POST",
				headers: {
					"Content-Type": "application/atom+xml",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	deleteWorksheet: {
		opt: function(opt) {
			return $.extend(true, {
				hots: "spreadsheets.google.com",
				method: "DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	// TODO
	},

	cell: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	row: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"GDATA-Version": VERSION
				}
			}, opt);
		},
		success: 200
	},

	ccc: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "GET",
				headers: {
					"X-Same-Domain": "trix",
					"Content-Type": "application/x-www-form-urlencoded",
					// "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7)
					// AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.10
					// Safari/535.1",
					"User-Agent": "AppleWebKit/535.1"
				}
			}, opt);
		},
		success: 200
	},
	
	action9: {
		opt: function(opt) {
			return $.extend(true, {
				host: "spreadsheets.google.com",
				method: "POST",
				headers: {
					"X-Same-Domain": "trix",
					"Content-Type": "application/x-www-form-urlencoded"
				}
			}, opt);
		},
		success: 200
	},
	
	createSpreadsheet: {
	  opt: function(opt) {
	    return $.extend(true, {
	      host: "docs.google.com",
	      path: "/feeds/default/private/full",
	      method: "POST",
        headers: {
          "Content-Type": "application/atom+xml",
          "GDATA-Version": VERSION
        }
	    }, opt);
	  },
	  success: 201
	},
	
	getSpreadsheet: {
    opt: function(opt) {
      return $.extend(true, {
        host: "docs.google.com",
        method: "GET",
        headers: {
          "Content-Type": "application/atom+xml",
          "GDATA-Version": VERSION
        }
      }, opt);
    },
    success: 200
	},
	
	download: {
	  opt: function(opt) {
	    return $.extend(true, {
	      method: "GET",
        headers: {
          "Content-Type": "application/atom+xml",
          "GDATA-Version": VERSION
        }
	    }, opt);
	  },
    success: 200
	},
	
	deleteSpreadsheet: {
    opt: function(opt) {
      return $.extend(true, {
        method: "DELETE",
        host: "docs.google.com",
        headers: {
          "Content-Type": "application/atom+xml",
          "GDATA-Version": VERSION
        }
      }, opt);
    },
    success: 200
	}
};

var fn;
for (fn in core) {
	exports[fn] = _fn(core[fn]);
}

function _fn(settings) {
	return function(opt, data, callback) {
		var self = this;
		request.call(self, settings.opt(opt), data,
				function(err, info) {
					if(info && info.statusCode !== settings.success)
						err = new Error(info.statusCode + " " + info.status + "\n"
								+ info.data);
					if(err)
						return callback.call(self, err);
					callback.call(self, null, info.data);
				});
	};
}

function request(options, data, callback) {
//  console.log(options);
//  console.log(data);
  var os = options["outputStream"];
  delete options["outputStream"];

	var self = this, req = https.request(options);

	req.on("response", function(response) {
	  var info = "";

	  response.on("end", function() {
	    var res = this, ret = {};
	    ret.statusCode = res.statusCode;
	    ret.status = http.STATUS_CODES[res.statusCode];
	    ret.data = info;
	    callback.call(self, null, ret);
	  });
	  response.on("close", function() {
	    response.emit("end");
	  });

	  if(os)
	    return response.pipe(os);
	  
		response.setEncoding("utf8");

		response.on("data", function(data) {
			info += data;
		});
	});

	req.on("error", function(err) {
		callback.call(self, err);
	});

	req.end(data);
};

