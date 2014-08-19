/*!
 * z.js JavaScript Library v0.0.2
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2014-08-15T16:38Z
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

z.fn.on = z.fn.bind = _each(function _on(eventType, fn) {
	this.addEventListener(eventType, fn, false);
});

z.fn.off = z.fn.unbind = _each(function _off(eventType, fn) {
	this.removeEventListener(eventType, fn, false);
});

z.fn.trigger = function (eventType, data) {
	var event, _data,
		i = 0,
		l = this.length;

	try {
		_data	= data ? {detail: data} : undefined;
		event	= new CustomEvent(eventType, _data);
	} catch (err) {
		event = document.createEvent('CustomEvent');
		event.initCustomEvent(eventType, true, true, data);
	}

	for (; i < l; i++) {
		this[i].dispatchEvent(event);
	}

	return this;
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

z.fn.append = function (value) {
	var i, l;

	if (value === undefined) {
		return this.innerHTML;
	}

	for (i = 0, l = this.length; i < l; i++) {
		this[i].appendChild(document.createElement(value));
	}

	return this;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImRhdGEuanMiLCJldmVudHMuanMiLCJmaWx0ZXJpbmcuanMiLCJtYW5pcHVsYXRpb24uanMiLCJzZWxlY3RvcnMuanMiLCJzZWxlY3RvcnNfY3VzdG9tLmpzIiwidHJhdmVyc2luZy5qcyIsInV0aWxzLmpzIiwiX2Zvb3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1RkE7QUFDQSIsImZpbGUiOiJ6LnNtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiB6LmpzIEphdmFTY3JpcHQgTGlicmFyeSB2QFZFUlNJT05cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ORVVSUy96LmpzXG4gKlxuICogQ29weXJpZ2h0IDIwMTQgTkVVUlMgTExDLCBLZXZpbiBKLiBNYXJ0aW4sIGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL05FVVJTL3ouanMvYmxvYi9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIERhdGU6IEBEQVRFXG4gKi9cbjsoZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbiIsInZhciB6QXJyYXksIF93aW5kb3csIF9kb2N1bWVudCwgaWZyYW1lO1xuXG5mdW5jdGlvbiB6KGVsZW0sIHNjb3BlKSB7XG5cdGlmIChlbGVtIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0cmV0dXJuIGVsZW07XG5cdH0gZWxzZSBpZiAoZWxlbSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG5cdFx0cmV0dXJuIG5ldyB6QXJyYXkoZWxlbSk7XG5cdH0gZWxzZSBpZiAoZWxlbSA9PT0gdW5kZWZpbmVkIHx8IGVsZW0gPT09IG51bGwpIHtcblx0XHRyZXR1cm4gbmV3IHpBcnJheSgpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBlbGVtICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIGlzIGludmFsaWRcIik7XG5cdH1cblxuXHRpZiAoc2NvcGUpIHtcblx0XHRpZiAoIV9jaGVja1ZhbGlkRWxlbWVudChzY29wZSkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgaXMgaW52YWxpZFwiKTtcblx0XHR9XG5cblx0XHRzY29wZSA9IHooc2NvcGUpO1xuXHR9IGVsc2Uge1xuXHRcdHNjb3BlID0gX2RvY3VtZW50O1xuXHR9XG5cblx0cmV0dXJuIF9maW5kKHNjb3BlLCBlbGVtKTtcbn1cblxudHJ5IHtcblx0aWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcblxuXHRpZnJhbWUuc3R5bGUud2lkdGhcdFx0XHQ9IDA7XG5cdGlmcmFtZS5zdHlsZS5oZWlnaHRcdFx0XHQ9IDA7XG5cdGlmcmFtZS5zdHlsZS5ib3JkZXJTdHlsZVx0PSBcIm5vbmVcIjtcblxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG5cblx0ekFycmF5ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuQXJyYXk7XG5cblx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xufSBjYXRjaCAoZSkge1xuXHR6QXJyYXkgPSBBcnJheTtcbn1cblxuLy93aW5kb3cuJFx0PSB6O1xud2luZG93LnpcdD0gejtcbnouZm5cdFx0PSB6QXJyYXkucHJvdG90eXBlO1xuX3dpbmRvd1x0XHQ9IHood2luZG93KTtcbl9kb2N1bWVudFx0PSB6KGRvY3VtZW50KTtcblxuei5mbi5maW5kID0gZnVuY3Rpb24gKHN0ckVsZW0pIHtcblx0aWYgKHR5cGVvZiBzdHJFbGVtICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1hdGVyIG9mIHojZmluZCgpIHNob3VsZCBiZSBhIHN0cmluZ1wiKTtcblx0fVxuXG5cdHJldHVybiBfZmluZCh0aGlzLCBzdHJFbGVtKTtcbn07IiwiaWYgKFwiZGF0YXNldFwiIGluIGRvY3VtZW50LmJvZHkpIHtcblx0ei5mbi5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0XHR2YXIgaSwgbDtcblxuXHRcdGlmICghdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzWzBdLmRhdGFzZXQ7XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1swXS5kYXRhc2V0W2tleV07XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmRhdGFzZXRba2V5XSA9IHZhbHVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufSBlbHNlIHtcblx0ei5mbi5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0XHR2YXIgaSwgbCxcblx0XHRcdGRhdGFLZXkgPSBcImRhdGEtXCIgKyAoa2V5IHx8IFwiXCIpO1xuXG5cdFx0aWYgKCF0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aSA9IHt9O1xuXG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwodGhpc1swXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xuXHRcdFx0XHRyZXR1cm4gaVthdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9IGVsc2UgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzWzBdLmF0dHJpYnV0ZXNbZGF0YUtleV07XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmRhdGFzZXRbZGF0YUtleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcbn1cbiIsInouZm4ub24gPSB6LmZuLmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb24oZXZlbnRUeXBlLCBmbikge1xuXHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmbiwgZmFsc2UpO1xufSk7XG5cbnouZm4ub2ZmID0gei5mbi51bmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb2ZmKGV2ZW50VHlwZSwgZm4pIHtcblx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcbn0pO1xuXG56LmZuLnRyaWdnZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBkYXRhKSB7XG5cdHZhciBldmVudCwgX2RhdGEsXG5cdFx0aSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdHRyeSB7XG5cdFx0X2RhdGFcdD0gZGF0YSA/IHtkZXRhaWw6IGRhdGF9IDogdW5kZWZpbmVkO1xuXHRcdGV2ZW50XHQ9IG5ldyBDdXN0b21FdmVudChldmVudFR5cGUsIF9kYXRhKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0ZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcblx0XHRldmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnRUeXBlLCB0cnVlLCB0cnVlLCBkYXRhKTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcbiIsImZ1bmN0aW9uIF9pc1dpdGhGdW5jdGlvbihlbGVtLCBmbikge1xuXHRyZXR1cm4gZm4uY2FsbChlbGVtLCBlbGVtKTtcbn1cblxuZnVuY3Rpb24gX2lzV2l0aEVsZW1lbnQoZWxlbTEsIGVsZW0yKSB7XG5cdHJldHVybiBlbGVtMSA9PT0gZWxlbTI7XG59XG5cbnouZm4uaXMgPSAoZnVuY3Rpb24gX2lzKCkge1xuXHR2YXIgbWF0Y2hlcyxcblx0XHRib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuXHRtYXRjaGVzXHQ9IGJvZHkubWF0Y2hlcyB8fCBib2R5Lm1hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm1zTWF0Y2hlc1NlbGVjdG9yO1xuXHRtYXRjaGVzID0gbWF0Y2hlcyB8fCBib2R5Lm1vek1hdGNoZXNTZWxlY3RvciB8fCBib2R5LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm9NYXRjaGVzU2VsZWN0b3I7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuXHRcdHZhciBfaXNXaXRoLCByZXQsXG5cdFx0XHRpXHQ9IDAsXG5cdFx0XHRsXHQ9IHRoaXMubGVuZ3RoO1xuXG5cdFx0c3dpdGNoICh0eXBlb2Ygc2VsZWN0b3IpIHtcblx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcblx0XHRcdFx0X2lzV2l0aCA9IG1hdGNoZXM7XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRnVuY3Rpb247XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0XHRpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuXHRcdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IF9pc1dpdGgodGhpc1tpXSwgc2VsZWN0b3IpO1xuXG5cdFx0XHRpZiAocmV0KSB7XG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufSkoKTtcbiIsInouZm4uaGlkZSA9IF9lYWNoKGZ1bmN0aW9uIGhpZGUoKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLnNob3cgPSBfZWFjaChmdW5jdGlvbiBzaG93KCkge1xuXHR0aGlzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLmNsb25lID0gZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGkgPSAwO1xuXG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQgfHwgZGVlcCA9PT0gbnVsbCkge1xuXHRcdGRlZXAgPSBmYWxzZTtcblx0fVxuXG5cdGZvciAoOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXNbaV0gPSB0aGlzW2ldLmNsb25lTm9kZShkZWVwKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5odG1sID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXJIVE1MO1xuXHR9XG5cblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbm5lckhUTUwgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi50ZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dENvbnRlbnQ7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLnRleHRDb250ZW50ID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4uZ2V0QXR0ciA9IGZ1bmN0aW9uIChrZXkpIHtcblx0aWYgKCFrZXkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNnZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXNbMF0gJiYgdGhpc1swXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn07XG5cbnouZm4uc2V0QXR0ciA9IF9lYWNoKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdGlmICgha2V5KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojc2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcblx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcblx0cmV0dXJuIHRoaXM7XG59KTtcblxuei5mbi5hdHRyID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRyKGtleSk7XG5cdH1cblxuXHR0aGlzLnNldEF0dHIoa2V5LCB2YWx1ZSk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5yZXBsYWNlV2l0aCA9IHouZm4ucmVwbGFjZSA9IF9lYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3JlcGxhY2UgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLm91dGVySFRNTCA9IHZhbHVlO1xufSk7XG5cbmlmIChcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0fSk7XG5cblx0ei5mbi50b2dnbGVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHRpZiAoZm9yY2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jbGFzc0xpc3RbZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIl0oY2xhc3NOYW1lKTtcblx0fSk7XG59IGVsc2Uge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTmFtZSArPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxcYilcIiArIGNsYXNzTmFtZSArIFwiKFxcXFxifCQpXCIsIFwiZ1wiKSwgXCIgXCIpO1xuXHR9KTtcblxuXHR6LmZuLnRvZ2dsZUNsYXNzID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHR0aGlzW2ZvcmNlID8gXCJhZGRDbGFzc1wiIDogXCJyZW1vdmVDbGFzc1wiXShjbGFzc05hbWUpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG56LmZuLmFwcGVuZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgaSwgbDtcblxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiB0aGlzLmlubmVySFRNTDtcblx0fVxuXG5cdGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh2YWx1ZSkpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59XG4iLCJ2YXIgX3NlbGVjdG9yc0NhY2hlLFxuXHRfc2VsZWN0b3JzID0ge307XG5cbmZ1bmN0aW9uIF9maW5kKHNjb3BlLCBzdHJFbGVtKSB7XG5cdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBfZmluZEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdHJldC5wdXNoLmFwcGx5KHJldCwgX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSk7XG5cdH0pO1xuXG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9zZWxlY3Qoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHRpZiAoIX5zdHJFbGVtLmluZGV4T2YoXCI6XCIpIHx8IF9zZWxlY3RvcnNDYWNoZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdGlmIChfc2VsZWN0b3JzQ2FjaGUgPT09IGZhbHNlKSB7XG5cdFx0X2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKTtcblx0fVxuXG5cdGlmICghc3RyRWxlbS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdHJldHVybiBfc2VsZWN0MihzY29wZWRFbGVtLCBzdHJFbGVtKTtcbn1cblxuZnVuY3Rpb24gX3NlbGVjdDIoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHR2YXIgZW50cnksIHNlbGVjdG9ycyxcblx0XHRzY29wZVx0PSBuZXcgekFycmF5KHNjb3BlZEVsZW0pLFxuXHRcdGN1cnJlbnRcdD0gXCJcIixcblx0XHRlbnRyaWVzXHQ9IHN0ckVsZW0uc3BsaXQoL1xccysvKTtcblxuXHR3aGlsZSAoZW50cnkgPSBlbnRyaWVzLnNoaWZ0KCkpIHtcblx0XHRzZWxlY3RvcnMgPSBlbnRyeS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpO1xuXG5cdFx0aWYgKCFzZWxlY3RvcnMpIHtcblx0XHRcdGN1cnJlbnQgKz0gZW50cnkgKyBcIiBcIjtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGN1cnJlbnRcdCs9IGVudHJ5LnJlcGxhY2UoX3NlbGVjdG9yc0NhY2hlLCBcIlwiKSB8fCBcIipcIjtcblx0XHRlbnRyeVx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIF9zZWxlY3RGb3JFYWNoKHNjb3BlZEVsZW0pIHtcblx0XHRcdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0XHRcdHNlbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIHNlbGVjdG9yc0ZvckVhY2goc2VsZWN0b3IpIHtcblx0XHRcdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0b3JzW3NlbGVjdG9yXS5jYWxsKHNjb3BlZEVsZW0sIGN1cnJlbnQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCByZXQpO1xuXHRcdH0pO1xuXG5cdFx0c2NvcGVcdD0gZW50cnk7XG5cdFx0Y3VycmVudFx0PSBcIlwiO1xuXHR9XG5cblx0aWYgKGN1cnJlbnQpIHtcblx0XHRlbnRyeSA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gY3VycmVudEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdFx0ZW50cnkucHVzaC5hcHBseShlbnRyeSwgc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKGN1cnJlbnQpKTtcblx0XHR9KTtcblxuXHRcdHNjb3BlID0gZW50cnk7XG5cdH1cblxuXHRyZXR1cm4gc2NvcGU7XG59XG5cbmZ1bmN0aW9uIF9nZW5lcmF0ZVNlbGVjdG9yc0NhY2hlKCkge1xuXHR2YXIgc2VsZWN0b3JzXHQ9IE9iamVjdC5rZXlzKF9zZWxlY3RvcnMpLmpvaW4oXCJ8XCIpLnJlcGxhY2UoLzovZywgXCJcIik7XG5cdF9zZWxlY3RvcnNDYWNoZVx0PSBuZXcgUmVnRXhwKFwiOihcIiArIHNlbGVjdG9ycyArIFwiKVwiLCBcImdcIik7XG59XG4iLCJ6LnJlZ2lzdGVyU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGZuKSB7XG5cdGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojcmVnaXN0ZXJTZWxlY3RvciBtdXN0IGJlIGEgc3RyaW5nIHNlbGVjdG9yXCIpO1xuXHR9IGVsc2UgaWYgKCFmbiB8fCB0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcblx0fVxuXG5cdGlmIChzZWxlY3RvclswXSAhPT0gXCI6XCIpIHtcblx0XHRzZWxlY3RvciA9IFwiOlwiICsgc2VsZWN0b3I7XG5cdH1cblxuXHRfc2VsZWN0b3JzQ2FjaGVcdFx0XHQ9IGZhbHNlO1xuXHRfc2VsZWN0b3JzW3NlbGVjdG9yXVx0PSBmbjtcbn07XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjpmaXJzdFwiLCBmdW5jdGlvbiBzZWxlY3RvckZpcnN0KHF1ZXJ5KSB7XG5cdHJldHVybiB6KHRoaXMucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xufSk7XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjppbnB1dFwiLCAoZnVuY3Rpb24gc2VsZWN0b3JGaXJzdCgpIHtcblx0dmFyIHRhZ3MgPSBcIklOUFVULFRFWFRBUkVBLFNFTEVDVCxCVVRUT05cIi5zcGxpdChcIixcIik7XG5cblx0ZnVuY3Rpb24gZmlsdGVyKGVsZW1lbnQpIHtcblx0XHRyZXR1cm4gfnRhZ3MuaW5kZXhPZihlbGVtZW50LnRhZ05hbWUpO1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uIHNlbGVjdG9ySW5wdXQocXVlcnkpIHtcblx0XHR2YXIgZWxlbWVudHMgPSBuZXcgekFycmF5KCk7XG5cblx0XHRlbGVtZW50cy5wdXNoLmFwcGx5KGVsZW1lbnRzLCBbXS5maWx0ZXIuY2FsbCh0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLCBmaWx0ZXIpKTtcblxuXHRcdHJldHVybiBlbGVtZW50cztcblx0fTtcbn0pKCkpO1xuIiwiei5mbi5wYXJlbnQgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLnBhcmVudE5vZGU7XG59KTtcblxuei5mbi5uZXh0ID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5uZXh0RWxlbWVudFNpYmxpbmc7XG59KTtcblxuei5mbi5wcmV2ID0gei5mbi5wcmV2aW91cyA9IF9lYWNoTmV3KGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMucHJldmlvdXNFbGVtZW50U2libGluZztcbn0pO1xuXG56LmZuLnNpYmxpbmdzID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gW10uZmlsdGVyLmNhbGwodGhpcy5wYXJlbnROb2RlLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuXHRcdHJldHVybiBjaGlsZCAhPT0gdGhpcztcblx0fSwgdGhpcyk7XG59KTtcbiIsImZ1bmN0aW9uIF9jaGVja1ZhbGlkRWxlbWVudChlbGVtKSB7XG5cdGlmIChlbGVtIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBfZWFjaChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgaVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aDtcblxuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRmbi5hcHBseSh0aGlzW2ldLCBhcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBfZWFjaE5ldyhmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgcmV0LFxuXHRcdFx0aVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aCxcblx0XHRcdGFyclx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gZm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblxuXHRcdFx0aWYgKHJldCkge1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXQpICYmIHJldC5sZW5ndGgpIHtcblx0XHRcdFx0XHRhcnIucHVzaC5hcHBseShhcnIsIHJldCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyLnB1c2gocmV0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnI7XG5cdH07XG59XG5cbnouZGVlcEV4dGVuZCA9IGZ1bmN0aW9uIF9leHRlbmQoZGVlcCkge1xuXHR2YXIgb2JqLCB0YXJnZXQsXG5cdFx0aSA9IDI7XG5cblx0aWYgKHR5cGVvZiBkZWVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0dGFyZ2V0XHQ9IGRlZXAgfHwge307XG5cdFx0ZGVlcFx0PSBJbmZpbml0eTtcblx0fSBlbHNlIHtcblx0XHRkZWVwXHQ9IGRlZXAgPT09IHRydWUgPyBJbmZpbml0eSA6IChkZWVwIHwgMCk7XG5cdFx0dGFyZ2V0XHQ9IGFyZ3VtZW50c1sxXSB8fCB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0b2JqID0gYXJndW1lbnRzW2ldO1xuXG5cdFx0aWYgKCFvYmopIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpZiAoZGVlcCAmJiB0eXBlb2Ygb2JqW2tleV0gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0XHRfZXh0ZW5kKGRlZXAgLSAxLCB0YXJnZXRba2V5XSwgb2JqW2tleV0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcblxuei5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XG5cdFtdLnVuc2hpZnQuY2FsbChhcmd1bWVudHMsIDApO1xuXHRyZXR1cm4gei5kZWVwRXh0ZW5kLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG56LmZuLmVhY2ggPSBfZWFjaChmdW5jdGlvbiBlYWNoKGZuKSB7XG5cdGZuLmNhbGwodGhpcywgdGhpcyk7XG5cdHJldHVybiB0aGlzO1xufSk7XG4iLCJ9KSh3aW5kb3csIGRvY3VtZW50KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==