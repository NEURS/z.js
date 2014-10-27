function _isWithFunction(elem, fn) {
	return fn.call(elem, elem);
}

function _isWithElement(elem1, elem2) {
	return elem1 === elem2;
}

z.fn.is = (function _is() {
	var matches,
		body = document.body;

	matches	= body.matches || body.matchesSelector || body.msMatchesSelector;
	matches = matches || body.mozMatchesSelector || body.webkitMatchesSelector || body.oMatchesSelector;

	return function (selector) {
		var _isWith, ret,
			i	= 0,
			l	= this.length;

		switch (typeof selector) {
			case "string":
				_isWith = matches;
			break;

			case "function":
				_isWith = _isWithFunction;
			break;

			case "object":
				if (selector instanceof Element || selector instanceof Window || selector instanceof Document) {
					_isWith = _isWithElement;
				} else {
					throw new Error("First parameter of z#is is invalid");
				}
			default:
				throw new Error("First parameter of z#is is invalid");
			break;
		}

		for (; i < l; i++) {
			ret = _isWith(this[i], selector);

			if (ret) {
				return ret;
			}
		}

		return false;
	};
})();
