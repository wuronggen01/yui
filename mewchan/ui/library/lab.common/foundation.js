var comparator = require("./comparator.js");
var template = require("./template.js");
var uuid = require("./uuid.js");

var Logger = null;

// Ensure Buffer exists
//
var Buffer = global.Buffer;
if (!Buffer) {

    Buffer = function Buffer() {
    };

    Buffer.prototype.toString = function () {
    };

    global.Buffer = Buffer;

}

// Ensure Symbol exists
//
var Symbol = global.Symbol;
if (!Symbol) {

    Symbol = function Symbol() {
        this.key = uuid.createUUID();
    };

    Symbol.prototype.toString = function () {
        return this.key;
    };

    global.Symbol = Symbol;

}

var deprecated = function (deprecated, replacer, action) {

    var called = false;

    return function () {

        if (!called) {

            called = true;

            var Logger = require("./logger.js");

            new Logger().warn("Function " + deprecated + " is deprecated, please use " + replacer);

        }

        return action.apply(this, arguments);

    };

};


// Get the script engine type
//
var getScriptEngineName = function() {

    if (Object.prototype.toSource && Object.prototype.watch && Object.prototype.unwatch) {
        return "SM";
    } else {
        return "V8";
    }

};


// Objectize
//
var objectize = function (item) {

    if (isNull(item)) {
        item = {};
    }

    return ((function () {
        return this;
    }).bind(item))();

};


// Test whether a value is null
//
var isNull = function (value) {
    return (value === null) || (value === undefined);
};


// Test whether a value is inherited from a constructor
//
var isKindOf = function (value, constructor) {

    if (isNull(value)) {

        return false;

    } else {

        switch (typeof value) {

            case "boolean": { return (constructor === Boolean); }
            case "number": { return (constructor === Number); }
            case "string": { return (constructor === String); }

            case "function": { return (constructor === Function); }

            case "symbol": { return (constructor === Symbol); }

            case "undefined": { return false; /* It won't happen */ }

            case "object":
            default: {
                return (value instanceof constructor);
            }

        }

    }

};


// Simplify value
//
var simplify = function (value) {

    if (isNull(value)) {

        return null;

    } else {

        switch (typeof value) {

            case "boolean":
            case "number":
            case "string":
            case "function":
            case "symbol": {
                return value;
            }

            case "undefined": {
                return false; /* It won't happen */
            }

            case "object":
            default: {

                if (value instanceof Boolean) {

                    return value && true;

                } else if (value instanceof Number) {

                    return value + 0;

                } else if (value instanceof String) {

                    return value + "";

                } else {

                    return value;

                }

            }

        }

    }

};


// Prepad zero for numbers
//
var prepadZero = function (number, length) {

    number = number + "";
    while (number.length < length) {
        number = "0" + number;
    }

    return number;

};


// Jsonize
//
var jsonizeIndentUnit = "    ";
var jsonizeMaximumLevel = 3;
var jsonize = function(content, indent, maximumLevel) {

    maximumLevel = parseInt(maximumLevel);
    if (!isFinite(maximumLevel)) {
        maximumLevel = jsonizeMaximumLevel;
    }

    if (content === null) {
        return "null";
    } else if (content === undefined) {
        return "undefined";
    } else if (isKindOf(content, Boolean)) {
        return (content && true) ? "true" : "false";
    } else if (isKindOf(content, Number)) {
        return content + "";
    } else if (isKindOf(content, String)) {
        return "\"" + content.replace(/\\/gim, "\\\\").replace(/\n/gim, "\\n").replace(/\r/gim, "\\r").replace(/"/gim, "\\\"") + "\"";
    } else if (isKindOf(content, RegExp)) {
        return "/" + content.source + "/" + (content.global ? "g" : "") + (content.ignoreCase ? "i" : "") + (content.multiline ? "m" : "");
    } else if (isKindOf(content, Function)) {
        if (content.name) {
            return "function " + content.name + "() { /* code */ }";
        } else {
            return "function () { /* code */ }";
        }
    } else if (isKindOf(content, Date)) {

        return "new Date(\"" + formatDate(content) + "\")";

    } else if (isKindOf(content, Error)) {

        indent = indent ? indent : "";

        return "new " + content.name + "(\"" +
            content.message.replace(/\\/gim, "\\\\").replace(/\n/gim, "\\n").replace(/\r/gim, "\\r").replace(/"/gim, "\\\"") + "\") /*\n" +
            getStack(content).split("\n").map(function (line) {
                return indent + line;
            }).join("\n") + "\n" + indent + "*/";

    } else if (isKindOf(content, Array)) {

        if (content.length > 0) {

            if (indent && (indent.length / jsonizeIndentUnit.length >= maximumLevel)) {
                return "[ /* " + content.length + " items ... */ ]";
            } else {

                var result = ["[", " ", "/* ", content.length, " ", "items", " */", "\n"];

                var nextIndent = (indent ? indent : "") + jsonizeIndentUnit;

                content.forEach(function (element, index) {

                    result.push(nextIndent);

                    result.push(jsonize(element, nextIndent, maximumLevel));

                    if (index < content.length - 1) {
                        result.push(",");
                    }

                    result.push("\n");

                });

                if (indent) {
                    result.push(indent);
                }

                result.push("]");

                return result.join("");

            }

        } else {
            return "[]";
        }

    } else {

        var keys = [];
        var functionKeys = [];

        for (var key in content) {

            if (isKindOf(content[key], Function)) {
                if (functionKeys.indexOf(key) === -1) {
                    functionKeys.push(key);
                }
            } else {
                if ((keys.indexOf(key) === -1) && (content[key] !== undefined)) {
                    keys.push(key);
                }
            }

        }

        keys = keys.sort(comparator.insensitiveNaturalComparator);
        functionKeys = functionKeys.sort(comparator.insensitiveNaturalComparator);

        var constructorName = content.constructor.name;
        if (constructorName) {
            constructorName = " /* " + constructorName;
        } else {
            constructorName = "";
        }

        if (content.constructor === Object) {
            constructorName = "";
        }

        if ((keys.length > 0) || (functionKeys.length > 0)) {

            if (indent && (indent.length / jsonizeIndentUnit.length >= maximumLevel)) {
                if (constructorName) {
                    return "{" + constructorName + " ... */ }";
                } else {
                    return "{ /* ... */ }";
                }
            } else {

                var result = ["{", constructorName];
                if (constructorName) {
                    result.push(" */");
                }

                result.push("\n");

                var nextIndent = (indent ? indent : "") + jsonizeIndentUnit;

                keys.forEach(function (key, index) {

                    result.push(nextIndent);
                    result.push(jsonize(key));
                    result.push(": ");
                    result.push(jsonize(content[key], nextIndent, maximumLevel));

                    if ((index < keys.length - 1) || (functionKeys.length > 0)) {
                        result.push(",");
                    }

                    result.push("\n");

                });

                functionKeys.forEach(function (key, index) {

                    result.push(nextIndent);
                    result.push(jsonize(key));
                    result.push(": ");
                    result.push(jsonize(content[key], nextIndent, maximumLevel));

                    if (index < functionKeys.length - 1) {
                        result.push(",");
                    }

                    result.push("\n");

                });

                if (indent) {
                    result.push(indent);
                }

                result.push("}");

                return result.join("");

            }

        } else {
            if (constructorName) {
                return "{" + constructorName + " */ }";
            } else {
                return "{}";
            }
        }

    }

};


