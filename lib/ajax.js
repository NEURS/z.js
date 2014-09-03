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
