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
		elem.setAttribute(_toDashes(key), value);
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
			return elem.getAttribute(_toDashes(key);
		}
	} else if ("dataset" in elem) {
		return Object.create(elem.dataset);
	}

	return _getDataAttrs(elem.attributes);
}

function _getDataAttrs(attrs) {
	var attr,
		i	= 0,
		l	= attrs.length,
		ret	= {};

	for (; i < l; i++) {
		attr = attrs[i];

		if (attr.name.indexOf('data-') === 0) {
			ret[_toDashes(attr.name)] = attr.value;
		}
	}

	return ret;
}

z.data = function (elem, key, value) {
	z(elem).data(key, value);
};
