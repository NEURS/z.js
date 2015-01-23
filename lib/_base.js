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
