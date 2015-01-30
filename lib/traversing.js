z.fn.parent = _eachNew(function parent() {
	return this.parentNode;
});

z.fn.next = _eachNew(function next() {
	return this.nextElementSibling;
});

z.fn.prev = z.fn.previous = _eachNew(function prev() {
	return this.previousElementSibling;
});

z.fn.siblings = _eachNew(function siblings() {
	return [].filter.call(this.parentNode.children, function(child) {
		return child !== this;
	}, this);
});

z.fn.nextAll = _eachNew(function nextAll(){
	return dir(this, "nextElementSibling");
});

z.fn.prevAll = _eachNew(function prevAll(){
	return dir(this, "previousElementSibling");
});

z.fn.children = _eachNew(function children(selector) {
	return this.children;
});
