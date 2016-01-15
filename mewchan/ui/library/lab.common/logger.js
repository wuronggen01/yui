var os = require("os");
var path = require("path");

var foundation = require("./foundation.js");
var home = require("./home.js");

home.registerUtilConfig("logger", {

    "!noLogger": true,

    "logLevel": { "!valueType": "string", "!defaultValue": "info" },
    "logStyle": { 
        "!valueType": "string", 
        "!defaultValue": (process.isEmbedded ? "none" : ((os.type().toLowerCase() === "darwin") ? "bright" : "dark")) 
    },

    "supportMultipleLine": { "!valueType": "boolean", "!defaultValue": true },

    "autorecordFileLine": { "!valueType": "boolean", "!defaultValue": true },

    "prefix": { "!valueType": "string", "!defaultValue": "" }

});

var styleCodePoints = {

    "white": [37, 39], 
    "black": [30, 39], 
    "blue": [34, 39], 
    "cyan": [36, 39],
    "green": [32, 39],
    "magenta": [35, 39],
    "red": [31, 39],
    "yellow": [33, 39],
    "brightBlack": [90, 39],
    "brightRed": [91, 39],
    "brightGreen": [92, 39],
    "brightYellow": [93, 39],
    "brightBlue": [94, 39],
    "brightMagenta": [95, 39],
    "brightCyan": [96, 39],
    "brightWhite": [97, 39],

    "bold": [1, 22],
    "dim": [2, 22],
    "italic": [3, 23],
    "underline": [4, 24],
    "inverse": [7, 27],
    "hidden": [8, 28],
    "strikethrough": [9, 29]

};

var logLevelMap = {
    "system": 1,
    "assert": 2,
    "error": 3,
    "dump": 4,
    "warn": 5,
    "celebr": 6,
    "info": 7,
    "debug": 8
};

var logLevelDisplayMap = {
    "system": "[system]",
    "assert": "[assert]",
    "error":  " [error]",
    "warn":   "  [warn]",
    "info":   "  [info]",
    "celebr": "[celebr]",
    "debug":  " [debug]",
    "dump":   "  [dump]"
};

var styles = {

    "bright": {
        "system": ["magenta", "bold"],
        "assert": ["magenta"],
        "error":  ["red", "bold"],
        "warn":   ["yellow", "bold"],
        "celebr": ["cyan", "bold"],
        "info":   ["black"],
        "debug":  ["brightBlack"],
        "dump":   ["blue", "bold"],
        "line":   ["white"]
    },

    "dark": {
        "system": ["brightMagenta", "bold"],
        "assert": ["brightMagenta"],
        "error":  ["brightRed", "bold"],
        "warn":   ["brightYellow", "bold"],
        "celebr": ["brightGreen", "bold"],
        "info":   ["brightWhite"],
        "debug":  ["white"],
        "dump":   ["brightCyan"],
        "line":   ["brightBlack"]
    },

};

var logPlaceholder = null;

var Logger = function Logger(options) {

    options = home.getUtilConfigSync("logger", null, options);

    this.logLevel = options.logLevel;
    this.prefix = options.prefix;

    ["logStyle", "supportMultipleLine", "autorecordFileLine"].forEach((function (key) {
        Object.defineProperty(this, key, {
            "enumerable": false,
            "value": options[key]
        });
    }).bind(this));

};

Object.defineProperty(Logger.prototype, "logWithLevel", {
    "enumerable": false,
    "value": function (fileLine, level) {

        if (logLevelMap[this.logLevel] >= logLevelMap[level]) {

            var loggedByHandler = false;
            if (this.handler) {
                try {
                    loggedByHandler = this.handler.apply(this, arguments);
                } catch (error) {
                    // Ignore error
                }
            }

            if (!loggedByHandler) {
                this.logInConsole.apply(this, arguments);
            }

        }

    }
});

