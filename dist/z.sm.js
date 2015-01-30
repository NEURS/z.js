/*!
 * z.js JavaScript Library v0.0.7
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2015-01-30T21:25Z
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
		this.className += " " + className;
	}
}

function _removeClass(className) {
	var regexp;

	if ("classList" in this) {
		this.classList.remove(className);
	} else {
		this.className = this.className.replace(_classRegexp(className), " ");
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
});

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImFqYXguanMiLCJhamF4X3R5cGVzLmpzIiwiY2xhc3Nlcy5qcyIsImRhdGEuanMiLCJldmVudHMuanMiLCJmaWx0ZXJpbmcuanMiLCJtYW5pcHVsYXRpb24uanMiLCJzZWxlY3RvcnMuanMiLCJzZWxlY3RvcnNfY3VzdG9tLmpzIiwidHJhdmVyc2luZy5qcyIsInV0aWxzLmpzIiwiX2Zvb3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEtBO0FBQ0EiLCJmaWxlIjoiei5zbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogei5qcyBKYXZhU2NyaXB0IExpYnJhcnkgdkBWRVJTSU9OXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTkVVUlMvei5qc1xuICpcbiAqIENvcHlyaWdodCAyMDE0IE5FVVJTIExMQywgS2V2aW4gSi4gTWFydGluLCBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ORVVSUy96LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBEYXRlOiBAREFURVxuICovXG47KGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG4iLCJ2YXIgekFycmF5LCBfd2luZG93LCBfZG9jdW1lbnQsXG5cdGNhY2hlID0gW107XG5cbmZ1bmN0aW9uIHooZWxlbSwgc2NvcGUpIHtcblx0aWYgKGVsZW0gaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHRyZXR1cm4gZWxlbTtcblx0fSBlbHNlIGlmIChlbGVtIGluc3RhbmNlb2YgRWxlbWVudCB8fCBlbGVtIGluc3RhbmNlb2YgV2luZG93IHx8IGVsZW0gaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuXHRcdHJldHVybiBuZXcgekFycmF5KGVsZW0pO1xuXHR9IGVsc2UgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG5ldyB6QXJyYXkoKTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZWxlbSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xuXHR9XG5cblx0aWYgKHNjb3BlKSB7XG5cdFx0aWYgKCFfY2hlY2tWYWxpZEVsZW1lbnQoc2NvcGUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIGlzIGludmFsaWRcIik7XG5cdFx0fVxuXG5cdFx0c2NvcGUgPSB6KHNjb3BlKTtcblx0fSBlbHNlIHtcblx0XHRzY29wZSA9IF9kb2N1bWVudDtcblx0fVxuXG5cdHJldHVybiBfZmluZChzY29wZSwgZWxlbSk7XG59XG5cbmZ1bmN0aW9uIG5vb3AoKXt9XG5cbihmdW5jdGlvbiAoKSB7XG5cdHZhciBzY29wZTtcblxuXHRpZiAoJ0FjdGl2ZVhPYmplY3QnIGluIHdpbmRvdykge1xuXHRcdHNjb3BlID0gbmV3IEFjdGl2ZVhPYmplY3QoXCJodG1sZmlsZVwiKTtcblxuXHRcdHNjb3BlLm9wZW4oKTtcblx0XHRzY29wZS53cml0ZShcIjxzY3JpcHQ+PFxcL3NjcmlwdD5cIik7XG5cdFx0c2NvcGUuY2xvc2UoKTtcblx0XHRjYWNoZS5wdXNoKHNjb3BlKTtcblxuXHRcdHpBcnJheSA9IHNjb3BlLnBhcmVudFdpbmRvdy5BcnJheTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR0cnkge1xuXHRcdHNjb3BlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcblxuXHRcdHNjb3BlLnN0eWxlLndpZHRoICAgICAgICAgICAgPSAwO1xuXHRcdHNjb3BlLnN0eWxlLmhlaWdodCAgICAgICAgICAgID0gMDtcblx0XHRzY29wZS5zdHlsZS5ib3JkZXJTdHlsZSAgICA9IFwibm9uZVwiO1xuXG5cdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY29wZSk7XG5cblx0XHR6QXJyYXkgPSBzY29wZS5jb250ZW50V2luZG93LkFycmF5O1xuXG5cdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChzY29wZSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR6QXJyYXkgPSBBcnJheTtcblx0fVxufSkoKTtcblxuLy93aW5kb3cuJFx0PSB6O1xud2luZG93LnpcdD0gejtcbnouZm5cdFx0PSB6QXJyYXkucHJvdG90eXBlO1xuX3dpbmRvd1x0XHQ9IHood2luZG93KTtcbl9kb2N1bWVudFx0PSB6KGRvY3VtZW50KTtcblxuei5mbi5maW5kID0gZnVuY3Rpb24gKHN0ckVsZW0pIHtcblx0aWYgKHR5cGVvZiBzdHJFbGVtICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1hdGVyIG9mIHojZmluZCgpIHNob3VsZCBiZSBhIHN0cmluZ1wiKTtcblx0fVxuXG5cdHJldHVybiBfZmluZCh0aGlzLCBzdHJFbGVtKTtcbn07XG4iLCJ2YXIgYWpheERlZmF1bHRzLCBhamF4VHlwZXMsXG5cdGFqYXhNaW1lc1x0PSB7fVxuXG5hamF4RGVmYXVsdHMgPSB7XG5cdG1ldGhvZDogXCJHRVRcIixcblx0cmVxdWVzdFR5cGU6IFwidGV4dFwiLFxuXHRyZXNwb25zZVR5cGU6IFwidGV4dFwiLFxuXHR1cmw6IHdpbmRvdy5sb2NhdGlvbiArIFwiXCIsXG5cdHF1ZXJ5OiBudWxsLFxuXHRkYXRhOiBudWxsLFxuXHRzZXR1cDogbm9vcCxcblx0c3VjY2Vzczogbm9vcCxcblx0ZXJyb3I6IG5vb3Bcbn07XG5cbmFqYXhUeXBlcyA9IHtcblx0dGV4dDogZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRyZXR1cm4gKGRhdGEgfHwgXCJcIikgKyBcIlwiO1xuXHR9XG59O1xuXG56LmFqYXggPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHR2YXIgZGF0YSxcblx0XHRyZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuXHRvcHRpb25zID0gei5leHRlbmQoe1xuXHRcdGNvbnRleHQ6IHJlcVxuXHR9LCBhamF4RGVmYXVsdHMsIG9wdGlvbnMpO1xuXG5cdGlmICghYWpheFR5cGVzW29wdGlvbnMucmVxdWVzdFR5cGVdKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBvcHRpb24gYHJlcXVlc3RUeXBlYFwiKTtcblx0fSBlbHNlIGlmICghYWpheFR5cGVzW29wdGlvbnMucmVzcG9uc2VUeXBlXSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgb3B0aW9uIGByZXNwb25zZVR5cGVgXCIpO1xuXHR9XG5cblx0aWYgKG9wdGlvbnMucXVlcnkgJiYgfltcIkhFQURcIiwgXCJHRVRcIl0uaW5kZXhPZihvcHRpb25zLm1ldGhvZC50b1VwcGVyQ2FzZSgpKSkge1xuXHRcdG9wdGlvbnMudXJsXHQrPSB+b3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPyBcIiZcIiA6IFwiP1wiO1xuXHRcdG9wdGlvbnMudXJsXHQrPSB6LnF1ZXJ5U3RyaW5nKG9wdGlvbnMucXVlcnkpO1xuXHRcdG9wdGlvbnMudXJsXHQ9IG9wdGlvbnMudXJsLnJlcGxhY2UoLyhcXD98JikmL2csIFwiJDFcIik7XG5cdH1cblxuXHRyZXEub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUpO1xuXG5cdHJlcS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHJlc3A7XG5cblx0XHRpZiAocmVxLnN0YXR1cyA+PSAyMDAgJiYgcmVxLnN0YXR1cyA8IDQwMCkge1xuXHRcdFx0cmVzcCA9IGFqYXhUeXBlc1tvcHRpb25zLnJlc3BvbnNlVHlwZV0uY2FsbChyZXEsIHJlcS5yZXNwb25zZVRleHQsIHRydWUpO1xuXHRcdFx0b3B0aW9ucy5zdWNjZXNzLmNhbGwob3B0aW9ucy5jb250ZXh0LCByZXNwKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b3B0aW9ucy5lcnJvci5jYWxsKG9wdGlvbnMuY29udGV4dCwgcmVxLnN0YXR1cywgcmVxLnN0YXR1c1RleHQpO1xuXHRcdH1cblx0fTtcblxuXHRyZXEub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0XHRvcHRpb25zLmVycm9yLmNhbGwob3B0aW9ucy5jb250ZXh0LCByZXEuc3RhdHVzLCByZXEuc3RhdHVzVGV4dCk7XG5cdH07XG5cblx0aWYgKCF+W1wiSEVBRFwiLCBcIkdFVFwiXS5pbmRleE9mKG9wdGlvbnMubWV0aG9kLnRvVXBwZXJDYXNlKCkpKSB7XG5cdFx0cmVxLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIik7XG5cdH1cblxuXHRpZiAob3B0aW9ucy5kYXRhKSB7XG5cdFx0b3B0aW9ucy5kYXRhID0gYWpheFR5cGVzW29wdGlvbnMucmVxdWVzdFR5cGVdLmNhbGwocmVxLCBvcHRpb25zLmRhdGEsIGZhbHNlKTtcblx0fVxuXG5cdG9wdGlvbnMuc2V0dXAuY2FsbChyZXEsIHJlcSk7XG5cblx0cmVxLnNlbmQob3B0aW9ucy5kYXRhKTtcbn07XG4iLCJhamF4RGVmYXVsdHMucmVxdWVzdFR5cGVcdD0gXCJkZXRlY3RcIjtcbmFqYXhEZWZhdWx0cy5yZXNwb25zZVR5cGVcdD0gXCJkZXRlY3RcIjtcblxuei5yZWdpc3RlckFqYXhUeXBlID0gZnVuY3Rpb24gKHR5cGUsIG1pbWUsIGZuKSB7XG5cdGlmICghZm4gJiYgdHlwZW9mIG1pbWUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdGZuXHRcdD0gbWltZTtcblx0XHRtaW1lXHQ9IGZhbHNlO1xuXHR9XG5cblx0YWpheFR5cGVzW3R5cGVdID0gZm47XG5cblx0aWYgKG1pbWUpIHtcblx0XHRhamF4TWltZXNbbWltZV0gPSB0eXBlO1xuXHR9XG59O1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJkZXRlY3RcIiwgZnVuY3Rpb24gKGRhdGEsIGlzUmVzcG9uc2UpIHtcblx0dmFyIGhlYWRlcixcblx0XHR0eXBlID0gXCJ0ZXh0XCI7XG5cblx0aWYgKGlzUmVzcG9uc2UpIHtcblx0XHRoZWFkZXJcdD0gdGhpcy5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtVHlwZVwiKSB8fCBcIlwiLFxuXHRcdGhlYWRlclx0PSBoZWFkZXIuc3BsaXQoXCI7XCIpWzBdLnRyaW0oKTtcblx0XHR0eXBlXHQ9IGFqYXhNaW1lc1toZWFkZXJdIHx8IFwidGV4dFwiO1xuXHR9IGVsc2Uge1xuXHRcdGlmIChkYXRhICYmIHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICYmIGRhdGEudG9TdHJpbmcgPT09ICh7fSkudG9TdHJpbmcpIHtcblx0XHRcdHR5cGUgPSBcImpzb25cIjtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYWpheFR5cGVzW3R5cGVdLmNhbGwodGhpcywgZGF0YSwgaXNSZXNwb25zZSk7XG59KTtcblxuei5yZWdpc3RlckFqYXhUeXBlKFwianNvblwiLCBcImFwcGxpY2F0aW9uL2pzb25cIiwgZnVuY3Rpb24gKGRhdGEsIGlzUmVzcG9uc2UpIHtcblx0cmV0dXJuIGlzUmVzcG9uc2UgPyBKU09OLnBhcnNlKGRhdGEpIDogSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG59KTtcblxuei5yZWdpc3RlckFqYXhUeXBlKFwiaHRtbFwiLCBcInRleHQvaHRtbFwiLCBmdW5jdGlvbiAoZGF0YSwgaXNSZXNwb25zZSkge1xuXHR2YXIgZG9jLCBhcnI7XG5cblx0aWYgKCFpc1Jlc3BvbnNlKSB7XG5cdFx0cmV0dXJuIGRhdGEub3V0ZXJIVE1MO1xuXHR9XG5cblx0YXJyXHQ9IG5ldyB6QXJyYXkoKTtcblx0ZG9jID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KFwiXCIpO1xuXG5cdGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gZGF0YTtcblxuXHRhcnIucHVzaC5hcHBseShhcnIsIGFyci5zbGljZS5jYWxsKGRvYy5ib2R5LmNoaWxkcmVuLCAwKSk7XG5cblx0cmV0dXJuIGFycjtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJ4bWxcIiwgXCJ0ZXh0L3htbFwiLCBhamF4WE1MUGFyc2VyKTtcbnoucmVnaXN0ZXJBamF4VHlwZShcInhtbFwiLCBcImFwcGxpY2F0aW9uL3htbFwiLCBhamF4WE1MUGFyc2VyKTtcblxuZnVuY3Rpb24gYWpheFhNTFBhcnNlcihkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHZhciBwYXJzZXI7XG5cblx0aWYgKCFpc1Jlc3BvbnNlKSB7XG5cdFx0cGFyc2VyID0gbmV3IFhNTFNlcmlhbGl6ZXIoKTtcblx0XHRyZXR1cm4gcGFyc2VyLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpO1xuXHR9XG5cblx0aWYgKHRoaXMucmVzcG9uc2VYTUwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXNwb25zZVhNTDtcblx0fVxuXG5cdHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcblx0cmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoZGF0YSwgXCJhcHBsaWNhdGlvbi94bWxcIik7XG59XG4iLCJ6LmZuLmFkZENsYXNzID0gX2VhY2goX2FkZENsYXNzKTtcblxuei5mbi5yZW1vdmVDbGFzcyA9IF9lYWNoKF9yZW1vdmVDbGFzcyk7XG5cbnouZm4udG9nZ2xlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiB0b2dnbGVDbGFzcyhjbGFzc05hbWUsIGZvcmNlKSB7XG5cdHZhciBmbjtcblxuXHRpZiAoZm9yY2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdGZuID0gX2VsZW1IYXNDbGFzcyh0aGlzLCBjbGFzc05hbWUpID8gX3JlbW92ZUNsYXNzIDogX2FkZENsYXNzO1xuXHR9IGVsc2Uge1xuXHRcdGZuID0gZm9yY2UgPyBfYWRkQ2xhc3MgOiBfcmVtb3ZlQ2xhc3M7XG5cdH1cblxuXHRmbi5jYWxsKHRoaXMsIGNsYXNzTmFtZSk7XG59KTtcblxuei5mbi5oYXNDbGFzcyA9IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcblx0dmFyIGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdGlmIChfZWxlbUhhc0NsYXNzKHRoaXNbaV0sIGNsYXNzTmFtZSkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRDbGFzcyhjbGFzc05hbWUpIHtcblx0aWYgKFwiY2xhc3NMaXN0XCIgaW4gdGhpcykge1xuXHRcdHRoaXMuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMuY2xhc3NOYW1lICs9IFwiIFwiICsgY2xhc3NOYW1lO1xuXHR9XG59XG5cbmZ1bmN0aW9uIF9yZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0dmFyIHJlZ2V4cDtcblxuXHRpZiAoXCJjbGFzc0xpc3RcIiBpbiB0aGlzKSB7XG5cdFx0dGhpcy5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5jbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKF9jbGFzc1JlZ2V4cChjbGFzc05hbWUpLCBcIiBcIik7XG5cdH1cbn1cblxuZnVuY3Rpb24gX2NsYXNzUmVnZXhwKGNsYXNzTmFtZSkge1xuXHR2YXIgcmVnZXhwID0gX2NhY2hlLmdldChcImNsYXNzLlwiICsgY2xhc3NOYW1lKTtcblxuXHRpZiAoIXJlZ2V4cCkge1xuXHRcdHJlZ2V4cCA9IG5ldyBSZWdFeHAoXCIoXnxcXFxcYilcIiArIGNsYXNzTmFtZSArIFwiKFxcXFxifCQpXCIsIFwiZ1wiKTtcblx0XHRfY2FjaGUuc2V0KFwiY2xhc3MuXCIgKyBjbGFzc05hbWUsIHJlZ2V4cCk7XG5cdH1cblxuXHRyZXR1cm4gcmVnZXhwO1xufVxuXG5mdW5jdGlvbiBfZWxlbUhhc0NsYXNzKGVsZW0sIGNsYXNzTmFtZSkge1xuXHRpZiAoXCJjbGFzc0xpc3RcIiBpbiBlbGVtKSB7XG5cdFx0aWYgKGVsZW0uY2xhc3NMaXN0LmNvbnRhaW5zKGNsYXNzTmFtZSkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fSBlbHNlIGlmIChfY2xhc3NSZWdleHAoY2xhc3NOYW1lKS50ZXN0KGVsZW0uY2xhc3NOYW1lKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuIiwiei5mbi5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKGtleSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5zZXREYXRhKGtleSwgdmFsdWUpO1xuXHR9IGVsc2UgaWYgKHRoaXMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0RGF0YShrZXkpO1xuXHR9XG59O1xuXG56LmZuLnNldERhdGEgPSBfZWFjaChmdW5jdGlvbiBfc2V0RGF0YShrZXksIHZhbHVlKSB7XG5cdHZhciBlbGVtID0gdGhpcztcblxuXHRpZiAoXCJkYXRhc2V0XCIgaW4gZWxlbSkge1xuXHRcdGVsZW0uZGF0YXNldFtfdG9DYW1lbENhc2Uoa2V5KV0gPSB2YWx1ZTtcblx0fSBlbHNlIHtcblx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImRhdGEtXCIgKyBfdG9EYXNoZXMoa2V5KSwgdmFsdWUpO1xuXHR9XG59KTtcblxuei5mbi5nZXREYXRhID0gZnVuY3Rpb24gKGtleSkge1xuXHR2YXIgZWxlbSA9IHRoaXNbMF07XG5cblx0aWYgKCFlbGVtKSB7XG5cdFx0cmV0dXJuO1xuXHR9IGVsc2UgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYgKFwiZGF0YXNldFwiIGluIGVsZW0pIHtcblx0XHRcdHJldHVybiBlbGVtLmRhdGFzZXRbX3RvQ2FtZWxDYXNlKGtleSldO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5nZXRBdHRyaWJ1dGUoXCJkYXRhLVwiICsgX3RvRGFzaGVzKGtleSkpO1xuXHRcdH1cblx0fSBlbHNlIGlmIChcImRhdGFzZXRcIiBpbiBlbGVtKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5jcmVhdGUoZWxlbS5kYXRhc2V0KTtcblx0fVxuXG5cdHJldHVybiBfZ2V0RGF0YUF0dHJzKGVsZW0uYXR0cmlidXRlcyk7XG59O1xuXG5mdW5jdGlvbiBfZ2V0RGF0YUF0dHJzKGF0dHJzKSB7XG5cdHZhciBhdHRyLFxuXHRcdGlcdD0gMCxcblx0XHRsXHQ9IGF0dHJzLmxlbmd0aCxcblx0XHRyZXRcdD0ge307XG5cblx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRhdHRyID0gYXR0cnNbaV07XG5cblx0XHRpZiAoYXR0ci5uYW1lLmluZGV4T2YoXCJkYXRhLVwiKSA9PT0gMCkge1xuXHRcdFx0cmV0W190b0NhbWVsQ2FzZShhdHRyLm5hbWUucmVwbGFjZSgvXmRhdGEtLywgXCJcIikpXSA9IGF0dHIudmFsdWU7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJldDtcbn1cblxuei5kYXRhID0gZnVuY3Rpb24gKGVsZW0sIGtleSwgdmFsdWUpIHtcblx0eihlbGVtKS5kYXRhKGtleSwgdmFsdWUpO1xufTtcbiIsInouZm4ub24gPSB6LmZuLmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb24oZXZlbnRUeXBlLCBmbikge1xuXHR0aGlzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmbiwgZmFsc2UpO1xufSk7XG5cbnouZm4ub25lID0gX2VhY2goZnVuY3Rpb24gKGV2ZW50LCBmbikge1xuXHR2YXIgY2FsbGVkID0gZmFsc2U7XG5cblx0eih0aGlzKS5vbihldmVudCwgZnVuY3Rpb24gb25jZUZuKGUpIHtcblx0XHRpZiAoY2FsbGVkKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y2FsbGVkID0gdHJ1ZTtcblx0XHR6KHRoaXMpLm9mZihldmVudCwgb25jZUZuKTtcblxuXHRcdGZuLmNhbGwodGhpcywgZSk7XG5cdH0pO1xufSk7XG5cbnouZm4ub2ZmID0gei5mbi51bmJpbmQgPSBfZWFjaChmdW5jdGlvbiBfb2ZmKGV2ZW50VHlwZSwgZm4pIHtcblx0dGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZm4sIGZhbHNlKTtcbn0pO1xuXG56LmZuLnRyaWdnZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBkYXRhKSB7XG5cdHZhciBldmVudCxcblx0XHRpID0gMCxcblx0XHRsID0gdGhpcy5sZW5ndGg7XG5cblx0aWYgKGRhdGEgPT09IHVuZGVmaW5lZCkge1xuXHRcdGRhdGEgPSB7fTtcblx0fVxuXG5cdGRhdGEuZXZlbnQgPSBkYXRhO1xuXG5cdHRyeSB7XG5cdFx0ZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoZXZlbnRUeXBlLCB7XG5cdFx0XHRkZXRhaWw6IGRhdGFcblx0XHR9KTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0ZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcblx0XHRldmVudC5pbml0Q3VzdG9tRXZlbnQoZXZlbnRUeXBlLCB0cnVlLCB0cnVlLCBkYXRhKTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcbiIsImZ1bmN0aW9uIF9pc1dpdGhGdW5jdGlvbihlbGVtLCBmbikge1xuXHRyZXR1cm4gZm4uY2FsbChlbGVtLCBlbGVtKTtcbn1cblxuZnVuY3Rpb24gX2lzV2l0aEVsZW1lbnQoZWxlbTEsIGVsZW0yKSB7XG5cdHJldHVybiBlbGVtMSA9PT0gZWxlbTI7XG59XG5cbnouZm4uaXMgPSAoZnVuY3Rpb24gX2lzKCkge1xuXHR2YXIgbWF0Y2hlcyxcblx0XHRib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuXHRtYXRjaGVzXHQ9IGJvZHkubWF0Y2hlcyB8fCBib2R5Lm1hdGNoZXNTZWxlY3RvciB8fCBib2R5LndlYmtpdE1hdGNoZXNTZWxlY3Rvcjtcblx0bWF0Y2hlcyA9IG1hdGNoZXMgfHwgYm9keS5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgYm9keS5tc01hdGNoZXNTZWxlY3RvciB8fCBib2R5Lm9NYXRjaGVzU2VsZWN0b3I7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIGlzKHNlbGVjdG9yKSB7XG5cdFx0dmFyIF9pc1dpdGgsIHJldCxcblx0XHRcdGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGg7XG5cblx0XHRzd2l0Y2ggKHR5cGVvZiBzZWxlY3Rvcikge1xuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0XHRfaXNXaXRoID0gbWF0Y2hlcztcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwiZnVuY3Rpb25cIjpcblx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhGdW5jdGlvbjtcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwib2JqZWN0XCI6XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRzZWxlY3RvciBpbnN0YW5jZW9mIEVsZW1lbnQgfHxcblx0XHRcdFx0XHRzZWxlY3RvciBpbnN0YW5jZW9mIFdpbmRvdyB8fFxuXHRcdFx0XHRcdHNlbGVjdG9yIGluc3RhbmNlb2YgRG9jdW1lbnRcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhFbGVtZW50O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2lzIGlzIGludmFsaWRcIik7XG5cdFx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0Ly9icmVhaztcblx0XHR9XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gX2lzV2l0aCh0aGlzW2ldLCBzZWxlY3Rvcik7XG5cblx0XHRcdGlmIChyZXQpIHtcblx0XHRcdFx0cmV0dXJuIHJldDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG59KSgpO1xuIiwiei5mbi5oaWRlID0gX2VhY2goZnVuY3Rpb24gaGlkZSgpIHtcblx0dGhpcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cdHJldHVybiB0aGlzO1xufSk7XG5cbnouZm4uc2hvdyA9IF9lYWNoKGZ1bmN0aW9uIHNob3coKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG5cdHJldHVybiB0aGlzO1xufSk7XG5cbnouZm4uY2xvbmUgPSBmdW5jdGlvbiAoZGVlcCkge1xuXHR2YXIgaSA9IDA7XG5cblx0aWYgKGRlZXAgPT09IHVuZGVmaW5lZCB8fCBkZWVwID09PSBudWxsKSB7XG5cdFx0ZGVlcCA9IGZhbHNlO1xuXHR9XG5cblx0Zm9yICg7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dGhpc1tpXSA9IHRoaXNbaV0uY2xvbmVOb2RlKGRlZXApO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLmh0bWwgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIGksIGw7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpc1swXS5pbm5lckhUTUw7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLmlubmVySFRNTCA9IHZhbHVlO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLnRleHQgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIGksIGw7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy50ZXh0Q29udGVudDtcblx0fVxuXG5cdGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0udGV4dENvbnRlbnQgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5nZXRBdHRyID0gZnVuY3Rpb24gKGtleSkge1xuXHRpZiAoIWtleSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2dldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHRyZXR1cm4gdGhpc1swXSAmJiB0aGlzWzBdLmdldEF0dHJpYnV0ZShrZXkpO1xufTtcblxuei5mbi5zZXRBdHRyID0gX2VhY2goZnVuY3Rpb24gc2V0QXR0cihrZXksIHZhbHVlKSB7XG5cdGlmICgha2V5KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojc2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcblx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbn0pO1xuXG56LmZuLmF0dHIgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHIoa2V5KTtcblx0fVxuXG5cdHRoaXMuc2V0QXR0cihrZXksIHZhbHVlKTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLnJlcGxhY2VXaXRoID0gei5mbi5yZXBsYWNlID0gX2VhY2goZnVuY3Rpb24gcmVwbGFjZVdpdGgodmFsdWUpIHtcblx0dmFyIHNjcmlwdHM7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcblx0XHR0aGlzLnJlbW92ZSgpO1xuXHR9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgekFycmF5IHx8IHZhbHVlIGluc3RhbmNlb2YgRXZlbnRUYXJnZXQpIHtcblx0XHRzY3JpcHRzID0gX2V4dHJhY3RTY3JpcHRzKHZhbHVlKTtcblxuXHRcdGlmICh2YWx1ZSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdFx0dmFsdWUgPSB2YWx1ZVswXTtcblx0XHR9XG5cblx0XHR0aGlzLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHZhbHVlLCB0aGlzKTtcblxuXHRcdF9hZGRTY3JpcHRzKHNjcmlwdHMpO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMub3V0ZXJIVE1MID0gdmFsdWU7XG5cdH1cbn0pO1xuXG5mdW5jdGlvbiBfZXh0cmFjdFNjcmlwdHMoZWxlbSkge1xuXHR2YXIgc2NyaXB0cyxcblx0XHRpXHQ9IDAsXG5cdFx0cmV0XHQ9IFtdO1xuXG5cdGVsZW1cdD0geihlbGVtKTtcblx0c2NyaXB0c1x0PSBlbGVtLmZpbmQoXCJzY3JpcHRcIik7XG5cblx0Zm9yICg7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0cmV0LnB1c2goe1xuXHRcdFx0c3JjOiBzY3JpcHRzW2ldLnNyYyxcblx0XHRcdHRleHQ6IHNjcmlwdHNbaV0udGV4dENvbnRlbnRcblx0XHR9KTtcblxuXHRcdHNjcmlwdHNbaV0ucmVtb3ZlKCk7XG5cdH1cblxuXHRyZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfYWRkU2NyaXB0cyhzY3JpcHRzKSB7XG5cdHZhciBzY3JpcHQsXG5cdFx0aSA9IDA7XG5cblx0Zm9yICg7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0c2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcblxuXHRcdGlmIChzY3JpcHRzW2ldLnNyYykge1xuXHRcdFx0c2NyaXB0LnNyYyA9IHNjcmlwdHNbaV0uc3JjO1xuXHRcdH0gZWxzZSBpZiAoc2NyaXB0c1tpXS50ZXh0KSB7XG5cdFx0XHRzY3JpcHQudGV4dCA9IHNjcmlwdHNbaV0udGV4dDtcblx0XHR9XG5cblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCkucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuXHR9XG59XG5cbnouZm4uYXBwZW5kID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBlbGVtZW50LFxuXHRcdGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2FwcGVuZCBpcyByZXF1aXJlZC5cIik7XG5cdH1cblxuXHRpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHRoaXNbaV0uaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCB2YWx1ZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHRpZiAodmFsdWUgaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHR2YWx1ZSA9IHZhbHVlWzBdO1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLmFwcGVuZENoaWxkKHZhbHVlKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5wcmVwZW5kID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBlbGVtZW50LFxuXHRcdGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3ByZXBlbmQgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIHZhbHVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdGlmICh2YWx1ZSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHZhbHVlID0gdmFsdWVbMF07XG5cdH1cblxuXHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0uaW5zZXJ0QmVmb3JlKHZhbHVlLCB0aGlzW2ldLmZpcnN0Q2hpbGQpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLmFmdGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBlbGVtZW50LFxuXHRcdGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I2FwcGVuZCBpcyByZXF1aXJlZC5cIik7XG5cdH1cblxuXHRpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHRoaXNbaV0uaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYWZ0ZXJlbmRcIiwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aWYgKHZhbHVlIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0dmFsdWUgPSB2YWx1ZVswXTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbnNlcnRBZGphY2VudEhUTUwoXCJhZnRlcmVuZFwiLCB2YWx1ZS5vdXRlckhUTUwpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG56LmZuLmNzcyA9IGZ1bmN0aW9uIChydWxlLCB2YWx1ZSkge1xuXHR2YXIgaSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdGlmIChydWxlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNjc3MgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzWzBdKVtydWxlXTtcblx0fSBlbHNlIHtcblx0XHRydWxlID0gcnVsZS5yZXBsYWNlKC8tLi9nLCBmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0ICAgIHJldHVybiByZXN1bHQuc3Vic3RyKDEpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fSk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5zdHlsZVtydWxlXSA9IHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5yZW1vdmUgPSBfZWFjaChmdW5jdGlvbiByZW1vdmUoKSB7XG5cdHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcbn0pO1xuXG56LmZuLmVtcHR5ID0gX2VhY2goZnVuY3Rpb24gZW1wdHkoKSB7XG5cdHRoaXMuaW5uZXJIVE1MID0gJyc7XG59KTtcbiIsInZhciBfc2VsZWN0b3JzQ2FjaGUsXG5cdF9zZWxlY3RvcnMgPSB7fTtcblxuZnVuY3Rpb24gX2ZpbmQoc2NvcGUsIHN0ckVsZW0pIHtcblx0dmFyIHJldCA9IG5ldyB6QXJyYXkoKTtcblxuXHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIF9maW5kRm9yRWFjaChzY29wZWRFbGVtKSB7XG5cdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0KHNjb3BlZEVsZW0sIHN0ckVsZW0pKTtcblx0fSk7XG5cblx0cmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSB7XG5cdGlmICghfnN0ckVsZW0uaW5kZXhPZihcIjpcIikgfHwgX3NlbGVjdG9yc0NhY2hlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKHN0ckVsZW0pO1xuXHR9XG5cblx0aWYgKF9zZWxlY3RvcnNDYWNoZSA9PT0gZmFsc2UpIHtcblx0XHRfZ2VuZXJhdGVTZWxlY3RvcnNDYWNoZSgpO1xuXHR9XG5cblx0aWYgKCFzdHJFbGVtLm1hdGNoKF9zZWxlY3RvcnNDYWNoZSkpIHtcblx0XHRyZXR1cm4gc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKHN0ckVsZW0pO1xuXHR9XG5cblx0cmV0dXJuIF9zZWxlY3QyKHNjb3BlZEVsZW0sIHN0ckVsZW0pO1xufVxuXG5mdW5jdGlvbiBfc2VsZWN0MihzY29wZWRFbGVtLCBzdHJFbGVtKSB7XG5cdHZhciBlbnRyeSwgc2VsZWN0b3JzLFxuXHRcdHNjb3BlXHQ9IG5ldyB6QXJyYXkoc2NvcGVkRWxlbSksXG5cdFx0Y3VycmVudFx0PSBcIlwiLFxuXHRcdGVudHJpZXNcdD0gc3RyRWxlbS5zcGxpdCgvXFxzKy8pO1xuXG5cdHdoaWxlIChlbnRyeSA9IGVudHJpZXMuc2hpZnQoKSkge1xuXHRcdHNlbGVjdG9ycyA9IGVudHJ5Lm1hdGNoKF9zZWxlY3RvcnNDYWNoZSk7XG5cblx0XHRpZiAoIXNlbGVjdG9ycykge1xuXHRcdFx0Y3VycmVudCArPSBlbnRyeSArIFwiIFwiO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Y3VycmVudFx0Kz0gZW50cnkucmVwbGFjZShfc2VsZWN0b3JzQ2FjaGUsIFwiXCIpIHx8IFwiKlwiO1xuXHRcdGVudHJ5XHQ9IG5ldyB6QXJyYXkoKTtcblxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gX3NlbGVjdEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdFx0dmFyIHJldCA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdFx0c2VsZWN0b3JzLmZvckVhY2goZnVuY3Rpb24gc2VsZWN0b3JzRm9yRWFjaChzZWxlY3Rvcikge1xuXHRcdFx0XHRyZXQucHVzaC5hcHBseShyZXQsIF9zZWxlY3RvcnNbc2VsZWN0b3JdLmNhbGwoc2NvcGVkRWxlbSwgY3VycmVudCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGVudHJ5LnB1c2guYXBwbHkoZW50cnksIHJldCk7XG5cdFx0fSk7XG5cblx0XHRzY29wZVx0PSBlbnRyeTtcblx0XHRjdXJyZW50XHQ9IFwiXCI7XG5cdH1cblxuXHRpZiAoY3VycmVudCkge1xuXHRcdGVudHJ5ID0gbmV3IHpBcnJheSgpO1xuXG5cdFx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBjdXJyZW50Rm9yRWFjaChzY29wZWRFbGVtKSB7XG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudCkpO1xuXHRcdH0pO1xuXG5cdFx0c2NvcGUgPSBlbnRyeTtcblx0fVxuXG5cdHJldHVybiBzY29wZTtcbn1cblxuZnVuY3Rpb24gX2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKSB7XG5cdHZhciBzZWxlY3RvcnNcdD0gT2JqZWN0LmtleXMoX3NlbGVjdG9ycykuam9pbihcInxcIikucmVwbGFjZSgvOi9nLCBcIlwiKTtcblx0X3NlbGVjdG9yc0NhY2hlXHQ9IG5ldyBSZWdFeHAoXCI6KFwiICsgc2VsZWN0b3JzICsgXCIpXCIsIFwiZ1wiKTtcbn1cbiIsInoucmVnaXN0ZXJTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZm4pIHtcblx0aWYgKCFzZWxlY3RvciB8fCB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBzdHJpbmcgc2VsZWN0b3JcIik7XG5cdH0gZWxzZSBpZiAoIWZuIHx8IHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3JlZ2lzdGVyU2VsZWN0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuXHR9XG5cblx0aWYgKHNlbGVjdG9yWzBdICE9PSBcIjpcIikge1xuXHRcdHNlbGVjdG9yID0gXCI6XCIgKyBzZWxlY3Rvcjtcblx0fVxuXG5cdF9zZWxlY3RvcnNDYWNoZVx0XHRcdD0gZmFsc2U7XG5cdF9zZWxlY3RvcnNbc2VsZWN0b3JdXHQ9IGZuO1xufTtcblxuei5yZWdpc3RlclNlbGVjdG9yKFwiOmZpcnN0XCIsIGZ1bmN0aW9uIHNlbGVjdG9yRmlyc3QocXVlcnkpIHtcblx0cmV0dXJuIHoodGhpcy5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSk7XG59KTtcblxuei5yZWdpc3RlclNlbGVjdG9yKFwiOmlucHV0XCIsIChmdW5jdGlvbiBzZWxlY3RvckZpcnN0KCkge1xuXHR2YXIgdGFncyA9IFwiSU5QVVQsVEVYVEFSRUEsU0VMRUNULEJVVFRPTlwiLnNwbGl0KFwiLFwiKTtcblxuXHRmdW5jdGlvbiBmaWx0ZXIoZWxlbWVudCkge1xuXHRcdHJldHVybiB+dGFncy5pbmRleE9mKGVsZW1lbnQudGFnTmFtZSk7XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24gc2VsZWN0b3JJbnB1dChxdWVyeSkge1xuXHRcdHZhciBlbGVtZW50cyA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdGVsZW1lbnRzLnB1c2guYXBwbHkoZWxlbWVudHMsIFtdLmZpbHRlci5jYWxsKHRoaXMucXVlcnlTZWxlY3RvckFsbChxdWVyeSksIGZpbHRlcikpO1xuXG5cdFx0cmV0dXJuIGVsZW1lbnRzO1xuXHR9O1xufSkoKSk7XG4iLCJ6LmZuLnBhcmVudCA9IF9lYWNoTmV3KGZ1bmN0aW9uIHBhcmVudCgpIHtcblx0cmV0dXJuIHRoaXMucGFyZW50Tm9kZTtcbn0pO1xuXG56LmZuLm5leHQgPSBfZWFjaE5ldyhmdW5jdGlvbiBuZXh0KCkge1xuXHRyZXR1cm4gdGhpcy5uZXh0RWxlbWVudFNpYmxpbmc7XG59KTtcblxuei5mbi5wcmV2ID0gei5mbi5wcmV2aW91cyA9IF9lYWNoTmV3KGZ1bmN0aW9uIHByZXYoKSB7XG5cdHJldHVybiB0aGlzLnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG59KTtcblxuei5mbi5zaWJsaW5ncyA9IF9lYWNoTmV3KGZ1bmN0aW9uIHNpYmxpbmdzKCkge1xuXHRyZXR1cm4gW10uZmlsdGVyLmNhbGwodGhpcy5wYXJlbnROb2RlLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuXHRcdHJldHVybiBjaGlsZCAhPT0gdGhpcztcblx0fSwgdGhpcyk7XG59KTtcblxuei5mbi5uZXh0QWxsID0gX2VhY2hOZXcoZnVuY3Rpb24gbmV4dEFsbCgpe1xuXHRyZXR1cm4gZGlyKHRoaXMsIFwibmV4dEVsZW1lbnRTaWJsaW5nXCIpO1xufSk7XG5cbnouZm4ucHJldkFsbCA9IF9lYWNoTmV3KGZ1bmN0aW9uIHByZXZBbGwoKXtcblx0cmV0dXJuIGRpcih0aGlzLCBcInByZXZpb3VzRWxlbWVudFNpYmxpbmdcIik7XG59KTtcblxuei5mbi5jaGlsZHJlbiA9IF9lYWNoTmV3KGZ1bmN0aW9uIGNoaWxkcmVuKHNlbGVjdG9yKSB7XG5cdHJldHVybiB0aGlzLmNoaWxkcmVuO1xufSk7XG4iLCJ2YXIgcmVnZXhwRGFzaFx0XHQ9IC8tKC4pL2csXG5cdHJlZ2V4cFVwcGVyQ2FzZVx0PSAvKD8hXikoW0EtWl0pL2c7XG5cbmZ1bmN0aW9uIF90b0NhbWVsQ2FzZShzdHJpbmcpIHtcblx0cmV0dXJuIHN0cmluZy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UocmVnZXhwRGFzaCwgX3RvQ2FtZWxDYXNlSGVscGVyKTtcbn1cblxuZnVuY3Rpb24gX3RvQ2FtZWxDYXNlSGVscGVyKG1hdGNoLCBncm91cCkge1xuXHRyZXR1cm4gZ3JvdXAudG9VcHBlckNhc2UoKTtcbn1cblxuZnVuY3Rpb24gX3RvRGFzaGVzKHN0cmluZykge1xuXHRyZXR1cm4gc3RyaW5nLnJlcGxhY2UocmVnZXhwVXBwZXJDYXNlLCBfdG9EYXNoZXNIZWxwZXIpLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIF90b0Rhc2hlc0hlbHBlcihtYXRjaCwgZ3JvdXApIHtcblx0cmV0dXJuICctJyArIGdyb3VwLnRvTG93ZXJDYXNlKCk7XG59XG5cbnZhciBfY2FjaGUgPSAoZnVuY3Rpb24gKCkge1xuXHR2YXIgY2FjaGU7XG5cblx0aWYgKFwiTWFwXCIgaW4gd2luZG93KSB7XG5cdFx0cmV0dXJuIG5ldyBNYXAoKTtcblx0fVxuXG5cdGNhY2hlID0ge307XG5cblx0cmV0dXJuIHtcblx0XHRzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0XHRjYWNoZVtrZXldID0gdmFsdWU7XG5cdFx0fSxcblx0XHRnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHJldHVybiBjYWNoZVtrZXldO1xuXHRcdH1cblx0fTtcbn0pO1xuXG5mdW5jdGlvbiBfY2hlY2tWYWxpZEVsZW1lbnQoZWxlbSkge1xuXHRpZiAoZWxlbSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKGVsZW0gaW5zdGFuY2VvZiBFbGVtZW50IHx8IGVsZW0gaW5zdGFuY2VvZiBXaW5kb3cgfHwgZWxlbSBpbnN0YW5jZW9mIERvY3VtZW50KSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRpZiAodHlwZW9mIGVsZW0gPT09IFwic3RyaW5nXCIpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5mdW5jdGlvbiBfZWFjaChmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgaVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aDtcblxuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRmbi5hcHBseSh0aGlzW2ldLCBhcmd1bWVudHMpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBfZWFjaE5ldyhmbikge1xuXHRyZXR1cm4gZnVuY3Rpb24gcnVuRWFjaCgpIHtcblx0XHR2YXIgcmV0LFxuXHRcdFx0aVx0PSAwLFxuXHRcdFx0bFx0PSB0aGlzLmxlbmd0aCxcblx0XHRcdGFyclx0PSBuZXcgekFycmF5KCk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0cmV0ID0gZm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblxuXHRcdFx0aWYgKHJldCkge1xuXHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShyZXQpICYmIHJldC5sZW5ndGggfHwgcmV0IGluc3RhbmNlb2YgSFRNTENvbGxlY3Rpb24pIHtcblx0XHRcdFx0XHRhcnIucHVzaC5hcHBseShhcnIsIHJldCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyLnB1c2gocmV0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnI7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGRpcihlbGVtLCBrZXkpIHtcblx0dmFyIG1hdGNoZWQgPSBuZXcgekFycmF5KCk7XG5cblx0d2hpbGUgKGVsZW1ba2V5XSAmJiBlbGVtLm5vZGVUeXBlID09PSAxKSB7XG5cdFx0ZWxlbSA9IGVsZW1ba2V5XTtcblx0XHRtYXRjaGVkLnB1c2goZWxlbSk7XG5cdH1cblxuXHRyZXR1cm4gbWF0Y2hlZDtcbn1cblxuei5kZWVwRXh0ZW5kID0gZnVuY3Rpb24gX2V4dGVuZChkZWVwKSB7XG5cdHZhciBvYmosIHRhcmdldCxcblx0XHRpID0gMjtcblxuXHRpZiAodHlwZW9mIGRlZXAgPT09IFwib2JqZWN0XCIpIHtcblx0XHR0YXJnZXRcdD0gZGVlcCB8fCB7fTtcblx0XHRkZWVwXHQ9IEluZmluaXR5O1xuXHR9IGVsc2Uge1xuXHRcdGRlZXBcdD0gZGVlcCA9PT0gdHJ1ZSA/IEluZmluaXR5IDogKGRlZXAgfCAwKTtcblx0XHR0YXJnZXRcdD0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHR9XG5cblx0Zm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRvYmogPSBhcmd1bWVudHNbaV07XG5cblx0XHRpZiAoIW9iaikge1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGlmIChkZWVwICYmIHR5cGVvZiBvYmpba2V5XSA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0XHRcdF9leHRlbmQoZGVlcCAtIDEsIHRhcmdldFtrZXldLCBvYmpba2V5XSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0YXJnZXQ7XG59O1xuXG56LmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcblx0W10udW5zaGlmdC5jYWxsKGFyZ3VtZW50cywgMCk7XG5cdHJldHVybiB6LmRlZXBFeHRlbmQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5cbnouZm4uZWFjaCA9IF9lYWNoKGZ1bmN0aW9uIGVhY2goZm4pIHtcblx0Zm4uY2FsbCh0aGlzLCB0aGlzKTtcblx0cmV0dXJuIHRoaXM7XG59KTtcblxuei5xdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvYmosIHByZWZpeCkge1xuXHR2YXIgaSwga2V5LCB2YWwsXG5cdFx0c3RyaW5ncyA9IFtdO1xuXG5cdGZvciAoaSBpbiBvYmopIHtcblx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRpZiAocHJlZml4KSB7XG5cdFx0XHRcdGtleSA9IHByZWZpeCArIFwiW1wiICsgaSArIFwiXVwiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0a2V5ID0gaTtcblx0XHRcdH1cblxuXHRcdFx0dmFsID0gb2JqW2ldO1xuXG5cdFx0XHRpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0c3RyaW5ncy5wdXNoKHoucXVlcnlTdHJpbmcodmFsLCBrZXkpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHN0cmluZ3MucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdHJpbmdzLmpvaW4oXCImXCIpO1xufTtcbiIsIn0pKHdpbmRvdywgZG9jdW1lbnQpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9