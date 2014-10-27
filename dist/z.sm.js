/*!
 * z.js JavaScript Library v0.0.4
 * https://github.com/NEURS/z.js
 *
 * Copyright 2014 NEURS LLC, Kevin J. Martin, and other contributors
 * Released under the MIT license
 * https://github.com/NEURS/z.js/blob/master/LICENSE
 *
 * Date: 2014-10-27T22:06Z
 */
;(function (window, document) {

var zArray, _window, _document, iframe;

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

z.data = function (elem, key, value) {
	z(elem).data(key, value);
};

z.fn.on = z.fn.bind = _each(function _on(eventType, fn) {
	this.addEventListener(eventType, fn, false);
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
}

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
}

z.fn.after = function (value) {
	var element,
		i = 0,
		l = this.length;

	if (value === undefined) {
		throw new Error("First parameter of z#append is required.");
	}

	if (typeof value === "string") {
		for (; i < l; i++) {
			this[i].insertAdjacentHTML('afterend', value);
		}

		return this;
	}

	if (value instanceof zArray) {
		value = value[0];
	}

	for (; i < l; i++) {
		this[i].insertAdjacentHTML('afterend', value.outerHTML);
	}

	return this;
}

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
}

z.fn.remove = _each(function () {
	this.parentNode.removeChild(this);
});

z.fn.empty = _each(function () {
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

z.fn.prevAll = _eachNew(function(){
	return dir(this, "previousElementSibling");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9oZWFkZXIuanMiLCJfYmFzZS5qcyIsImFqYXguanMiLCJhamF4X3R5cGVzLmpzIiwiZGF0YS5qcyIsImV2ZW50cy5qcyIsImZpbHRlcmluZy5qcyIsIm1hbmlwdWxhdGlvbi5qcyIsInNlbGVjdG9ycy5qcyIsInNlbGVjdG9yc19jdXN0b20uanMiLCJ0cmF2ZXJzaW5nLmpzIiwidXRpbHMuanMiLCJfZm9vdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hJQTtBQUNBIiwiZmlsZSI6Inouc20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIHouanMgSmF2YVNjcmlwdCBMaWJyYXJ5IHZAVkVSU0lPTlxuICogaHR0cHM6Ly9naXRodWIuY29tL05FVVJTL3ouanNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNCBORVVSUyBMTEMsIEtldmluIEouIE1hcnRpbiwgYW5kIG90aGVyIGNvbnRyaWJ1dG9yc1xuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vTkVVUlMvei5qcy9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKlxuICogRGF0ZTogQERBVEVcbiAqL1xuOyhmdW5jdGlvbiAod2luZG93LCBkb2N1bWVudCkge1xuIiwidmFyIHpBcnJheSwgX3dpbmRvdywgX2RvY3VtZW50LCBpZnJhbWU7XG5cbmZ1bmN0aW9uIHooZWxlbSwgc2NvcGUpIHtcblx0aWYgKGVsZW0gaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHRyZXR1cm4gZWxlbTtcblx0fSBlbHNlIGlmIChlbGVtIGluc3RhbmNlb2YgRWxlbWVudCB8fCBlbGVtIGluc3RhbmNlb2YgV2luZG93IHx8IGVsZW0gaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuXHRcdHJldHVybiBuZXcgekFycmF5KGVsZW0pO1xuXHR9IGVsc2UgaWYgKGVsZW0gPT09IHVuZGVmaW5lZCB8fCBlbGVtID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIG5ldyB6QXJyYXkoKTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZWxlbSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBpcyBpbnZhbGlkXCIpO1xuXHR9XG5cblx0aWYgKHNjb3BlKSB7XG5cdFx0aWYgKCFfY2hlY2tWYWxpZEVsZW1lbnQoc2NvcGUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIGlzIGludmFsaWRcIik7XG5cdFx0fVxuXG5cdFx0c2NvcGUgPSB6KHNjb3BlKTtcblx0fSBlbHNlIHtcblx0XHRzY29wZSA9IF9kb2N1bWVudDtcblx0fVxuXG5cdHJldHVybiBfZmluZChzY29wZSwgZWxlbSk7XG59XG5cbmZ1bmN0aW9uIG5vb3AoKXt9XG5cbnRyeSB7XG5cdGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG5cblx0aWZyYW1lLnN0eWxlLndpZHRoXHRcdFx0PSAwO1xuXHRpZnJhbWUuc3R5bGUuaGVpZ2h0XHRcdFx0PSAwO1xuXHRpZnJhbWUuc3R5bGUuYm9yZGVyU3R5bGVcdD0gXCJub25lXCI7XG5cblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuXG5cdHpBcnJheSA9IGlmcmFtZS5jb250ZW50V2luZG93LkFycmF5O1xuXG5cdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbn0gY2F0Y2ggKGUpIHtcblx0ekFycmF5ID0gQXJyYXk7XG59XG5cbi8vd2luZG93LiRcdD0gejtcbndpbmRvdy56XHQ9IHo7XG56LmZuXHRcdD0gekFycmF5LnByb3RvdHlwZTtcbl93aW5kb3dcdFx0PSB6KHdpbmRvdyk7XG5fZG9jdW1lbnRcdD0geihkb2N1bWVudCk7XG5cbnouZm4uZmluZCA9IGZ1bmN0aW9uIChzdHJFbGVtKSB7XG5cdGlmICh0eXBlb2Ygc3RyRWxlbSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtYXRlciBvZiB6I2ZpbmQoKSBzaG91bGQgYmUgYSBzdHJpbmdcIik7XG5cdH1cblxuXHRyZXR1cm4gX2ZpbmQodGhpcywgc3RyRWxlbSk7XG59O1xuIiwidmFyIGFqYXhEZWZhdWx0cywgYWpheFR5cGVzLFxuXHRhamF4TWltZXNcdD0ge31cblxuYWpheERlZmF1bHRzID0ge1xuXHRtZXRob2Q6IFwiR0VUXCIsXG5cdHJlcXVlc3RUeXBlOiBcInRleHRcIixcblx0cmVzcG9uc2VUeXBlOiBcInRleHRcIixcblx0dXJsOiB3aW5kb3cubG9jYXRpb24gKyBcIlwiLFxuXHRxdWVyeTogbnVsbCxcblx0ZGF0YTogbnVsbCxcblx0c2V0dXA6IG5vb3AsXG5cdHN1Y2Nlc3M6IG5vb3AsXG5cdGVycm9yOiBub29wXG59O1xuXG5hamF4VHlwZXMgPSB7XG5cdHRleHQ6IGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0cmV0dXJuIChkYXRhIHx8IFwiXCIpICsgXCJcIjtcblx0fVxufTtcblxuei5hamF4ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0dmFyIGRhdGEsXG5cdFx0cmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cblx0b3B0aW9ucyA9IHouZXh0ZW5kKHtcblx0XHRjb250ZXh0OiByZXFcblx0fSwgYWpheERlZmF1bHRzLCBvcHRpb25zKTtcblxuXHRpZiAoIWFqYXhUeXBlc1tvcHRpb25zLnJlcXVlc3RUeXBlXSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgb3B0aW9uIGByZXF1ZXN0VHlwZWBcIik7XG5cdH0gZWxzZSBpZiAoIWFqYXhUeXBlc1tvcHRpb25zLnJlc3BvbnNlVHlwZV0pIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG9wdGlvbiBgcmVzcG9uc2VUeXBlYFwiKTtcblx0fVxuXG5cdGlmIChvcHRpb25zLnF1ZXJ5ICYmIH5bXCJIRUFEXCIsIFwiR0VUXCJdLmluZGV4T2Yob3B0aW9ucy5tZXRob2QudG9VcHBlckNhc2UoKSkpIHtcblx0XHRvcHRpb25zLnVybFx0Kz0gfm9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpID8gXCImXCIgOiBcIj9cIjtcblx0XHRvcHRpb25zLnVybFx0Kz0gei5xdWVyeVN0cmluZyhvcHRpb25zLnF1ZXJ5KTtcblx0XHRvcHRpb25zLnVybFx0PSBvcHRpb25zLnVybC5yZXBsYWNlKC8oXFw/fCYpJi9nLCBcIiQxXCIpO1xuXHR9XG5cblx0cmVxLm9wZW4ob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMudXJsLCB0cnVlKTtcblxuXHRyZXEub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciByZXNwO1xuXG5cdFx0aWYgKHJlcS5zdGF0dXMgPj0gMjAwICYmIHJlcS5zdGF0dXMgPCA0MDApIHtcblx0XHRcdHJlc3AgPSBhamF4VHlwZXNbb3B0aW9ucy5yZXNwb25zZVR5cGVdLmNhbGwocmVxLCByZXEucmVzcG9uc2VUZXh0LCB0cnVlKTtcblx0XHRcdG9wdGlvbnMuc3VjY2Vzcy5jYWxsKG9wdGlvbnMuY29udGV4dCwgcmVzcCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9wdGlvbnMuZXJyb3IuY2FsbChvcHRpb25zLmNvbnRleHQsIHJlcS5zdGF0dXMsIHJlcS5zdGF0dXNUZXh0KTtcblx0XHR9XG5cdH07XG5cblx0cmVxLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdFx0b3B0aW9ucy5lcnJvci5jYWxsKG9wdGlvbnMuY29udGV4dCwgcmVxLnN0YXR1cywgcmVxLnN0YXR1c1RleHQpO1xuXHR9O1xuXG5cdGlmICghfltcIkhFQURcIiwgXCJHRVRcIl0uaW5kZXhPZihvcHRpb25zLm1ldGhvZC50b1VwcGVyQ2FzZSgpKSkge1xuXHRcdHJlcS5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIpO1xuXHR9XG5cblx0aWYgKG9wdGlvbnMuZGF0YSkge1xuXHRcdG9wdGlvbnMuZGF0YSA9IGFqYXhUeXBlc1tvcHRpb25zLnJlcXVlc3RUeXBlXS5jYWxsKHJlcSwgb3B0aW9ucy5kYXRhLCBmYWxzZSk7XG5cdH1cblxuXHRvcHRpb25zLnNldHVwLmNhbGwocmVxLCByZXEpO1xuXG5cdHJlcS5zZW5kKG9wdGlvbnMuZGF0YSk7XG59O1xuIiwiYWpheERlZmF1bHRzLnJlcXVlc3RUeXBlXHQ9IFwiZGV0ZWN0XCI7XG5hamF4RGVmYXVsdHMucmVzcG9uc2VUeXBlXHQ9IFwiZGV0ZWN0XCI7XG5cbnoucmVnaXN0ZXJBamF4VHlwZSA9IGZ1bmN0aW9uICh0eXBlLCBtaW1lLCBmbikge1xuXHRpZiAoIWZuICYmIHR5cGVvZiBtaW1lID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRmblx0XHQ9IG1pbWU7XG5cdFx0bWltZVx0PSBmYWxzZTtcblx0fVxuXG5cdGFqYXhUeXBlc1t0eXBlXSA9IGZuO1xuXG5cdGlmIChtaW1lKSB7XG5cdFx0YWpheE1pbWVzW21pbWVdID0gdHlwZTtcblx0fVxufTtcblxuei5yZWdpc3RlckFqYXhUeXBlKFwiZGV0ZWN0XCIsIGZ1bmN0aW9uIChkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHZhciBoZWFkZXIsXG5cdFx0dHlwZSA9IFwidGV4dFwiO1xuXG5cdGlmIChpc1Jlc3BvbnNlKSB7XG5cdFx0aGVhZGVyXHQ9IHRoaXMuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIikgfHwgXCJcIixcblx0XHRoZWFkZXJcdD0gaGVhZGVyLnNwbGl0KFwiO1wiKVswXS50cmltKCk7XG5cdFx0dHlwZVx0PSBhamF4TWltZXNbaGVhZGVyXSB8fCBcInRleHRcIjtcblx0fSBlbHNlIHtcblx0XHRpZiAoZGF0YSAmJiB0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIiAmJiBkYXRhLnRvU3RyaW5nID09PSAoe30pLnRvU3RyaW5nKSB7XG5cdFx0XHR0eXBlID0gXCJqc29uXCI7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGFqYXhUeXBlc1t0eXBlXS5jYWxsKHRoaXMsIGRhdGEsIGlzUmVzcG9uc2UpO1xufSk7XG5cbnoucmVnaXN0ZXJBamF4VHlwZShcImpzb25cIiwgXCJhcHBsaWNhdGlvbi9qc29uXCIsIGZ1bmN0aW9uIChkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHJldHVybiBpc1Jlc3BvbnNlID8gSlNPTi5wYXJzZShkYXRhKSA6IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xufSk7XG5cbnoucmVnaXN0ZXJBamF4VHlwZShcImh0bWxcIiwgXCJ0ZXh0L2h0bWxcIiwgZnVuY3Rpb24gKGRhdGEsIGlzUmVzcG9uc2UpIHtcblx0dmFyIGRvYywgYXJyO1xuXG5cdGlmICghaXNSZXNwb25zZSkge1xuXHRcdHJldHVybiBkYXRhLm91dGVySFRNTDtcblx0fVxuXG5cdGFyclx0PSBuZXcgekFycmF5KCk7XG5cdGRvYyA9IGRvY3VtZW50LmltcGxlbWVudGF0aW9uLmNyZWF0ZUhUTUxEb2N1bWVudCgpO1xuXG5cdGRvYy5kb2N1bWVudEVsZW1lbnQuaW5uZXJIVE1MID0gZGF0YTtcblxuXHRhcnIucHVzaC5hcHBseShhcnIsIGFyci5zbGljZS5jYWxsKGRvYy5ib2R5LmNoaWxkcmVuLCAwKSk7XG5cblx0cmV0dXJuIGFycjtcbn0pO1xuXG56LnJlZ2lzdGVyQWpheFR5cGUoXCJ4bWxcIiwgXCJ0ZXh0L3htbFwiLCBhamF4WE1MUGFyc2VyKTtcbnoucmVnaXN0ZXJBamF4VHlwZShcInhtbFwiLCBcImFwcGxpY2F0aW9uL3htbFwiLCBhamF4WE1MUGFyc2VyKTtcblxuZnVuY3Rpb24gYWpheFhNTFBhcnNlcihkYXRhLCBpc1Jlc3BvbnNlKSB7XG5cdHZhciBwYXJzZXI7XG5cblx0aWYgKCFpc1Jlc3BvbnNlKSB7XG5cdFx0cGFyc2VyID0gbmV3IFhNTFNlcmlhbGl6ZXIoKTtcblx0XHRyZXR1cm4gcGFyc2VyLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpO1xuXHR9XG5cblx0aWYgKHRoaXMucmVzcG9uc2VYTUwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXNwb25zZVhNTDtcblx0fVxuXG5cdHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcblx0cmV0dXJuIHBhcnNlci5wYXJzZUZyb21TdHJpbmcoZGF0YSwgXCJhcHBsaWNhdGlvbi94bWxcIik7XG59XG4iLCJpZiAoXCJkYXRhc2V0XCIgaW4gZG9jdW1lbnQuYm9keSkge1xuXHR6LmZuLmRhdGEgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdHZhciBpLCBsO1xuXG5cdFx0aWYgKCF0aGlzLmxlbmd0aCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbMF0uZGF0YXNldDtcblx0XHR9IGVsc2UgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiB0aGlzWzBdLmRhdGFzZXRba2V5XTtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHRoaXNbaV0uZGF0YXNldFtrZXldID0gdmFsdWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG59IGVsc2Uge1xuXHR6LmZuLmRhdGEgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdHZhciBpLCBsLFxuXHRcdFx0ZGF0YUtleSA9IFwiZGF0YS1cIiArIChrZXkgfHwgXCJcIik7XG5cblx0XHRpZiAoIXRoaXMubGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRpID0ge307XG5cblx0XHRcdFtdLmZvckVhY2guY2FsbCh0aGlzWzBdLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uIChhdHRyKSB7XG5cdFx0XHRcdHJldHVybiBpW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBpO1xuXHRcdH0gZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbMF0uYXR0cmlidXRlc1tkYXRhS2V5XTtcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHRoaXNbaV0uZGF0YXNldFtkYXRhS2V5XSA9IHZhbHVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG56LmRhdGEgPSBmdW5jdGlvbiAoZWxlbSwga2V5LCB2YWx1ZSkge1xuXHR6KGVsZW0pLmRhdGEoa2V5LCB2YWx1ZSk7XG59O1xuIiwiei5mbi5vbiA9IHouZm4uYmluZCA9IF9lYWNoKGZ1bmN0aW9uIF9vbihldmVudFR5cGUsIGZuKSB7XG5cdHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGZuLCBmYWxzZSk7XG59KTtcblxuei5mbi5vZmYgPSB6LmZuLnVuYmluZCA9IF9lYWNoKGZ1bmN0aW9uIF9vZmYoZXZlbnRUeXBlLCBmbikge1xuXHR0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmbiwgZmFsc2UpO1xufSk7XG5cbnouZm4udHJpZ2dlciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGRhdGEpIHtcblx0dmFyIGV2ZW50LFxuXHRcdGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAoZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0ZGF0YSA9IHt9O1xuXHR9XG5cblx0ZGF0YS5ldmVudCA9IGRhdGE7XG5cblx0dHJ5IHtcblx0XHRldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudFR5cGUsIHtcblx0XHRcdGRldGFpbDogZGF0YVxuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuXHRcdGV2ZW50LmluaXRDdXN0b21FdmVudChldmVudFR5cGUsIHRydWUsIHRydWUsIGRhdGEpO1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuIiwiZnVuY3Rpb24gX2lzV2l0aEZ1bmN0aW9uKGVsZW0sIGZuKSB7XG5cdHJldHVybiBmbi5jYWxsKGVsZW0sIGVsZW0pO1xufVxuXG5mdW5jdGlvbiBfaXNXaXRoRWxlbWVudChlbGVtMSwgZWxlbTIpIHtcblx0cmV0dXJuIGVsZW0xID09PSBlbGVtMjtcbn1cblxuei5mbi5pcyA9IChmdW5jdGlvbiBfaXMoKSB7XG5cdHZhciBtYXRjaGVzLFxuXHRcdGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuXG5cdG1hdGNoZXNcdD0gYm9keS5tYXRjaGVzIHx8IGJvZHkubWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkubXNNYXRjaGVzU2VsZWN0b3I7XG5cdG1hdGNoZXMgPSBtYXRjaGVzIHx8IGJvZHkubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IGJvZHkub01hdGNoZXNTZWxlY3RvcjtcblxuXHRyZXR1cm4gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG5cdFx0dmFyIF9pc1dpdGgsIHJldCxcblx0XHRcdGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGg7XG5cblx0XHRzd2l0Y2ggKHR5cGVvZiBzZWxlY3Rvcikge1xuXHRcdFx0Y2FzZSBcInN0cmluZ1wiOlxuXHRcdFx0XHRfaXNXaXRoID0gbWF0Y2hlcztcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwiZnVuY3Rpb25cIjpcblx0XHRcdFx0X2lzV2l0aCA9IF9pc1dpdGhGdW5jdGlvbjtcblx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwib2JqZWN0XCI6XG5cdFx0XHRcdGlmIChzZWxlY3RvciBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgc2VsZWN0b3IgaW5zdGFuY2VvZiBXaW5kb3cgfHwgc2VsZWN0b3IgaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuXHRcdFx0XHRcdF9pc1dpdGggPSBfaXNXaXRoRWxlbWVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNpcyBpcyBpbnZhbGlkXCIpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IF9pc1dpdGgodGhpc1tpXSwgc2VsZWN0b3IpO1xuXG5cdFx0XHRpZiAocmV0KSB7XG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufSkoKTtcbiIsInouZm4uaGlkZSA9IF9lYWNoKGZ1bmN0aW9uIGhpZGUoKSB7XG5cdHRoaXMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLnNob3cgPSBfZWFjaChmdW5jdGlvbiBzaG93KCkge1xuXHR0aGlzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXHRyZXR1cm4gdGhpcztcbn0pO1xuXG56LmZuLmNsb25lID0gZnVuY3Rpb24gKGRlZXApIHtcblx0dmFyIGkgPSAwO1xuXG5cdGlmIChkZWVwID09PSB1bmRlZmluZWQgfHwgZGVlcCA9PT0gbnVsbCkge1xuXHRcdGRlZXAgPSBmYWxzZTtcblx0fVxuXG5cdGZvciAoOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuXHRcdHRoaXNbaV0gPSB0aGlzW2ldLmNsb25lTm9kZShkZWVwKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5odG1sID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXNbMF0uaW5uZXJIVE1MO1xuXHR9XG5cblx0Zm9yIChpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbm5lckhUTUwgPSB2YWx1ZTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi50ZXh0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBpLCBsO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dENvbnRlbnQ7XG5cdH1cblxuXHRmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHR0aGlzW2ldLnRleHRDb250ZW50ID0gdmFsdWU7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbnouZm4uZ2V0QXR0ciA9IGZ1bmN0aW9uIChrZXkpIHtcblx0aWYgKCFrZXkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNnZXRBdHRyIGlzIHJlcXVpcmVkXCIpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXNbMF0gJiYgdGhpc1swXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn07XG5cbnouZm4uc2V0QXR0ciA9IF9lYWNoKGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdGlmICgha2V5KSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojc2V0QXR0ciBpcyByZXF1aXJlZFwiKTtcblx0fSBlbHNlIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3NldEF0dHIgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcblx0cmV0dXJuIHRoaXM7XG59KTtcblxuei5mbi5hdHRyID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRyKGtleSk7XG5cdH1cblxuXHR0aGlzLnNldEF0dHIoa2V5LCB2YWx1ZSk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuei5mbi5yZXBsYWNlV2l0aCA9IHouZm4ucmVwbGFjZSA9IF9lYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3JlcGxhY2UgaXMgcmVxdWlyZWRcIik7XG5cdH1cblxuXHR0aGlzLm91dGVySFRNTCA9IHZhbHVlO1xufSk7XG5cbmlmIChcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0fSk7XG5cblx0ei5mbi50b2dnbGVDbGFzcyA9IF9lYWNoKGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHRpZiAoZm9yY2UgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jbGFzc0xpc3RbZm9yY2UgPyBcImFkZFwiIDogXCJyZW1vdmVcIl0oY2xhc3NOYW1lKTtcblx0fSk7XG59IGVsc2Uge1xuXHR6LmZuLmFkZENsYXNzID0gX2VhY2goZnVuY3Rpb24gYWRkQ2xhc3MoY2xhc3NOYW1lKSB7XG5cdFx0dGhpcy5jbGFzc05hbWUgKz0gXCIgXCIgKyBjbGFzc05hbWU7XG5cdH0pO1xuXG5cdHouZm4ucmVtb3ZlQ2xhc3MgPSBfZWFjaChmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWUpIHtcblx0XHR0aGlzLmNsYXNzTmFtZSArPSB0aGlzLmNsYXNzTmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxcYilcIiArIGNsYXNzTmFtZSArIFwiKFxcXFxifCQpXCIsIFwiZ1wiKSwgXCIgXCIpO1xuXHR9KTtcblxuXHR6LmZuLnRvZ2dsZUNsYXNzID0gZnVuY3Rpb24gKGNsYXNzTmFtZSwgZm9yY2UpIHtcblx0XHR0aGlzW2ZvcmNlID8gXCJhZGRDbGFzc1wiIDogXCJyZW1vdmVDbGFzc1wiXShjbGFzc05hbWUpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xufVxuXG56LmZuLmFwcGVuZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHR2YXIgZWxlbWVudCxcblx0XHRpID0gMCxcblx0XHRsID0gdGhpcy5sZW5ndGg7XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNhcHBlbmQgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgdmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aWYgKHZhbHVlIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0dmFsdWUgPSB2YWx1ZVswXTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5hcHBlbmRDaGlsZCh2YWx1ZSk7XG5cdH1cblxuXHRyZXR1cm4gdGhpcztcbn1cblxuei5mbi5wcmVwZW5kID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHZhciBlbGVtZW50LFxuXHRcdGkgPSAwLFxuXHRcdGwgPSB0aGlzLmxlbmd0aDtcblxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBvZiB6I3ByZXBlbmQgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHR0aGlzW2ldLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIHZhbHVlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdGlmICh2YWx1ZSBpbnN0YW5jZW9mIHpBcnJheSkge1xuXHRcdHZhbHVlID0gdmFsdWVbMF07XG5cdH1cblxuXHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdHRoaXNbaV0uaW5zZXJ0QmVmb3JlKHZhbHVlLCB0aGlzW2ldLmZpcnN0Q2hpbGQpO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59XG5cbnouZm4uYWZ0ZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFyIGVsZW1lbnQsXG5cdFx0aSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIG9mIHojYXBwZW5kIGlzIHJlcXVpcmVkLlwiKTtcblx0fVxuXG5cdGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgdmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aWYgKHZhbHVlIGluc3RhbmNlb2YgekFycmF5KSB7XG5cdFx0dmFsdWUgPSB2YWx1ZVswXTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbDsgaSsrKSB7XG5cdFx0dGhpc1tpXS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgdmFsdWUub3V0ZXJIVE1MKTtcblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG56LmZuLmNzcyA9IGZ1bmN0aW9uIChydWxlLCB2YWx1ZSkge1xuXHR2YXIgaSA9IDAsXG5cdFx0bCA9IHRoaXMubGVuZ3RoO1xuXG5cdGlmIChydWxlID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNjc3MgaXMgcmVxdWlyZWQuXCIpO1xuXHR9XG5cblx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzWzBdKVtydWxlXTtcblx0fSBlbHNlIHtcblx0XHRydWxlID0gcnVsZS5yZXBsYWNlKC8tLi9nLCBmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0ICAgIHJldHVybiByZXN1bHQuc3Vic3RyKDEpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fSk7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0dGhpc1tpXS5zdHlsZVtydWxlXSA9IHZhbHVlO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufVxuXG56LmZuLnJlbW92ZSA9IF9lYWNoKGZ1bmN0aW9uICgpIHtcblx0dGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpO1xufSk7XG5cbnouZm4uZW1wdHkgPSBfZWFjaChmdW5jdGlvbiAoKSB7XG5cdHRoaXMuaW5uZXJIVE1MID0gJyc7XG59KTtcbiIsInZhciBfc2VsZWN0b3JzQ2FjaGUsXG5cdF9zZWxlY3RvcnMgPSB7fTtcblxuZnVuY3Rpb24gX2ZpbmQoc2NvcGUsIHN0ckVsZW0pIHtcblx0dmFyIHJldCA9IG5ldyB6QXJyYXkoKTtcblxuXHRzY29wZS5mb3JFYWNoKGZ1bmN0aW9uIF9maW5kRm9yRWFjaChzY29wZWRFbGVtKSB7XG5cdFx0cmV0LnB1c2guYXBwbHkocmV0LCBfc2VsZWN0KHNjb3BlZEVsZW0sIHN0ckVsZW0pKTtcblx0fSk7XG5cblx0cmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX3NlbGVjdChzY29wZWRFbGVtLCBzdHJFbGVtKSB7XG5cdGlmICghfnN0ckVsZW0uaW5kZXhPZihcIjpcIikgfHwgX3NlbGVjdG9yc0NhY2hlID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKHN0ckVsZW0pO1xuXHR9XG5cblx0aWYgKF9zZWxlY3RvcnNDYWNoZSA9PT0gZmFsc2UpIHtcblx0XHRfZ2VuZXJhdGVTZWxlY3RvcnNDYWNoZSgpO1xuXHR9XG5cblx0aWYgKCFzdHJFbGVtLm1hdGNoKF9zZWxlY3RvcnNDYWNoZSkpIHtcblx0XHRyZXR1cm4gc2NvcGVkRWxlbS5xdWVyeVNlbGVjdG9yQWxsKHN0ckVsZW0pO1xuXHR9XG5cblx0cmV0dXJuIF9zZWxlY3QyKHNjb3BlZEVsZW0sIHN0ckVsZW0pO1xufVxuXG5mdW5jdGlvbiBfc2VsZWN0MihzY29wZWRFbGVtLCBzdHJFbGVtKSB7XG5cdHZhciBlbnRyeSwgc2VsZWN0b3JzLFxuXHRcdHNjb3BlXHQ9IG5ldyB6QXJyYXkoc2NvcGVkRWxlbSksXG5cdFx0Y3VycmVudFx0PSBcIlwiLFxuXHRcdGVudHJpZXNcdD0gc3RyRWxlbS5zcGxpdCgvXFxzKy8pO1xuXG5cdHdoaWxlIChlbnRyeSA9IGVudHJpZXMuc2hpZnQoKSkge1xuXHRcdHNlbGVjdG9ycyA9IGVudHJ5Lm1hdGNoKF9zZWxlY3RvcnNDYWNoZSk7XG5cblx0XHRpZiAoIXNlbGVjdG9ycykge1xuXHRcdFx0Y3VycmVudCArPSBlbnRyeSArIFwiIFwiO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Y3VycmVudFx0Kz0gZW50cnkucmVwbGFjZShfc2VsZWN0b3JzQ2FjaGUsIFwiXCIpIHx8IFwiKlwiO1xuXHRcdGVudHJ5XHQ9IG5ldyB6QXJyYXkoKTtcblxuXHRcdHNjb3BlLmZvckVhY2goZnVuY3Rpb24gX3NlbGVjdEZvckVhY2goc2NvcGVkRWxlbSkge1xuXHRcdFx0dmFyIHJldCA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdFx0c2VsZWN0b3JzLmZvckVhY2goZnVuY3Rpb24gc2VsZWN0b3JzRm9yRWFjaChzZWxlY3Rvcikge1xuXHRcdFx0XHRyZXQucHVzaC5hcHBseShyZXQsIF9zZWxlY3RvcnNbc2VsZWN0b3JdLmNhbGwoc2NvcGVkRWxlbSwgY3VycmVudCkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGVudHJ5LnB1c2guYXBwbHkoZW50cnksIHJldCk7XG5cdFx0fSk7XG5cblx0XHRzY29wZVx0PSBlbnRyeTtcblx0XHRjdXJyZW50XHQ9IFwiXCI7XG5cdH1cblxuXHRpZiAoY3VycmVudCkge1xuXHRcdGVudHJ5ID0gbmV3IHpBcnJheSgpO1xuXG5cdFx0c2NvcGUuZm9yRWFjaChmdW5jdGlvbiBjdXJyZW50Rm9yRWFjaChzY29wZWRFbGVtKSB7XG5cdFx0XHRlbnRyeS5wdXNoLmFwcGx5KGVudHJ5LCBzY29wZWRFbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoY3VycmVudCkpO1xuXHRcdH0pO1xuXG5cdFx0c2NvcGUgPSBlbnRyeTtcblx0fVxuXG5cdHJldHVybiBzY29wZTtcbn1cblxuZnVuY3Rpb24gX2dlbmVyYXRlU2VsZWN0b3JzQ2FjaGUoKSB7XG5cdHZhciBzZWxlY3RvcnNcdD0gT2JqZWN0LmtleXMoX3NlbGVjdG9ycykuam9pbihcInxcIikucmVwbGFjZSgvOi9nLCBcIlwiKTtcblx0X3NlbGVjdG9yc0NhY2hlXHQ9IG5ldyBSZWdFeHAoXCI6KFwiICsgc2VsZWN0b3JzICsgXCIpXCIsIFwiZ1wiKTtcbn1cbiIsInoucmVnaXN0ZXJTZWxlY3RvciA9IGZ1bmN0aW9uIChzZWxlY3RvciwgZm4pIHtcblx0aWYgKCFzZWxlY3RvciB8fCB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgb2YgeiNyZWdpc3RlclNlbGVjdG9yIG11c3QgYmUgYSBzdHJpbmcgc2VsZWN0b3JcIik7XG5cdH0gZWxzZSBpZiAoIWZuIHx8IHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBvZiB6I3JlZ2lzdGVyU2VsZWN0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuXHR9XG5cblx0aWYgKHNlbGVjdG9yWzBdICE9PSBcIjpcIikge1xuXHRcdHNlbGVjdG9yID0gXCI6XCIgKyBzZWxlY3Rvcjtcblx0fVxuXG5cdF9zZWxlY3RvcnNDYWNoZVx0XHRcdD0gZmFsc2U7XG5cdF9zZWxlY3RvcnNbc2VsZWN0b3JdXHQ9IGZuO1xufTtcblxuei5yZWdpc3RlclNlbGVjdG9yKFwiOmZpcnN0XCIsIGZ1bmN0aW9uIHNlbGVjdG9yRmlyc3QocXVlcnkpIHtcblx0cmV0dXJuIHoodGhpcy5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSk7XG59KTtcblxuei5yZWdpc3RlclNlbGVjdG9yKFwiOmlucHV0XCIsIChmdW5jdGlvbiBzZWxlY3RvckZpcnN0KCkge1xuXHR2YXIgdGFncyA9IFwiSU5QVVQsVEVYVEFSRUEsU0VMRUNULEJVVFRPTlwiLnNwbGl0KFwiLFwiKTtcblxuXHRmdW5jdGlvbiBmaWx0ZXIoZWxlbWVudCkge1xuXHRcdHJldHVybiB+dGFncy5pbmRleE9mKGVsZW1lbnQudGFnTmFtZSk7XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24gc2VsZWN0b3JJbnB1dChxdWVyeSkge1xuXHRcdHZhciBlbGVtZW50cyA9IG5ldyB6QXJyYXkoKTtcblxuXHRcdGVsZW1lbnRzLnB1c2guYXBwbHkoZWxlbWVudHMsIFtdLmZpbHRlci5jYWxsKHRoaXMucXVlcnlTZWxlY3RvckFsbChxdWVyeSksIGZpbHRlcikpO1xuXG5cdFx0cmV0dXJuIGVsZW1lbnRzO1xuXHR9O1xufSkoKSk7XG4iLCJ6LmZuLnBhcmVudCA9IF9lYWNoTmV3KGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMucGFyZW50Tm9kZTtcbn0pO1xuXG56LmZuLm5leHQgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLm5leHRFbGVtZW50U2libGluZztcbn0pO1xuXG56LmZuLnByZXYgPSB6LmZuLnByZXZpb3VzID0gX2VhY2hOZXcoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xufSk7XG5cbnouZm4uc2libGluZ3MgPSBfZWFjaE5ldyhmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBbXS5maWx0ZXIuY2FsbCh0aGlzLnBhcmVudE5vZGUuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0cmV0dXJuIGNoaWxkICE9PSB0aGlzO1xuXHR9LCB0aGlzKTtcbn0pO1xuXG56LmZuLnByZXZBbGwgPSBfZWFjaE5ldyhmdW5jdGlvbigpe1xuXHRyZXR1cm4gZGlyKHRoaXMsIFwicHJldmlvdXNFbGVtZW50U2libGluZ1wiKTtcbn0pO1xuIiwiZnVuY3Rpb24gX2NoZWNrVmFsaWRFbGVtZW50KGVsZW0pIHtcblx0aWYgKGVsZW0gaW5zdGFuY2VvZiB6QXJyYXkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmIChlbGVtIGluc3RhbmNlb2YgRWxlbWVudCB8fCBlbGVtIGluc3RhbmNlb2YgV2luZG93IHx8IGVsZW0gaW5zdGFuY2VvZiBEb2N1bWVudCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBlbGVtID09PSBcInN0cmluZ1wiKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cblxuZnVuY3Rpb24gX2VhY2goZm4pIHtcblx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkVhY2goKSB7XG5cdFx0dmFyIGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGg7XG5cblx0XHRmb3IgKDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Zm4uYXBwbHkodGhpc1tpXSwgYXJndW1lbnRzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcbn1cblxuZnVuY3Rpb24gX2VhY2hOZXcoZm4pIHtcblx0cmV0dXJuIGZ1bmN0aW9uIHJ1bkVhY2goKSB7XG5cdFx0dmFyIHJldCxcblx0XHRcdGlcdD0gMCxcblx0XHRcdGxcdD0gdGhpcy5sZW5ndGgsXG5cdFx0XHRhcnJcdD0gbmV3IHpBcnJheSgpO1xuXG5cdFx0Zm9yICg7IGkgPCBsOyBpKyspIHtcblx0XHRcdHJldCA9IGZuLmFwcGx5KHRoaXNbaV0sIGFyZ3VtZW50cyk7XG5cblx0XHRcdGlmIChyZXQpIHtcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocmV0KSAmJiByZXQubGVuZ3RoKSB7XG5cdFx0XHRcdFx0YXJyLnB1c2guYXBwbHkoYXJyLCByZXQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFyci5wdXNoKHJldCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBkaXIoZWxlbSwga2V5KSB7XG5cdHZhciBtYXRjaGVkID0gbmV3IHpBcnJheSgpO1xuXG5cdHdoaWxlIChlbGVtW2tleV0gJiYgZWxlbS5ub2RlVHlwZSA9PT0gMSkge1xuXHRcdGVsZW0gPSBlbGVtW2tleV07XG5cdFx0bWF0Y2hlZC5wdXNoKGVsZW0pO1xuXHR9XG5cblx0cmV0dXJuIG1hdGNoZWQ7XG59XG5cbnouZGVlcEV4dGVuZCA9IGZ1bmN0aW9uIF9leHRlbmQoZGVlcCkge1xuXHR2YXIgb2JqLCB0YXJnZXQsXG5cdFx0aSA9IDI7XG5cblx0aWYgKHR5cGVvZiBkZWVwID09PSBcIm9iamVjdFwiKSB7XG5cdFx0dGFyZ2V0XHQ9IGRlZXAgfHwge307XG5cdFx0ZGVlcFx0PSBJbmZpbml0eTtcblx0fSBlbHNlIHtcblx0XHRkZWVwXHQ9IGRlZXAgPT09IHRydWUgPyBJbmZpbml0eSA6IChkZWVwIHwgMCk7XG5cdFx0dGFyZ2V0XHQ9IGFyZ3VtZW50c1sxXSB8fCB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0b2JqID0gYXJndW1lbnRzW2ldO1xuXG5cdFx0aWYgKCFvYmopIHtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpZiAoZGVlcCAmJiB0eXBlb2Ygb2JqW2tleV0gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdFx0XHRfZXh0ZW5kKGRlZXAgLSAxLCB0YXJnZXRba2V5XSwgb2JqW2tleV0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRhcmdldFtrZXldID0gb2JqW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcblxuei5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XG5cdFtdLnVuc2hpZnQuY2FsbChhcmd1bWVudHMsIDApO1xuXHRyZXR1cm4gei5kZWVwRXh0ZW5kLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG59O1xuXG56LmZuLmVhY2ggPSBfZWFjaChmdW5jdGlvbiBlYWNoKGZuKSB7XG5cdGZuLmNhbGwodGhpcywgdGhpcyk7XG5cdHJldHVybiB0aGlzO1xufSk7XG5cbnoucXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAob2JqLCBwcmVmaXgpIHtcblx0dmFyIGksIGtleSwgdmFsLFxuXHRcdHN0cmluZ3MgPSBbXTtcblxuXHRmb3IgKGkgaW4gb2JqKSB7XG5cdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuXHRcdFx0aWYgKHByZWZpeCkge1xuXHRcdFx0XHRrZXkgPSBwcmVmaXggKyBcIltcIiArIGkgKyBcIl1cIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGtleSA9IGk7XG5cdFx0XHR9XG5cblx0XHRcdHZhbCA9IG9ialtpXTtcblxuXHRcdFx0aWYgKHZhbCAmJiB0eXBlb2YgdmFsID09PSBcIm9iamVjdFwiKSB7XG5cdFx0XHRcdHN0cmluZ3MucHVzaCh6LnF1ZXJ5U3RyaW5nKHZhbCwga2V5KSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzdHJpbmdzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWwpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gc3RyaW5ncy5qb2luKFwiJlwiKTtcbn07XG4iLCJ9KSh3aW5kb3csIGRvY3VtZW50KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==