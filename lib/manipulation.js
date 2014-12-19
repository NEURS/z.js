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

	z.fn.hasClass = function (className) {
		var i = 0,
			l = this.length;

		for (; i < l; i++) {
			if (this[i].classList.contains(className)) {
				return true;
			}
		}

		return false;
	};
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

	z.fn.hasClass = function (className) {
		var i = 0,
			l = this.length,
			r = new RegExp("(^| )" + className + "( |$)", "gi");

		for (; i < l; i++) {
			if (r.test(this[i].className)) {
				return true;
			}
		}

		return false;
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
