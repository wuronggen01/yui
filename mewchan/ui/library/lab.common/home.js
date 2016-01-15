var fs = require("fs");
var path = require("path");

var foundation = require("./foundation.js");
var storage = require("./storage.js");
var configCaches = {};

var registeredConfigs = {};

var utilHomeDir = null;

var getConfig = function (configPath, noCache, callback) {

    if ((!configCaches.hasOwnProperty(configPath)) || noCache) {

        configCaches[configPath] = {};

        callback(configCaches[configPath]);

    } else {

        callback(configCaches[configPath]);

    }

};

var getConfigSync = function (configPath, noCache) {

    if ((!configCaches.hasOwnProperty(configPath)) || noCache) {

        configCaches[configPath] = {};

    }

    return configCaches[configPath];

};

var getUtilHomeDir = function (subpath) {

    if (subpath) {
        if (utilHomeDir) {
            return path.resolve(utilHomeDir, subpath);
        } else {
            return path.resolve(process.cwd(), subpath);
        }
    } else {
        if (utilHomeDir) {
            return utilHomeDir;
        } else {
            return process.cwd();
        }
    }

};

var setUtilHomeDir = function (homePath, callback) {

    utilHomeDir = homePath;

    var looper = 0;

    var loop = function () {

        if (looper < registeredConfigs.length) {

            ++looper;

            getUtilConfig(registeredConfigs[looper - 1], null, loop);

        } else {
            callback();
        }

    };

    loop();

};

var getUtilConfig = function (config, mergeRules) {

    if (!mergeRules) {
        mergeRules = registeredConfigs[config];
    }

    var allMergeArguments = foundation.copyAsArray(arguments).slice(2);

    var callback = function () {};
    if (foundation.isKindOf(allMergeArguments[allMergeArguments.length - 1]), Function) {
        callback = allMergeArguments.pop();
    }

    var homeConfigPath = path.resolve(storage.getHomeDir(".mew/conf"), config + ".json");
    var utilConfigPath = path.resolve(getUtilHomeDir("conf"), config + ".json");

    getConfig(homeConfigPath, mergeRules["!noCache"], function (config) {

        allMergeArguments.unshift(config);

        if (homeConfigPath !== utilConfigPath) {

            getConfig(utilConfigPath, mergeRules["!noCache"], function (config) {

                allMergeArguments.unshift(config);

                allMergeArguments.unshift(mergeRules);

                callback(foundation.advancedMerge.apply(foundation, allMergeArguments));

            });

        } else {

            allMergeArguments.unshift(mergeRules);

            callback(foundation.advancedMerge.apply(foundation, allMergeArguments));

        }

    });

};

var getUtilConfigSync = function (config, mergeRules) {

    if (!mergeRules) {
        mergeRules = registeredConfigs[config];
    }

    var allMergeArguments = foundation.copyAsArray(arguments).slice(2);

    var homeConfigPath = path.resolve(storage.getHomeDir(".mew/conf"), config + ".json");

    var utilConfigPath = path.resolve(getUtilHomeDir("conf"), config + ".json");

    allMergeArguments.unshift(getConfigSync(homeConfigPath, mergeRules["!noCache"]));

    if (homeConfigPath !== utilConfigPath) {
        allMergeArguments.unshift(getConfigSync(utilConfigPath, mergeRules["!noCache"]));
    }

    allMergeArguments.unshift(mergeRules);

    return foundation.advancedMerge.apply(foundation, allMergeArguments);

};

var registerUtilConfig = function (config, mergeRules) {

    if (!registeredConfigs.hasOwnProperty(config)) {
        registeredConfigs[config] = mergeRules;
    }

};

var getFileLine = function (offset, components, needColumn) {

    var stack = new Error().stack;

    if (stack){
        var prefix = "@";

        if (foundation.getScriptEngineName() === "V8") {

            ++offset;

            prefix = "at";

        }

        if (!foundation.isKindOf(components, Number)) {
            components = 3;
        }
        components = stack.split("\n")[offset + 1].split(prefix).slice(1).join(prefix).split(path.sep).slice(-components).join("/").split(":");
    } else {
        components = [document.URL.split(path.sep).slice(-components).join("/"), "0" , "0"];
    }


    if (needColumn) {
        return components.join(":").trim();
    } else {
        return components.slice(0, components.length - 1).join(":").trim();
    }

};


module.exports = {

    "getConfig": getConfig,
    "getConfigSync": getConfigSync,

    "getUtilHomeDir": getUtilHomeDir,
    "setUtilHomeDir": setUtilHomeDir,

    "getUtilConfig": getUtilConfig,
    "getUtilConfigSync": getUtilConfigSync,

    "registerUtilConfig": registerUtilConfig,

    "getFileLine": getFileLine

};