// Check whether an object is array like
//
var isArrayLike = function (object, stringAsArray) {

    if (isNull(object)) {
        return false;
    }

    if (object.constructor === String) {
        return (stringAsArray ? true : false);
    } else {
        return isFinite(parseInt(object.length));
    }

};


// Iterate an array like object
//
var iterateArray = function (array, action) {

    if (isArrayLike(array)) {
        Array.prototype.forEach.call(array, action);
    }

};


// Copy array-like as array
//
var copyAsArray = function (array) {

    if (isArrayLike(array)) {
        return Array.prototype.slice.call(array, 0);
    } else {
        return [];
    }

};


// Format date
//
//   YY, YYYY: Year
//   M, MM: Month
//   D, DD: Date
//   h, hh: Hour
//   m, mm: Minute
//   s, ss: Second
//   S, SSS: Millisecond
//
var formatDate = function (date, format, utc) {

    var toString = function (number, length) {

        number = number + "";
        while (number.length < length) {
            number = "0" + number;
        }

        return number;
    };

    if (!date) {
        date = new Date();
    }

    if (!format) {
        format = "YYYY-MM-DD hh:mm:ss.SSS";
    }

    var result = [];

    var looper = 0;
    while (looper < format.length) {

        switch (format[looper]) {

            case "Y":
                {

                    if (format[looper + 1] == "Y") {

                        if ((format[looper + 2] == "Y") && (format[looper + 3] == "Y")) {

                            result.push(toString(utc ? date.getUTCFullYear() : date.getFullYear(), 4));

                            looper += 4;

                        } else {

                            result.push(toString((utc ? date.getUTCFullYear() : date.getFullYear()) % 100, 2));

                            looper += 2;
                        }

                    } else {

                        result.push((utc ? date.getUTCFullYear() : date.getFullYear()) + "");

                        ++looper;
                    }

                    break;
                }

            case "M":
                {

                    if (format[looper + 1] == "M") {

                        result.push(toString((utc ? date.getUTCMonth() : date.getMonth()) + 1, 2));

                        looper += 2;

                    } else {

                        result.push(((utc ? date.getUTCMonth() : date.getMonth()) + 1) + "");

                        ++looper;
                    }

                    break;
                }

            case "D":
                {

                    if (format[looper + 1] == "D") {

                        result.push(toString((utc ? date.getUTCDate() : date.getDate()), 2));

                        looper += 2;

                    } else {

                        result.push((utc ? date.getUTCDate() : date.getDate()) + "");

                        ++looper;
                    }

                    break;
                }

            case "h":
                {

                    if (format[looper + 1] == "h") {

                        result.push(toString((utc ? date.getUTCHours() : date.getHours()), 2));

                        looper += 2;

                    } else {

                        result.push((utc ? date.getUTCHours() : date.getHours()) + "");

                        ++looper;
                    }

                    break;
                }

            case "m":
                {

                    if (format[looper + 1] == "m") {

                        result.push(toString((utc ? date.getUTCMinutes() : date.getMinutes()), 2));

                        looper += 2;

                    } else {

                        result.push((utc ? date.getUTCMinutes() : date.getMinutes()) + "");

                        ++looper;
                    }

                    break;
                }

            case "s":
                {

                    if (format[looper + 1] == "s") {

                        result.push(toString((utc ? date.getUTCSeconds() : date.getSeconds()), 2));

                        looper += 2;

                    } else {

                        result.push((utc ? date.getUTCSeconds() : date.getSeconds()) + "");

                        ++looper;
                    }

                    break;
                }

            case "S":
                {

                    if ((format[looper + 1] == "S") && (format[looper + 2] == "S")) {

                        result.push(toString((utc ? date.getUTCMilliseconds() : date.getMilliseconds()), 3));

                        looper += 3;

                    } else {

                        result.push((utc ? date.getUTCMilliseconds() : date.getMilliseconds()) + "");

                        ++looper;
                    }

                    break;
                }

            case "\"":
            case "'":
                {

                    var offset = 1;
                    while ((format[looper + offset] != format[looper]) &&
                        (looper + offset < format.length)) {

                        if (format[looper + offset] == "\\") {

                            result.push(format[looper + offset + 1]);

                            offset += 2;

                        } else {

                            result.push(format[looper + offset]);

                            ++offset;
                        }

                    }

                    looper += offset + 1;

                    break;
                }

            default:
                {

                    result.push(format[looper]);

                    ++looper;

                    break;
                }

        }

    }

    return result.join("");

};


