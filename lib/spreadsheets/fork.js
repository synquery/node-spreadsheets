/***/
var events = require("events");

module.exports = function() {
	var self = this;
	var i, len, actors = Array.prototype.slice.call(arguments);
	var _ret = [], _cb = cb = actors.pop();
	var evt = new events.EventEmitter();

	evt.on("end", function(info, index) {
		_ret[index] = info;
		_cb = _cb.call(self, null, _ret);
	});
	evt.on("error", function(err) {
		cb.call(self, err);
	});

	try {
		for (i = 0, len = actors.length; i < len; i++) {
			_cb = wrap(_cb);
			process.nextTick(act(actors[i], i));
		}
		_cb = _cb.call(self, null, null);
	} catch (err) {
		_finally.call(self, err);
	}

	function act(actor, index) {
		return function() {
			try {
				var length = actor.length, args = [];
				if(length === 0)
					return evt.emit("end", actor.apply(self, args), index);
				args[length - 1] = function(err, info) {
					if(err)
						return evt.emit("error", err);
					evt.emit("end", info, index);
				};
				actor.apply(self, args);
			} catch (err) {
				evt.emit("error", err);
			}
		};
	}

	function wrap(fnc) {
		return function() {
			return fnc;
		};
	}
};
