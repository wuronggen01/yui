// Cache pool
//
//   -> get(id, autorefresh, generator, timeout)
//   -> put(id, content, timeout)
//   -> refresh(id, timeout)
//   -> clearExpired()
//   -> fetch(filter(id, content)) => [{"id": id, "content": content}]
//

var CachePool = function CachePool(timeout) {

    this.timeout = parseInt(timeout);
    if (isNaN(this.timeout)) {
        this.timeout = 20 * 60 * 1000;
    }

    Object.defineProperty(this, "pool", {
        "enumerable": false,
        "value": {}
    });

};

var define = function (key, value) {
    Object.defineProperty(CachePool.prototype, key, {
        "enumerable": false,
        "value": value
    });
};

define("has", function (id) {
    return this.pool.hasOwnProperty(id);
});

CachePool.prototype.working = true;

Object.defineProperty(CachePool.prototype, "count", {
    "enumerable": true,
    "get": function () {
        return Object.keys(this.pool).length;    
    }
});

define("get", function (id, autorefresh, generator, timeout) {

    if (!timeout) {
        timeout = this.timeout;
    }

    if (this.pool.hasOwnProperty(id)) {

        var entry = this.pool[id];

        if (autorefresh) {
            this.refresh(id, timeout);
        }

        return entry.content;

    } else {

        if (generator) {

            var content = generator();

            this.pool[id] = {
                "content": content
            };

            this.refresh(id, timeout);

            return content;

        } else {

            return null;

        }

    }

});

define("fetch", function (filter) {

    return Object.keys(this.pool).filter((function (id) {

        if (filter) {
            return filter(id, this.pool[id].content);
        } else {
            return true;
        }

    }).bind(this)).map((function (id) {

        return {
            "id": id,
            "content": this.pool[id].content
        };

    }).bind(this));

});

define("put", function (id, content, timeout) {

    if (!timeout) {
        timeout = this.timeout;
    }

    if (this.pool.hasOwnProperty(id)) {
        this.pool[id].content = content;
        this.pool[id].expiredDate = new Date().getTime() + timeout;
    } else {
        this.pool[id] = {
            "content": content,
            "expiredDate": new Date().getTime() + timeout
        };
    }

    this.refresh(id);

});

define("refresh", function (id, timeout) {

    if (!timeout) {
        timeout = this.timeout;
    }

    if (this.pool.hasOwnProperty(id)) {
        this.pool[id].expiredDate = new Date().getTime() + timeout;
    }

});

define("clearExpired", function () {

    var now = new Date().getTime();

    Object.keys(this.pool).slice(0).forEach((function (id) {

        if (this.pool[id].expiredDate < now) {
            delete this.pool[id];
        }

    }).bind(this));

});

module.exports = CachePool;