Object.defineProperty(Logger.prototype, "logInConsole", {
    "enumerable": false,
    "value": function (fileLine, level, object) {

        var prefix = foundation.formatDate(new Date(), "MM-DD hh:mm:ss.SSS", true) + " " + logLevelDisplayMap[level].toUpperCase() + " ";

        if (!logPlaceholder) {
            logPlaceholder = prefix.replace(/./g, function () {
                return " ";
            });
        }

        if (this.prefix) {
            prefix += this.prefix;
        }

        var object = arguments[2];
        if (arguments.length > 3) {
            object = foundation.copyAsArray(arguments).slice(2).join(", ");
        }

        var message = null;
        if (object === null) {
            message = "null";
        } else if (object === undefined) {
            message = "undefined";
        } else if (object instanceof Error) {
            message = object.message + "\n" + foundation.getStack(object);
        } else if (object.constructor === Buffer) {
            message = object.toString();
        } else if (object.constructor !== String) {
            message = foundation.jsonize(object);
        } else {
            message = object;
        }

        message = message.split("\n").map((function (line, index) {

            if (index > 0) {

                if (this.supportMultipleLine) {
                    return logPlaceholder + line;
                } else {
                    return line;
                }

            } else {
                return prefix + line;
            }

        }).bind(this)).join("\n");

        if (this.autorecordFileLine) {
            fileLine = "(" + fileLine + ")";
        }

        if (styles[this.logStyle]) {

            var messageStyles = styles[this.logStyle][level];
            if (messageStyles) {
                messageStyles.forEach(function (style) {

                    if (styleCodePoints[style]) {

                        var open = "\u001b[" + styleCodePoints[style][0] + "m";
                        var close = "\u001b[" + styleCodePoints[style][1] + "m";

                        message = open + message + close;

                    }

                });
            }

            var fileLineStyles = styles[this.logStyle]["line"];
            if (fileLineStyles) {
                fileLineStyles.forEach(function (style) {

                    if (styleCodePoints[style]) {

                        var open = "\u001b[" + styleCodePoints[style][0] + "m";
                        var close = "\u001b[" + styleCodePoints[style][1] + "m";

                        fileLine = open + fileLine + close;

                    }

                });
            }

        }

        if (this.autorecordFileLine) {
            message += " " + fileLine;
        }

        this.output(message);

    }
});

Object.keys(logLevelMap).forEach((function (level) {
    Object.defineProperty(Logger.prototype, level, {
        "enumerable": false,
        "configurable": true,
        "writable": true,
        "value": function () {

            var logArguments = Array.prototype.slice.call(arguments, 0);

            logArguments.unshift(level);

            logArguments.unshift(home.getFileLine(1));

            this.logWithLevel.apply(this, logArguments);

        }
    });
}).bind(this));

Object.defineProperty(Logger.prototype, "assert", {
    "enumerable": false,
    "value": function (condition) {

        if (!condition) {

            var logArguments = Array.prototype.slice.call(arguments, 1);

            logArguments.unshift("assert");

            logArguments.unshift(home.getFileLine(1));

            this.logWithLevel.apply(this, logArguments);

        }

    }
});

Object.defineProperty(Logger.prototype, "dump", {
    "enumerable": false,
    "value": function (object, maximumLevel) {

         if (!maximumLevel) {
             maximumLevel = 3;
         }

        if (this.prefix || (!this.supportMultipleLine)) {
            this.logWithLevel.call(this, home.getFileLine(1), "dump", "\n" + foundation.jsonize(object, "", maximumLevel));
        } else {
            this.logWithLevel.call(this, home.getFileLine(1), "dump", foundation.jsonize(object, "", maximumLevel));
        }

    }
});

Object.defineProperty(Logger.prototype, "clearScreen", {
    "enumerable": false,
    "value": function () {
        this.output("\u001b[2J");
    }
});

Object.defineProperty(Logger.prototype, "output", {
    "enumerable": false,
    "value": function (data) {
        console.log(data);
    }
});

module.exports = Logger;