// Iterate an object
//
//   -> iterateObject(object, action)
//   -> iterateObject(object, prototypeKeysAllowed, action)
//
var iterateObject = function (object) {

    if (!(isNull(object) ||
        isKindOf(object, Boolean) ||
        isKindOf(object, Number) ||
        isKindOf(object, String) ||
        isKindOf(object, Date) ||
        isKindOf(object, RegExp))) {

        var prototypeKeysAllowed = false;
        if (arguments.length === 3) {
            prototypeKeysAllowed = (arguments[1] ? true : false);
        }

        var action = arguments[arguments.length - 1];

        Object.keys(object).slice(0).forEach(function (key) {

            if (object.hasOwnProperty(key) || prototypeKeysAllowed) {
                action(key, object[key]);
            }

        });

    }

};


// Check whether an object could be accepted as a type
//
//  -> valueType: boolean | number | string | buffer | regex | function | array | array-like | object | any
//
var couldBeAcceptedAs = function (value, valueType) {

    var regexFlags = "m";
    if (valueType && (valueType.indexOf("regex-source-") === 0)) {
        regexFlags = valueType.split("-")[2];
        valueType = "regex-source";
    }

    switch (valueType) {

        case "boolean": { return isKindOf(value, Boolean); }
        case "number": { return isKindOf(value, Number); }
        case "string": { return isKindOf(value, String); }
        case "buffer": { return isKindOf(value, Buffer); }
        case "date": { return isKindOf(value, Date); }

        case "regex": { return isKindOf(value, RegExp); }

        case "function": { return isKindOf(value, Function); }

        case "array": { return isKindOf(value, Array); }

        case "array-like": { return isArrayLike(value); }

        case "object": {

            if (isNull(value) ||
                isKindOf(value, Boolean) ||
                isKindOf(value, Number) ||
                isKindOf(value, String) ||
                isKindOf(value, RegExp) ||
                isKindOf(value, Date) ||
                isKindOf(value, Function)) {

                return false;

            } else {
                return true;
            }

        }

        case "any": { return true; }

        default: {

            if (isKindOf(valueType, Function)) {

                if (isKindOf(value, valueType)) {
                    return true;
                } else {
                    return false;
                }

            } else {

                return false;

            }

        }

    }

};

var getStack = function (error) {

    var stack = null;
    if (!error) {

        stack = new Error("Get stack").stack.split("\n");

        if (getScriptEngineName() === "V8") {
            stack = stack.slice(2);
        } else {
            stack = stack.slice(1);
        }

    } else {

        stack = error.stack.split("\n");
        if (getScriptEngineName() === "V8") {
            stack = stack.slice(1);
        }

    }

    switch (getScriptEngineName()) {

        case "SM": {

            if (stack[0].substring(0, 7) !== "    at ") {
                return stack.join("\n").trim().split("\n").map(function(line) {

                    var components = line.split("@");

                    if (components[0].trim().length > 0) {
                        return "    at " + components[0] + " (" + components.slice(1).join("@") + ")";
                    } else {
                        return "    at Object.<anonymous> (" + components.slice(1).join("@") + ")";
                    }

                }).join("\n");
            } else {
                return stack.join("\n");
            }

        }

        case "V8": {
            return stack.join("\n");
        }

        default: {
            return stack.join("\n");
        }

    }

};


