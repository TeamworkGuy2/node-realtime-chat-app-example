
// ==== InMemDb ====
/** Create a simple in-memory database
 * @param opts: contains the following optional properties
 * [name] optional name of the collection, else name will be generated based on timestamp
 * [collectionConfigs] an array of collection configuration options, see addCollection()
 */
function InMemDb(opts) {
	opts = opts || {};

	this.name = opts.name || ("in-mem-db-" + Date.now());
	this.collections = [];

	if(opts.collectionConfigs && Array.isArray(opts.collectionConfigs)) {
		for(var i = 0, size = opts.collectionConfigs.length; i < size; i++) {
			this.addCollection(opts.collectionConfigs[i]);
		}
	}
}

/** Add a collection with various configuration options.
 * @param opts: contains options configuring the collection to add, including the following properties:
 * {string} name the collection's name
 * {int} [maxSize] the maximum size of the collection (default: Infinity)
 */
InMemDb.prototype.addCollection = function addCollection(opts) {
	if(opts == null) { throw new Error("cannot create collection without config options"); }
	var newCollection = null;
	if((newCollection = this.getCollection(opts.name)) != null) { return newCollection; }

	newCollection = new Collection({
		name: opts.name,
		maxSize: opts.maxSize || Infinity,
		data: []
	});

	this.collections.push(newCollection);

	return newCollection;
};


/** Get a collection by name
 * @param name the name of the collection to retrieve
 * @return this database's collection matching the given name, or null if no such collection exists
 */
InMemDb.prototype.getCollection = function getCollection(name) {
	var colls = this.collections;
	for(var i = 0, size = colls.length; i < size; i++) {
		if(colls[i].name === name) { return colls[i]; }
	}
	return null;
};


/** Remove a collection by name
 * @return true if the collection was found and removed, false if not
 */
InMemDb.prototype.removeCollection = function removeCollection(name) {
	var colls = this.collections;
	for(var i = 0, size = colls.length; i < size; i++) {
		if(colls[i].name === name) {
			colls[i] = colls[size - 1];
			colls.pop();
			return true;
		}
	}
	return false;
};




// ==== Collection ====
/**
 * @param opts: contains options configuring the collection to add, including the following properties:
 * {string} name the collection's name
 * {int} maxSize the maximum size of the collection (default: Infinity)
 * {Array} data the data array to store the collection's items in
 */
function Collection(opts) {
	this.name = opts.name;
	this.maxSize = opts.maxSize;
	this.data = opts.data;
}

Collection.prototype.addItem = function addItem(item) {
	if(item == null) { return; }
	this.data.push(item);

	if(this.maxSize != null && this.data.length > this.maxSize) {
		this.data.shift();
	}
};

Collection.prototype.addItems = function addItems(items) {
	if(items == null && Array.isArray(items)) { return; }
	Array.prototype.push.apply(this, items);

	if(this.maxSize != null && this.data.length > this.maxSize) {
		this.data.splice(0, this.maxSize - this.data.length);
	}
};

Collection.prototype.clear = function clear() {
	this.data = [];
};

/**
 * @param {function(T,int,T[])|int} offsetOrFilter: either a function (which is passed parameters mirroring Array.filter's callback)
 * or number, in which case it is used as an offset into this collection at which to slice off a sub-array of items to return
 * {int} [len] optional number of items to return, only used if the first argument 'offsetOrFilter' is a number
 */
Collection.prototype.getItems = function getItems(offsetOrFilter, len) {
	var res = [];
	var dat = this.data;
	if(typeof offsetOrFilter === "function") {
		var filter = offsetOrFilter;
		for(var i = 0, size = dat.length; i < size; i++) {
			if(!!filter(dat[i], i, dat)) {
				res.push(dat[i]);
			}
		}
	}
	else {
		var off = offsetOrFilter;
		res = dat.slice(off, len != null ? off + len : undefined);
	}
	return res;
};



// ==== exports ====
exports.newInMemDb = function (opts) {
	return new InMemDb(opts || {});
};