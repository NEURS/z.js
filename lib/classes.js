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
