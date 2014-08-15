var zArray, _window, _document, iframe;

function z(elem, scope) {
	if (elem instanceof zArray) {
		return elem;
	} else if (elem instanceof EventTarget) {
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