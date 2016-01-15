(function () {

    Object.defineProperty(this.constructor.prototype, "global", {
        "enumerable": true,
        "get": function () {
          return this;
        }
    });

    Object.defineProperty(global, "Global", {
        "enumerable": true,
        "value": global.constructor
    });

    var getFileLine = function (offset) {

        offset = parseInt(offset);
        if (!isFinite(offset)) {
            offset = 0;
        }

        try {

            var stack = new Error("937b84bb-7953-4443-be30-34ba130b98e7").stack.split("\n");
            var line = null;
            if (stack[0].indexOf("937b84bb-7953-4443-be30-34ba130b98e7") !== -1) {
                line = stack[2 + offset];
            } else {
                line = stack[1 + offset];
            }

            if (line.substring(0, 7) === "    at ") {
                line = line.split("at").slice(1).join("at");
            } else {
                line = line.split("@");
                if (line.length > 1) {
                    line = line.slice(1).join("@");
                } else {
                    line = line[0];
                }
            }

            if (line[line.length - 1] === ")") {
                line = line.split("(").slice(1).join("(").slice(0, -1);
            }

            return line.trim();

        } catch (error) {
            return document.URL;
        }

    };

    Object.defineProperty(Global.prototype, "__dirname", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return getFileLine(1).split(":").slice(0, -2).join(":").split("/").slice(0, -1).join("/");
        }
    });

    Object.defineProperty(Global.prototype, "__filename", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return getFileLine(1).split(":").slice(0, -2).join(":");
        }
    });

    Object.defineProperty(Global.prototype, "__line", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return parseInt(getFileLine(1).split(":").slice(-2, -1)[0]);
        }
    });

    Object.defineProperty(Global.prototype, "__column", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return parseInt(getFileLine(1).split(":").slice(-1)[0]);
        }
    });

    var modules = {};

    var rootURL = __filename.split("/").slice(0, 3).join("/");
    var loadedModules = {};

    var Module = function (parent, id, autoregister, callback) {

        var module = this;

        if (autoregister) {
            modules[id] = this;
        }

        this.parent = parent;

        this.id = id;

        this.filename = id;

        this.loaded = false;

        this.children = [];

        this.exports = {};

        this.require = (function (id, callback) {

            if (id[0] === ".") {
                id = this.id.split("/").slice(0, -1).join("/") + "/" + id;
            }

            if (!loadedModules[id]) {

                var newID = null;
                if (id.indexOf("://") !== -1) {
                    newID = [id.split("/").slice(0, 3).join("/")];
                    id = "/" + id.split("/").slice(3).join("/");
                } else {
                    newID = [this.id.split("/").slice(0, 3).join("/")];
                }

                id = id.replace(/\/+/gm, "/").split("/");
                if (id[0] === "/") {
                    id = id.slice(1);
                }

                id.forEach(function (component) {

                    if (component === "..") {

                        if (newID.length > 1) {
                            newID.pop();
                        } else{
                            throw new Error("Invalid path to resolve for module require");
                        }

                    } else if (component === ".") {
                        // Do nothing
                    } else if (component.length === 0) {
                        // Do nothing
                    } else {
                        newID.push(component);
                    }

                });

                id = newID.join("/");
            }

            return Module.get(this, id, callback).exports;

        }).bind(this);

        if (((!global.document) || ((Array.prototype.filter.call(document.querySelectorAll("script"), function (element) {
                return (element.src === id);
            }).length === 0) && ((document.documentURI||document.URL).split("#")[0].split("?")[0] !== id))) && (!loadedModules[id])) {

            loadedModules[id] = true;

            var load = function (code) {
                try{
                    global[(function () { return "eval"; })()](
                        "(function () { return function (module, require, exports, __filename, __diranme) {" + code + "}; })(); //@ sourceURL=" + id)(
                            module, module.require, module.exports, module.id, module.id.split("/").slice(0, -1).join("/"), module.exports
                        );
                } catch (ex){
                    console.log(ex);
                }

            };

            if (global.$ && global.$.loadResources && (callback || global.$.isResourceCached(id))) {

                global.$.loadResources(id, function (error, contents) {

                    if (error) {

                        if (callback) {
                            callback(error);
                        }

                    } else {

                        load(contents[id]);

                        if (callback) {
                            callback(null, module.exports);
                        }

                    }

                });

            } else {

                var request = null;
                if (window.XDomainRequest) {
                    request = new XDomainRequest();
                } else if (window.XMLHttpRequest) {
                    request = new XMLHttpRequest();
                } else {
                    request = new ActiveXObject("Microsoft.XMLHTTP");
                }

                if (callback) {
                    request.addEventListener("readystatechange", function () {
                        if (request.readyState === 4) {
                            switch (request.status % 100) {

                                case 0:
                                case 2: {

                                    load(request.responseText);

                                    callback(null, module.exports);

                                    break;
                                }

                                default: {
                                    callback(new Error("Failed to module " + path));
                                }

                            }
                        }
                    });
                }

                request.open("GET", id, (callback ? true : false));

                request.send();

                if (!callback) {
                    load(request.responseText);
                }

            }

        } else {
            loadedModules[id] = true;
        }

    };

    Module.get = function (parent, id, callback) {

        if (modules.hasOwnProperty(id)) {

            if (callback) {
                callback(null, modules[id].exports);
            }

            return modules[id];

        } else {

            if (parent === null) {
                parent = modules[__filename];
            }

            return new Module(parent, id, true, callback);

        }

    };

    Module._extensions = {};

    var getModule = function (parent, offset) {

        var id = getFileLine(1 + offset).split(":").slice(0, -2).join(":");
        if (id) {
            return Module.get(parent, id);
        } else {
            return mainModule;
        }

    };

    Object.defineProperty(Global.prototype, "module", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return getModule(null, 1);
        }
    });

    Object.defineProperty(Global.prototype, "require", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return getModule(null, 1).require;
        }
    });

    Object.defineProperty(Global.prototype, "exports", {
        "enumerable": false,
        "configurable": false,
        "get": function () {
            return getModule(null, 1).exports;
        },
        "set": function (exports) {
            getModule(null, 1).exports = exports;
        }
    });

    var registerModule = function (name, apis) {

        loadedModules[name] = true;

        var newModule = new Module(module, name, true);

        Object.keys(apis).forEach(function (key) {
            newModule.exports[key] = apis[key];
        });

    };

    var notImplSync = function () {
        throw new Error("Not implemented");
    };

    var notImpl = function () {
        arguments[arguments.length - 1](new Error("Not implemented"));
    };

    var mainFile = (document.documentURI||document.URL).split("#")[0].split("?")[0];

    var mainModule = Module.get(null, mainFile);

    var startTime = new Date().getTime();

    registerModule("module", Module);

    registerModule("os", {
        "tmpdir": function () { return null; },
        "endianness": function () { return "BE"; },
        "type": function () { return "browser"; },
        "hostname": function () { return "browser"; },
        "platform": function () { return "browser"; },
        "arch": function () { return "js"; },
        "release": function () { return "0.1.0"; },
        "uptime": function () { return (new Date().getTime() - startTime) / 1000; },
        "loadavg": function () { return [0, 0, 0]; },
        "totalmem": function () { return Infinity; },
        "freemem": function () { return Infinity; },
        "cpus": function () {
            return [{
                "model": "Browser Javascript CPU",
                "speed": Infinity,
                "times": { "user": 0, "nice": 0, "sys": 0, "idle": 0, "irq": 0 }
            }];
        }
    });

    registerModule("path", {
        "normalize": function (path) {

            var pair = path.split("://");

            if (pair.length > 1) {
                return pair[0] + "://" + pair.slice(1).join("://").replace(/\/+/g, "/").replace(/\/.\//g, "/").replace(/\/[^\/]\/..\//g, "/");
            } else {
                return pair.join("://").replace(/\/+/g, "/").replace(/\/.\//g, "/").replace(/\/[^\/]\/..\//g, "/")
            }

        },
        "join": function () {
            return this.normalize(Array.prototype.join.call(arguments, "/"));
        },
        "resolve": function () {

            var path = null;

            var looper = 0;
            while (looper < arguments.length) {

                if (arguments[looper].indexOf("://") !== -1) {
                    path = arguments[looper];
                } else {
                    path = path + "/" + arguments[looper];
                }

                ++looper;
            }

            return this.normalize(path);

        },
        "isAbsolute": function (path) {
            return (arguments[looper].indexOf("://") !== -1);
        },
        "relative": function (basePath, path) {

            basePathComponents = basePath.split("/");
            pathComponents = path.split("/");

            if ((pathComponents[0] !== basePathComponents[0]) ||
                (pathComponents[1] !== basePathComponents[1]) ||
                (pathComponents[2] !== basePathComponents[2])) {
                return path;
            } else {

                var looper = 3;
                while ((looper < basePathComponents.length) && (pathComponents[looper] === basePathComponents[looper])) {
                    ++looper;
                }

                var components = [];
                while (looper < pathComponents.length) {

                    if (looper < basePathComponents.length) {
                        components.unshift("..");
                    }

                    components.push(pathComponents[looper]);

                    ++looper;
                }

                return components.join("/");

            }

        },
        "dirname": function (path) {
            return path.split("/").slice(0, -1).join("/");
        },
        "basename": function (path, extname) {

            var basename = path.split("/").slice(-1)[0];
            if (extname) {
                if (basename.substring(basename.length - extname.length, basename.length) === extname) {
                    basename = basename.substring(basename.length - extname.length);
                }
            }

            return basename;
        },
        "extname": function (path) {
            var components = path.split("/").slice(-1)[0].split(".");
            if ((components.length > 1) && ((components[0].length > 0) || (components.length > 2))) {
                return components[components.length - 1];
            } else {
                return "";
            }
        },
        "sep": "/",
        "delimiter": ":"
    });


    registerModule("fs", {

        "Stats": notImplSync,
        "FSWatcher": notImplSync,
        "ReadStream": notImplSync,
        "WriteStream": notImplSync,

        "exists": function (path, callback) {
            callback(false);
        },
        "existsSync": function (path) {
            return false;
        },

        "readFile": notImpl,
        "readFileSync": notImplSync,
        "writeFile": notImpl,
        "writeFileSync": notImplSync,
        "truncate": notImpl,
        "truncateSync": notImplSync,
        "unlink": notImpl,
        "unlinkSync": notImplSync,

        "stat": notImpl,
        "statSync": notImplSync,
        "lstat": notImpl,
        "lstatSync": notImplSync,

        "readdir": notImpl,
        "readdirSync": notImplSync,
        "mkdir": notImpl,
        "mkdirSync": notImplSync,
        "rmdir": notImpl,
        "rmdirSync": notImplSync,

        "rename": notImpl,
        "renameSync": notImplSync,
        "link": notImpl,
        "linkSync": notImplSync,
        "symlink": notImpl,
        "symlinkSync": notImplSync,
        "readlink": notImpl,
        "readlinkSync": notImplSync,
        "chmod": notImpl,
        "chmodSync": notImplSync,
        "lchmod": notImpl,
        "lchmodSync": notImplSync,
        "chown": notImpl,
        "chownSync": notImplSync,
        "lchown": notImpl,
        "lchownSync": notImplSync,
        "access": notImpl,
        "accessSync": notImplSync,
        "utimes": notImpl,
        "utimesSync": notImplSync,

        "realpath": notImpl,
        "realpathSync": notImplSync,

        "open": notImpl,
        "openSync": notImplSync,
        "read": notImpl,
        "readSync": notImplSync,
        "write": notImpl,
        "writeSync": notImplSync,
        "close": notImpl,
        "closeSync": notImplSync,

        "append": notImpl,
        "appendSync": notImplSync,

        "ftruncate": notImpl,
        "ftruncateSync": notImplSync,
        "fstat": notImpl,
        "fstatSync": notImplSync,
        "fsync": notImpl,
        "fsyncSync": notImplSync,
        "fchmod": notImpl,
        "fchmodSync": notImplSync,
        "fchown": notImpl,
        "fchownSync": notImplSync,
        "futimes": notImpl,
        "futimesSync": notImplSync,

        "createReadStream": notImplSync,
        "createWriteStream": notImplSync,

        "watch": notImplSync,
        "watchFile": notImplSync,
        "unwatchFile": notImplSync

    });

    var workingDirectory = mainFile.split("/").slice(0, -1).join("/");

    var lastHRTime = 0;

    var nextTickSignature = "deb93a6f-d613-44f5-b82c-c58e8b0a3e2f";
    var ticks = [];

    window.addEventListener("message", function (event) {

        if ((event.source === window) &&
            event.data && (event.data.signature === nextTickSignature)) {
            event.stopPropagation();
        }

        var oldTicks = ticks;
        ticks = [];

        oldTicks.forEach(function (tick) {
            try {
                tick.job.apply(window, tick.arguments);
            } catch (error) {
                if (global.$ && global.$.reportError) {
                    global.$.reportError(error);
                } else {
                    setTimeout(function () {
                        throw error;
                    });
                }
            }
        });

    });

    registerModule("<anonymous>", {});

    registerModule("process", {

        "cwd": function () {
            return workingDirectory;
        },
        "chdir": notImplSync,

        "exit": notImplSync,
        "kill": notImplSync,
        "abort": notImplSync,

        "umask": 0777,

        "getgid": function () { return 0; },
        "getuid": function () { return 0; },
        "setgid": notImplSync,
        "setuid": notImplSync,

        "hrtime": function () {

            var hrTime = new Date().getTime();

            var difference = (hrTime - lastHRTime) / 1000;

            lastHRTime = hrTime;

            return [Math.floor(difference), difference - Math.floor(difference)];

        },

        "uptime": function () {
            return (new Date().getTime() - startTime) / 1000;
        },

        "nextTick": function (job) {

            ticks.push({
                "job": job,
                "arguments": [].slice.call(arguments, 1)
            });

            window.postMessage({
                "signature": nextTickSignature
            }, "*");

        },

        "getgroups": notImplSync,
        "setgroups": notImplSync,
        "initgroups": notImplSync,

        "memoryUsage": notImplSync,

        "env": {
            "HOME": workingDirectory
        },
        "pid": 0,

        "arch": "js",
        "platform": "browser",
        "title": "browser",
        "version": "0.1.0",

        "argv": ["browser", mainFile],
        "execArgv": [],
        "execPath": "browser",

        "stdin": null,
        "stderr": null,
        "stdout": null,
        "exitCode": 0,

        "config": {},
        "versions": {},

        "mainModule": mainModule.exports

    });

    global.process = modules.process.exports;

})();
