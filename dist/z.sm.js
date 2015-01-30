/*!
 * z.js JavaScript Library v0.0.8
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2015-01-30T21:43Z
 */
;(function (window, document) {

var zArray, _window, _document,
	cache = [];

function z(elem, scope) {
	if (elem instanceof zArray) {
		return elem;
	} else if (elem instanceof Element || elem instanceof Window || elem instanceof Document) {
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

(function () {
	var scope;

	if ('ActiveXObject' in window) {
		scope = new ActiveXObject("htmlfile");

		scope.open();
		scope.write("<script><\/script>");
		scope.close();
		cache.push(scope);

		zArray = scope.parentWindow.Array;
		return;
	}

	try {
		scope = document.createElement("iframe");

		scope.style.width            = 0;
		scope.style.height            = 0;
		scope.style.borderStyle    = "none";

		document.body.appendChild(scope);

		zArray = scope.contentWindow.Array;

		document.body.removeChild(scope);
	} catch (e) {
		zArray = Array;
	}
})();

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
	doc = document.implementation.createHTMLDocument("");

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

z.fn.addClass = _each(_addClass);

z.fn.removeClass = _each(_removeClass);

z.fn.toggleClass = _each(function toggleClass(className, force) {
	var fn;

	if (force === undefined) {
		fn = _elemHasClass(this, className) ? _removeClass : _addClass;
	} else {
		fn = force ? _addClass : _removeClass;
	}

	fn.call(this, className);
});

z.fn.hasClass = function (className) {
	var i = 0,
		l = this.length;

	for (; i < l; i++) {
		if (_elemHasClass(this[i], className)) {
			return true;
		}
	}

	return false;
};

function _addClass(className) {
	if ("classList" in this) {
		this.classList.add(className);
	} else {
		this.setAttribute("class", this.getAttribute("class") + " " + className);
	}
}

function _removeClass(className) {
	var value;

	if ("classList" in this) {
		this.classList.remove(className);
	} else {
		value = this.getAttribute("class").replace(_classRegexp(className), " ");
		this.setAttribute("class", value);
	}
}

function _classRegexp(className) {
	var regexp = _cache.get("class." + className);

	if (!regexp) {
		regexp = new RegExp("(^|\\b)" + className + "(\\b|$)", "g");
		_cache.set("class." + className, regexp);
	}

	return regexp;
}

function _elemHasClass(elem, className) {
	if ("classList" in elem) {
		if (elem.classList.contains(className)) {
			return true;
		}
	} else if (_classRegexp(className).test(elem.className)) {
		return true;
	}

	return false;
}

z.fn.data = function (key, value) {
	if (key !== undefined && value !== undefined) {
		return this.setData(key, value);
	} else if (this.length) {
		return this.getData(key);
	}
};

z.fn.setData = _each(function _setData(key, value) {
	var elem = this;

	if ("dataset" in elem) {
		elem.dataset[_toCamelCase(key)] = value;
	} else {
		elem.setAttribute("data-" + _toDashes(key), value);
	}
});

z.fn.getData = function (key) {
	var elem = this[0];

	if (!elem) {
		return;
	} else if (key !== undefined) {
		if ("dataset" in elem) {
			return elem.dataset[_toCamelCase(key)];
		} else {
			return elem.getAttribute("data-" + _toDashes(key));
		}
	} else if ("dataset" in elem) {
		return Object.create(elem.dataset);
	}

	return _getDataAttrs(elem.attributes);
};

function _getDataAttrs(attrs) {
	var attr,
		i	= 0,
		l	= attrs.length,
		ret	= {};

	for (; i < l; i++) {
		attr = attrs[i];

		if (attr.name.indexOf("data-") === 0) {
			ret[_toCamelCase(attr.name.replace(/^data-/, ""))] = attr.value;
		}
	}

	return ret;
}

z.data = function (elem, key, value) {
	z(elem).data(key, value);
};

z.fn.on = z.fn.bind = _each(function _on(eventType, fn) {
	this.addEventListener(eventType, fn, false);
});

z.fn.one = _each(function (event, fn) {
	var called = false;

	z(this).on(event, function onceFn(e) {
		if (called) {
			return;
		}

		called = true;
		z(this).off(event, onceFn);

		fn.call(this, e);
	});
});

z.fn.off = z.fn.unbind = _each(function _off(eventType, fn) {
	this.removeEventListener(eventType, fn, false);
});

z.fn.trigger = function (eventType, data) {
	var event,
		i = 0,
		l = this.length;

	if (data === undefined) {
		data = {};
	}

	data.event = data;

	try {
		event = new CustomEvent(eventType, {
			detail: data
		});
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

	matches	= body.matches || body.matchesSelector || body.webkitMatchesSelector;
	matches = matches || body.mozMatchesSelector || body.msMatchesSelector || body.oMatchesSelector;

	return function is(selector) {
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
				if (
					selector instanceof Element ||
					selector instanceof Window ||
					selector instanceof Document
				) {
					_isWith = _isWithElement;
				} else {
					throw new Error("First parameter of z#is is invalid");
				}
			break;

			default:
				throw new Error("First parameter of z#is is invalid");
			//break;
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
		return this[0].innerHTML;
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

z.fn.setAttr = _each(function setAttr(key, value) {
	if (!key) {
		throw new Error("First parameter of z#setAttr is required");
	} else if (value === undefined) {
		throw new Error("Second parameter of z#setAttr is required");
	}

	this.setAttribute(key, value);
});

z.fn.attr = function (key, value) {
	if (value === undefined) {
		return this.getAttr(key);
	}

	this.setAttr(key, value);
	return this;
};

z.fn.replaceWith = z.fn.replace = _each(function replaceWith(value) {
	var scripts;

	if (value === undefined || value === null) {
		this.remove();
	} else if (value instanceof zArray || value instanceof EventTarget) {
		scripts = _extractScripts(value);

		if (value instanceof zArray) {
			value = value[0];
		}

		this.parentNode.replaceChild(value, this);

		_addScripts(scripts);
	} else {
		this.outerHTML = value;
	}
});

function _extractScripts(elem) {
	var scripts,
		i	= 0,
		ret	= [];

	elem	= z(elem);
	scripts	= elem.find("script");

	for (; i < scripts.length; i++) {
		ret.push({
			src: scripts[i].src,
			text: scripts[i].textContent
		});

		scripts[i].remove();
	}

	return ret;
}

function _addScripts(scripts) {
	var script,
		i = 0;

	for (; i < scripts.length; i++) {
		script = document.createElement("script");

		if (scripts[i].src) {
			script.src = scripts[i].src;
		} else if (scripts[i].text) {
			script.text = scripts[i].text;
		}

		document.head.appendChild(script).parentNode.removeChild(script);
	}
}

z.fn.append = function (value) {
	var element,
		i = 0,
		l = this.length;

	if (value === undefined) {
		throw new Error("First parameter of z#append is required.");
	}

	if (typeof value === "string") {
		for (; i < l; i++) {
			this[i].insertAdjacentHTML('beforeend', value);
		}

		return this;
	}

	if (value instanceof zArray) {
		value = value[0];
	}

	for (; i < l; i++) {
		this[i].appendChild(value);
	}

	return this;
};

z.fn.prepend = function (value) {
	var element,
		i = 0,
		l = this.length;

	if (value === undefined) {
		throw new Error("First parameter of z#prepend is required.");
	}

	if (typeof value === "string") {
		for (; i < l; i++) {
			this[i].insertAdjacentHTML('afterbegin', value);
		}

		return this;
	}

	if (value instanceof zArray) {
		value = value[0];
	}

	for (; i < l; i++) {
		this[i].insertBefore(value, this[i].firstChild);
	}

	return this;
};

z.fn.after = function (value) {
	var element,
		i = 0,
		l = this.length;

	if (value === undefined) {
		throw new Error("First parameter of z#append is required.");
	}

	if (typeof value === "string") {
		for (; i < l; i++) {
			this[i].insertAdjacentHTML("afterend", value);
		}

		return this;
	}

	if (value instanceof zArray) {
		value = value[0];
	}

	for (; i < l; i++) {
		this[i].insertAdjacentHTML("afterend", value.outerHTML);
	}

	return this;
};

z.fn.css = function (rule, value) {
	var i = 0,
		l = this.length;

	if (rule === undefined) {
		throw new Error("First parameter of z#css is required.");
	}

	if (value === undefined) {
		return getComputedStyle(this[0])[rule];
	} else {
		rule = rule.replace(/-./g, function (result) {
		    return result.substr(1).toUpperCase();
		});

		for (; i < l; i++) {
			this[i].style[rule] = value;
		}
	}

	return this;
};

z.fn.remove = _each(function remove() {
	this.parentNode.removeChild(this);
});

z.fn.empty = _each(function empty() {
	this.innerHTML = '';
});

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

z.fn.parent = _eachNew(function parent() {
	return this.parentNode;
});

z.fn.next = _eachNew(function next() {
	return this.nextElementSibling;
});

z.fn.prev = z.fn.previous = _eachNew(function prev() {
	return this.previousElementSibling;
});

z.fn.siblings = _eachNew(function siblings() {
	return [].filter.call(this.parentNode.children, function(child) {
		return child !== this;
	}, this);
});

z.fn.nextAll = _eachNew(function nextAll(){
	return dir(this, "nextElementSibling");
});

z.fn.prevAll = _eachNew(function prevAll(){
	return dir(this, "previousElementSibling");
});

z.fn.children = _eachNew(function children(selector) {
	return this.children;
});

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

})(window, document);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImFqYXguanMiLCJhamF4X3R5cGVzLmpzIiwiY2xhc3Nlcy5qcyIsImRhdGEuanMiLCJldmVudHMuanMiLCJmaWx0ZXJpbmcuanMiLCJtYW5pcHVsYXRpb24uanMiLCJzZWxlY3RvcnMuanMiLCJzZWxlY3RvcnNfY3VzdG9tLmpzIiwidHJhdmVyc2luZy5qcyIsInV0aWxzLmpzIiwiX2Zvb3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0S0E7QUFDQSIsImZpbGUiOiJ6LnNtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiB6LmpzIEphdmFTY3JpcHQgTGlicmFyeSB2QFZFUlNJT05cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ORVVSUy96LmpzXG4gKlxuICogQ29weXJpZ2h0IDIwMTQgTkVVUlMgTExDLCBLZXZpbiBKLiBNYXJ0aW4sIGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL05FVVJTL3ouanMvYmxvYi9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIERhdGU6IEBEQVRFXG4gKi9cbjsoZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbiIsInZhciB6QXJyYXksIF93aW5kb3csIF9kb2N1bWVudCxcblx0Y2FjaGUgPSBbXTtcblxuZnVuY3Rpb24geihlbGVtLCBzY29wZSkge1xuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHJldHVybiBlbGVtO1xuXHR9IGVsc2UgaWYgKGVsZW0gaW5zdGFuY2VvZiBFbGVtZW50IHx8IGVsZW0gaW5zdGFuY2VvZiBXaW5kb3cgfHwgZWxlbSBpbnN0YW5jZW9mIERvY3VtZW50KSB7XG5cdFx0cmV0dXJuIG5ldyB6QXJyYXkoZWxlbSk7XG5cdH0gZWxzZSBpZiAoZWxlbSA9PT0gdW5kZWZpbmVkIHx8IGVsZW0gPT09IG51bGwpIHtcblx0XHRyZXR1cm4gbmV3IHpBcnJheSgpO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBlbGVtICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIGlzIGludmFsaWRcIik7XG5cdH1cblxuXHRpZiAoc2NvcGUpIHtcblx0XHRpZiAoIV9jaGVja1ZhbGlkRWxlbWVudChzY29wZSkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgaXMgaW52YWxpZFwiKTtcblx0XHR9XG5cblx0XHRzY29wZSA9IHooc2NvcGUpO1xuXHR9IGVsc2Uge1xuXHRcdHNjb3BlID0gX2RvY3VtZW50O1xuXHR9XG5cblx0cmV0dXJuIF9maW5kKHNjb3BlLCBlbGVtKTtcbn1cblxuZnVuY3Rpb24gbm9vcCgpe31cblxuKGZ1bmN0aW9uICgpIHtcblx0dmFyIHNjb3BlO1xuXG5cdGlmICgnQWN0aXZlWE9iamVjdCcgaW4gd2luZG93KSB7XG5cdFx0c2NvcGUgPSBuZXcgQWN0aXZlWE9iamVjdChcImh0bWxmaWxlXCIpO1xuXG5cdFx0c2NvcGUub3BlbigpO1xuXHRcdHNjb3BlLndyaXRlKFwiPHNjcmlwdD48XFwvc2NyaXB0PlwiKTtcblx0XHRzY29wZS5jbG9zZSgpO1xuXHRcdGNhY2hlLnB1c2goc2NvcGUpO1xuXG5cdFx0ekFycmF5ID0gc2NvcGUucGFyZW50V2luZG93LkFycmF5O1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHRyeSB7XG5cdFx0c2NvcGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xuXG5cdFx0c2NvcGUuc3R5bGUud2lkdGggICAgICAgICAgICA9IDA7XG5cdFx0c2NvcGUuc3R5bGUuaGVpZ2h0ICAgICAgICAgICAgPSAwO1xuXHRcdHNjb3BlLnN0eWxlLmJvcmRlclN0eWxlICAgID0gXCJub25lXCI7XG5cblx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjb3BlKTtcblxuXHRcdHpBcnJheSA9IHNjb3BlLmNvbnRlbnRXaW5kb3cuQXJyYXk7XG5cblx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHNjb3BlKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHpBcnJheSA9IEFycmF5O1xuXHR9XG59KSgpO1xuXG4vL3dpbmRvdy4kXHQ9IHo7XG53aW5kb3cuelx0PSB6O1xuei5mblx0XHQ9IHpBcnJheS5wcm90b3R5cGU7XG5fd2luZG93XHRcdD0geih3aW5kb3cpO1xuX2RvY3VtZW50XHQ9IHooZG9jdW1lbnQpO1xuXG56LmZuLmZpbmQgPSBmdW5jdGlvbiAoc3RyRWxlbSkge1xuXHRpZiAodHlwZW9mIHN0ckVsZW0gIT09IFwic3RyaW5nXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWF0ZXIgb2YgeiNmaW5kKCkgc2hvdWxkIGJlIGEgc3RyaW5nXCIpO1xuXHR9XG5cblx0cmV0dXJuIF9maW5kKHRoaXMsIHN0ckVsZW0pO1xufTtcbiIsInZhciBhamF4RGVmYXVsdHMsIGFqYXhUeXBlcyxcblx0YWpheE1pbWVzXHQ9IHt9XG5cbmFqYXhEZWZhdWx0cyA9IHtcblx0bWV0aG9kOiBcIkdFVFwiLFxuXHRyZXF1ZXN0VHlwZTogXCJ0ZXh0XCIsXG5cdHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCIsXG5cdHVybDogd2luZG93LmxvY2F0aW9uICsgXCJcIixcblx0cXVlcnk6IG51bGwsXG5cdGRhdGE6IG51bGwsXG5cdHNldHVwOiBub29wLFxuXHRzdWNjZXNzOiBub29wLFxuXHRlcnJvcjogbm9vcFxufTtcblxuYWpheFR5cGVzID0ge1xuXHR0ZXh0OiBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdHJldHVybiAoZGF0YSB8fCBcIlwiKSArIFwiXCI7XG5cdH1cbn07XG5cbnouYWpheCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdHZhciBkYXRhLFxuXHRcdHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG5cdG9wdGlvbnMgPSB6LmV4dGVuZCh7XG5cdFx0Y29udGV4dDogcmVxXG5cdH0sIGFqYXhEZWZhdWx0cywgb3B0aW9ucyk7XG5cblx0aWYgKCFhamF4VHlwZXNbb3B0aW9ucy5yZXF1ZXN0VHlwZV0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG9wdGlvbiBgcmVxdWVzdFR5cGVgXCIpO1xuXHR9IGVsc2UgaWYgKCFhamF4VHlwZXNbb3B0aW9ucy5yZXNwb25zZVR5cGVdKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBvcHRpb24gYHJlc3BvbnNlVHlwZWBcIik7XG5cdH1cblxuXHRpZiAob3B0aW9ucy5xdWVyeSAmJiB+W1wiSEVBRFwiLCBcIkdFVFwiXS5pbmRleE9mKG9wdGlvbnMubWV0aG9kLnRvVXBwZXJDYXNlKCkpKSB7XG5cdFx0b3B0aW9ucy51cmxcdCs9IH5vcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA/IFwiJlwiIDogXCI/XCI7XG5cdFx0b3B0aW9ucy51cmxcdCs9IHoucXVlcnlTdHJpbmcob3B0aW9ucy5xdWVyeSk7XG5cdFx0b3B0aW9ucy51cmxcdD0gb3B0aW9ucy51cmwucmVwbGFjZSgvKFxcP3wmKSYvZywgXCIkMVwiKTtcblx0fVxuXG5cdHJlcS5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSk7XG5cblx0cmVxLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgcmVzcDtcblxuXHRcdGlmIChyZXEuc3RhdHVzID49IDIwMCAmJiByZXEuc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHRyZXNwID0gYWpheFR5cGVzW29wdGlvbnMucmVzcG9uc2VUeXBlXS5jYWxsKHJlcSwgcmVxLnJlc3BvbnNlVGV4dCwgdHJ1ZSk7XG5cdFx0XHRvcHRpb25zLnN1Y2Nlc3MuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlc3ApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvcHRpb25zLmVycm9yLmNhbGwob3B0aW9ucy5jb250ZXh0LCByZXEuc3RhdHVzLCByZXEuc3RhdHVzVGV4dCk7XG5cdFx0fVxuXHR9O1xuXG5cdHJlcS5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xuXHRcdG9wdGlvbnMuZXJyb3IuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlcS5zdGF0dXMsIHJlcS5zdGF0dXNUZXh0KTtcblx0fTtcblxuXHRpZiAoIX5bXCJIRUFEXCIsIFwiR0VUXCJdLmluZGV4T2Yob3B0aW9ucy5tZXRob2QudG9VcHBlckNhc2UoKSkpIHtcblx0XHRyZXEuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiKTtcblx0fVxuXG5cdGlmIChvcHRpb25zLmRhdGEpIHtcblx0XHRvcHRpb25zLmRhdGEgPSBhamF4VHlwZXNbb3B0aW9ucy5yZXF1ZXN0VHlwZV0uY2FsbChyZXEsIG9wdGlvbnMuZGF0YSwgZmFsc2UpO1xuXHR9XG5cblx0b3B0aW9ucy5zZXR1cC5jYWxsKHJlcSwgcmVxKTtcblxuXHRyZXEuc2VuZChvcHRpb25zLmRhdGEpO1xufTtcbiIsImFqYXhEZWZhdWx0cy5yZXF1ZXN0VHlwZVx0PSBcImRldGVjdFwiO1xuYWpheERlZmF1bHRzLnJlc3BvbnNlVHlwZVx0PSBcImRldGVjdFwiO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUgPSBmdW5jdGlvbiAodHlwZSwgbWltZSwgZm4pIHtcblx0aWYgKCFmbiAmJiB0eXBlb2YgbWltZSA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Zm5cdFx0PSBtaW1lO1xuXHRcdG1pbWVcdD0gZmFsc2U7XG5cdH1cblxuXHRhamF4VHlwZXNbdHlwZV0gPSBmbjtcblxuXHRpZiAobWltZSkge1xuXHRcdGFqYXhNaW1lc1ttaW1lXSA9IHR5cGU7XG5cdH1cbn07XG5cbnoucmVnaXN0ZXJBamF4VHlwZShcImRldGVjdFwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xuXHR2YXIgaGVhZGVyLFxuXHRcdHR5cGUgPSBcInRleHRcIjtcblxuXHRpZiAoaXNSZXNwb25zZSkge1xuXHRcdGhlYWRlclx0PSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1UeXBlXCIpIHx8IFwiXCIsXG5cdFx0aGVhZGVyXHQ9IGhlYWRlci5zcGxpdChcIjtcIilbMF0udHJpbSgpO1xuXHRcdHR5cGVcdD0gYWpheE1pbWVzW2hlYWRlcl0gfHwgXCJ0ZXh0XCI7XG5cdH0gZWxzZSB7XG5cdFx0aWYgKGRhdGEgJiYgdHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgJiYgZGF0YS50b1N0cmluZyA9PT0gKHt9KS50b1N0cmluZykge1xuXHRcdFx0dHlwZSA9IFwianNvblwiO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBhamF4VHlwZXNbdHlwZV0uY2FsbCh0aGlzLCBkYXRhLCBpc1Jlc3BvbnNlKTtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJqc29uXCIsIFwiYXBwbGljYXRpb24vanNvblwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xuXHRyZXR1cm4gaXNSZXNwb25zZSA/IEpTT04ucGFyc2UoZGF0YSkgOiBKU09OLnN0cmluZ2lmeShkYXRhKTtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJodG1sXCIsIFwidGV4dC9odG1sXCIsIGZ1bmN0aW9uIChkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHZhciBkb2MsIGFycjtcblxuXHRpZiAoIWlzUmVzcG9uc2UpIHtcblx0XHRyZXR1cm4gZGF0YS5vdXRlckhUTUw7XG5cdH1cblxuXHRhcnJcdD0gbmV3IHpBcnJheSgpO1xuXHRkb2MgPSBkb2N1bWVudC5pbXBsZW1lbnRhdGlvbi5jcmVhdGVIVE1MRG9jdW1lbnQoXCJcIik7XG5cblx0ZG9jLmRvY3VtZW50RWxlbWVudC5pbm5lckhUTUwgPSBkYXRhO1xuXG5cdGFyci5wdXNoLmFwcGx5KGFyciwgYXJyLnNsaWNlLmNhbGwoZG9jLmJvZHkuY2hpbGRyZW4sIDApKTtcblxuXHRyZXR1cm4gYXJyO1xufSk7XG5cbnoucmVnaXN0ZXJBamF4VHlwZShcInhtbFwiLCBcInRleHQveG1sXCIsIGFqYXhYTUxQYXJzZXIpO1xuei5yZWdpc3RlckFqYXhUeXBlKFwieG1sXCIsIFwiYXBwbGljYXRpb24veG1sXCIsIGFqYXhYTUxQYXJzZXIpO1xuXG5mdW5jdGlvbiBhamF4WE1MUGFyc2VyKGRhdGEsIGlzUmVzcG9uc2UpIHtcblx0dmFyIHBhcnNlcjtcblxuXHRpZiAoIWlzUmVzcG9uc2UpIHtcblx0XHRwYXJzZXIgPSBuZXcgWE1MU2VyaWFsaXplcigpO1xuXHRcdHJldHVybiBwYXJzZXIuc2VyaWFsaXplVG9TdHJpbmcoZGF0YSk7XG5cdH1cblxuXHRpZiAodGhpcy5yZXNwb25zZVhNTCkge1xuXHRcdHJldHVybiB0aGlzLnJlc3BvbnNlWE1MO1xuXHR9XG5cblx0cGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXHRyZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhkYXRhLCBcImFwcGxpY2F0aW9uL3htbFwiKTtcbn1cbiIsInouZm4uYWRkQ2xhc3MgPSBfZWFjaChfYWRkQ2xhc3MpO1xuXG56LmZuLnJlbW92ZUNsYXNzID0gX2VhY2goX3JlbW92ZUNsYXNzKTtcblxuei5mbi50b2dnbGVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0dmFyIGZuO1xuXG5cdGlmIChmb3JjZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0Zm4gPSBfZWxlbUhhc0NsYXNzKHRoaXMsIGNsYXNzTmFtZSkgPyBfcmVtb3ZlQ2xhc3MgOiBfYWRkQ2xhc3M7XG5cdH0gZWxzZSB7XG5cdFx0Zm4gPSBmb3JjZSA/IF9hZGRDbGFzcyA6IF9yZW1vdmVDbGFzcztcblx0fVxuXG5cdGZuLmNhbGwodGhpcywgY2xhc3NOYW1lKTtcbn0pO1xuXG56LmZuLmhhc0NsYXNzID0gZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuXHR2YXIgaSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0aWYgKF9lbGVtSGFzQ2xhc3ModGhpc1tpXSwgY2xhc3NOYW1lKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufTtcblxuZnVuY3Rpb24gX2FkZENsYXNzKGNsYXNzTmFtZSkge1xuXHRpZiAoXCJjbGFzc0xpc3RcIiBpbiB0aGlzKSB7XG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpICsgXCIgXCIgKyBjbGFzc05hbWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIF9yZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0dmFyIHZhbHVlO1xuXG5cdGlmIChcImNsYXNzTGlzdFwiIGluIHRoaXMpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0fSBlbHNlIHtcblx0XHR2YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikucmVwbGFjZShfY2xhc3NSZWdleHAoY2xhc3NOYW1lKSwgXCIgXCIpO1xuXHRcdHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdmFsdWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIF9jbGFzc1JlZ2V4cChjbGFzc05hbWUpIHtcblx0dmFyIHJlZ2V4cCA9IF9jYWNoZS5nZXQoXCJjbGFzcy5cIiArIGNsYXNzTmFtZSk7XG5cblx0aWYgKCFyZWdleHApIHtcblx0XHRyZWdleHAgPSBuZXcgUmVnRXhwKFwiKF58XFxcXGIpXCIgKyBjbGFzc05hbWUgKyBcIihcXFxcYnwkKVwiLCBcImdcIik7XG5cdFx0X2NhY2hlLnNldChcImNsYXNzLlwiICsgY2xhc3NOYW1lLCByZWdleHApO1xuXHR9XG5cblx0cmV0dXJuIHJlZ2V4cDtcbn1cblxuZnVuY3Rpb24gX2VsZW1IYXNDbGFzcyhlbGVtLCBjbGFzc05hbWUpIHtcblx0aWYgKFwiY2xhc3NMaXN0XCIgaW4gZWxlbSkge1xuXHRcdGlmIChlbGVtLmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoX2NsYXNzUmVnZXhwKGNsYXNzTmFtZSkudGVzdChlbGVtLmNsYXNzTmFtZSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cbiIsInouZm4uZGF0YSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdGlmIChrZXkgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0RGF0YShrZXksIHZhbHVlKTtcblx0fSBlbHNlIGlmICh0aGlzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0aGlzLmdldERhdGEoa2V5KTtcblx0fVxufTtcblxuei5mbi5zZXREYXRhID0gX2VhY2goZnVuY3Rpb24gX3NldERhdGEoa2V5LCB2YWx1ZSkge1xuXHR2YXIgZWxlbSA9IHRoaXM7XG5cblx0aWYgKFwiZGF0YXNldFwiIGluIGVsZW0pIHtcblx0XHRlbGVtLmRhdGFzZXRbX3RvQ2FtZWxDYXNlKGtleSldID0gdmFsdWU7XG5cdH0gZWxzZSB7XG5cdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJkYXRhLVwiICsgX3RvRGFzaGVzKGtleSksIHZhbHVlKTtcblx0fVxufSk7XG5cbnouZm4uZ2V0RGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcblx0dmFyIGVsZW0gPSB0aGlzWzBdO1xuXG5cdGlmICghZWxlbSkge1xuXHRcdHJldHVybjtcblx0fSBlbHNlIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuXHRcdGlmIChcImRhdGFzZXRcIiBpbiBlbGVtKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5kYXRhc2V0W190b0NhbWVsQ2FzZShrZXkpXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGVsZW0uZ2V0QXR0cmlidXRlKFwiZGF0YS1cIiArIF90b0Rhc2hlcyhrZXkpKTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoXCJkYXRhc2V0XCIgaW4gZWxlbSkge1xuXHRcdHJldHVybiBPYmplY3QuY3JlYXRlKGVsZW0uZGF0YXNldCk7XG5cdH1cblxuXHRyZXR1cm4gX2dldERhdGFBdHRycyhlbGVtLmF0dHJpYnV0ZXMpO1xufTtcblxuZnVuY3Rpb24gX2dldERhdGFBdHRycyhhdHRycykge1xuXHR2YXIgYXR0cixcblx0XHRpXHQ9IDAsXG5cdFx0bFx0PSBhdHRycy5sZW5ndGgsXG5cdFx0cmV0XHQ9IHt9O1xuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0YXR0ciA9IGF0dHJzW2ldO1xuXG5cdFx0aWYgKGF0dHIubmFtZS5pbmRleE9mKFwiZGF0YS1cIikgPT09IDApIHtcblx0XHRcdHJldFtfdG9DYW1lbENhc2UoYXR0ci5uYW1lLnJlcGxhY2UoL15kYXRhLS8sIFwiXCIpKV0gPSBhdHRyLnZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXQ7XG59XG5cbnouZGF0YSA9IGZ1bmN0aW9uIChlbGVtLCBrZXksIHZhbHVlKSB7XG5cdHooZWxlbSkuZGF0YShrZXksIHZhbHVlKTtcbn07XG4iLCJ6LmZuLm9uID0gei5mbi5iaW5kID0gX2VhY2goZnVuY3Rpb24gX29uKGV2ZW50VHlwZSwgZm4pIHtcblx0dGhpcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcbn0pO1xuXG56LmZuLm9uZSA9IF9lYWNoKGZ1bmN0aW9uIChldmVudCwgZm4pIHtcblx0dmFyIGNhbGxlZCA9IGZhbHNlO1xuXG5cdHoodGhpcykub24oZXZlbnQsIGZ1bmN0aW9uIG9uY2VGbihlKSB7XG5cdFx0aWYgKGNhbGxlZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNhbGxlZCA9IHRydWU7XG5cdFx0eih0aGlzKS5vZmYoZXZlbnQsIG9uY2VGbik7XG5cblx0XHRmbi5jYWxsKHRoaXMsIGUpO1xuXHR9KTtcbn0pO1xuXG56LmZuLm9mZiA9IHouZm4udW5iaW5kID0gX2VhY2goZnVuY3Rpb24gX29mZihldmVudFR5cGUsIGZuKSB7XG5cdHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGZuLCBmYWxzZSk7XG59KTtcblxuei5mbi50cmlnZ2VyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZGF0YSkge1xuXHR2YXIgZXZlbnQsXG5cdFx0aSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdGlmIChkYXRhID09PSB1bmRlZmluZWQpIHtcblx0XHRkYXRhID0ge307XG5cdH1cblxuXHRkYXRhLmV2ZW50ID0gZGF0YTtcblxuXHR0cnkge1xuXHRcdGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwge1xuXHRcdFx0ZGV0YWlsOiBkYXRhXG5cdFx0fSk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG5cdFx0ZXZlbnQuaW5pdEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSwgZGF0YSk7XG5cdH1cblxuXHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0uZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG4iLCJmdW5jdGlvbiBfaXNXaXRoRnVuY3Rpb24oZWxlbSwgZm4pIHtcblx0cmV0dXJuIGZuLmNhbGwoZWxlbSwgZWxlbSk7XG59XG5cbmZ1bmN0aW9uIF9pc1dpdGhFbGVtZW50KGVsZW0xLCBlbGVtMikge1xuXHRyZXR1cm4gZWxlbTEgPT09IGVsZW0yO1xufVxuXG56LmZuLmlzID0gKGZ1bmN0aW9uIF9pcygpIHtcblx0dmFyIG1hdGNoZXMsXG5cdFx0Ym9keSA9IGRvY3VtZW50LmJvZHk7XG5cblx0bWF0Y2hlc1x0PSBib2R5Lm1hdGNoZXMgfHwgYm9keS5tYXRjaGVzU2VsZWN0b3IgfHwgYm9keS53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG5cdG1hdGNoZXMgPSBtYXRjaGVzIHx8IGJvZHkubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkubXNNYXRjaGVzU2VsZWN0b3IgfHwgYm9keS5vTWF0Y2hlc1NlbGVjdG9yO1xuXG5cdHJldHVybiBmdW5jdGlvbiBpcyhzZWxlY3Rvcikge1xuXHRcdHZhciBfaXNXaXRoLCByZXQsXG5cdFx0XHRpXHQ9IDAsXG5cdFx0XHRsXHQ9IHRoaXMubGVuZ3RoO1xuXG5cdFx0c3dpdGNoICh0eXBlb2Ygc2VsZWN0b3IpIHtcblx0XHRcdGNhc2UgXCJzdHJpbmdcIjpcblx0XHRcdFx0X2lzV2l0aCA9IG1hdGNoZXM7XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcImZ1bmN0aW9uXCI6XG5cdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRnVuY3Rpb247XG5cdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcIm9iamVjdFwiOlxuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0c2VsZWN0b3IgaW5zdGFuY2VvZiBFbGVtZW50IHx8XG5cdFx0XHRcdFx0c2VsZWN0b3IgaW5zdGFuY2VvZiBXaW5kb3cgfHxcblx0XHRcdFx0XHRzZWxlY3RvciBpbnN0YW5jZW9mIERvY3VtZW50XG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRicmVhaztcblxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojaXMgaXMgaW52YWxpZFwiKTtcblx0XHRcdC8vYnJlYWs7XG5cdFx0fVxuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IF9pc1dpdGgodGhpc1tpXSwgc2VsZWN0b3IpO1xuXG5cdFx0XHRpZiAocmV0KSB7XG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufSkoKTtcbiIsInouZm4uaGlkZSA9IF9lYWNoKGZ1bmN0aW9uIGhpZGUoKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLnNob3cgPSBfZWFjaChmdW5jdGlvbiBzaG93KCkge1xuXHR0aGlzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLmNsb25lID0gZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGkgPSAwO1xuXG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQgfHwgZGVlcCA9PT0gbnVsbCkge1xuXHRcdGRlZXAgPSBmYWxzZTtcblx0fVxuXG5cdGZvciAoOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXNbaV0gPSB0aGlzW2ldLmNsb25lTm9kZShkZWVwKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5odG1sID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXNbMF0uaW5uZXJIVE1MO1xuXHR9XG5cblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbm5lckhUTUwgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi50ZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dENvbnRlbnQ7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLnRleHRDb250ZW50ID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4uZ2V0QXR0ciA9IGZ1bmN0aW9uIChrZXkpIHtcblx0aWYgKCFrZXkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNnZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXNbMF0gJiYgdGhpc1swXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn07XG5cbnouZm4uc2V0QXR0ciA9IF9lYWNoKGZ1bmN0aW9uIHNldEF0dHIoa2V5LCB2YWx1ZSkge1xuXHRpZiAoIWtleSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgb2YgeiNzZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0dGhpcy5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG59KTtcblxuei5mbi5hdHRyID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRyKGtleSk7XG5cdH1cblxuXHR0aGlzLnNldEF0dHIoa2V5LCB2YWx1ZSk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5yZXBsYWNlV2l0aCA9IHouZm4ucmVwbGFjZSA9IF9lYWNoKGZ1bmN0aW9uIHJlcGxhY2VXaXRoKHZhbHVlKSB7XG5cdHZhciBzY3JpcHRzO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG5cdFx0dGhpcy5yZW1vdmUoKTtcblx0fSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIHpBcnJheSB8fCB2YWx1ZSBpbnN0YW5jZW9mIEV2ZW50VGFyZ2V0KSB7XG5cdFx0c2NyaXB0cyA9IF9leHRyYWN0U2NyaXB0cyh2YWx1ZSk7XG5cblx0XHRpZiAodmFsdWUgaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHRcdHZhbHVlID0gdmFsdWVbMF07XG5cdFx0fVxuXG5cdFx0dGhpcy5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGhpcyk7XG5cblx0XHRfYWRkU2NyaXB0cyhzY3JpcHRzKTtcblx0fSBlbHNlIHtcblx0XHR0aGlzLm91dGVySFRNTCA9IHZhbHVlO1xuXHR9XG59KTtcblxuZnVuY3Rpb24gX2V4dHJhY3RTY3JpcHRzKGVsZW0pIHtcblx0dmFyIHNjcmlwdHMsXG5cdFx0aVx0PSAwLFxuXHRcdHJldFx0PSBbXTtcblxuXHRlbGVtXHQ9IHooZWxlbSk7XG5cdHNjcmlwdHNcdD0gZWxlbS5maW5kKFwic2NyaXB0XCIpO1xuXG5cdGZvciAoOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuXHRcdHJldC5wdXNoKHtcblx0XHRcdHNyYzogc2NyaXB0c1tpXS5zcmMsXG5cdFx0XHR0ZXh0OiBzY3JpcHRzW2ldLnRleHRDb250ZW50XG5cdFx0fSk7XG5cblx0XHRzY3JpcHRzW2ldLnJlbW92ZSgpO1xuXHR9XG5cblx0cmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2FkZFNjcmlwdHMoc2NyaXB0cykge1xuXHR2YXIgc2NyaXB0LFxuXHRcdGkgPSAwO1xuXG5cdGZvciAoOyBpIDwgc2NyaXB0cy5sZW5ndGg7IGkrKykge1xuXHRcdHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG5cblx0XHRpZiAoc2NyaXB0c1tpXS5zcmMpIHtcblx0XHRcdHNjcmlwdC5zcmMgPSBzY3JpcHRzW2ldLnNyYztcblx0XHR9IGVsc2UgaWYgKHNjcmlwdHNbaV0udGV4dCkge1xuXHRcdFx0c2NyaXB0LnRleHQgPSBzY3JpcHRzW2ldLnRleHQ7XG5cdFx0fVxuXG5cdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcblx0fVxufVxuXG56LmZuLmFwcGVuZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgZWxlbWVudCxcblx0XHRpID0gMCxcblx0XHRsID0gdGhpcy5sZW5ndGg7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNhcHBlbmQgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgdmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aWYgKHZhbHVlIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0dmFsdWUgPSB2YWx1ZVswXTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5hcHBlbmRDaGlsZCh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4ucHJlcGVuZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgZWxlbWVudCxcblx0XHRpID0gMCxcblx0XHRsID0gdGhpcy5sZW5ndGg7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNwcmVwZW5kIGlzIHJlcXVpcmVkLlwiKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCB2YWx1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRpZiAodmFsdWUgaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHR2YWx1ZSA9IHZhbHVlWzBdO1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLmluc2VydEJlZm9yZSh2YWx1ZSwgdGhpc1tpXS5maXJzdENoaWxkKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5hZnRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgZWxlbWVudCxcblx0XHRpID0gMCxcblx0XHRsID0gdGhpcy5sZW5ndGg7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNhcHBlbmQgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmluc2VydEFkamFjZW50SFRNTChcImFmdGVyZW5kXCIsIHZhbHVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdGlmICh2YWx1ZSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHZhbHVlID0gdmFsdWVbMF07XG5cdH1cblxuXHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0uaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYWZ0ZXJlbmRcIiwgdmFsdWUub3V0ZXJIVE1MKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5jc3MgPSBmdW5jdGlvbiAocnVsZSwgdmFsdWUpIHtcblx0dmFyIGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAocnVsZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojY3NzIGlzIHJlcXVpcmVkLlwiKTtcblx0fVxuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGdldENvbXB1dGVkU3R5bGUodGhpc1swXSlbcnVsZV07XG5cdH0gZWxzZSB7XG5cdFx0cnVsZSA9IHJ1bGUucmVwbGFjZSgvLS4vZywgZnVuY3Rpb24gKHJlc3VsdCkge1xuXHRcdCAgICByZXR1cm4gcmVzdWx0LnN1YnN0cigxKS50b1VwcGVyQ2FzZSgpO1xuXHRcdH0pO1xuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHRoaXNbaV0uc3R5bGVbcnVsZV0gPSB2YWx1ZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4ucmVtb3ZlID0gX2VhY2goZnVuY3Rpb24gcmVtb3ZlKCkge1xuXHR0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG59KTtcblxuei5mbi5lbXB0eSA9IF9lYWNoKGZ1bmN0aW9uIGVtcHR5KCkge1xuXHR0aGlzLmlubmVySFRNTCA9ICcnO1xufSk7XG4iLCJ2YXIgX3NlbGVjdG9yc0NhY2hlLFxuXHRfc2VsZWN0b3JzID0ge307XG5cbmZ1bmN0aW9uIF9maW5kKHNjb3BlLCBzdHJFbGVtKSB7XG5cdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBfZmluZEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdHJldC5wdXNoLmFwcGx5KHJldCwgX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSk7XG5cdH0pO1xuXG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9zZWxlY3Qoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHRpZiAoIX5zdHJFbGVtLmluZGV4T2YoXCI6XCIpIHx8IF9zZWxlY3RvcnNDYWNoZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdGlmIChfc2VsZWN0b3JzQ2FjaGUgPT09IGZhbHNlKSB7XG5cdFx0X2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKTtcblx0fVxuXG5cdGlmICghc3RyRWxlbS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpKSB7XG5cdFx0cmV0dXJuIHNjb3BlZEVsZW0ucXVlcnlTZWxlY3RvckFsbChzdHJFbGVtKTtcblx0fVxuXG5cdHJldHVybiBfc2VsZWN0MihzY29wZWRFbGVtLCBzdHJFbGVtKTtcbn1cblxuZnVuY3Rpb24gX3NlbGVjdDIoc2NvcGVkRWxlbSwgc3RyRWxlbSkge1xuXHR2YXIgZW50cnksIHNlbGVjdG9ycyxcblx0XHRzY29wZVx0PSBuZXcgekFycmF5KHNjb3BlZEVsZW0pLFxuXHRcdGN1cnJlbnRcdD0gXCJcIixcblx0XHRlbnRyaWVzXHQ9IHN0ckVsZW0uc3BsaXQoL1xccysvKTtcblxuXHR3aGlsZSAoZW50cnkgPSBlbnRyaWVzLnNoaWZ0KCkpIHtcblx0XHRzZWxlY3RvcnMgPSBlbnRyeS5tYXRjaChfc2VsZWN0b3JzQ2FjaGUpO1xuXG5cdFx0aWYgKCFzZWxlY3RvcnMpIHtcblx0XHRcdGN1cnJlbnQgKz0gZW50cnkgKyBcIiBcIjtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGN1cnJlbnRcdCs9IGVudHJ5LnJlcGxhY2UoX3NlbGVjdG9yc0NhY2hlLCBcIlwiKSB8fCBcIipcIjtcblx0XHRlbnRyeVx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIF9zZWxlY3RGb3JFYWNoKHNjb3BlZEVsZW0pIHtcblx0XHRcdHZhciByZXQgPSBuZXcgekFycmF5KCk7XG5cblx0XHRcdHNlbGVjdG9ycy5mb3JFYWNoKGZ1bmN0aW9uIHNlbGVjdG9yc0ZvckVhY2goc2VsZWN0b3IpIHtcblx0XHRcdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0b3JzW3NlbGVjdG9yXS5jYWxsKHNjb3BlZEVsZW0sIGN1cnJlbnQpKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCByZXQpO1xuXHRcdH0pO1xuXG5cdFx0c2NvcGVcdD0gZW50cnk7XG5cdFx0Y3VycmVudFx0PSBcIlwiO1xuXHR9XG5cblx0aWYgKGN1cnJlbnQpIHtcblx0XHRlbnRyeSA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gY3VycmVudEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdFx0ZW50cnkucHVzaC5hcHBseShlbnRyeSwgc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKGN1cnJlbnQpKTtcblx0XHR9KTtcblxuXHRcdHNjb3BlID0gZW50cnk7XG5cdH1cblxuXHRyZXR1cm4gc2NvcGU7XG59XG5cbmZ1bmN0aW9uIF9nZW5lcmF0ZVNlbGVjdG9yc0NhY2hlKCkge1xuXHR2YXIgc2VsZWN0b3JzXHQ9IE9iamVjdC5rZXlzKF9zZWxlY3RvcnMpLmpvaW4oXCJ8XCIpLnJlcGxhY2UoLzovZywgXCJcIik7XG5cdF9zZWxlY3RvcnNDYWNoZVx0PSBuZXcgUmVnRXhwKFwiOihcIiArIHNlbGVjdG9ycyArIFwiKVwiLCBcImdcIik7XG59XG4iLCJ6LnJlZ2lzdGVyU2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGZuKSB7XG5cdGlmICghc2VsZWN0b3IgfHwgdHlwZW9mIHNlbGVjdG9yICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojcmVnaXN0ZXJTZWxlY3RvciBtdXN0IGJlIGEgc3RyaW5nIHNlbGVjdG9yXCIpO1xuXHR9IGVsc2UgaWYgKCFmbiB8fCB0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcblx0fVxuXG5cdGlmIChzZWxlY3RvclswXSAhPT0gXCI6XCIpIHtcblx0XHRzZWxlY3RvciA9IFwiOlwiICsgc2VsZWN0b3I7XG5cdH1cblxuXHRfc2VsZWN0b3JzQ2FjaGVcdFx0XHQ9IGZhbHNlO1xuXHRfc2VsZWN0b3JzW3NlbGVjdG9yXVx0PSBmbjtcbn07XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjpmaXJzdFwiLCBmdW5jdGlvbiBzZWxlY3RvckZpcnN0KHF1ZXJ5KSB7XG5cdHJldHVybiB6KHRoaXMucXVlcnlTZWxlY3RvcihxdWVyeSkpO1xufSk7XG5cbnoucmVnaXN0ZXJTZWxlY3RvcihcIjppbnB1dFwiLCAoZnVuY3Rpb24gc2VsZWN0b3JGaXJzdCgpIHtcblx0dmFyIHRhZ3MgPSBcIklOUFVULFRFWFRBUkVBLFNFTEVDVCxCVVRUT05cIi5zcGxpdChcIixcIik7XG5cblx0ZnVuY3Rpb24gZmlsdGVyKGVsZW1lbnQpIHtcblx0XHRyZXR1cm4gfnRhZ3MuaW5kZXhPZihlbGVtZW50LnRhZ05hbWUpO1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uIHNlbGVjdG9ySW5wdXQocXVlcnkpIHtcblx0XHR2YXIgZWxlbWVudHMgPSBuZXcgekFycmF5KCk7XG5cblx0XHRlbGVtZW50cy5wdXNoLmFwcGx5KGVsZW1lbnRzLCBbXS5maWx0ZXIuY2FsbCh0aGlzLnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpLCBmaWx0ZXIpKTtcblxuXHRcdHJldHVybiBlbGVtZW50cztcblx0fTtcbn0pKCkpO1xuIiwiei5mbi5wYXJlbnQgPSBfZWFjaE5ldyhmdW5jdGlvbiBwYXJlbnQoKSB7XG5cdHJldHVybiB0aGlzLnBhcmVudE5vZGU7XG59KTtcblxuei5mbi5uZXh0ID0gX2VhY2hOZXcoZnVuY3Rpb24gbmV4dCgpIHtcblx0cmV0dXJuIHRoaXMubmV4dEVsZW1lbnRTaWJsaW5nO1xufSk7XG5cbnouZm4ucHJldiA9IHouZm4ucHJldmlvdXMgPSBfZWFjaE5ldyhmdW5jdGlvbiBwcmV2KCkge1xuXHRyZXR1cm4gdGhpcy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xufSk7XG5cbnouZm4uc2libGluZ3MgPSBfZWFjaE5ldyhmdW5jdGlvbiBzaWJsaW5ncygpIHtcblx0cmV0dXJuIFtdLmZpbHRlci5jYWxsKHRoaXMucGFyZW50Tm9kZS5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRyZXR1cm4gY2hpbGQgIT09IHRoaXM7XG5cdH0sIHRoaXMpO1xufSk7XG5cbnouZm4ubmV4dEFsbCA9IF9lYWNoTmV3KGZ1bmN0aW9uIG5leHRBbGwoKXtcblx0cmV0dXJuIGRpcih0aGlzLCBcIm5leHRFbGVtZW50U2libGluZ1wiKTtcbn0pO1xuXG56LmZuLnByZXZBbGwgPSBfZWFjaE5ldyhmdW5jdGlvbiBwcmV2QWxsKCl7XG5cdHJldHVybiBkaXIodGhpcywgXCJwcmV2aW91c0VsZW1lbnRTaWJsaW5nXCIpO1xufSk7XG5cbnouZm4uY2hpbGRyZW4gPSBfZWFjaE5ldyhmdW5jdGlvbiBjaGlsZHJlbihzZWxlY3Rvcikge1xuXHRyZXR1cm4gdGhpcy5jaGlsZHJlbjtcbn0pO1xuIiwidmFyIHJlZ2V4cERhc2hcdFx0PSAvLSguKS9nLFxuXHRyZWdleHBVcHBlckNhc2VcdD0gLyg/IV4pKFtBLVpdKS9nO1xuXG5mdW5jdGlvbiBfdG9DYW1lbENhc2Uoc3RyaW5nKSB7XG5cdHJldHVybiBzdHJpbmcudG9Mb3dlckNhc2UoKS5yZXBsYWNlKHJlZ2V4cERhc2gsIF90b0NhbWVsQ2FzZUhlbHBlcik7XG59XG5cbmZ1bmN0aW9uIF90b0NhbWVsQ2FzZUhlbHBlcihtYXRjaCwgZ3JvdXApIHtcblx0cmV0dXJuIGdyb3VwLnRvVXBwZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIF90b0Rhc2hlcyhzdHJpbmcpIHtcblx0cmV0dXJuIHN0cmluZy5yZXBsYWNlKHJlZ2V4cFVwcGVyQ2FzZSwgX3RvRGFzaGVzSGVscGVyKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBfdG9EYXNoZXNIZWxwZXIobWF0Y2gsIGdyb3VwKSB7XG5cdHJldHVybiAnLScgKyBncm91cC50b0xvd2VyQ2FzZSgpO1xufVxuXG52YXIgX2NhY2hlID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGNhY2hlO1xuXG5cdGlmIChcIk1hcFwiIGluIHdpbmRvdykge1xuXHRcdHJldHVybiBuZXcgTWFwKCk7XG5cdH1cblxuXHRjYWNoZSA9IHt9O1xuXG5cdHJldHVybiB7XG5cdFx0c2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdFx0Y2FjaGVba2V5XSA9IHZhbHVlO1xuXHRcdH0sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRyZXR1cm4gY2FjaGVba2V5XTtcblx0XHR9XG5cdH07XG59KSgpO1xuXG5mdW5jdGlvbiBfY2hlY2tWYWxpZEVsZW1lbnQoZWxlbSkge1xuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKGVsZW0gaW5zdGFuY2VvZiBFbGVtZW50IHx8IGVsZW0gaW5zdGFuY2VvZiBXaW5kb3cgfHwgZWxlbSBpbnN0YW5jZW9mIERvY3VtZW50KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBfZWFjaChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgaVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aDtcblxuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRmbi5hcHBseSh0aGlzW2ldLCBhcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBfZWFjaE5ldyhmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgcmV0LFxuXHRcdFx0aVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aCxcblx0XHRcdGFyclx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gZm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblxuXHRcdFx0aWYgKHJldCkge1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXQpICYmIHJldC5sZW5ndGggfHwgcmV0IGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb24pIHtcblx0XHRcdFx0XHRhcnIucHVzaC5hcHBseShhcnIsIHJldCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyLnB1c2gocmV0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnI7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGRpcihlbGVtLCBrZXkpIHtcblx0dmFyIG1hdGNoZWQgPSBuZXcgekFycmF5KCk7XG5cblx0d2hpbGUgKGVsZW1ba2V5XSAmJiBlbGVtLm5vZGVUeXBlID09PSAxKSB7XG5cdFx0ZWxlbSA9IGVsZW1ba2V5XTtcblx0XHRtYXRjaGVkLnB1c2goZWxlbSk7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2hlZDtcbn1cblxuei5kZWVwRXh0ZW5kID0gZnVuY3Rpb24gX2V4dGVuZChkZWVwKSB7XG5cdHZhciBvYmosIHRhcmdldCxcblx0XHRpID0gMjtcblxuXHRpZiAodHlwZW9mIGRlZXAgPT09IFwib2JqZWN0XCIpIHtcblx0XHR0YXJnZXRcdD0gZGVlcCB8fCB7fTtcblx0XHRkZWVwXHQ9IEluZmluaXR5O1xuXHR9IGVsc2Uge1xuXHRcdGRlZXBcdD0gZGVlcCA9PT0gdHJ1ZSA/IEluZmluaXR5IDogKGRlZXAgfCAwKTtcblx0XHR0YXJnZXRcdD0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHR9XG5cblx0Zm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRvYmogPSBhcmd1bWVudHNbaV07XG5cblx0XHRpZiAoIW9iaikge1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGlmIChkZWVwICYmIHR5cGVvZiBvYmpba2V5XSA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0XHRcdF9leHRlbmQoZGVlcCAtIDEsIHRhcmdldFtrZXldLCBvYmpba2V5XSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXJnZXQ7XG59O1xuXG56LmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcblx0W10udW5zaGlmdC5jYWxsKGFyZ3VtZW50cywgMCk7XG5cdHJldHVybiB6LmRlZXBFeHRlbmQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbnouZm4uZWFjaCA9IF9lYWNoKGZ1bmN0aW9uIGVhY2goZm4pIHtcblx0Zm4uY2FsbCh0aGlzLCB0aGlzKTtcblx0cmV0dXJuIHRoaXM7XG59KTtcblxuei5xdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmosIHByZWZpeCkge1xuXHR2YXIgaSwga2V5LCB2YWwsXG5cdFx0c3RyaW5ncyA9IFtdO1xuXG5cdGZvciAoaSBpbiBvYmopIHtcblx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRpZiAocHJlZml4KSB7XG5cdFx0XHRcdGtleSA9IHByZWZpeCArIFwiW1wiICsgaSArIFwiXVwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0a2V5ID0gaTtcblx0XHRcdH1cblxuXHRcdFx0dmFsID0gb2JqW2ldO1xuXG5cdFx0XHRpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0c3RyaW5ncy5wdXNoKHoucXVlcnlTdHJpbmcodmFsLCBrZXkpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN0cmluZ3MucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdHJpbmdzLmpvaW4oXCImXCIpO1xufTtcbiIsIn0pKHdpbmRvdywgZG9jdW1lbnQpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9