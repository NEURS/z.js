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
