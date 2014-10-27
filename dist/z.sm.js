/*!
 * z.js JavaScript Library v0.0.3
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2014-08-27T18:33Z
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

function noop(){}

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

var ajaxDefaults, ajaxTypes,
	ajaxMimes	= {}

ajaxDefaults = {
	method: "GET",
	requestType: "text",
	responseType: "text",
	url: window.location + "",
	query: null,
	data: null,
	setup: noop,
	success: noop,
	error: noop
};

ajaxTypes = {
	text: function (data) {
		return (data || "") + "";
	}
};

z.ajax = function (options) {
	var data,
		req = new XMLHttpRequest();

	options = z.extend({
		context: req
	}, ajaxDefaults, options);

	if (!ajaxTypes[options.requestType]) {
		throw new Error("Invalid option `requestType`");
	} else if (!ajaxTypes[options.responseType]) {
		throw new Error("Invalid option `responseType`");
	}

	if (options.query && ~["HEAD", "GET"].indexOf(options.method.toUpperCase())) {
		options.url	+= ~options.url.indexOf("?") ? "&" : "?";
		options.url	+= z.queryString(options.query);
		options.url	= options.url.replace(/(\?|&)&/g, "$1");
	}

	req.open(options.method, options.url, true);

	req.onload = function () {
		var resp;

		if (req.status >= 200 && req.status < 400) {
			resp = ajaxTypes[options.responseType].call(req, req.responseText, true);
			options.success.call(options.context, resp);
		} else {
			options.error.call(options.context, req.status, req.statusText);
		}
	};

	req.onerror = function () {
		options.error.call(options.context, req.status, req.statusText);
	};

	if (!~["HEAD", "GET"].indexOf(options.method.toUpperCase())) {
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	}

	if (options.data) {
		options.data = ajaxTypes[options.requestType].call(req, options.data, false);
	}

	options.setup.call(req, req);

	req.send(options.data);
};

ajaxDefaults.requestType	= "detect";
ajaxDefaults.responseType	= "detect";

z.registerAjaxType = function (type, mime, fn) {
	if (!fn && typeof mime === "function") {
		fn		= mime;
		mime	= false;
	}

	ajaxTypes[type] = fn;

	if (mime) {
		ajaxMimes[mime] = type;
	}
};

z.registerAjaxType("detect", function (data, isResponse) {
	var header,
		type = "text";

	if (isResponse) {
		header	= this.getResponseHeader("Content-Type") || "",
		header	= header.split(";")[0].trim();
		type	= ajaxMimes[header] || "text";
	} else {
		if (data && typeof data === "object" && data.toString === ({}).toString) {
			type = "json";
		}
	}

	return ajaxTypes[type].call(this, data, isResponse);
});

z.registerAjaxType("json", "application/json", function (data, isResponse) {
	return isResponse ? JSON.parse(data) : JSON.stringify(data);
});

z.registerAjaxType("html", "text/html", function (data, isResponse) {
	var doc, arr;

	if (!isResponse) {
		return data.outerHTML;
	}

	arr	= new zArray();
	doc = document.implementation.createHTMLDocument();

	doc.documentElement.innerHTML = data;

	arr.push.apply(arr, arr.slice.call(doc.body.children, 0));

	return arr;
});

z.registerAjaxType("xml", "text/xml", ajaxXMLParser);
z.registerAjaxType("xml", "application/xml", ajaxXMLParser);

function ajaxXMLParser(data, isResponse) {
	var parser;

	if (!isResponse) {
		parser = new XMLSerializer();
		return parser.serializeToString(data);
	}

	if (this.responseXML) {
		return this.responseXML;
	}

	parser = new DOMParser();
	return parser.parseFromString(data, "application/xml");
}

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

})(window, document);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImFqYXguanMiLCJhamF4X3R5cGVzLmpzIiwiZGF0YS5qcyIsImV2ZW50cy5qcyIsImZpbHRlcmluZy5qcyIsIm1hbmlwdWxhdGlvbi5qcyIsInNlbGVjdG9ycy5qcyIsInNlbGVjdG9yc19jdXN0b20uanMiLCJ0cmF2ZXJzaW5nLmpzIiwidXRpbHMuanMiLCJfZm9vdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JIQTtBQUNBIiwiZmlsZSI6Inouc20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIHouanMgSmF2YVNjcmlwdCBMaWJyYXJ5IHZAVkVSU0lPTlxuICogaHR0cHM6Ly9naXRodWIuY29tL05FVVJTL3ouanNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNCBORVVSUyBMTEMsIEtldmluIEouIE1hcnRpbiwgYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTkVVUlMvei5qcy9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKlxuICogRGF0ZTogQERBVEVcbiAqL1xuOyhmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xuIiwidmFyIHpBcnJheSwgX3dpbmRvdywgX2RvY3VtZW50LCBpZnJhbWU7XG5cbmZ1bmN0aW9uIHooZWxlbSwgc2NvcGUpIHtcblx0aWYgKGVsZW0gaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHRyZXR1cm4gZWxlbTtcblx0fSBlbHNlIGlmIChlbGVtIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcblx0XHRyZXR1cm4gbmV3IHpBcnJheShlbGVtKTtcblx0fSBlbHNlIGlmIChlbGVtID09PSB1bmRlZmluZWQgfHwgZWxlbSA9PT0gbnVsbCkge1xuXHRcdHJldHVybiBuZXcgekFycmF5KCk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGVsZW0gIT09IFwic3RyaW5nXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgaXMgaW52YWxpZFwiKTtcblx0fVxuXG5cdGlmIChzY29wZSkge1xuXHRcdGlmICghX2NoZWNrVmFsaWRFbGVtZW50KHNjb3BlKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xuXHRcdH1cblxuXHRcdHNjb3BlID0geihzY29wZSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NvcGUgPSBfZG9jdW1lbnQ7XG5cdH1cblxuXHRyZXR1cm4gX2ZpbmQoc2NvcGUsIGVsZW0pO1xufVxuXG5mdW5jdGlvbiBub29wKCl7fVxuXG50cnkge1xuXHRpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xuXG5cdGlmcmFtZS5zdHlsZS53aWR0aFx0XHRcdD0gMDtcblx0aWZyYW1lLnN0eWxlLmhlaWdodFx0XHRcdD0gMDtcblx0aWZyYW1lLnN0eWxlLmJvcmRlclN0eWxlXHQ9IFwibm9uZVwiO1xuXG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcblxuXHR6QXJyYXkgPSBpZnJhbWUuY29udGVudFdpbmRvdy5BcnJheTtcblxuXHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XG59IGNhdGNoIChlKSB7XG5cdHpBcnJheSA9IEFycmF5O1xufVxuXG4vL3dpbmRvdy4kXHQ9IHo7XG53aW5kb3cuelx0PSB6O1xuei5mblx0XHQ9IHpBcnJheS5wcm90b3R5cGU7XG5fd2luZG93XHRcdD0geih3aW5kb3cpO1xuX2RvY3VtZW50XHQ9IHooZG9jdW1lbnQpO1xuXG56LmZuLmZpbmQgPSBmdW5jdGlvbiAoc3RyRWxlbSkge1xuXHRpZiAodHlwZW9mIHN0ckVsZW0gIT09IFwic3RyaW5nXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWF0ZXIgb2YgeiNmaW5kKCkgc2hvdWxkIGJlIGEgc3RyaW5nXCIpO1xuXHR9XG5cblx0cmV0dXJuIF9maW5kKHRoaXMsIHN0ckVsZW0pO1xufTtcbiIsInZhciBhamF4RGVmYXVsdHMsIGFqYXhUeXBlcyxcblx0YWpheE1pbWVzXHQ9IHt9XG5cbmFqYXhEZWZhdWx0cyA9IHtcblx0bWV0aG9kOiBcIkdFVFwiLFxuXHRyZXF1ZXN0VHlwZTogXCJ0ZXh0XCIsXG5cdHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCIsXG5cdHVybDogd2luZG93LmxvY2F0aW9uICsgXCJcIixcblx0cXVlcnk6IG51bGwsXG5cdGRhdGE6IG51bGwsXG5cdHNldHVwOiBub29wLFxuXHRzdWNjZXNzOiBub29wLFxuXHRlcnJvcjogbm9vcFxufTtcblxuYWpheFR5cGVzID0ge1xuXHR0ZXh0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdHJldHVybiAoZGF0YSB8fCBcIlwiKSArIFwiXCI7XG5cdH1cbn07XG5cbnouYWpheCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdHZhciBkYXRhLFxuXHRcdHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdG9wdGlvbnMgPSB6LmV4dGVuZCh7XG5cdFx0Y29udGV4dDogcmVxXG5cdH0sIGFqYXhEZWZhdWx0cywgb3B0aW9ucyk7XG5cblx0aWYgKCFhamF4VHlwZXNbb3B0aW9ucy5yZXF1ZXN0VHlwZV0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG9wdGlvbiBgcmVxdWVzdFR5cGVgXCIpO1xuXHR9IGVsc2UgaWYgKCFhamF4VHlwZXNbb3B0aW9ucy5yZXNwb25zZVR5cGVdKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBvcHRpb24gYHJlc3BvbnNlVHlwZWBcIik7XG5cdH1cblxuXHRpZiAob3B0aW9ucy5xdWVyeSAmJiB+W1wiSEVBRFwiLCBcIkdFVFwiXS5pbmRleE9mKG9wdGlvbnMubWV0aG9kLnRvVXBwZXJDYXNlKCkpKSB7XG5cdFx0b3B0aW9ucy51cmxcdCs9IH5vcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA/IFwiJlwiIDogXCI/XCI7XG5cdFx0b3B0aW9ucy51cmxcdCs9IHoucXVlcnlTdHJpbmcob3B0aW9ucy5xdWVyeSk7XG5cdFx0b3B0aW9ucy51cmxcdD0gb3B0aW9ucy51cmwucmVwbGFjZSgvKFxcP3wmKSYvZywgXCIkMVwiKTtcblx0fVxuXG5cdHJlcS5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSk7XG5cblx0cmVxLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgcmVzcDtcblxuXHRcdGlmIChyZXEuc3RhdHVzID49IDIwMCAmJiByZXEuc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHRyZXNwID0gYWpheFR5cGVzW29wdGlvbnMucmVzcG9uc2VUeXBlXS5jYWxsKHJlcSwgcmVxLnJlc3BvbnNlVGV4dCwgdHJ1ZSk7XG5cdFx0XHRvcHRpb25zLnN1Y2Nlc3MuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlc3ApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvcHRpb25zLmVycm9yLmNhbGwob3B0aW9ucy5jb250ZXh0LCByZXEuc3RhdHVzLCByZXEuc3RhdHVzVGV4dCk7XG5cdFx0fVxuXHR9O1xuXG5cdHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHRcdG9wdGlvbnMuZXJyb3IuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlcS5zdGF0dXMsIHJlcS5zdGF0dXNUZXh0KTtcblx0fTtcblxuXHRpZiAoIX5bXCJIRUFEXCIsIFwiR0VUXCJdLmluZGV4T2Yob3B0aW9ucy5tZXRob2QudG9VcHBlckNhc2UoKSkpIHtcblx0XHRyZXEuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiKTtcblx0fVxuXG5cdGlmIChvcHRpb25zLmRhdGEpIHtcblx0XHRvcHRpb25zLmRhdGEgPSBhamF4VHlwZXNbb3B0aW9ucy5yZXF1ZXN0VHlwZV0uY2FsbChyZXEsIG9wdGlvbnMuZGF0YSwgZmFsc2UpO1xuXHR9XG5cblx0b3B0aW9ucy5zZXR1cC5jYWxsKHJlcSwgcmVxKTtcblxuXHRyZXEuc2VuZChvcHRpb25zLmRhdGEpO1xufTtcbiIsImFqYXhEZWZhdWx0cy5yZXF1ZXN0VHlwZVx0PSBcImRldGVjdFwiO1xuYWpheERlZmF1bHRzLnJlc3BvbnNlVHlwZVx0PSBcImRldGVjdFwiO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUgPSBmdW5jdGlvbiAodHlwZSwgbWltZSwgZm4pIHtcblx0aWYgKCFmbiAmJiB0eXBlb2YgbWltZSA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Zm5cdFx0PSBtaW1lO1xuXHRcdG1pbWVcdD0gZmFsc2U7XG5cdH1cblxuXHRhamF4VHlwZXNbdHlwZV0gPSBmbjtcblxuXHRpZiAobWltZSkge1xuXHRcdGFqYXhNaW1lc1ttaW1lXSA9IHR5cGU7XG5cdH1cbn07XG5cbnoucmVnaXN0ZXJBamF4VHlwZShcImRldGVjdFwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xuXHR2YXIgaGVhZGVyLFxuXHRcdHR5cGUgPSBcInRleHRcIjtcblxuXHRpZiAoaXNSZXNwb25zZSkge1xuXHRcdGhlYWRlclx0PSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1UeXBlXCIpIHx8IFwiXCIsXG5cdFx0aGVhZGVyXHQ9IGhlYWRlci5zcGxpdChcIjtcIilbMF0udHJpbSgpO1xuXHRcdHR5cGVcdD0gYWpheE1pbWVzW2hlYWRlcl0gfHwgXCJ0ZXh0XCI7XG5cdH0gZWxzZSB7XG5cdFx0aWYgKGRhdGEgJiYgdHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgJiYgZGF0YS50b1N0cmluZyA9PT0gKHt9KS50b1N0cmluZykge1xuXHRcdFx0dHlwZSA9IFwianNvblwiO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBhamF4VHlwZXNbdHlwZV0uY2FsbCh0aGlzLCBkYXRhLCBpc1Jlc3BvbnNlKTtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJqc29uXCIsIFwiYXBwbGljYXRpb24vanNvblwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xuXHRyZXR1cm4gaXNSZXNwb25zZSA/IEpTT04ucGFyc2UoZGF0YSkgOiBKU09OLnN0cmluZ2lmeShkYXRhKTtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJodG1sXCIsIFwidGV4dC9odG1sXCIsIGZ1bmN0aW9uIChkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHZhciBkb2MsIGFycjtcblxuXHRpZiAoIWlzUmVzcG9uc2UpIHtcblx0XHRyZXR1cm4gZGF0YS5vdXRlckhUTUw7XG5cdH1cblxuXHRhcnJcdD0gbmV3IHpBcnJheSgpO1xuXHRkb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoKTtcblxuXHRkb2MuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IGRhdGE7XG5cblx0YXJyLnB1c2guYXBwbHkoYXJyLCBhcnIuc2xpY2UuY2FsbChkb2MuYm9keS5jaGlsZHJlbiwgMCkpO1xuXG5cdHJldHVybiBhcnI7XG59KTtcblxuei5yZWdpc3RlckFqYXhUeXBlKFwieG1sXCIsIFwidGV4dC94bWxcIiwgYWpheFhNTFBhcnNlcik7XG56LnJlZ2lzdGVyQWpheFR5cGUoXCJ4bWxcIiwgXCJhcHBsaWNhdGlvbi94bWxcIiwgYWpheFhNTFBhcnNlcik7XG5cbmZ1bmN0aW9uIGFqYXhYTUxQYXJzZXIoZGF0YSwgaXNSZXNwb25zZSkge1xuXHR2YXIgcGFyc2VyO1xuXG5cdGlmICghaXNSZXNwb25zZSkge1xuXHRcdHBhcnNlciA9IG5ldyBYTUxTZXJpYWxpemVyKCk7XG5cdFx0cmV0dXJuIHBhcnNlci5zZXJpYWxpemVUb1N0cmluZyhkYXRhKTtcblx0fVxuXG5cdGlmICh0aGlzLnJlc3BvbnNlWE1MKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVzcG9uc2VYTUw7XG5cdH1cblxuXHRwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG5cdHJldHVybiBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKGRhdGEsIFwiYXBwbGljYXRpb24veG1sXCIpO1xufVxuIiwiaWYgKFwiZGF0YXNldFwiIGluIGRvY3VtZW50LmJvZHkpIHtcblx0ei5mbi5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0XHR2YXIgaSwgbDtcblxuXHRcdGlmICghdGhpcy5sZW5ndGgpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzWzBdLmRhdGFzZXQ7XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1swXS5kYXRhc2V0W2tleV07XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmRhdGFzZXRba2V5XSA9IHZhbHVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufSBlbHNlIHtcblx0ei5mbi5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0XHR2YXIgaSwgbCxcblx0XHRcdGRhdGFLZXkgPSBcImRhdGEtXCIgKyAoa2V5IHx8IFwiXCIpO1xuXG5cdFx0aWYgKCF0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0aSA9IHt9O1xuXG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwodGhpc1swXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xuXHRcdFx0XHRyZXR1cm4gaVthdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9IGVsc2UgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzWzBdLmF0dHJpYnV0ZXNbZGF0YUtleV07XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmRhdGFzZXRbZGF0YUtleV0gPSB2YWx1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcbn1cbiIsInouZm4ub24gPSB6LmZuLmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb24oZXZlbnRUeXBlLCBmbikge1xuXHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmbiwgZmFsc2UpO1xufSk7XG5cbnouZm4ub2ZmID0gei5mbi51bmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb2ZmKGV2ZW50VHlwZSwgZm4pIHtcblx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcbn0pO1xuXG56LmZuLnRyaWdnZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBkYXRhKSB7XG5cdHZhciBldmVudCwgX2RhdGEsXG5cdFx0aSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdHRyeSB7XG5cdFx0X2RhdGFcdD0gZGF0YSA/IHtkZXRhaWw6IGRhdGF9IDogdW5kZWZpbmVkO1xuXHRcdGV2ZW50XHQ9IG5ldyBDdXN0b21FdmVudChldmVudFR5cGUsIF9kYXRhKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0ZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcblx0XHRldmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnRUeXBlLCB0cnVlLCB0cnVlLCBkYXRhKTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcbiIsImZ1bmN0aW9uIF9pc1dpdGhGdW5jdGlvbihlbGVtLCBmbikge1xuXHRyZXR1cm4gZm4uY2FsbChlbGVtLCBlbGVtKTtcbn1cblxuZnVuY3Rpb24gX2lzV2l0aEVsZW1lbnQoZWxlbTEsIGVsZW0yKSB7XG5cdHJldHVybiBlbGVtMSA9PT0gZWxlbTI7XG59XG5cbnouZm4uaXMgPSAoZnVuY3Rpb24gX2lzKCkge1xuXHR2YXIgbWF0Y2hlcyxcblx0XHRib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuXHRtYXRjaGVzXHQ9IGJvZHkubWF0Y2hlcyB8fCBib2R5Lm1hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm1zTWF0Y2hlc1NlbGVjdG9yO1xuXHRtYXRjaGVzID0gbWF0Y2hlcyB8fCBib2R5Lm1vek1hdGNoZXNTZWxlY3RvciB8fCBib2R5LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm9NYXRjaGVzU2VsZWN0b3I7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuXHRcdHZhciBfaXNXaXRoLCByZXQsXG5cdFx0XHRpXHQ9IDAsXG5cdFx0XHRsXHQ9IHRoaXMubGVuZ3RoO1xuXG5cdFx0c3dpdGNoICh0eXBlb2Ygc2VsZWN0b3IpIHtcblx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcblx0XHRcdFx0X2lzV2l0aCA9IG1hdGNoZXM7XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRnVuY3Rpb247XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0XHRpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuXHRcdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IF9pc1dpdGgodGhpc1tpXSwgc2VsZWN0b3IpO1xuXG5cdFx0XHRpZiAocmV0KSB7XG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufSkoKTtcbiIsInouZm4uaGlkZSA9IF9lYWNoKGZ1bmN0aW9uIGhpZGUoKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLnNob3cgPSBfZWFjaChmdW5jdGlvbiBzaG93KCkge1xuXHR0aGlzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLmNsb25lID0gZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGkgPSAwO1xuXG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQgfHwgZGVlcCA9PT0gbnVsbCkge1xuXHRcdGRlZXAgPSBmYWxzZTtcblx0fVxuXG5cdGZvciAoOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXNbaV0gPSB0aGlzW2ldLmNsb25lTm9kZShkZWVwKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5odG1sID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXJIVE1MO1xuXHR9XG5cblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbm5lckhUTUwgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi50ZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dENvbnRlbnQ7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLnRleHRDb250ZW50ID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4uZ2V0QXR0ciA9IGZ1bmN0aW9uIChrZXkpIHtcblx0aWYgKCFrZXkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNnZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXNbMF0gJiYgdGhpc1swXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn07XG5cbnouZm4uc2V0QXR0ciA9IF9lYWNoKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdGlmICgha2V5KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojc2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcblx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcblx0cmV0dXJuIHRoaXM7XG59KTtcblxuei5mbi5hdHRyID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRyKGtleSk7XG5cdH1cblxuXHR0aGlzLnNldEF0dHIoa2V5LCB2YWx1ZSk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5yZXBsYWNlV2l0aCA9IHouZm4ucmVwbGFjZSA9IF9lYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3JlcGxhY2UgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLm91dGVySFRNTCA9IHZhbHVlO1xufSk7XG5cbmlmIChcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0fSk7XG5cblx0ei5mbi50b2dnbGVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHRpZiAoZm9yY2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jbGFzc0xpc3RbZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIl0oY2xhc3NOYW1lKTtcblx0fSk7XG59IGVsc2Uge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTmFtZSArPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxcYilcIiArIGNsYXNzTmFtZSArIFwiKFxcXFxifCQpXCIsIFwiZ1wiKSwgXCIgXCIpO1xuXHR9KTtcblxuXHR6LmZuLnRvZ2dsZUNsYXNzID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHR0aGlzW2ZvcmNlID8gXCJhZGRDbGFzc1wiIDogXCJyZW1vdmVDbGFzc1wiXShjbGFzc05hbWUpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuIiwidmFyIF9zZWxlY3RvcnNDYWNoZSxcblx0X3NlbGVjdG9ycyA9IHt9O1xuXG5mdW5jdGlvbiBfZmluZChzY29wZSwgc3RyRWxlbSkge1xuXHR2YXIgcmV0ID0gbmV3IHpBcnJheSgpO1xuXG5cdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gX2ZpbmRGb3JFYWNoKHNjb3BlZEVsZW0pIHtcblx0XHRyZXQucHVzaC5hcHBseShyZXQsIF9zZWxlY3Qoc2NvcGVkRWxlbSwgc3RyRWxlbSkpO1xuXHR9KTtcblxuXHRyZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfc2VsZWN0KHNjb3BlZEVsZW0sIHN0ckVsZW0pIHtcblx0aWYgKCF+c3RyRWxlbS5pbmRleE9mKFwiOlwiKSB8fCBfc2VsZWN0b3JzQ2FjaGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoc3RyRWxlbSk7XG5cdH1cblxuXHRpZiAoX3NlbGVjdG9yc0NhY2hlID09PSBmYWxzZSkge1xuXHRcdF9nZW5lcmF0ZVNlbGVjdG9yc0NhY2hlKCk7XG5cdH1cblxuXHRpZiAoIXN0ckVsZW0ubWF0Y2goX3NlbGVjdG9yc0NhY2hlKSkge1xuXHRcdHJldHVybiBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoc3RyRWxlbSk7XG5cdH1cblxuXHRyZXR1cm4gX3NlbGVjdDIoc2NvcGVkRWxlbSwgc3RyRWxlbSk7XG59XG5cbmZ1bmN0aW9uIF9zZWxlY3QyKHNjb3BlZEVsZW0sIHN0ckVsZW0pIHtcblx0dmFyIGVudHJ5LCBzZWxlY3RvcnMsXG5cdFx0c2NvcGVcdD0gbmV3IHpBcnJheShzY29wZWRFbGVtKSxcblx0XHRjdXJyZW50XHQ9IFwiXCIsXG5cdFx0ZW50cmllc1x0PSBzdHJFbGVtLnNwbGl0KC9cXHMrLyk7XG5cblx0d2hpbGUgKGVudHJ5ID0gZW50cmllcy5zaGlmdCgpKSB7XG5cdFx0c2VsZWN0b3JzID0gZW50cnkubWF0Y2goX3NlbGVjdG9yc0NhY2hlKTtcblxuXHRcdGlmICghc2VsZWN0b3JzKSB7XG5cdFx0XHRjdXJyZW50ICs9IGVudHJ5ICsgXCIgXCI7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRjdXJyZW50XHQrPSBlbnRyeS5yZXBsYWNlKF9zZWxlY3RvcnNDYWNoZSwgXCJcIikgfHwgXCIqXCI7XG5cdFx0ZW50cnlcdD0gbmV3IHpBcnJheSgpO1xuXG5cdFx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBfc2VsZWN0Rm9yRWFjaChzY29wZWRFbGVtKSB7XG5cdFx0XHR2YXIgcmV0ID0gbmV3IHpBcnJheSgpO1xuXG5cdFx0XHRzZWxlY3RvcnMuZm9yRWFjaChmdW5jdGlvbiBzZWxlY3RvcnNGb3JFYWNoKHNlbGVjdG9yKSB7XG5cdFx0XHRcdHJldC5wdXNoLmFwcGx5KHJldCwgX3NlbGVjdG9yc1tzZWxlY3Rvcl0uY2FsbChzY29wZWRFbGVtLCBjdXJyZW50KSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0ZW50cnkucHVzaC5hcHBseShlbnRyeSwgcmV0KTtcblx0XHR9KTtcblxuXHRcdHNjb3BlXHQ9IGVudHJ5O1xuXHRcdGN1cnJlbnRcdD0gXCJcIjtcblx0fVxuXG5cdGlmIChjdXJyZW50KSB7XG5cdFx0ZW50cnkgPSBuZXcgekFycmF5KCk7XG5cblx0XHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIGN1cnJlbnRGb3JFYWNoKHNjb3BlZEVsZW0pIHtcblx0XHRcdGVudHJ5LnB1c2guYXBwbHkoZW50cnksIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChjdXJyZW50KSk7XG5cdFx0fSk7XG5cblx0XHRzY29wZSA9IGVudHJ5O1xuXHR9XG5cblx0cmV0dXJuIHNjb3BlO1xufVxuXG5mdW5jdGlvbiBfZ2VuZXJhdGVTZWxlY3RvcnNDYWNoZSgpIHtcblx0dmFyIHNlbGVjdG9yc1x0PSBPYmplY3Qua2V5cyhfc2VsZWN0b3JzKS5qb2luKFwifFwiKS5yZXBsYWNlKC86L2csIFwiXCIpO1xuXHRfc2VsZWN0b3JzQ2FjaGVcdD0gbmV3IFJlZ0V4cChcIjooXCIgKyBzZWxlY3RvcnMgKyBcIilcIiwgXCJnXCIpO1xufVxuIiwiei5yZWdpc3RlclNlbGVjdG9yID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBmbikge1xuXHRpZiAoIXNlbGVjdG9yIHx8IHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3JlZ2lzdGVyU2VsZWN0b3IgbXVzdCBiZSBhIHN0cmluZyBzZWxlY3RvclwiKTtcblx0fSBlbHNlIGlmICghZm4gfHwgdHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIG9mIHojcmVnaXN0ZXJTZWxlY3RvciBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG5cdH1cblxuXHRpZiAoc2VsZWN0b3JbMF0gIT09IFwiOlwiKSB7XG5cdFx0c2VsZWN0b3IgPSBcIjpcIiArIHNlbGVjdG9yO1xuXHR9XG5cblx0X3NlbGVjdG9yc0NhY2hlXHRcdFx0PSBmYWxzZTtcblx0X3NlbGVjdG9yc1tzZWxlY3Rvcl1cdD0gZm47XG59O1xuXG56LnJlZ2lzdGVyU2VsZWN0b3IoXCI6Zmlyc3RcIiwgZnVuY3Rpb24gc2VsZWN0b3JGaXJzdChxdWVyeSkge1xuXHRyZXR1cm4geih0aGlzLnF1ZXJ5U2VsZWN0b3IocXVlcnkpKTtcbn0pO1xuXG56LnJlZ2lzdGVyU2VsZWN0b3IoXCI6aW5wdXRcIiwgKGZ1bmN0aW9uIHNlbGVjdG9yRmlyc3QoKSB7XG5cdHZhciB0YWdzID0gXCJJTlBVVCxURVhUQVJFQSxTRUxFQ1QsQlVUVE9OXCIuc3BsaXQoXCIsXCIpO1xuXG5cdGZ1bmN0aW9uIGZpbHRlcihlbGVtZW50KSB7XG5cdFx0cmV0dXJuIH50YWdzLmluZGV4T2YoZWxlbWVudC50YWdOYW1lKTtcblx0fVxuXG5cdHJldHVybiBmdW5jdGlvbiBzZWxlY3RvcklucHV0KHF1ZXJ5KSB7XG5cdFx0dmFyIGVsZW1lbnRzID0gbmV3IHpBcnJheSgpO1xuXG5cdFx0ZWxlbWVudHMucHVzaC5hcHBseShlbGVtZW50cywgW10uZmlsdGVyLmNhbGwodGhpcy5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSwgZmlsdGVyKSk7XG5cblx0XHRyZXR1cm4gZWxlbWVudHM7XG5cdH07XG59KSgpKTtcbiIsInouZm4ucGFyZW50ID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5wYXJlbnROb2RlO1xufSk7XG5cbnouZm4ubmV4dCA9IF9lYWNoTmV3KGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMubmV4dEVsZW1lbnRTaWJsaW5nO1xufSk7XG5cbnouZm4ucHJldiA9IHouZm4ucHJldmlvdXMgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG59KTtcblxuei5mbi5zaWJsaW5ncyA9IF9lYWNoTmV3KGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIFtdLmZpbHRlci5jYWxsKHRoaXMucGFyZW50Tm9kZS5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRyZXR1cm4gY2hpbGQgIT09IHRoaXM7XG5cdH0sIHRoaXMpO1xufSk7XG4iLCJmdW5jdGlvbiBfY2hlY2tWYWxpZEVsZW1lbnQoZWxlbSkge1xuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKGVsZW0gaW5zdGFuY2VvZiBFdmVudFRhcmdldCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gX2VhY2goZm4pIHtcblx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkVhY2goKSB7XG5cdFx0dmFyIGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGg7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Zm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcbn1cblxuZnVuY3Rpb24gX2VhY2hOZXcoZm4pIHtcblx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkVhY2goKSB7XG5cdFx0dmFyIHJldCxcblx0XHRcdGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGgsXG5cdFx0XHRhcnJcdD0gbmV3IHpBcnJheSgpO1xuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IGZuLmFwcGx5KHRoaXNbaV0sIGFyZ3VtZW50cyk7XG5cblx0XHRcdGlmIChyZXQpIHtcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocmV0KSAmJiByZXQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0YXJyLnB1c2guYXBwbHkoYXJyLCByZXQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFyci5wdXNoKHJldCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9O1xufVxuXG56LmRlZXBFeHRlbmQgPSBmdW5jdGlvbiBfZXh0ZW5kKGRlZXApIHtcblx0dmFyIG9iaiwgdGFyZ2V0LFxuXHRcdGkgPSAyO1xuXG5cdGlmICh0eXBlb2YgZGVlcCA9PT0gXCJvYmplY3RcIikge1xuXHRcdHRhcmdldFx0PSBkZWVwIHx8IHt9O1xuXHRcdGRlZXBcdD0gSW5maW5pdHk7XG5cdH0gZWxzZSB7XG5cdFx0ZGVlcFx0PSBkZWVwID09PSB0cnVlID8gSW5maW5pdHkgOiAoZGVlcCB8IDApO1xuXHRcdHRhcmdldFx0PSBhcmd1bWVudHNbMV0gfHwge307XG5cdH1cblxuXHRmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdG9iaiA9IGFyZ3VtZW50c1tpXTtcblxuXHRcdGlmICghb2JqKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aWYgKGRlZXAgJiYgdHlwZW9mIG9ialtrZXldID09PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRcdFx0X2V4dGVuZChkZWVwIC0gMSwgdGFyZ2V0W2tleV0sIG9ialtrZXldKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcmdldDtcbn07XG5cbnouZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xuXHRbXS51bnNoaWZ0LmNhbGwoYXJndW1lbnRzLCAwKTtcblx0cmV0dXJuIHouZGVlcEV4dGVuZC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xufTtcblxuei5mbi5lYWNoID0gX2VhY2goZnVuY3Rpb24gZWFjaChmbikge1xuXHRmbi5jYWxsKHRoaXMsIHRoaXMpO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LnF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKG9iaiwgcHJlZml4KSB7XG5cdHZhciBpLCBrZXksIHZhbCxcblx0XHRzdHJpbmdzID0gW107XG5cblx0Zm9yIChpIGluIG9iaikge1xuXHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdGlmIChwcmVmaXgpIHtcblx0XHRcdFx0a2V5ID0gcHJlZml4ICsgXCJbXCIgKyBpICsgXCJdXCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRrZXkgPSBpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YWwgPSBvYmpbaV07XG5cblx0XHRcdGlmICh2YWwgJiYgdHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0XHRzdHJpbmdzLnB1c2goei5xdWVyeVN0cmluZyh2YWwsIGtleSkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0c3RyaW5ncy5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHN0cmluZ3Muam9pbihcIiZcIik7XG59O1xuIiwifSkod2luZG93LCBkb2N1bWVudCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=