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
