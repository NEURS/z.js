/*!
 * z.js JavaScript Library v0.0.3
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2014-09-09T18:02Z
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

z.ready = z.fn.ready = function (fn) {
    var states = ["interactive", "loaded", "complete"];

    if (~states.indexOf(document.readyState)) {
        setTimeout(fn, 0);
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }

    return this;
};

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
				strings.push(queryString(val, key));
			} else {
				strings.push(encodeURIComponent(key) + "=" + encodeURIComponent(val));
			}
		}
	}

	return strings.join("&");
};

})(window, document);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImFqYXguanMiLCJhamF4X3R5cGVzLmpzIiwiZGF0YS5qcyIsImV2ZW50cy5qcyIsImZpbHRlcmluZy5qcyIsIm1hbmlwdWxhdGlvbi5qcyIsInNlbGVjdG9ycy5qcyIsInNlbGVjdG9yc19jdXN0b20uanMiLCJ0cmF2ZXJzaW5nLmpzIiwidXRpbHMuanMiLCJfZm9vdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckhBO0FBQ0EiLCJmaWxlIjoiei5zbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxyXG4gKiB6LmpzIEphdmFTY3JpcHQgTGlicmFyeSB2QFZFUlNJT05cclxuICogaHR0cHM6Ly9naXRodWIuY29tL05FVVJTL3ouanNcclxuICpcclxuICogQ29weXJpZ2h0IDIwMTQgTkVVUlMgTExDLCBLZXZpbiBKLiBNYXJ0aW4sIGFuZCBvdGhlciBjb250cmlidXRvcnNcclxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ORVVSUy96LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcclxuICpcclxuICogRGF0ZTogQERBVEVcclxuICovXHJcbjsoZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcclxuIiwidmFyIHpBcnJheSwgX3dpbmRvdywgX2RvY3VtZW50LCBpZnJhbWU7XHJcblxyXG5mdW5jdGlvbiB6KGVsZW0sIHNjb3BlKSB7XHJcblx0aWYgKGVsZW0gaW5zdGFuY2VvZiB6QXJyYXkpIHtcclxuXHRcdHJldHVybiBlbGVtO1xyXG5cdH0gZWxzZSBpZiAoZWxlbSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XHJcblx0XHRyZXR1cm4gbmV3IHpBcnJheShlbGVtKTtcclxuXHR9IGVsc2UgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtID09PSBudWxsKSB7XHJcblx0XHRyZXR1cm4gbmV3IHpBcnJheSgpO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIGVsZW0gIT09IFwic3RyaW5nXCIpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xyXG5cdH1cclxuXHJcblx0aWYgKHNjb3BlKSB7XHJcblx0XHRpZiAoIV9jaGVja1ZhbGlkRWxlbWVudChzY29wZSkpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHNjb3BlID0geihzY29wZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHNjb3BlID0gX2RvY3VtZW50O1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIF9maW5kKHNjb3BlLCBlbGVtKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbm9vcCgpe31cclxuXHJcbnRyeSB7XHJcblx0aWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuXHJcblx0aWZyYW1lLnN0eWxlLndpZHRoXHRcdFx0PSAwO1xyXG5cdGlmcmFtZS5zdHlsZS5oZWlnaHRcdFx0XHQ9IDA7XHJcblx0aWZyYW1lLnN0eWxlLmJvcmRlclN0eWxlXHQ9IFwibm9uZVwiO1xyXG5cclxuXHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XHJcblxyXG5cdHpBcnJheSA9IGlmcmFtZS5jb250ZW50V2luZG93LkFycmF5O1xyXG5cclxuXHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcbn0gY2F0Y2ggKGUpIHtcclxuXHR6QXJyYXkgPSBBcnJheTtcclxufVxyXG5cclxuLy93aW5kb3cuJFx0PSB6O1xyXG53aW5kb3cuelx0PSB6O1xyXG56LmZuXHRcdD0gekFycmF5LnByb3RvdHlwZTtcclxuX3dpbmRvd1x0XHQ9IHood2luZG93KTtcclxuX2RvY3VtZW50XHQ9IHooZG9jdW1lbnQpO1xyXG5cclxuei5mbi5maW5kID0gZnVuY3Rpb24gKHN0ckVsZW0pIHtcclxuXHRpZiAodHlwZW9mIHN0ckVsZW0gIT09IFwic3RyaW5nXCIpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtYXRlciBvZiB6I2ZpbmQoKSBzaG91bGQgYmUgYSBzdHJpbmdcIik7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gX2ZpbmQodGhpcywgc3RyRWxlbSk7XHJcbn07XHJcbiIsInZhciBhamF4RGVmYXVsdHMsIGFqYXhUeXBlcyxcclxuXHRhamF4TWltZXNcdD0ge31cclxuXHJcbmFqYXhEZWZhdWx0cyA9IHtcclxuXHRtZXRob2Q6IFwiR0VUXCIsXHJcblx0cmVxdWVzdFR5cGU6IFwidGV4dFwiLFxyXG5cdHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCIsXHJcblx0dXJsOiB3aW5kb3cubG9jYXRpb24gKyBcIlwiLFxyXG5cdHF1ZXJ5OiBudWxsLFxyXG5cdGRhdGE6IG51bGwsXHJcblx0c2V0dXA6IG5vb3AsXHJcblx0c3VjY2Vzczogbm9vcCxcclxuXHRlcnJvcjogbm9vcFxyXG59O1xyXG5cclxuYWpheFR5cGVzID0ge1xyXG5cdHRleHQ6IGZ1bmN0aW9uIChkYXRhKSB7XHJcblx0XHRyZXR1cm4gKGRhdGEgfHwgXCJcIikgKyBcIlwiO1xyXG5cdH1cclxufTtcclxuXHJcbnouYWpheCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0dmFyIGRhdGEsXHJcblx0XHRyZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHJcblx0b3B0aW9ucyA9IHouZXh0ZW5kKHtcclxuXHRcdGNvbnRleHQ6IHJlcVxyXG5cdH0sIGFqYXhEZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG5cdGlmICghYWpheFR5cGVzW29wdGlvbnMucmVxdWVzdFR5cGVdKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG9wdGlvbiBgcmVxdWVzdFR5cGVgXCIpO1xyXG5cdH0gZWxzZSBpZiAoIWFqYXhUeXBlc1tvcHRpb25zLnJlc3BvbnNlVHlwZV0pIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgb3B0aW9uIGByZXNwb25zZVR5cGVgXCIpO1xyXG5cdH1cclxuXHJcblx0aWYgKG9wdGlvbnMucXVlcnkgJiYgfltcIkhFQURcIiwgXCJHRVRcIl0uaW5kZXhPZihvcHRpb25zLm1ldGhvZC50b1VwcGVyQ2FzZSgpKSkge1xyXG5cdFx0b3B0aW9ucy51cmxcdCs9IH5vcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA/IFwiJlwiIDogXCI/XCI7XHJcblx0XHRvcHRpb25zLnVybFx0Kz0gei5xdWVyeVN0cmluZyhvcHRpb25zLnF1ZXJ5KTtcclxuXHRcdG9wdGlvbnMudXJsXHQ9IG9wdGlvbnMudXJsLnJlcGxhY2UoLyhcXD98JikmL2csIFwiJDFcIik7XHJcblx0fVxyXG5cclxuXHRyZXEub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUpO1xyXG5cclxuXHRyZXEub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIHJlc3A7XHJcblxyXG5cdFx0aWYgKHJlcS5zdGF0dXMgPj0gMjAwICYmIHJlcS5zdGF0dXMgPCA0MDApIHtcclxuXHRcdFx0cmVzcCA9IGFqYXhUeXBlc1tvcHRpb25zLnJlc3BvbnNlVHlwZV0uY2FsbChyZXEsIHJlcS5yZXNwb25zZVRleHQsIHRydWUpO1xyXG5cdFx0XHRvcHRpb25zLnN1Y2Nlc3MuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlc3ApO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0b3B0aW9ucy5lcnJvci5jYWxsKG9wdGlvbnMuY29udGV4dCwgcmVxLnN0YXR1cywgcmVxLnN0YXR1c1RleHQpO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0b3B0aW9ucy5lcnJvci5jYWxsKG9wdGlvbnMuY29udGV4dCwgcmVxLnN0YXR1cywgcmVxLnN0YXR1c1RleHQpO1xyXG5cdH07XHJcblxyXG5cdGlmICghfltcIkhFQURcIiwgXCJHRVRcIl0uaW5kZXhPZihvcHRpb25zLm1ldGhvZC50b1VwcGVyQ2FzZSgpKSkge1xyXG5cdFx0cmVxLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIik7XHJcblx0fVxyXG5cclxuXHRpZiAob3B0aW9ucy5kYXRhKSB7XHJcblx0XHRvcHRpb25zLmRhdGEgPSBhamF4VHlwZXNbb3B0aW9ucy5yZXF1ZXN0VHlwZV0uY2FsbChyZXEsIG9wdGlvbnMuZGF0YSwgZmFsc2UpO1xyXG5cdH1cclxuXHJcblx0b3B0aW9ucy5zZXR1cC5jYWxsKHJlcSwgcmVxKTtcclxuXHJcblx0cmVxLnNlbmQob3B0aW9ucy5kYXRhKTtcclxufTtcclxuIiwiYWpheERlZmF1bHRzLnJlcXVlc3RUeXBlXHQ9IFwiZGV0ZWN0XCI7XHJcbmFqYXhEZWZhdWx0cy5yZXNwb25zZVR5cGVcdD0gXCJkZXRlY3RcIjtcclxuXHJcbnoucmVnaXN0ZXJBamF4VHlwZSA9IGZ1bmN0aW9uICh0eXBlLCBtaW1lLCBmbikge1xyXG5cdGlmICghZm4gJiYgdHlwZW9mIG1pbWUgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0Zm5cdFx0PSBtaW1lO1xyXG5cdFx0bWltZVx0PSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdGFqYXhUeXBlc1t0eXBlXSA9IGZuO1xyXG5cclxuXHRpZiAobWltZSkge1xyXG5cdFx0YWpheE1pbWVzW21pbWVdID0gdHlwZTtcclxuXHR9XHJcbn07XHJcblxyXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJkZXRlY3RcIiwgZnVuY3Rpb24gKGRhdGEsIGlzUmVzcG9uc2UpIHtcclxuXHR2YXIgaGVhZGVyLFxyXG5cdFx0dHlwZSA9IFwidGV4dFwiO1xyXG5cclxuXHRpZiAoaXNSZXNwb25zZSkge1xyXG5cdFx0aGVhZGVyXHQ9IHRoaXMuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIikgfHwgXCJcIixcclxuXHRcdGhlYWRlclx0PSBoZWFkZXIuc3BsaXQoXCI7XCIpWzBdLnRyaW0oKTtcclxuXHRcdHR5cGVcdD0gYWpheE1pbWVzW2hlYWRlcl0gfHwgXCJ0ZXh0XCI7XHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChkYXRhICYmIHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICYmIGRhdGEudG9TdHJpbmcgPT09ICh7fSkudG9TdHJpbmcpIHtcclxuXHRcdFx0dHlwZSA9IFwianNvblwiO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGFqYXhUeXBlc1t0eXBlXS5jYWxsKHRoaXMsIGRhdGEsIGlzUmVzcG9uc2UpO1xyXG59KTtcclxuXHJcbnoucmVnaXN0ZXJBamF4VHlwZShcImpzb25cIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIsIGZ1bmN0aW9uIChkYXRhLCBpc1Jlc3BvbnNlKSB7XHJcblx0cmV0dXJuIGlzUmVzcG9uc2UgPyBKU09OLnBhcnNlKGRhdGEpIDogSlNPTi5zdHJpbmdpZnkoZGF0YSk7XHJcbn0pO1xyXG5cclxuei5yZWdpc3RlckFqYXhUeXBlKFwiaHRtbFwiLCBcInRleHQvaHRtbFwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xyXG5cdHZhciBkb2MsIGFycjtcclxuXHJcblx0aWYgKCFpc1Jlc3BvbnNlKSB7XHJcblx0XHRyZXR1cm4gZGF0YS5vdXRlckhUTUw7XHJcblx0fVxyXG5cclxuXHRhcnJcdD0gbmV3IHpBcnJheSgpO1xyXG5cdGRvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgpO1xyXG5cclxuXHRkb2MuZG9jdW1lbnRFbGVtZW50LmlubmVySFRNTCA9IGRhdGE7XHJcblxyXG5cdGFyci5wdXNoLmFwcGx5KGFyciwgYXJyLnNsaWNlLmNhbGwoZG9jLmJvZHkuY2hpbGRyZW4sIDApKTtcclxuXHJcblx0cmV0dXJuIGFycjtcclxufSk7XHJcblxyXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJ4bWxcIiwgXCJ0ZXh0L3htbFwiLCBhamF4WE1MUGFyc2VyKTtcclxuei5yZWdpc3RlckFqYXhUeXBlKFwieG1sXCIsIFwiYXBwbGljYXRpb24veG1sXCIsIGFqYXhYTUxQYXJzZXIpO1xyXG5cclxuZnVuY3Rpb24gYWpheFhNTFBhcnNlcihkYXRhLCBpc1Jlc3BvbnNlKSB7XHJcblx0dmFyIHBhcnNlcjtcclxuXHJcblx0aWYgKCFpc1Jlc3BvbnNlKSB7XHJcblx0XHRwYXJzZXIgPSBuZXcgWE1MU2VyaWFsaXplcigpO1xyXG5cdFx0cmV0dXJuIHBhcnNlci5zZXJpYWxpemVUb1N0cmluZyhkYXRhKTtcclxuXHR9XHJcblxyXG5cdGlmICh0aGlzLnJlc3BvbnNlWE1MKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5yZXNwb25zZVhNTDtcclxuXHR9XHJcblxyXG5cdHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcclxuXHRyZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhkYXRhLCBcImFwcGxpY2F0aW9uL3htbFwiKTtcclxufVxyXG4iLCJpZiAoXCJkYXRhc2V0XCIgaW4gZG9jdW1lbnQuYm9keSkge1xyXG5cdHouZm4uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XHJcblx0XHR2YXIgaSwgbDtcclxuXHJcblx0XHRpZiAoIXRoaXMubGVuZ3RoKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXNbMF0uZGF0YXNldDtcclxuXHRcdH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1swXS5kYXRhc2V0W2tleV07XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRcdHRoaXNbaV0uZGF0YXNldFtrZXldID0gdmFsdWU7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxufSBlbHNlIHtcclxuXHR6LmZuLmRhdGEgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG5cdFx0dmFyIGksIGwsXHJcblx0XHRcdGRhdGFLZXkgPSBcImRhdGEtXCIgKyAoa2V5IHx8IFwiXCIpO1xyXG5cclxuXHRcdGlmICghdGhpcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRpID0ge307XHJcblxyXG5cdFx0XHRbXS5mb3JFYWNoLmNhbGwodGhpc1swXS5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAoYXR0cikge1xyXG5cdFx0XHRcdHJldHVybiBpW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBpO1xyXG5cdFx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzWzBdLmF0dHJpYnV0ZXNbZGF0YUtleV07XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRcdHRoaXNbaV0uZGF0YXNldFtkYXRhS2V5XSA9IHZhbHVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH07XHJcbn1cclxuIiwiei5mbi5vbiA9IHouZm4uYmluZCA9IF9lYWNoKGZ1bmN0aW9uIF9vbihldmVudFR5cGUsIGZuKSB7XHJcblx0dGhpcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcclxufSk7XHJcblxyXG56LmZuLm9mZiA9IHouZm4udW5iaW5kID0gX2VhY2goZnVuY3Rpb24gX29mZihldmVudFR5cGUsIGZuKSB7XHJcblx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcclxufSk7XHJcblxyXG56LnJlYWR5ID0gei5mbi5yZWFkeSA9IGZ1bmN0aW9uIChmbikge1xyXG4gICAgdmFyIHN0YXRlcyA9IFtcImludGVyYWN0aXZlXCIsIFwibG9hZGVkXCIsIFwiY29tcGxldGVcIl07XHJcblxyXG4gICAgaWYgKH5zdGF0ZXMuaW5kZXhPZihkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZm4pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuei5mbi50cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZGF0YSkge1xyXG5cdHZhciBldmVudCwgX2RhdGEsXHJcblx0XHRpID0gMCxcclxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcclxuXHJcblx0dHJ5IHtcclxuXHRcdF9kYXRhXHQ9IGRhdGEgPyB7ZGV0YWlsOiBkYXRhfSA6IHVuZGVmaW5lZDtcclxuXHRcdGV2ZW50XHQ9IG5ldyBDdXN0b21FdmVudChldmVudFR5cGUsIF9kYXRhKTtcclxuXHR9IGNhdGNoIChlcnIpIHtcclxuXHRcdGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XHJcblx0XHRldmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnRUeXBlLCB0cnVlLCB0cnVlLCBkYXRhKTtcclxuXHR9XHJcblxyXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHR0aGlzW2ldLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4iLCJmdW5jdGlvbiBfaXNXaXRoRnVuY3Rpb24oZWxlbSwgZm4pIHtcclxuXHRyZXR1cm4gZm4uY2FsbChlbGVtLCBlbGVtKTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2lzV2l0aEVsZW1lbnQoZWxlbTEsIGVsZW0yKSB7XHJcblx0cmV0dXJuIGVsZW0xID09PSBlbGVtMjtcclxufVxyXG5cclxuei5mbi5pcyA9IChmdW5jdGlvbiBfaXMoKSB7XHJcblx0dmFyIG1hdGNoZXMsXHJcblx0XHRib2R5ID0gZG9jdW1lbnQuYm9keTtcclxuXHJcblx0bWF0Y2hlc1x0PSBib2R5Lm1hdGNoZXMgfHwgYm9keS5tYXRjaGVzU2VsZWN0b3IgfHwgYm9keS5tc01hdGNoZXNTZWxlY3RvcjtcclxuXHRtYXRjaGVzID0gbWF0Y2hlcyB8fCBib2R5Lm1vek1hdGNoZXNTZWxlY3RvciB8fCBib2R5LndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm9NYXRjaGVzU2VsZWN0b3I7XHJcblxyXG5cdHJldHVybiBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuXHRcdHZhciBfaXNXaXRoLCByZXQsXHJcblx0XHRcdGlcdD0gMCxcclxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aDtcclxuXHJcblx0XHRzd2l0Y2ggKHR5cGVvZiBzZWxlY3Rvcikge1xyXG5cdFx0XHRjYXNlIFwic3RyaW5nXCI6XHJcblx0XHRcdFx0X2lzV2l0aCA9IG1hdGNoZXM7XHJcblx0XHRcdGJyZWFrO1xyXG5cclxuXHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XHJcblx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhGdW5jdGlvbjtcclxuXHRcdFx0YnJlYWs7XHJcblxyXG5cdFx0XHRjYXNlIFwib2JqZWN0XCI6XHJcblx0XHRcdFx0aWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcclxuXHRcdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRWxlbWVudDtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojaXMgaXMgaW52YWxpZFwiKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojaXMgaXMgaW52YWxpZFwiKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcclxuXHRcdFx0cmV0ID0gX2lzV2l0aCh0aGlzW2ldLCBzZWxlY3Rvcik7XHJcblxyXG5cdFx0XHRpZiAocmV0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHJldDtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9O1xyXG59KSgpO1xyXG4iLCJ6LmZuLmhpZGUgPSBfZWFjaChmdW5jdGlvbiBoaWRlKCkge1xyXG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG5cdHJldHVybiB0aGlzO1xyXG59KTtcclxuXHJcbnouZm4uc2hvdyA9IF9lYWNoKGZ1bmN0aW9uIHNob3coKSB7XHJcblx0dGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcclxuXHRyZXR1cm4gdGhpcztcclxufSk7XHJcblxyXG56LmZuLmNsb25lID0gZnVuY3Rpb24gKGRlZXApIHtcclxuXHR2YXIgaSA9IDA7XHJcblxyXG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQgfHwgZGVlcCA9PT0gbnVsbCkge1xyXG5cdFx0ZGVlcCA9IGZhbHNlO1xyXG5cdH1cclxuXHJcblx0Zm9yICg7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR0aGlzW2ldID0gdGhpc1tpXS5jbG9uZU5vZGUoZGVlcCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbnouZm4uaHRtbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdHZhciBpLCBsO1xyXG5cclxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuaW5uZXJIVE1MO1xyXG5cdH1cclxuXHJcblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHR0aGlzW2ldLmlubmVySFRNTCA9IHZhbHVlO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG56LmZuLnRleHQgPSBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHR2YXIgaSwgbDtcclxuXHJcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuXHRcdHJldHVybiB0aGlzLnRleHRDb250ZW50O1xyXG5cdH1cclxuXHJcblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHR0aGlzW2ldLnRleHRDb250ZW50ID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbnouZm4uZ2V0QXR0ciA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRpZiAoIWtleSkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojZ2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aGlzWzBdICYmIHRoaXNbMF0uZ2V0QXR0cmlidXRlKGtleSk7XHJcbn07XHJcblxyXG56LmZuLnNldEF0dHIgPSBfZWFjaChmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG5cdGlmICgha2V5KSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNzZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xyXG5cdH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XHJcblx0fVxyXG5cclxuXHR0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcclxuXHRyZXR1cm4gdGhpcztcclxufSk7XHJcblxyXG56LmZuLmF0dHIgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xyXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRyKGtleSk7XHJcblx0fVxyXG5cclxuXHR0aGlzLnNldEF0dHIoa2V5LCB2YWx1ZSk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG56LmZuLnJlcGxhY2VXaXRoID0gei5mbi5yZXBsYWNlID0gX2VhY2goZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3JlcGxhY2UgaXMgcmVxdWlyZWRcIik7XHJcblx0fVxyXG5cclxuXHR0aGlzLm91dGVySFRNTCA9IHZhbHVlO1xyXG59KTtcclxuXHJcbmlmIChcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG5cdHouZm4uYWRkQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiBhZGRDbGFzcyhjbGFzc05hbWUpIHtcclxuXHRcdHRoaXMuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xyXG5cdH0pO1xyXG5cclxuXHR6LmZuLnJlbW92ZUNsYXNzID0gX2VhY2goZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoY2xhc3NOYW1lKSB7XHJcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcclxuXHR9KTtcclxuXHJcblx0ei5mbi50b2dnbGVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgZm9yY2UpIHtcclxuXHRcdGlmIChmb3JjZSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRoaXMuY2xhc3NMaXN0LnRvZ2dsZShjbGFzc05hbWUpO1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5jbGFzc0xpc3RbZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIl0oY2xhc3NOYW1lKTtcclxuXHR9KTtcclxufSBlbHNlIHtcclxuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XHJcblx0XHR0aGlzLmNsYXNzTmFtZSArPSBcIiBcIiArIGNsYXNzTmFtZTtcclxuXHR9KTtcclxuXHJcblx0ei5mbi5yZW1vdmVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZSkge1xyXG5cdFx0dGhpcy5jbGFzc05hbWUgKz0gdGhpcy5jbGFzc05hbWUucmVwbGFjZShuZXcgUmVnRXhwKFwiKF58XFxcXGIpXCIgKyBjbGFzc05hbWUgKyBcIihcXFxcYnwkKVwiLCBcImdcIiksIFwiIFwiKTtcclxuXHR9KTtcclxuXHJcblx0ei5mbi50b2dnbGVDbGFzcyA9IGZ1bmN0aW9uIChjbGFzc05hbWUsIGZvcmNlKSB7XHJcblx0XHR0aGlzW2ZvcmNlID8gXCJhZGRDbGFzc1wiIDogXCJyZW1vdmVDbGFzc1wiXShjbGFzc05hbWUpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxufVxyXG4iLCJ2YXIgX3NlbGVjdG9yc0NhY2hlLFxyXG5cdF9zZWxlY3RvcnMgPSB7fTtcclxuXHJcbmZ1bmN0aW9uIF9maW5kKHNjb3BlLCBzdHJFbGVtKSB7XHJcblx0dmFyIHJldCA9IG5ldyB6QXJyYXkoKTtcclxuXHJcblx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBfZmluZEZvckVhY2goc2NvcGVkRWxlbSkge1xyXG5cdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0KHNjb3BlZEVsZW0sIHN0ckVsZW0pKTtcclxuXHR9KTtcclxuXHJcblx0cmV0dXJuIHJldDtcclxufVxyXG5cclxuZnVuY3Rpb24gX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSB7XHJcblx0aWYgKCF+c3RyRWxlbS5pbmRleE9mKFwiOlwiKSB8fCBfc2VsZWN0b3JzQ2FjaGUgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcclxuXHR9XHJcblxyXG5cdGlmIChfc2VsZWN0b3JzQ2FjaGUgPT09IGZhbHNlKSB7XHJcblx0XHRfZ2VuZXJhdGVTZWxlY3RvcnNDYWNoZSgpO1xyXG5cdH1cclxuXHJcblx0aWYgKCFzdHJFbGVtLm1hdGNoKF9zZWxlY3RvcnNDYWNoZSkpIHtcclxuXHRcdHJldHVybiBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoc3RyRWxlbSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gX3NlbGVjdDIoc2NvcGVkRWxlbSwgc3RyRWxlbSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9zZWxlY3QyKHNjb3BlZEVsZW0sIHN0ckVsZW0pIHtcclxuXHR2YXIgZW50cnksIHNlbGVjdG9ycyxcclxuXHRcdHNjb3BlXHQ9IG5ldyB6QXJyYXkoc2NvcGVkRWxlbSksXHJcblx0XHRjdXJyZW50XHQ9IFwiXCIsXHJcblx0XHRlbnRyaWVzXHQ9IHN0ckVsZW0uc3BsaXQoL1xccysvKTtcclxuXHJcblx0d2hpbGUgKGVudHJ5ID0gZW50cmllcy5zaGlmdCgpKSB7XHJcblx0XHRzZWxlY3RvcnMgPSBlbnRyeS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpO1xyXG5cclxuXHRcdGlmICghc2VsZWN0b3JzKSB7XHJcblx0XHRcdGN1cnJlbnQgKz0gZW50cnkgKyBcIiBcIjtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Y3VycmVudFx0Kz0gZW50cnkucmVwbGFjZShfc2VsZWN0b3JzQ2FjaGUsIFwiXCIpIHx8IFwiKlwiO1xyXG5cdFx0ZW50cnlcdD0gbmV3IHpBcnJheSgpO1xyXG5cclxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gX3NlbGVjdEZvckVhY2goc2NvcGVkRWxlbSkge1xyXG5cdFx0XHR2YXIgcmV0ID0gbmV3IHpBcnJheSgpO1xyXG5cclxuXHRcdFx0c2VsZWN0b3JzLmZvckVhY2goZnVuY3Rpb24gc2VsZWN0b3JzRm9yRWFjaChzZWxlY3Rvcikge1xyXG5cdFx0XHRcdHJldC5wdXNoLmFwcGx5KHJldCwgX3NlbGVjdG9yc1tzZWxlY3Rvcl0uY2FsbChzY29wZWRFbGVtLCBjdXJyZW50KSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZW50cnkucHVzaC5hcHBseShlbnRyeSwgcmV0KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHNjb3BlXHQ9IGVudHJ5O1xyXG5cdFx0Y3VycmVudFx0PSBcIlwiO1xyXG5cdH1cclxuXHJcblx0aWYgKGN1cnJlbnQpIHtcclxuXHRcdGVudHJ5ID0gbmV3IHpBcnJheSgpO1xyXG5cclxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gY3VycmVudEZvckVhY2goc2NvcGVkRWxlbSkge1xyXG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudCkpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0c2NvcGUgPSBlbnRyeTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBzY29wZTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKSB7XHJcblx0dmFyIHNlbGVjdG9yc1x0PSBPYmplY3Qua2V5cyhfc2VsZWN0b3JzKS5qb2luKFwifFwiKS5yZXBsYWNlKC86L2csIFwiXCIpO1xyXG5cdF9zZWxlY3RvcnNDYWNoZVx0PSBuZXcgUmVnRXhwKFwiOihcIiArIHNlbGVjdG9ycyArIFwiKVwiLCBcImdcIik7XHJcbn1cclxuIiwiei5yZWdpc3RlclNlbGVjdG9yID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBmbikge1xyXG5cdGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBzdHJpbmcgc2VsZWN0b3JcIik7XHJcblx0fSBlbHNlIGlmICghZm4gfHwgdHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcclxuXHR9XHJcblxyXG5cdGlmIChzZWxlY3RvclswXSAhPT0gXCI6XCIpIHtcclxuXHRcdHNlbGVjdG9yID0gXCI6XCIgKyBzZWxlY3RvcjtcclxuXHR9XHJcblxyXG5cdF9zZWxlY3RvcnNDYWNoZVx0XHRcdD0gZmFsc2U7XHJcblx0X3NlbGVjdG9yc1tzZWxlY3Rvcl1cdD0gZm47XHJcbn07XHJcblxyXG56LnJlZ2lzdGVyU2VsZWN0b3IoXCI6Zmlyc3RcIiwgZnVuY3Rpb24gc2VsZWN0b3JGaXJzdChxdWVyeSkge1xyXG5cdHJldHVybiB6KHRoaXMucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xyXG59KTtcclxuXHJcbnoucmVnaXN0ZXJTZWxlY3RvcihcIjppbnB1dFwiLCAoZnVuY3Rpb24gc2VsZWN0b3JGaXJzdCgpIHtcclxuXHR2YXIgdGFncyA9IFwiSU5QVVQsVEVYVEFSRUEsU0VMRUNULEJVVFRPTlwiLnNwbGl0KFwiLFwiKTtcclxuXHJcblx0ZnVuY3Rpb24gZmlsdGVyKGVsZW1lbnQpIHtcclxuXHRcdHJldHVybiB+dGFncy5pbmRleE9mKGVsZW1lbnQudGFnTmFtZSk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZnVuY3Rpb24gc2VsZWN0b3JJbnB1dChxdWVyeSkge1xyXG5cdFx0dmFyIGVsZW1lbnRzID0gbmV3IHpBcnJheSgpO1xyXG5cclxuXHRcdGVsZW1lbnRzLnB1c2guYXBwbHkoZWxlbWVudHMsIFtdLmZpbHRlci5jYWxsKHRoaXMucXVlcnlTZWxlY3RvckFsbChxdWVyeSksIGZpbHRlcikpO1xyXG5cclxuXHRcdHJldHVybiBlbGVtZW50cztcclxuXHR9O1xyXG59KSgpKTtcclxuIiwiei5mbi5wYXJlbnQgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMucGFyZW50Tm9kZTtcclxufSk7XHJcblxyXG56LmZuLm5leHQgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMubmV4dEVsZW1lbnRTaWJsaW5nO1xyXG59KTtcclxuXHJcbnouZm4ucHJldiA9IHouZm4ucHJldmlvdXMgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHRoaXMucHJldmlvdXNFbGVtZW50U2libGluZztcclxufSk7XHJcblxyXG56LmZuLnNpYmxpbmdzID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xyXG5cdHJldHVybiBbXS5maWx0ZXIuY2FsbCh0aGlzLnBhcmVudE5vZGUuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XHJcblx0XHRyZXR1cm4gY2hpbGQgIT09IHRoaXM7XHJcblx0fSwgdGhpcyk7XHJcbn0pO1xyXG4iLCJmdW5jdGlvbiBfY2hlY2tWYWxpZEVsZW1lbnQoZWxlbSkge1xyXG5cdGlmIChlbGVtIGluc3RhbmNlb2YgekFycmF5KSB7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdGlmIChlbGVtIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9lYWNoKGZuKSB7XHJcblx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkVhY2goKSB7XHJcblx0XHR2YXIgaVx0PSAwLFxyXG5cdFx0XHRsXHQ9IHRoaXMubGVuZ3RoO1xyXG5cclxuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRcdGZuLmFwcGx5KHRoaXNbaV0sIGFyZ3VtZW50cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fTtcclxufVxyXG5cclxuZnVuY3Rpb24gX2VhY2hOZXcoZm4pIHtcclxuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcclxuXHRcdHZhciByZXQsXHJcblx0XHRcdGlcdD0gMCxcclxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aCxcclxuXHRcdFx0YXJyXHQ9IG5ldyB6QXJyYXkoKTtcclxuXHJcblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xyXG5cdFx0XHRyZXQgPSBmbi5hcHBseSh0aGlzW2ldLCBhcmd1bWVudHMpO1xyXG5cclxuXHRcdFx0aWYgKHJldCkge1xyXG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHJldCkgJiYgcmV0Lmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0YXJyLnB1c2guYXBwbHkoYXJyLCByZXQpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRhcnIucHVzaChyZXQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhcnI7XHJcblx0fTtcclxufVxyXG5cclxuei5kZWVwRXh0ZW5kID0gZnVuY3Rpb24gX2V4dGVuZChkZWVwKSB7XHJcblx0dmFyIG9iaiwgdGFyZ2V0LFxyXG5cdFx0aSA9IDI7XHJcblxyXG5cdGlmICh0eXBlb2YgZGVlcCA9PT0gXCJvYmplY3RcIikge1xyXG5cdFx0dGFyZ2V0XHQ9IGRlZXAgfHwge307XHJcblx0XHRkZWVwXHQ9IEluZmluaXR5O1xyXG5cdH0gZWxzZSB7XHJcblx0XHRkZWVwXHQ9IGRlZXAgPT09IHRydWUgPyBJbmZpbml0eSA6IChkZWVwIHwgMCk7XHJcblx0XHR0YXJnZXRcdD0gYXJndW1lbnRzWzFdIHx8IHt9O1xyXG5cdH1cclxuXHJcblx0Zm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdG9iaiA9IGFyZ3VtZW50c1tpXTtcclxuXHJcblx0XHRpZiAoIW9iaikge1xyXG5cdFx0XHRjb250aW51ZTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRcdGlmIChkZWVwICYmIHR5cGVvZiBvYmpba2V5XSA9PT0gXCJvYmplY3RcIikge1xyXG5cdFx0XHRcdFx0X2V4dGVuZChkZWVwIC0gMSwgdGFyZ2V0W2tleV0sIG9ialtrZXldKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiB0YXJnZXQ7XHJcbn07XHJcblxyXG56LmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRbXS51bnNoaWZ0LmNhbGwoYXJndW1lbnRzLCAwKTtcclxuXHRyZXR1cm4gei5kZWVwRXh0ZW5kLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG56LmZuLmVhY2ggPSBfZWFjaChmdW5jdGlvbiBlYWNoKGZuKSB7XHJcblx0Zm4uY2FsbCh0aGlzLCB0aGlzKTtcclxuXHRyZXR1cm4gdGhpcztcclxufSk7XHJcblxyXG56LnF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKG9iaiwgcHJlZml4KSB7XHJcblx0dmFyIGksIGtleSwgdmFsLFxyXG5cdFx0c3RyaW5ncyA9IFtdO1xyXG5cclxuXHRmb3IgKGkgaW4gb2JqKSB7XHJcblx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XHJcblx0XHRcdGlmIChwcmVmaXgpIHtcclxuXHRcdFx0XHRrZXkgPSBwcmVmaXggKyBcIltcIiArIGkgKyBcIl1cIjtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRrZXkgPSBpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YWwgPSBvYmpbaV07XHJcblxyXG5cdFx0XHRpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcclxuXHRcdFx0XHRzdHJpbmdzLnB1c2gocXVlcnlTdHJpbmcodmFsLCBrZXkpKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRzdHJpbmdzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWwpKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHN0cmluZ3Muam9pbihcIiZcIik7XHJcbn07XHJcbiIsIn0pKHdpbmRvdywgZG9jdW1lbnQpO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=