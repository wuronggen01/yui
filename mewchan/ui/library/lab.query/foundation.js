(function () {

    var Query = function Query() {
    };

    Object.defineProperty(Query.prototype, "valueSet", {
        "enumerable": false,
        "get": function () {

            var valueSet = $.create(this.domain);

            this.forEach(function (element) {
                valueSet.include(element);
            });

            return valueSet;
        }
    });

    Object.defineProperty(Query.prototype, "array", {
        "enumerable": false,
        "get": function () {
            return Array.prototype.slice.call(this, 0);
        }
    });

    Object.defineProperty(Query.prototype, "first", {
        "enumerable": false,
        "get": function () {
            if (this.length > 0) {
                return this[0];
            } else {
                return null;
            }
        }
    });

    Object.defineProperty(Query.prototype, "last", {
        "enumerable": false,
        "get": function () {
            if (this.length > 0) {
                return this[this.length - 1];
            } else {
                return null;
            }
        }
    });

    Object.defineProperty(Query.prototype, "lifted", {
        "enumerable": false,
        "get": function () {
            return this.operateOn($.create(this.domain), function (result, item) {

                if ($.isNull(item)) {
                    result.push(item);
                } else if ($.isKindOf(item, String) || $.isKindOf(item, Function)) {
                    result.push(item);
                } else if ($.isKindOf(item.length, Number)) {

                    var looper = 0;
                    while (looper < item.length) {

                        result.push(item[looper]);

                        ++looper;
                    }

                } else {
                    result.push(item);
                }

            });
        }
    });

    Object.defineProperty(Query.prototype, "empty", {
        "enumerable": false,
        "get": function () {
            return this.length === 0;
        }
    });

    Query.prototype.clone = function () {
        return $.create(this.domain, this);
    };

    Query.prototype.forEach = function (action) {

        var looper = 0;
        while (looper < this.length) {
            action(this[looper], looper, this);
            ++looper;
        }

        return this;

    };

    Query.prototype.map = function (action) {

        return this.operateOn($.create(this.domain), function (result, item, index, list) {
            result[index] = action(item, index, list);
        });

    };

    Query.prototype.fold = function (start, action) {

        var result = start;

        this.forEach(function (item, index, list) {
            result = action(result, item, index, list);
        });

        return result;

    };

    Query.prototype.operateOn = function (target, action) {

        return this.fold(target, function (target, item, index, list) {

            action(target, item, index, list);

            return target;
        });

    };

    Query.prototype.filter = function (test) {

        return this.find(test).map((function (index) {
            return this[index];
        }).bind(this));

    };

    Query.prototype.find = function (test) {

        if (!test) {
            test = function (item, index, list) {
                return true;
            };
        }

        if ($.isKindOf(test, RegExp)) {
            test = (function (regex) {
                return function (value) {
                    if ($.isEqual(regex, value)) {
                        return true;
                    } else {
                        if ($.isKindOf(value, String)) {
                            regex.test(value);
                        } else {
                            return false;
                        }
                    }
                };
            })(test);
        } else if (!$.isKindOf(test, Function)) {
            test = (function (sample) {
                return function (value) {
                    return $.isEqual(sample, value);
                };
            })(test);
        }

        return this.operateOn($.create(this.domain), function (indices, item, index, list) {
            if (test(item, index, list)) {
                indices.push(index);
            }
        });

    };

    Query.prototype.slice = function (start, end) {

        if ($.isNull(start)) {
            start = 0;
        }

        if ($.isNull(end)) {
            end = this.length;
        }

        if (start < 0) {
            start += this.length;
            if (start < 0) {
                start = 0;
            }
        }

        if (start > this.length) {
            start = this.length;
        }

        if (end <= 0) {
            end += this.length;
            if (end < start) {
                end = start;
            }
        }

        return $.create(this.domain, Array.prototype.slice.call(this, start, end));
    };

    Query.prototype.splice = function (index, length) {
        return $.create(this.domain, Array.prototype.splice.apply(this, arguments));
    };

    Query.prototype.push = function () {

        Array.prototype.push.apply(this, arguments);

        return this;
    };

    Query.prototype.pop = function () {
        return Array.prototype.pop.apply(this, arguments);
    };

    Query.prototype.unshift = function () {

        Array.prototype.unshift.apply(this, arguments);

        return this;
    };

    Query.prototype.shift = function () {
        return Array.prototype.shift.apply(this, arguments);
    };

    Query.prototype.include = function () {

        var looper = 0;
        while (looper < arguments.length) {

            if (this.find(arguments[looper]).length === 0) {
                this.push(arguments[looper]);
            }

            ++looper;
        }

        return this;

    };

    Query.prototype.exclude = function () {

        var slice = this.map(function (item, index, list) {
            return {
                "index": index,
                "item": item
            }
        });

        var list = arguments;

        if ((arguments.length === 1) && (!$.isNull(arguments[0])) && 
            (!$.isKindOf(arguments[0], String)) &&
            $.isKindOf(arguments[0].length, Number)) {
            list = Array.prototype.slice.call(arguments[0]);
            list.push(arguments[0]);
        }

        var looper = 0;
        while (looper < list.length) {

            var indices = this.find(list[looper]);

            var looper2 = indices.length;
            while (looper2 > 0) {
                --looper2;

                slice.splice(indices[looper2], 1);

                this.splice(indices[looper2], 1);

            }

            ++looper;
        }

        return slice.sort(function (a, b) {
            if (a.index < b.index) {
                return -1;
            } else if (a.index > b.index) {
                return 1;
            } else {
                return 0;
            }
        }).map(function (item) {
            return item.item;
        });

    };

    Query.prototype.shuffle = function () {

        var powers = this.map(function (item) {
            return Math.random();
        })

        return this.sort(function (a, b, aIndex, bIndex) {
            if (powers[aIndex] < powers[bIndex]) {
                return -1;
            } else if (powers[aIndex] > powers[bIndex]) {
                return 1;
            } else {
                return 0;
            }
        });

    };

    Query.prototype.sort = function (comparator) {

        if (!comparator) {
            comparator = function (a, b, aIndex, bIndex) {
                return ("" + a).localeCompare("" + b);
            };
        }

        var orders = this.map(function (item, index) {
            return {
                "item": item,
                "index": index
            };
        });

        var that = this;

        orders.sort(function (a, b) {
            return comparator(a.item, b.item, a.index, b.index);
        }).forEach(function (item, index) {
            that[index] = item.item;
        });

        return this;

    };


    Query.prototype.property = function () {
 
        if ((arguments.length === 0) || 
            ((arguments.length === 1) && $.isKindOf(arguments[0], String))) {
            return this.properties.apply(this, arguments)[0];
        } else {
            return this.properties.apply(this, arguments);
        }

    };

    Query.prototype.properties = function () {
       
        if ((arguments.length === 0) || 
            ((arguments.length === 1) && $.isKindOf(arguments[0], String))) {

            var name = null;
            if (arguments.length === 1) {
                name = arguments[0];
            }

            return this.map(function (element) {

                if (name !== null) {
                    return element[name];
                } else {
                    return element;
                }

            });

        } else {

            var settings = {};
            if (arguments.length === 2) {
                settings[arguments[0]] = arguments[1];
            } else {
                settings = arguments[0];
            }

            return this.forEach(function (element) {
                for (var key in settings) {
                    element[key] = settings[key];
                }
            });

        }

    };


    var domains = ["common", "empty"];
    var versions = {
        "empty": {
            "tests": [],
            "initializers": [],
            "prototype": {}
        },
        "common": { 
            "tests": [function (list) {
                return true;
            }],
            "initializers": [function (list) {
                $.query(list).operateOn(this, function (list, item) {
                    list.push(item);
                });
            }],
            "prototype": Query.prototype
        }
    };

    global.$ = function () {

        var list = null;

        if (arguments.length > 1) {

            list = Array.prototype.slice.call(arguments, 0);

        } else if (arguments.length === 1) {

            if ((arguments[0] === null) || (arguments[0] === undefined)) {
                list = [arguments[0]];
            } else if ((typeof arguments[0] === "string") || (arguments[0] instanceof String)) {
                list = [arguments[0]];
            } else if ((typeof arguments[0] === "function") || (arguments[0] instanceof Function)) {
                list = [arguments[0]];
            } else if ((typeof arguments[0].length === "number") || (arguments[0].length instanceof Number)) {
                list = Array.prototype.slice.call(arguments[0], 0);
            } else {
                list = [arguments[0]];
            }

        } else {
            list = [];
        }

        if ((list.length === 1) && (list[0] instanceof Query)) {

            return list[0].clone();

        } else {

            return $.query(domains).operateOn({ 
                "passed": false, 
                "query": $.query() 
            }, function (state, domain) {

                if ((!state.passed) && $.query(versions[domain].tests).fold(false, function (passed, test) {
                    return passed || test(list);
                })) {

                    state.passed = true;
                    state.query = $.query(versions[domain].initializers).operateOn($.create(domain), function (query, initializer) {
                        initializer.call(query, list);
                    });

                }

            }).query;

        }

    };

    $.Query = Query;
    
    $.create = function (domain) {

        var query = null;

        if (arguments.length > 2) {

            query = Array.prototype.slice.call(arguments, 1);

        } else if (arguments.length === 2) {

            if ((arguments[1] !== null) && (arguments[1] !== undefined)) {

                if ((typeof arguments[1] === "string") || (arguments[1] instanceof String)) {
                    query = [arguments[1]];
                } else if ((typeof arguments[1] === "function") || (arguments[1] instanceof Function)) {
                    query = [arguments[1]];
                } else if ((typeof arguments[1].length === "number") || (arguments[1].length instanceof Number)) {
                    query = Array.prototype.slice.call(arguments[1], 0);
                } else {
                    query = [arguments[1]];
                }

            } else {
                query = [arguments[1]];
            }

        } else {
            query = [];
        }

        if (!domain) {
            domain = "common";
        }

        var prototype = null;
        if (versions.hasOwnProperty(domain)) {
            prototype = versions[domain].prototype;
        }

        if (!prototype) {
            prototype = Query.prototype;
        }

        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(query, prototype);
        } else {

            query.__proto__ = prototype;

            Object.defineProperty(query, "__proto__", {
                "enumerable": false,
                "value": prototype
            });

        }
        
        Object.defineProperty(query, "constructor", {
            "enumerable": false,
            "value": Query
        });

        Object.defineProperty(query, "domain", {
            "enumerable": false,
            "value": domain
        });

        return query;

    };

    $.upgrade = function (version) {

        if (!version) {
            return;
        }

        if ((!version.hasOwnProperty("domain")) || (!version.domain)) {
            version.domain = "common";
        }

        if (!version.hasOwnProperty("prototype") || (!version.prototype)) {
            version.prototype = "common";
        }

        if ((typeof version.prototype === "string") || (version.prototype instanceof String)) {
            version.prototype = versions[version.prototype].prototype;
        }

        if (!version.prototype) {
            version.prototype = Query.prototype;
        }

        if (!version.addons) {
            version.addons = {};
        }

        if (!versions.hasOwnProperty(version.domain)) {

            versions[version.domain] = {
                "tests": [],
                "initializers": [],
                "prototype": Object.create(version.prototype)
            };

            domains.unshift(version.domain);

        }

        for (var key in version.addons) {

            if (versions[version.domain].prototype[key]) {
                version.addons[key].super = versions[version.domain].prototype[key];
            }

            versions[version.domain].prototype[key] = version.addons[key];
        }

        if (version.hasOwnProperty("test") && version.test) {
            versions[version.domain].tests.push(version.test)
        }

        if (version.hasOwnProperty("initializer") && version.initializer) {
            versions[version.domain].initializers.push(version.initializer);
        }

        if (version.hasOwnProperty("prototype") && version.prototype) {
            for (var key in version.prototype) {
                versions[version.domain].prototype[key] = version.prototype[key];
            }
        }

    };

    $.query = function () {

        var createArguments = Array.prototype.slice.call(arguments, 0);

        createArguments.unshift("common");

        return $.create.apply($, createArguments);

    };

    $.isEqual = function (a, b) {

        if ((a instanceof RegExp) && (b instanceof RegExp)) {
            return ((a.source === b.source) && 
                    (a.global === b.global) && 
                    (a.ignoreCase === b.ignoreCase) && 
                    (a.multiline === b.multiline));
        } else {
            return $.simplify(a) === $.simplify(b);
        }

    };

    Object.defineProperty($, "domains", {
        "enumerable": false,
        "get": function () {
            return Array.prototype.slice.call(domains, 0);
        },
        "set": function (newDomains) {

            domains = $.query(domains).operateOn($.query(newDomains).valueSet, function (domains, domain) {
                domains.include(domain);
            }).filter(function (domain) {
                return ($.query(domains).find(domain).length > 0);
            }).array;

        }
    });

})();
