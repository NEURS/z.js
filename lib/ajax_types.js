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