// Convert a value to specified value type
//
//  -> valueType: boolean | number | string | buffer | regex | regex-ignore-case | regex-asterisk | regex-asterisk-dot | regex-path | regex-source-* | function | array | array-autoindex | object
//  -> options:
//      -> autowrapAsArray: true | false
//      -> stringDelimiter:
//      -> autotrim: true | false
//      -> ignoreEmptyElement: true | false
//      -> uniqueElement: true | false
//      -> defaultValue
//      -> numberShouldFinite: true | false
//      -> numberAsInteger: true | false
//      -> emptyAsNull: true | false
//      -> validator: template
//      -> failedValue:
//
var convert = function (value, valueType, options) {

    var regexFlags = "m";
    if (valueType && (valueType.indexOf("regex-source-") === 0)) {
        regexFlags = valueType.split("-")[2];
        valueType = "regex-source";
    }

    var validate = function (value) {

        if (options && options["validator"]) {
            if (template.execute(options["validator"], {
                "data": value
            }, {
                "functors": {
                    "isArrayLike": function (template, call, parameters, options, array) {
                        return isArrayLike(array);
                    },
                    "enum": function (template, call, parameters, options) {

                        var list = Array.prototype.slice.call(arguments, 4);

                        return (list.indexOf(parameters.data) !== -1);

                    },
                    "range": function (template, call, parameters, options, min, max, excludingMin, excludingMax) {

                        if ((parameters.data >= min) && (parameters.data <= max)) {

                            if (excludingMin && (parameters.data === min)) {
                                return false;
                            } else if (excludingMax && (parameters.data === max)) {
                                return false;
                            } else {
                                return true;
                            }

                        } else {
                            return false;
                        }

                    },
                    "notNull": function (template, call, parameters, options) {
                        return (parameters.data !== null) && (parameters.data !== undefined);
                    },
                    "notEmpty": function (template, call, parameters, options) {

                        if (isKindOf(parameters.data, String)) {
                            return parameters.data.length > 0;
                        } else if (isKindOf(parameters.data, Array)) {
                            return parameters.data.length > 0;
                        } else if (isArrayLike(parameters.data)) {
                            return parameters.data.length > 0;
                        } else {
                            return (parameters.data !== null) && (parameters.data !== undefined);
                        }

                    }
                }
            })) {
                return value;
            } else {
                if (options.hasOwnProperty("failedValue")) {
                    return options.failedValue;
                } else {
                    throw new Error("Invalid value: " + value);
                }
            }
        } else {
            return value;
        }

    };

    switch (valueType) {

        case "boolean": {

            if (isNull(value) && options) {
                return validate(options.defaultValue ? true : false);
            } else {
                return validate(value ? true : false);
            }

        }

        case "number": {

            var number = NaN;
            if (options && options.numberAsInteger) {
                number = parseInt(value);
            } else {
                number = parseFloat(value);
            }

            var shouldUseDefault = false;
            if (options && options.numberShouldFinite) {
                shouldUseDefault = !isFinite(number);
            } else {
                shouldUseDefault = isNaN(number);
            }

            if (shouldUseDefault) {
                if (options && options.numberAsInteger) {
                    number = parseInt(options.defaultValue);
                } else if (options) {
                    number = parseFloat(options.defaultValue);
                }
            }

            return validate(number);

        }

        case "string": {

            if (isKindOf(value, Date)) {
                return validate(formatDate(value, "YYYY-MM-DDThh:mm:ss.SSSZ", true));
            } else {

                if (isArrayLike(value) && options && options.stringDelimiter) {

                    return validate(copyAsArray(value).join(options.stringDelimiter));

                } else {

                    var result;
                    if (!isNull(value)) {
                        if (options && options.autotrim) {
                            result = ("" + value).trim();
                        } else {
                            result = "" + value;
                        }
                    }

                    if (options && options.emptyAsNull && (result.length === 0)) {
                        result = null;
                    }

                    if (isNull(result) && options && (!isNull(options.defaultValue))) {
                        result = "" + options.defaultValue;
                    }

                    return validate(result);

                }

            }

        }

        case "buffer": {

            if (isKindOf(value, String)) {
                return validate(new Buffer(value, "utf8"));
            } else if (isKindOf(value, Buffer)) {
                return validate(value);
            } else {

                value = options.defaultValue;

                if (isKindOf(value, String)) {
                    return validate(new Buffer(value, "utf8"));
                } else if (isKindOf(value, Buffer)) {
                    return validate(value);
                } else {
                    return null;
                }

            }

        }

        case "date": {

            if (isKindOf(value, String)) {

                if (/^(\-?)[0-9]+$/.test(value)) {
                    return validate(new Date(parseInt(value)));
                } else {
                    return validate(new Date(value));
                }

            } else if (isKindOf(value, Number)) {
                return validate(new Date(value));
            } else if (isKindOf(value, Date)) {
                return validate(value);
            } else if (options) {
                return validate((isNull(options.defaultValue) ? null : options.defaultValue));
            } else {
                return validate(null);
            }

        }

        case "regex":
        case "regex-ignore-case": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, RegExp)) {
                return validate(value);
            } else if (!isNull(value)) {

                var regex = new RegExp("^" + (value + "").replace(/[\$\^\*\(\)\-\+\[\]\{\}\\\|\,\?\/\.]/g, function (character) {
                    return "\\" + character;
                }) + "$", "m");

                regex.fromString = value;

                return validate(regex);

            } else {
                return validate(null);
            }
        }

        case "regex-asterisk": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, RegExp)) {
                return validate(value);
            } else if (!isNull(value)) {

                var regex = new RegExp("^" + (value + "").replace(/[\$\^\(\)\-\+\[\]\{\}\\\|\,\?\/\.]/g, function (character) {
                    return "\\" + character;
                }).replace(/\*/g, ".*") + "$", "m");

                regex.fromString = value;

                return validate(regex);

            } else {
                return validate(null);
            }
        }

        case "regex-asterisk-dot": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, RegExp)) {
                return validate(value);
            } else if (!isNull(value)) {

                var regex = new RegExp("^" + (value + "").replace(/[\$\^\(\)\-\+\[\]\{\}\\\|\,\?\/\.]/g, function (character) {
                    return "\\" + character;
                }).replace(/(\\\.)*(\*+)(\\\.)*/g, function (string) {

                    if (string.slice(0, 2) === "\\.") {
                        if (string.slice(-2) === "\\.") {
                            return "(\\.|\\..+\\.)";
                        } else {
                            return "(\\..+)?";
                        }
                    } else if (string.slice(-2) === "\\.") {
                        return "(.+\\.)?";
                    } else {
                        return ".*";
                    }

                }) + "$", "m");

                regex.fromString = value;

                return validate(regex);

            } else {
                return validate(null);
            }
        }

        case "regex-path": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, RegExp)) {
                return validate(value);
            } else if (!isNull(value)) {

                var regex = new RegExp("^" + (value + "")
                .replace(/[\\\/]+$/, "")
                .replace(/((^|[^\\\/])[\\\/]([^\\\/]|$))|([\$\^\(\)\-\+\[\]\{\}\|\,\\\/\.])/g, function (phrase) {
                    if (phrase.length > 1) {
                        return phrase.replace(/[\\\/]/g, "[\\\\\\\/]");
                    } else {
                        return "\\" + phrase;
                    }
                })
                .replace(/^(\\\/){2,}/g, "(.+[\\/\\\\])?")
                .replace(/(\\\/){2,}/g, "([\\/\\\\].+[\\/\\\\]|[\\/\\\\])")
                .replace(/\*/g, "[^\\/\\\\\\*\\?]+") + "$", "im");

                regex.fromString = value;

                return validate(regex);

            } else {
                return validate(null);
            }
        }

        case "regex-source": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, RegExp)) {
                return validate(value);
            } else if (!isNull(value)) {

                var regex = new RegExp(value + "", regexFlags);

                regex.fromString = value;

                return validate(regex);

            } else {
                return validate(null);
            }
        }

        case "function": {

            if (isKindOf(value, Function)) {

                return validate(value);

            } else if (isNull(value)) {

                if (options && options.hasOwnProperty("defaultValue")) {

                    if (isKindOf(options.defaultValue, Function)) {
                        return validate(options.defaultValue);
                    } else {
                        return validate(function () { return options.defaultValue; });
                    }

                } else {
                    return validate(function () { return value; });
                }

            } else {
                return validate(function () { return value; });
            }

        }

        case "array": {

            var array = null;
            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isKindOf(value, String)) {

                if (options && options.stringDelimiter) {

                    if (isArrayLike(options.stringDelimiter)) {

                        var regex = new RegExp("(" + options.stringDelimiter.map(function (delimiter) {
                            return (delimiter + "").replace(/[\$\^\*\(\)\-\+\[\]\{\}\\\|\,\?\/\.]/g, function (character) {
                                return "\\" + character;
                            });
                        }).join(")|(") + ")");

                        array = value.split(regex).filter(function (element) {
                            if (!isNull(element)) {
                                return !regex.test(element);
                            } else {
                                return false;
                            }
                        });

                    } else {
                        array = value.split(options.stringDelimiter);
                    }

                } else {

                    if (options && options.autowrapAsArray) {
                        array = [value];
                    }

                }

            } else {

                if (isArrayLike(value)) {

                    array = copyAsArray(value);

                } else {

                    if (options && options.autowrapAsArray) {
                        array = [value];
                    }

                }

            }

            if (array) {

                if (options && options.autotrim) {
                    array = array.map(function (element) {
                        if (isKindOf(element, String)) {
                            return element.trim();
                        } else {
                            return element;
                        }
                    });
                }

                if (options && options.ignoreEmptyElement) {
                    array = array.filter(function (element) {
                        return (element ? true : false);
                    });
                }

                if (options && options.uniqueElement) {

                    var array2 = [];

                    array.forEach(function (element) {
                        if (array2.indexOf(element) === -1) {
                            array2.push(element);
                        }
                    });

                    array = array2;
                }

            } else {
                array = [];
            }

            return validate(array);

        }

        case "array-autoindex": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            var array = [];

            if (value) {
                Object.keys(value).forEach(function (key) {
                    array.push(value[key]);
                });
            }

            if (options && options.autotrim) {
                array = array.map(function (element) {
                    if (isKindOf(element, String)) {
                        return element.trim();
                    } else {
                        return element;
                    }
                });
            }

            if (options && options.ignoreEmptyElement) {
                array = array.filter(function (element) {
                    return (element ? true : false);
                });
            }

            if (options && options.uniqueElement) {

                var array2 = [];

                array.forEach(function (element) {
                    if (array2.indexOf(element) === -1) {
                        array2.push(element);
                    }
                });

                array = array2;
            }

            return validate(array);

        }

        case "object": {

            if (isNull(value) && options) {
                value = options.defaultValue;
            }

            if (isNull(value) ||
                isKindOf(value, Boolean) ||
                isKindOf(value, Number) ||
                isKindOf(value, String) ||
                isKindOf(value, RegExp) ||
                isKindOf(value, Date)) {

                return validate({});

            } else {

                var result = {};
                iterateObject(value, function (key, value) {
                    result[key] = value;
                })

                return validate(result);
            }

        }

        default: {

            if (isKindOf(valueType, Function)) {

                if (isKindOf(value, valueType)) {
                    return validate(value);
                } else {
                    return validate(new valueType(value));
                }

            } else {

                return validate(value);

            }

        }

    }

};


