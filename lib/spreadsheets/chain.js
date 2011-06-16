/***/

module.exports = function() {
	var self = this;
	var actors = Array.prototype.slice.call(arguments);
	next();
	function next(err) {
		try {
			if(err)
				return actors.pop().call(self, err);
			var actor = actors.shift();
			var args = Array.prototype.slice.call(arguments);
			if(actors.length > 0) {
				args = args.slice(1).concat(next);
			}
			actor.apply(self, args);
		} catch (error) {
			actors.length === 0 ? actor.call(self, error): next(error);
		}
	}
};