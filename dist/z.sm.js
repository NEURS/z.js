/*!
 * z.js JavaScript Library v0.0.1
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2014-08-15T04:17Z
 */
;(function (window, document) {

var zArray, _window, _document, iframe;

function z(elem, scope) {
	if (elem instanceof zArray) {
		return elem;
	} else if (elem instanceof EventTarget) {
		return new zArray(elem);
	} else if (elem === undefined || elem === null) {
		return new zArray();
	} else if (typeof elem !== "string") {
		throw new Error("First parameter is invalid");
	}

	if (scope) {
		if (!_checkValidElement(scope)) {
			throw new Error("Second parameter is invalid");
		}

		scope = z(scope);
	} else {
		scope = _document;
	}

	return _find(scope, elem);
}

try {
	iframe = document.createElement("iframe");

	iframe.style.width			= 0;
	iframe.style.height			= 0;
	iframe.style.borderStyle	= "none";

	document.body.appendChild(iframe);

	zArray = iframe.contentWindow.Array;

	document.body.removeChild(iframe);
} catch (e) {
	zArray = Array;
}

//window.$	= z;
window.z	= z;
z.fn		= zArray.prototype;
_window		= z(window);
_document	= z(document);

z.fn.find = function (strElem) {
	if (typeof strElem !== "string") {
		throw new Error("First paramater of z#find() should be a string");
	}

	return _find(this, strElem);
};
if ("dataset" in document.body) {
	z.fn.data = function (key, value) {
		var i, l;

		if (!this.length) {
			return;
		}

		if (key === undefined) {
			return this[0].dataset;
		} else if (value === undefined) {
			return this[0].dataset[key];
		}

		for (i = 0, l = this.length; i < l; i++) {
			this[i].dataset[key] = value;
		}

		return this;
	};
} else {
	z.fn.data = function (key, value) {
		var i, l,
			dataKey = "data-" + (key || "");

		if (!this.length) {
			return;
		}

		if (key === undefined) {
			i = {};

			[].forEach.call(this[0].attributes, function (attr) {
				return i[attr.name] = attr.value;
			});

			return i;
		} else if (value === undefined) {
			return this[0].attributes[dataKey];
		}

		for (i = 0, l = this.length; i < l; i++) {
			this[i].dataset[dataKey] = value;
		}

		return this;
	};
}

z.fn.on = z.fn.bind = function (eventType, fn) {
	
};

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
				if (selector instanceof EventTarget) {
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

z.fn.hide = _each(function hide() {
	this.style.display = "none";
	return this;
});

z.fn.show = _each(function show() {
	this.style.display = "";
	return this;
});

z.fn.clone = function (deep) {
	var i = 0;

	if (deep === undefined || deep === null) {
		deep = false;
	}

	for (; i < this.length; i++) {
		this[i] = this[i].cloneNode(deep);
	}

	return this;
};

z.fn.html = function (value) {
	var i, l;

	if (value === undefined) {
		return this.innerHTML;
	}

	for (i = 0, l = this.length; i < l; i++) {
		this[i].innerHTML = value;
	}

	return this;
};

z.fn.text = function (value) {
	var i, l;

	if (value === undefined) {
		return this.textContent;
	}

	for (i = 0, l = this.length; i < l; i++) {
		this[i].textContent = value;
	}

	return this;
};

z.fn.getAttr = function (key) {
	if (!key) {
		throw new Error("First parameter of z#getAttr is required");
	}

	return this[0] && this[0].getAttribute(key);
};

z.fn.setAttr = _each(function (key, value) {
	if (!key) {
		throw new Error("First parameter of z#setAttr is required");
	} else if (value === undefined) {
		throw new Error("Second parameter of z#setAttr is required");
	}

	this.setAttribute(key, value);
	return this;
});

z.fn.attr = function (key, value) {
	if (value === undefined) {
		return this.getAttr(key);
	}

	this.setAttr(key, value);
	return this;
};

z.fn.replaceWith = z.fn.replace = _each(function (value) {
	if (value === undefined) {
		throw new Error("First parameter of z#replace is required");
	}

	this.outerHTML = value;
});

if ("classList" in document.documentElement) {
	z.fn.addClass = _each(function addClass(className) {
		this.classList.add(className);
	});

	z.fn.removeClass = _each(function removeClass(className) {
		this.classList.remove(className);
	});

	z.fn.toggleClass = _each(function toggleClass(className, force) {
		if (force === undefined) {
			this.classList.toggle(className);
			return;
		}

		this.classList[force ? "add" : "remove"](className);
	});
} else {
	z.fn.addClass = _each(function addClass(className) {
		this.className += " " + className;
	});

	z.fn.removeClass = _each(function removeClass(className) {
		this.className += this.className.replace(new RegExp("(^|\\b)" + className + "(\\b|$)", "g"), " ");
	});

	z.fn.toggleClass = function (className, force) {
		this[force ? "addClass" : "removeClass"](className);
		return this;
	};
}

var _selectorsCache,
	_selectors = {};

function _find(scope, strElem) {
	var ret = new zArray();

	scope.forEach(function _findForEach(scopedElem) {
		ret.push.apply(ret, _select(scopedElem, strElem));
	});

	return ret;
}

function _select(scopedElem, strElem) {
	if (!~strElem.indexOf(":") || _selectorsCache === undefined) {
		return scopedElem.querySelectorAll(strElem);
	}

	if (_selectorsCache === false) {
		_generateSelectorsCache();
	}

	if (!strElem.match(_selectorsCache)) {
		return scopedElem.querySelectorAll(strElem);
	}

	return _select2(scopedElem, strElem);
}

function _select2(scopedElem, strElem) {
	var entry, selectors,
		scope	= new zArray(scopedElem),
		current	= "",
		entries	= strElem.split(/\s+/);

	while (entry = entries.shift()) {
		selectors = entry.match(_selectorsCache);

		if (!selectors) {
			current += entry + " ";
			continue;
		}

		current	+= entry.replace(_selectorsCache, "") || "*";
		entry	= new zArray();

		scope.forEach(function _selectForEach(scopedElem) {
			var ret = new zArray();

			selectors.forEach(function selectorsForEach(selector) {
				ret.push.apply(ret, _selectors[selector].call(scopedElem, current));
			});

			entry.push.apply(entry, ret);
		});

		scope	= entry;
		current	= "";
	}

	if (current) {
		entry = new zArray();

		scope.forEach(function currentForEach(scopedElem) {
			entry.push.apply(entry, scopedElem.querySelectorAll(current));
		});

		scope = entry;
	}

	return scope;
}

function _generateSelectorsCache() {
	var selectors	= Object.keys(_selectors).join("|").replace(/:/g, "");
	_selectorsCache	= new RegExp(":(" + selectors + ")", "g");
}

z.registerSelector = function (selector, fn) {
	if (!selector || typeof selector !== "string") {
		throw new Error("First parameter of z#registerSelector must be a string selector");
	} else if (!fn || typeof fn !== "function") {
		throw new Error("Second parameter of z#registerSelector must be a function");
	}

	if (selector[0] !== ":") {
		selector = ":" + selector;
	}

	_selectorsCache			= false;
	_selectors[selector]	= fn;
};

z.registerSelector(":first", function selectorFirst(query) {
	return z(this.querySelector(query));
});

z.registerSelector(":input", (function selectorFirst() {
	var tags = "INPUT,TEXTAREA,SELECT,BUTTON".split(",");

	function filter(element) {
		return ~tags.indexOf(element.tagName);
	}

	return function selectorInput(query) {
		var elements = new zArray();

		elements.push.apply(elements, [].filter.call(this.querySelectorAll(query), filter));

		return elements;
	};
})());

z.fn.parent = _eachNew(function () {
	return this.parentNode;
});

z.fn.next = _eachNew(function () {
	return this.nextElementSibling;
});

z.fn.prev = z.fn.previous = _eachNew(function () {
	return this.previousElementSibling;
});

z.fn.siblings = _eachNew(function () {
	return [].filter.call(this.parentNode.children, function(child) {
		return child !== this;
	}, this);
});

function _checkValidElement(elem) {
	if (elem instanceof zArray) {
		return true;
	}

	if (elem instanceof EventTarget) {
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
				if (Array.isArray(ret) && ret.length) {
					arr.push.apply(arr, ret);
				} else {
					arr.push(ret);
				}
			}
		}

		return arr;
	};
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

})(window, document);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImRhdGEuanMiLCJldmVudHMuanMiLCJmaWx0ZXJpbmcuanMiLCJtYW5pcHVsYXRpb24uanMiLCJzZWxlY3RvcnMuanMiLCJzZWxlY3RvcnNfY3VzdG9tLmpzIiwidHJhdmVyc2luZy5qcyIsInV0aWxzLmpzIiwiX2Zvb3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUZBO0FBQ0EiLCJmaWxlIjoiei5zbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogei5qcyBKYXZhU2NyaXB0IExpYnJhcnkgdkBWRVJTSU9OXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTkVVUlMvei5qc1xuICpcbiAqIENvcHlyaWdodCAyMDE0IE5FVVJTIExMQywgS2V2aW4gSi4gTWFydGluLCBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ORVVSUy96LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBEYXRlOiBAREFURVxuICovXG47KGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG4iLCJ2YXIgekFycmF5LCBfd2luZG93LCBfZG9jdW1lbnQsIGlmcmFtZTtcblxuZnVuY3Rpb24geihlbGVtLCBzY29wZSkge1xuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHJldHVybiBlbGVtO1xuXHR9IGVsc2UgaWYgKGVsZW0gaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuXHRcdHJldHVybiBuZXcgekFycmF5KGVsZW0pO1xuXHR9IGVsc2UgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG5ldyB6QXJyYXkoKTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZWxlbSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xuXHR9XG5cblx0aWYgKHNjb3BlKSB7XG5cdFx0aWYgKCFfY2hlY2tWYWxpZEVsZW1lbnQoc2NvcGUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIGlzIGludmFsaWRcIik7XG5cdFx0fVxuXG5cdFx0c2NvcGUgPSB6KHNjb3BlKTtcblx0fSBlbHNlIHtcblx0XHRzY29wZSA9IF9kb2N1bWVudDtcblx0fVxuXG5cdHJldHVybiBfZmluZChzY29wZSwgZWxlbSk7XG59XG5cbnRyeSB7XG5cdGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG5cblx0aWZyYW1lLnN0eWxlLndpZHRoXHRcdFx0PSAwO1xuXHRpZnJhbWUuc3R5bGUuaGVpZ2h0XHRcdFx0PSAwO1xuXHRpZnJhbWUuc3R5bGUuYm9yZGVyU3R5bGVcdD0gXCJub25lXCI7XG5cblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuXG5cdHpBcnJheSA9IGlmcmFtZS5jb250ZW50V2luZG93LkFycmF5O1xuXG5cdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbn0gY2F0Y2ggKGUpIHtcblx0ekFycmF5ID0gQXJyYXk7XG59XG5cbi8vd2luZG93LiRcdD0gejtcbndpbmRvdy56XHQ9IHo7XG56LmZuXHRcdD0gekFycmF5LnByb3RvdHlwZTtcbl93aW5kb3dcdFx0PSB6KHdpbmRvdyk7XG5fZG9jdW1lbnRcdD0geihkb2N1bWVudCk7XG5cbnouZm4uZmluZCA9IGZ1bmN0aW9uIChzdHJFbGVtKSB7XG5cdGlmICh0eXBlb2Ygc3RyRWxlbSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtYXRlciBvZiB6I2ZpbmQoKSBzaG91bGQgYmUgYSBzdHJpbmdcIik7XG5cdH1cblxuXHRyZXR1cm4gX2ZpbmQodGhpcywgc3RyRWxlbSk7XG59OyIsImlmIChcImRhdGFzZXRcIiBpbiBkb2N1bWVudC5ib2R5KSB7XG5cdHouZm4uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0dmFyIGksIGw7XG5cblx0XHRpZiAoIXRoaXMubGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1swXS5kYXRhc2V0O1xuXHRcdH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbMF0uZGF0YXNldFtrZXldO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5kYXRhc2V0W2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcbn0gZWxzZSB7XG5cdHouZm4uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0dmFyIGksIGwsXG5cdFx0XHRkYXRhS2V5ID0gXCJkYXRhLVwiICsgKGtleSB8fCBcIlwiKTtcblxuXHRcdGlmICghdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGkgPSB7fTtcblxuXHRcdFx0W10uZm9yRWFjaC5jYWxsKHRoaXNbMF0uYXR0cmlidXRlcywgZnVuY3Rpb24gKGF0dHIpIHtcblx0XHRcdFx0cmV0dXJuIGlbYXR0ci5uYW1lXSA9IGF0dHIudmFsdWU7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGk7XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1swXS5hdHRyaWJ1dGVzW2RhdGFLZXldO1xuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5kYXRhc2V0W2RhdGFLZXldID0gdmFsdWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59XG4iLCJ6LmZuLm9uID0gei5mbi5iaW5kID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZm4pIHtcblx0XG59O1xuIiwiZnVuY3Rpb24gX2lzV2l0aEZ1bmN0aW9uKGVsZW0sIGZuKSB7XG5cdHJldHVybiBmbi5jYWxsKGVsZW0sIGVsZW0pO1xufVxuXG5mdW5jdGlvbiBfaXNXaXRoRWxlbWVudChlbGVtMSwgZWxlbTIpIHtcblx0cmV0dXJuIGVsZW0xID09PSBlbGVtMjtcbn1cblxuei5mbi5pcyA9IChmdW5jdGlvbiBfaXMoKSB7XG5cdHZhciBtYXRjaGVzLFxuXHRcdGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5cdG1hdGNoZXNcdD0gYm9keS5tYXRjaGVzIHx8IGJvZHkubWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkubXNNYXRjaGVzU2VsZWN0b3I7XG5cdG1hdGNoZXMgPSBtYXRjaGVzIHx8IGJvZHkubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkub01hdGNoZXNTZWxlY3RvcjtcblxuXHRyZXR1cm4gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG5cdFx0dmFyIF9pc1dpdGgsIHJldCxcblx0XHRcdGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGg7XG5cblx0XHRzd2l0Y2ggKHR5cGVvZiBzZWxlY3Rvcikge1xuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0XHRfaXNXaXRoID0gbWF0Y2hlcztcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwiZnVuY3Rpb25cIjpcblx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhGdW5jdGlvbjtcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwib2JqZWN0XCI6XG5cdFx0XHRcdGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG5cdFx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhFbGVtZW50O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2lzIGlzIGludmFsaWRcIik7XG5cdFx0XHRcdH1cblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2lzIGlzIGludmFsaWRcIik7XG5cdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gX2lzV2l0aCh0aGlzW2ldLCBzZWxlY3Rvcik7XG5cblx0XHRcdGlmIChyZXQpIHtcblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG59KSgpO1xuIiwiei5mbi5oaWRlID0gX2VhY2goZnVuY3Rpb24gaGlkZSgpIHtcblx0dGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdHJldHVybiB0aGlzO1xufSk7XG5cbnouZm4uc2hvdyA9IF9lYWNoKGZ1bmN0aW9uIHNob3coKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cdHJldHVybiB0aGlzO1xufSk7XG5cbnouZm4uY2xvbmUgPSBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgaSA9IDA7XG5cblx0aWYgKGRlZXAgPT09IHVuZGVmaW5lZCB8fCBkZWVwID09PSBudWxsKSB7XG5cdFx0ZGVlcCA9IGZhbHNlO1xuXHR9XG5cblx0Zm9yICg7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dGhpc1tpXSA9IHRoaXNbaV0uY2xvbmVOb2RlKGRlZXApO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLmh0bWwgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIGksIGw7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lckhUTUw7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLmlubmVySFRNTCA9IHZhbHVlO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLnRleHQgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIGksIGw7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy50ZXh0Q29udGVudDtcblx0fVxuXG5cdGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0udGV4dENvbnRlbnQgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5nZXRBdHRyID0gZnVuY3Rpb24gKGtleSkge1xuXHRpZiAoIWtleSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2dldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHRyZXR1cm4gdGhpc1swXSAmJiB0aGlzWzBdLmdldEF0dHJpYnV0ZShrZXkpO1xufTtcblxuei5mbi5zZXRBdHRyID0gX2VhY2goZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKCFrZXkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNzZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9IGVsc2UgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIG9mIHojc2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcblx0fVxuXG5cdHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLmF0dHIgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHIoa2V5KTtcblx0fVxuXG5cdHRoaXMuc2V0QXR0cihrZXksIHZhbHVlKTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLnJlcGxhY2VXaXRoID0gei5mbi5yZXBsYWNlID0gX2VhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojcmVwbGFjZSBpcyByZXF1aXJlZFwiKTtcblx0fVxuXG5cdHRoaXMub3V0ZXJIVE1MID0gdmFsdWU7XG59KTtcblxuaWYgKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XG5cdHouZm4uYWRkQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiBhZGRDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblx0fSk7XG5cblx0ei5mbi5yZW1vdmVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZSkge1xuXHRcdHRoaXMuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuXHR9KTtcblxuXHR6LmZuLnRvZ2dsZUNsYXNzID0gX2VhY2goZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoY2xhc3NOYW1lLCBmb3JjZSkge1xuXHRcdGlmIChmb3JjZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLmNsYXNzTGlzdC50b2dnbGUoY2xhc3NOYW1lKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmNsYXNzTGlzdFtmb3JjZSA/IFwiYWRkXCIgOiBcInJlbW92ZVwiXShjbGFzc05hbWUpO1xuXHR9KTtcbn0gZWxzZSB7XG5cdHouZm4uYWRkQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiBhZGRDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTmFtZSArPSBcIiBcIiArIGNsYXNzTmFtZTtcblx0fSk7XG5cblx0ei5mbi5yZW1vdmVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZSkge1xuXHRcdHRoaXMuY2xhc3NOYW1lICs9IHRoaXMuY2xhc3NOYW1lLnJlcGxhY2UobmV3IFJlZ0V4cChcIihefFxcXFxiKVwiICsgY2xhc3NOYW1lICsgXCIoXFxcXGJ8JClcIiwgXCJnXCIpLCBcIiBcIik7XG5cdH0pO1xuXG5cdHouZm4udG9nZ2xlQ2xhc3MgPSBmdW5jdGlvbiAoY2xhc3NOYW1lLCBmb3JjZSkge1xuXHRcdHRoaXNbZm9yY2UgPyBcImFkZENsYXNzXCIgOiBcInJlbW92ZUNsYXNzXCJdKGNsYXNzTmFtZSk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59XG4iLCJ2YXIgX3NlbGVjdG9yc0NhY2hlLFxuXHRfc2VsZWN0b3JzID0ge307XG5cbmZ1bmN0aW9uIF9maW5kKHNjb3BlLCBzdHJFbGVtKSB7XG5cdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBfZmluZEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdHJldC5wdXNoLmFwcGx5KHJldCwgX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSk7XG5cdH0pO1xuXG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9zZWxlY3Qoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHRpZiAoIX5zdHJFbGVtLmluZGV4T2YoXCI6XCIpIHx8IF9zZWxlY3RvcnNDYWNoZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdGlmIChfc2VsZWN0b3JzQ2FjaGUgPT09IGZhbHNlKSB7XG5cdFx0X2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKTtcblx0fVxuXG5cdGlmICghc3RyRWxlbS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdHJldHVybiBfc2VsZWN0MihzY29wZWRFbGVtLCBzdHJFbGVtKTtcbn1cblxuZnVuY3Rpb24gX3NlbGVjdDIoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHR2YXIgZW50cnksIHNlbGVjdG9ycyxcblx0XHRzY29wZVx0PSBuZXcgekFycmF5KHNjb3BlZEVsZW0pLFxuXHRcdGN1cnJlbnRcdD0gXCJcIixcblx0XHRlbnRyaWVzXHQ9IHN0ckVsZW0uc3BsaXQoL1xccysvKTtcblxuXHR3aGlsZSAoZW50cnkgPSBlbnRyaWVzLnNoaWZ0KCkpIHtcblx0XHRzZWxlY3RvcnMgPSBlbnRyeS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpO1xuXG5cdFx0aWYgKCFzZWxlY3RvcnMpIHtcblx0XHRcdGN1cnJlbnQgKz0gZW50cnkgKyBcIiBcIjtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGN1cnJlbnRcdCs9IGVudHJ5LnJlcGxhY2UoX3NlbGVjdG9yc0NhY2hlLCBcIlwiKSB8fCBcIipcIjtcblx0XHRlbnRyeVx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIF9zZWxlY3RGb3JFYWNoKHNjb3BlZEVsZW0pIHtcblx0XHRcdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0XHRcdHNlbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIHNlbGVjdG9yc0ZvckVhY2goc2VsZWN0b3IpIHtcblx0XHRcdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0b3JzW3NlbGVjdG9yXS5jYWxsKHNjb3BlZEVsZW0sIGN1cnJlbnQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCByZXQpO1xuXHRcdH0pO1xuXG5cdFx0c2NvcGVcdD0gZW50cnk7XG5cdFx0Y3VycmVudFx0PSBcIlwiO1xuXHR9XG5cblx0aWYgKGN1cnJlbnQpIHtcblx0XHRlbnRyeSA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gY3VycmVudEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdFx0ZW50cnkucHVzaC5hcHBseShlbnRyeSwgc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKGN1cnJlbnQpKTtcblx0XHR9KTtcblxuXHRcdHNjb3BlID0gZW50cnk7XG5cdH1cblxuXHRyZXR1cm4gc2NvcGU7XG59XG5cbmZ1bmN0aW9uIF9nZW5lcmF0ZVNlbGVjdG9yc0NhY2hlKCkge1xuXHR2YXIgc2VsZWN0b3JzXHQ9IE9iamVjdC5rZXlzKF9zZWxlY3RvcnMpLmpvaW4oXCJ8XCIpLnJlcGxhY2UoLzovZywgXCJcIik7XG5cdF9zZWxlY3RvcnNDYWNoZVx0PSBuZXcgUmVnRXhwKFwiOihcIiArIHNlbGVjdG9ycyArIFwiKVwiLCBcImdcIik7XG59XG4iLCJ6LnJlZ2lzdGVyU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGZuKSB7XG5cdGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojcmVnaXN0ZXJTZWxlY3RvciBtdXN0IGJlIGEgc3RyaW5nIHNlbGVjdG9yXCIpO1xuXHR9IGVsc2UgaWYgKCFmbiB8fCB0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcblx0fVxuXG5cdGlmIChzZWxlY3RvclswXSAhPT0gXCI6XCIpIHtcblx0XHRzZWxlY3RvciA9IFwiOlwiICsgc2VsZWN0b3I7XG5cdH1cblxuXHRfc2VsZWN0b3JzQ2FjaGVcdFx0XHQ9IGZhbHNlO1xuXHRfc2VsZWN0b3JzW3NlbGVjdG9yXVx0PSBmbjtcbn07XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjpmaXJzdFwiLCBmdW5jdGlvbiBzZWxlY3RvckZpcnN0KHF1ZXJ5KSB7XG5cdHJldHVybiB6KHRoaXMucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xufSk7XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjppbnB1dFwiLCAoZnVuY3Rpb24gc2VsZWN0b3JGaXJzdCgpIHtcblx0dmFyIHRhZ3MgPSBcIklOUFVULFRFWFRBUkVBLFNFTEVDVCxCVVRUT05cIi5zcGxpdChcIixcIik7XG5cblx0ZnVuY3Rpb24gZmlsdGVyKGVsZW1lbnQpIHtcblx0XHRyZXR1cm4gfnRhZ3MuaW5kZXhPZihlbGVtZW50LnRhZ05hbWUpO1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uIHNlbGVjdG9ySW5wdXQocXVlcnkpIHtcblx0XHR2YXIgZWxlbWVudHMgPSBuZXcgekFycmF5KCk7XG5cblx0XHRlbGVtZW50cy5wdXNoLmFwcGx5KGVsZW1lbnRzLCBbXS5maWx0ZXIuY2FsbCh0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLCBmaWx0ZXIpKTtcblxuXHRcdHJldHVybiBlbGVtZW50cztcblx0fTtcbn0pKCkpO1xuIiwiei5mbi5wYXJlbnQgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLnBhcmVudE5vZGU7XG59KTtcblxuei5mbi5uZXh0ID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5uZXh0RWxlbWVudFNpYmxpbmc7XG59KTtcblxuei5mbi5wcmV2ID0gei5mbi5wcmV2aW91cyA9IF9lYWNoTmV3KGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMucHJldmlvdXNFbGVtZW50U2libGluZztcbn0pO1xuXG56LmZuLnNpYmxpbmdzID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gW10uZmlsdGVyLmNhbGwodGhpcy5wYXJlbnROb2RlLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuXHRcdHJldHVybiBjaGlsZCAhPT0gdGhpcztcblx0fSwgdGhpcyk7XG59KTtcbiIsImZ1bmN0aW9uIF9jaGVja1ZhbGlkRWxlbWVudChlbGVtKSB7XG5cdGlmIChlbGVtIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBfZWFjaChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgaVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aDtcblxuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRmbi5hcHBseSh0aGlzW2ldLCBhcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBfZWFjaE5ldyhmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgcmV0LFxuXHRcdFx0aVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aCxcblx0XHRcdGFyclx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gZm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblxuXHRcdFx0aWYgKHJldCkge1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXQpICYmIHJldC5sZW5ndGgpIHtcblx0XHRcdFx0XHRhcnIucHVzaC5hcHBseShhcnIsIHJldCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyLnB1c2gocmV0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnI7XG5cdH07XG59XG5cbnouZGVlcEV4dGVuZCA9IGZ1bmN0aW9uIF9leHRlbmQoZGVlcCkge1xuXHR2YXIgb2JqLCB0YXJnZXQsXG5cdFx0aSA9IDI7XG5cblx0aWYgKHR5cGVvZiBkZWVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0dGFyZ2V0XHQ9IGRlZXAgfHwge307XG5cdFx0ZGVlcFx0PSBJbmZpbml0eTtcblx0fSBlbHNlIHtcblx0XHRkZWVwXHQ9IGRlZXAgPT09IHRydWUgPyBJbmZpbml0eSA6IChkZWVwIHwgMCk7XG5cdFx0dGFyZ2V0XHQ9IGFyZ3VtZW50c1sxXSB8fCB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0b2JqID0gYXJndW1lbnRzW2ldO1xuXG5cdFx0aWYgKCFvYmopIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpZiAoZGVlcCAmJiB0eXBlb2Ygb2JqW2tleV0gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0XHRfZXh0ZW5kKGRlZXAgLSAxLCB0YXJnZXRba2V5XSwgb2JqW2tleV0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcblxuei5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XG5cdFtdLnVuc2hpZnQuY2FsbChhcmd1bWVudHMsIDApO1xuXHRyZXR1cm4gei5kZWVwRXh0ZW5kLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG56LmZuLmVhY2ggPSBfZWFjaChmdW5jdGlvbiBlYWNoKGZuKSB7XG5cdGZuLmNhbGwodGhpcywgdGhpcyk7XG5cdHJldHVybiB0aGlzO1xufSk7XG4iLCJ9KSh3aW5kb3csIGRvY3VtZW50KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==