// Merge elements
//
var merge = function () {

    var callArguments = copyAsArray(arguments);

    callArguments.unshift({});

    return advancedMerge.apply(this, callArguments);

};

// Merge elements with options
//
//   -> options
//
//      -> !valueType: boolean | number | string | buffer | date | regex | regex-ignore-case | regex-asterisk | regex-asterisk-dot | regex-path | regex-source-? | function | array | array-autoindex | object
//
//      -> !nullOperation: omit | overwrite
//
//      -> !warningMessage
//
//      -> !booleanFields
//      -> !numberFields
//      -> !stringFields
//      -> !bufferFields
//      -> !regexFields
//      -> !dateFields
//      -> !functionFields
//      -> !arrayFields
//
//      -> !aliasField
//      -> !aliasDeprecated: true | false
//
//      -> !defaultValue
//      -> !operation: plus | multiply | and | or | xor | max | min | multicall | concat | union | merge | overwrite | assign
//
//      -> !numberAsInteger
//      -> !arrayElement
//      -> !resultVariant
//      -> !stringDelimiter
//      -> !autotrimString: true | false
//      -> !comparatorPath
//      -> !comparatorType: date | string | natural | insensitive-natural | number
//      -> !ignoreEmptyElement: true | false
//
//      -> !objectProperty
//
//      -> !validator
//      -> !failedValue
//
//      -> !postscript
//      -> !templateData
//      -> !templateFunc
//
//      -> !noLogger
//
var advancedMerge = function (options) {

    var logger = null;

    if ((!options) || (!options["!noLogger"])) {

        if (!Logger) {
            Logger = require("./logger.js");
        }

        logger = new Logger();

    } else {
        logger = {
            "warn": function (message) {
                // Do nothing
            }
        };
    }

    var result = null;

    copyAsArray(arguments).slice(1).forEach(function (element) {

        var calculate = function (result, value, options, data, functors) {

            if (!options) {
                options = {};
            }

            if (!data) {
                data = {};
            } else {
                var newData = {};
                Object.keys(data).forEach(function (key) {
                    newData[key] = data[key];
                });
                data = newData;
            }

            if (!functors) {
                functors = {};
            } else {
                var newFunctors = {};
                Object.keys(data).forEach(function (key) {
                    newFunctors[key] = functors[key];
                });
                functors = newFunctors;
            }

            if (options["!templateData"]) {
                Object.keys(options["!templateData"]).forEach(function (key) {
                    data[key] = options["!templateData"][key];
                });
            }

            if (options["!templateFunctors"]) {
                Object.keys(options["!templateFunctors"]).forEach(function (key) {
                    functors[key] = options["!templateFunctors"][key];
                });
            }

            if (options["!warningMessage"]) {
                logger.warn(options["!warningMessage"]);
            }

            var valueType = "unknown";

            var resolve = function (fieldNames, rawValueType) {

                valueType = rawValueType;

                if (options[fieldNames]) {

                    var value2 = {};

                    options[fieldNames].split(/[\s,]+/g).forEach(function (fieldName) {
                        value2[fieldName] = value;
                    });

                    value = value2;
                }

            };

            var postprocess = function (value) {
                if (options["!postscript"]) {

                    var templateData = {};

                    Object.keys(data).forEach(function (key) {
                        templateData[key] = data[key];
                    });

                    templateData["data"] = value;

                    return template.execute(options["!postscript"], templateData, {
                        "functors": functors
                    });

                } else {
                    return value;
                }
            };

            if (isNull(value) || isKindOf(value, Symbol)) {

                if (options["!nullOperation"]) {
                    operation = options["!nullOperation"];
                } else {
                    operation = "omit";
                }

                valueType = "null";

            } else if (isKindOf(value, Boolean)) {
                resolve("!booleanFields", "boolean");
            } else if (isKindOf(value, Number)) {
                resolve("!numberFields", "number");
            } else if (isKindOf(value, String)) {
                resolve("!stringFields", "string");
            } else if (isKindOf(value, Buffer)) {
                resolve("!bufferFields", "buffer");
            } else if (isKindOf(value, Date)) {
                resolve("!dateFields", "date");
            } else if (isKindOf(value, RegExp)) {
                resolve("!regexFields", "regex");
            } else if (isKindOf(value, Function) && options["!functionField"]) {
                resolve("!functionFields", "function");
            } else {

                if (Array.isArray(value)) {

                    if (options["!arrayFields"]) {

                        var value2 = {};

                        options["!arrayFields"].split(/[\s,]+/g).forEach(function (fieldName) {
                            value2[fieldName] = value;
                        });

                        value = value2;

                    } else {

                        if (options["!arrayOperation"]) {
                            operation = options["!arrayOperation"];
                        }

                        valueType = "array";
                    }

                } else {
                    valueType = "object";
                }

            }

            var convertOptions = {
                "stringDelimiter": options["!stringDelimiter"],
                "autowrapAsArray": true,
                "autotrim": options["!autotrimString"],
                "ignoreEmptyElement": options["!ignoreEmptyElement"],
                "defaultValue": options["!defaultValue"],
                "numberAsInteger": options["!numberAsInteger"],
                "validator": options["!validator"]
            };

            if (options.hasOwnProperty("!failedValue")) {
                convertOptions.failedValue = options["!failedValue"];
            }

            value = convert(value, options["!valueType"], convertOptions);

            if (isNull(value) || (valueType === "null")) {

                if (options["!nullOperation"] === "overwrite") {

                    if (isNull(options["!defaultValue"])) {
                        return postprocess(null);
                    } else {
                        return postprocess(calculate(null, options["!defaultValue"], options, data, functors));
                    }

                } else {

                    if (isNull(result) && (!isNull(options["!defaultValue"]))) {
                        return postprocess(calculate(null, options["!defaultValue"], options, data, functors));
                    } else {
                        return postprocess(result);
                    }

                }

            } else {

                var resultType = options["!valueType"];
                if (resultType && (resultType.indexOf("regex") === 0)) {
                    resultType = "regex";
                }

                var simpleOperation = function (operation) {

                    if (isNull(result)) {

                        if (isNull(options["!defaultValue"])) {
                            return value;
                        } else {
                            return operation(convert(options["!defaultValue"], options["!valueType"]), value);
                        }

                    } else {
                        return operation(result, value);
                    }

                };

                switch (resultType) {

                    case "boolean": {

                        switch (options["!operation"]) {

                            case "and": {
                                return postprocess(simpleOperation(function (a, b) { return a && b; }));
                            }

                            case "or": {
                                return postprocess(simpleOperation(function (a, b) { return a || b; }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "number": {

                        switch (options["!operation"]) {

                            case "plus": {
                                return postprocess(simpleOperation(function (a, b) { return a + b; }));
                            }

                            case "multiply": {
                                return postprocess(simpleOperation(function (a, b) { return a * b; }));
                            }

                            case "and": {
                                return postprocess(simpleOperation(function (a, b) { return a & b; }));
                            }

                            case "or": {
                                return postprocess(simpleOperation(function (a, b) { return a | b; }));
                            }

                            case "xor": {
                                return postprocess(simpleOperation(function (a, b) { return a ^ b; }));
                            }

                            case "min": {
                                return postprocess(simpleOperation(function (a, b) { return Math.min(a, b); }));
                            }

                            case "max": {
                                return postprocess(simpleOperation(function (a, b) { return Math.max(a, b); }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "string": {

                        switch (options["!operation"]) {

                            case "plus":
                            case "concat": {
                                return postprocess(simpleOperation(function (a, b) {

                                    if (!isNull(options["!stringDelimiter"])) {

                                        if (a && b) {
                                            return a + options["!stringDelimiter"] + b;
                                        } else {
                                            return a + b;
                                        }

                                    } else {
                                        return a + b;
                                    }

                                }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "buffer": {

                        switch (options["!operation"]) {

                            case "concat": {
                                return postprocess(simpleOperation(function (a, b) {
                                    return Buffer.concat([a, b]);
                                }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "date": {

                        switch (options["!operation"]) {

                            case "min": {
                                return postprocess(simpleOperation(function (a, b) {
                                    if (a.getTime() < b.getTime()) {
                                        return a;
                                    } else {
                                        return b;
                                    }
                                }));
                            }

                            case "max": {
                                return postprocess(simpleOperation(function (a, b) {
                                    if (a.getTime() > b.getTime()) {
                                        return a;
                                    } else {
                                        return b;
                                    }
                                }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "regex": {
                        return postprocess(value);
                    }

                    case "function": {

                        var doubleFunction = function (functionA, functionB, operation) {
                            return function () {

                                if (functionA) {
                                    var a = functionA.apply(this, arguments);
                                    if (functionB) {
                                        return operation(a, functionB.apply(this, arguments));
                                    } else {
                                        return operation(a);
                                    }
                                } else if (functionB) {
                                    return operation(functionB.apply(this, arguments));
                                } else {
                                    return operation();
                                }

                            };
                        };

                        var operationFunction = function (operation) {

                            if (isNull(result)) {

                                if (isNull(options["!defaultValue"])) {
                                    return value;
                                } else {
                                    return doubleFunction(value, convert(options["!defaultValue"], options["!valueType"]), operation);
                                }

                            } else {
                                return doubleFunction(value, convert(result, options["!valueType"]), operation);
                            }

                        };

                        switch (options["!operation"]) {

                            case "multicall": {
                                return postprocess(operationFunction(function () {}));
                            }

                            case "plus": {
                                return postprocess(operationFunction(function () {
                                    var result = 0;
                                    copyAsArray(arguments).forEach(function (i) {
                                        result += i;
                                    });
                                    return result;
                                }));
                            }

                            case "multiply": {
                                return postprocess(operationFunction(function () {
                                    var result = 1;
                                    copyAsArray(arguments).forEach(function (i) {
                                        result *= i;
                                    });
                                    return result;
                                }));
                            }

                            case "and": {
                                return postprocess(operationFunction(function () {
                                    var result = 1;
                                    copyAsArray(arguments).forEach(function (i) {
                                        result = result && i;
                                    });
                                    return result;
                                }));
                            }

                            case "or": {
                                return postprocess(operationFunction(function () {
                                    var result = 0;
                                    copyAsArray(arguments).forEach(function (i) {
                                        result = result || i;
                                    });
                                    return result;
                                }));
                            }

                            case "min": {
                                return postprocess(operationFunction(function () {
                                    return Math.min.apply(Math, arguments);
                                }));
                            }

                            case "max": {
                                return postprocess(operationFunction(function () {
                                    return Math.max.apply(Math, arguments);
                                }));
                            }

                            case "concat": {
                                return postprocess(operationFunction(function () {
                                    var result = [];
                                    copyAsArray(arguments).forEach(function (i) {
                                        result.push(calculate(null, i, options["!resultVariant"], data, functors));
                                    });
                                    return result;
                                }));
                            }

                            case "union": {
                                return postprocess(operationFunction(function () {
                                    var result = [];
                                    copyAsArray(arguments).forEach(function (i) {
                                        if (result.indexOf(i) === -1) {
                                            result.push(calculate(null, i, options["!resultVariant"], data, functors));
                                        }
                                    });
                                    return result;
                                }));
                            }

                            case "merge": {
                                return postprocess(operationFunction(function () {

                                    var mergeArguments = copyAsArray(arguments);
                                    mergeArguments.unshift(options["!resultVariant"]);

                                    return advancedMerge.call(this, mergeArguments);

                                }));
                            }

                            case "overwrite":
                            default: {
                                return postprocess(value);
                            }

                        }

                    }

                    case "array":
                    case "array-autoindex": {

                        switch (options["!operation"]) {

                            case "concat": {

                                var newResult = [];

                                iterateArray(result, function (element) {
                                    newResult.push(calculate(null, element, options["!arrayElement"], data, functors));
                                });

                                iterateArray(value, function (element) {
                                    newResult.push(calculate(null, element, options["!arrayElement"], data, functors));
                                });

                                return postprocess(newResult);
                            }

                            case "union": {

                                var newResult = [];

                                iterateArray(result, function (element) {

                                    element = calculate(null, element, options["!arrayElement"], data, functors);

                                    var index = getIndex(newResult,
                                        options["!comparatorPath"], options["!comparatorType"],
                                        getProperty(element, options["!comparatorPath"]));

                                    if (index === -1) {
                                        newResult.push(element);
                                    } else {
                                        newResult[index] = calculate(newResult[index], element, options["!arrayElement"], data, functors);
                                    }

                                });

                                iterateArray(value, function (element) {

                                    element = calculate(null, element, options["!arrayElement"], data, functors);

                                    var index = getIndex(newResult,
                                        options["!comparatorPath"], options["!comparatorType"],
                                        getProperty(element, options["!comparatorPath"]));

                                    if (index === -1) {
                                        newResult.push(element);
                                    } else {
                                        newResult[index] = calculate(newResult[index], element, options["!arrayElement"], data, functors);
                                    }

                                });

                                return postprocess(newResult);
                            }

                            case "overwrite": {
                                return postprocess(value.slice(0));
                            }

                            case "merge":
                            default: {

                                var newResult = [];

                                iterateArray(result, function (element, index) {
                                    newResult[index] = calculate(null, element, options["!arrayElement"], data, functors);
                                });

                                iterateArray(value, function (element, index) {
                                    newResult[index] = calculate(newResult[index], element, options["!arrayElement"], data, functors);
                                });

                                return postprocess(newResult);
                            }

                        }

                    }

                    case "object":
                    default: {

                        var convertKeyValue = function (result, key, value) {

                            while (options[key] && options[key]["!aliasField"]) {

                                var key2 = options[key]["!aliasField"];

                                if (options[key]["!aliasDeprecated"]) {
                                    logger.warn("Field \"" + key + "\" is deprecated, please use field \"" + key2 + "\"");
                                }

                                value = calculate(result[key], value, options[key], data, functors);

                                key = key2;

                            }

                            if (options[key]) {
                                result[key] = calculate(result[key], value, options[key], data, functors);
                            } else if (options["!objectProperty"]) {
                                result[key] = calculate(result[key], value, options["!objectProperty"], data, functors);
                            } else if (options["!objectElement"]) {

                                logger.warn("Template definition \"!objectElement\" is deprecated for adavanced merge, please use \"!objectProperty\"");

                                result[key] = calculate(result[key], value, options["!objectElement"], data, functors);

                            } else {
                                result[key] = calculate(result[key], value, null, data, functors);
                            }

                        };

                        if (isKindOf(value, Boolean) ||
                            isKindOf(value, Number) ||
                            isKindOf(value, String) ||
                            isKindOf(value, Buffer) ||
                            isKindOf(value, Date) ||
                            isKindOf(value, RegExp) ||
                            isKindOf(value, Function) ||
                            isKindOf(value, Error) ||
                            isKindOf(value, Symbol) ||
                            isNull(result) ||
                            isKindOf(result, Boolean) ||
                            isKindOf(result, Number) ||
                            isKindOf(result, String) ||
                            isKindOf(result, Date) ||
                            isKindOf(result, Function) ||
                            isKindOf(result, Error) ||
                            isKindOf(result, Symbol) ||
                            isKindOf(result, RegExp)) {

                            if (isKindOf(value, Boolean) ||
                                isKindOf(value, Number) ||
                                isKindOf(value, String) ||
                                isKindOf(value, Buffer) ||
                                isKindOf(value, Date) ||
                                isKindOf(value, RegExp) ||
                                isKindOf(value, Function) ||
                                isKindOf(value, Error) ||
                                isKindOf(value, Symbol)) {

                                return postprocess(value);

                            } else {

                                if ((options["!operation"] === "assign") || (value && value.constructor !== Object)) {

                                    iterateObject(options, function (key2, value2) {
                                        if ((key2[0] !== "!") && (!isNull(value2) && options[key2].hasOwnProperty("!defaultValue"))) {
                                            convertKeyValue(value, key2, null);
                                        }
                                    });

                                    return postprocess(value);

                                } else {

                                    var newResult = ((isKindOf(value, Array) && (!resultType)) ? [] : {});

                                    iterateObject(value, function (key2, value2) {
                                        convertKeyValue(newResult, key2, value2);
                                    });

                                    iterateObject(options, function (key2, value2) {
                                        if ((key2[0] !== "!") && (!isNull(value2) && options[key2].hasOwnProperty("!defaultValue")) && isNull(newResult[key2])) {
                                            convertKeyValue(newResult, key2, null);
                                        }
                                    });

                                    return postprocess(newResult);

                                }

                            }

                        } else {

                            switch (options["!operation"]) {

                                case "assign": {

                                    iterateObject(options, function (key2, value2) {
                                        if ((key2[0] !== "!") && (!isNull(value2) && options[key2].hasOwnProperty("!defaultValue")) && isNull(newResult[key2])) {
                                            convertKeyValue(value, key2, null);
                                        }
                                    });

                                    return postprocess(value);

                                }

                                case "overwrite": {

                                    var newResult = ((isKindOf(value, Array) && (!resultType)) ? [] : {});

                                    iterateObject(value, function (key2, value2) {
                                        convertKeyValue(newResult, key2, value2);
                                    });

                                    iterateObject(options, function (key2, value2) {
                                        if ((key2[0] !== "!") && (!isNull(value2) && options[key2].hasOwnProperty("!defaultValue")) && isNull(newResult[key2])) {
                                            convertKeyValue(newResult, key2, null);
                                        }
                                    });

                                    return postprocess(newResult);

                                }

                                case "merge":
                                default: {

                                    var newResult = value;
                                    if (value.constructor === Object) {
                                        newResult = ((isKindOf(value, Array) && (!resultType)) ? [] : {});
                                    }

                                    iterateObject(result, function (key2, value2) {
                                        convertKeyValue(newResult, key2, value2);
                                    });

                                    if (newResult !== value) {
                                        iterateObject(value, function (key2, value2) {
                                            convertKeyValue(newResult, key2, value2);
                                        });
                                    }

                                    iterateObject(options, function (key2, value2) {
                                        if ((key2[0] !== "!") && (!isNull(value2) && options[key2].hasOwnProperty("!defaultValue")) && isNull(newResult[key2])) {
                                            convertKeyValue(newResult, key2, null);
                                        }
                                    });

                                    return postprocess(newResult);

                                }

                            }

                        }

                    }

                }

            }

        };

        result = calculate(result, element, options, {}, {});

    });

    return result;

};


// Match arguments
//
var matchArguments = function (matches, fields, argumentsToMatch) {

    var formalFields = {};

    iterateObject(fields, function (key, value) {
        formalFields[key] = advancedMerge({
            "!noLogger": true,
            "!stringFields": "acceptsTypes",
            "!arrayFields": "acceptsTypes",
            "acceptTypes": {
                "!valueType": "array-autoindex",
                "!stringFields": "type",
                "!defaultValue": ["any"]
            },
            "mergeOptions": {
                "!valueType": "object"
            },
            "defaultValue": null
        }, value);
    });

    var result = null;

    iterateObject(matches, function (name, list) {

        if (list.length === argumentsToMatch.length) {

            var newResult = {};

            var failed = false;

            var index = 0;
            while (index < list.length) {

                var field = formalFields[list[index]];

                var accepted = false;
                field.acceptTypes.forEach(function (type) {
                    if (!accepted) {
                        accepted = couldBeAcceptedAs(argumentsToMatch[index], type);
                    }
                });

                if (accepted) {
                    if (field.mergeOptions) {
                        newResult[list[index]] = advancedMerge(field.mergeOptions, argumentsToMatch[index]);
                    } else {
                        newResult[list[index]] = argumentsToMatch[index];
                    }
                } else {
                    failed = true;
                }

                ++index;
            }

            if (!failed) {
                result = newResult;
            }

        }

    });

    if (result) {

        iterateObject(formalFields, function (key, value) {

            if (!result.hasOwnProperty(key)) {
                result[key] = advancedMerge(value.mergeOptions, value.defaultValue);
            }

        });

        return result;

    } else {

        throw new Error("Invalid arguments to match with settings");

    }

};

var getProperty = function (object, path) {

    path = convert(path, "string");
    if (isNull(path)) {
        path = "";
    }

    path = path.replace(/[\.\s]+/g, ".");

    if ((path.length > 0) && (path !== ".")) {
        path.split(".").forEach(function (component) {

            if (!isNull(object)) {
                object = object[component];
            } else {
                object = null;
            }

        });
    }

    return object;

};

var getIndex = function (arrayLike, path, type, value) {

    path = convert(path, "string");
    if (isNull(path)) {
        path = "";
    }

    var pathComparator = comparator.generatePathComparator(path, type, true);

    var index = 0;
    while (index < arrayLike.length) {

        if (pathComparator(arrayLike[index], value) === 0) {
            return index;
        }

        ++index;
    }

    return -1;

};

var keys = function (object) {

    var keys = [];

    for (var key in object) {
        if (keys.indexOf(key) === -1) {
            keys.push(key);
        }
    }

    return keys.sort(comparator.insensitiveNaturalComparator);

};

var stringHash = function(string){
    var hash = 0, i, chr, len;
    if (string.length == 0){
        return hash;
    }
    for (i = 0, len = string.length; i < len; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

module.exports = {

    "deprecated": deprecated,

    "getScriptEngineName": getScriptEngineName,

    "objectize": objectize,

    "isNull": isNull,
    "isKindOf": isKindOf,

    "isArrayLike": isArrayLike,

    "copyAsArray": copyAsArray,

    "iterateArray": iterateArray,
    "iterateObject": iterateObject,

    "formatDate": formatDate,

    "couldBeAcceptedAs": couldBeAcceptedAs,
    "simplify": simplify,
    "convert": convert,

    "merge": merge,
    "advancedMerge": advancedMerge,

    "prepadZero": prepadZero,

    "getStack": getStack,

    "jsonize": jsonize,

    "matchArguments": matchArguments,

    "getProperty": getProperty,
    "getIndex": getIndex,

    "keys": keys,

    "stringHash" : stringHash

};
