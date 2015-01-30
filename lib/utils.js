var regexpDash		= /-(.)/g,
	regexpUpperCase	= /(?!^)([A-Z])/g;

function _toCamelCase(string) {
	return string.toLowerCase().replace(regexpDash, _toCamelCaseHelper);
}

function _toCamelCaseHelper(match, group) {
	return group.toUpperCase();
}

function _toDashes(string) {
	return string.replace(regexpUpperCase, _toDashesHelper).toLowerCase();
}

function _toDashesHelper(match, group) {
	return '-' + group.toLowerCase();
}

var _cache = (function () {
	var cache;

	if ("Map" in window) {
		return new Map();
	}

	cache = {};

	return {
		set: function (key, value) {
			cache[key] = value;
		},
		get: function (key) {
			return cache[key];
		}
	};
})();

function _checkValidElement(elem) {
	if (elem instanceof zArray) {
		return true;
	}

	if (elem instanceof Element || elem instanceof Window || elem instanceof Document) {
		return true;
	}

	if (typeof elem === "string") {
		return true;
	}
}

function _each(fn) {
	return function runEach() {
		var i	= 0,
			l	= this.length;

		for (; i < l; i++) {
			fn.apply(this[i], arguments);
		}

		return this;
	};
}

function _eachNew(fn) {
	return function runEach() {
		var ret,
			i	= 0,
			l	= this.length,
			arr	= new zArray();

		for (; i < l; i++) {
			ret = fn.apply(this[i], arguments);

			if (ret) {
				if (Array.isArray(ret) && ret.length || ret instanceof HTMLCollection) {
					arr.push.apply(arr, ret);
				} else {
					arr.push(ret);
				}
			}
		}

		return arr;
	};
}

function dir(elem, key) {
	var matched = new zArray();

	while (elem[key] && elem.nodeType === 1) {
		elem = elem[key];
		matched.push(elem);
	}

	return matched;
}

z.deepExtend = function _extend(deep) {
	var obj, target,
		i = 2;

	if (typeof deep === "object") {
		target	= deep || {};
		deep	= Infinity;
	} else {
		deep	= deep === true ? Infinity : (deep | 0);
		target	= arguments[1] || {};
	}

	for (; i < arguments.length; i++) {
		obj = arguments[i];

		if (!obj) {
			continue;
		}

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (deep && typeof obj[key] === "object") {
					_extend(deep - 1, target[key], obj[key]);
				} else {
					target[key] = obj[key];
				}
			}
		}
	}

	return target;
};

z.extend = function () {
	[].unshift.call(arguments, 0);
	return z.deepExtend.apply(null, arguments);
};

z.fn.each = _each(function each(fn) {
	fn.call(this, this);
	return this;
});

z.queryString = function (obj, prefix) {
	var i, key, val,
		strings = [];

	for (i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (prefix) {
				key = prefix + "[" + i + "]";
			} else {
				key = i;
			}

			val = obj[i];

			if (val && typeof val === "object") {
				strings.push(z.queryString(val, key));
			} else {
				strings.push(encodeURIComponent(key) + "=" + encodeURIComponent(val));
			}
		}
	}

	return strings.join("&");
};
