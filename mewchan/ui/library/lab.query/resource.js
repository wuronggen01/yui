$(function () {

    // -> path, callback
    // -> path, options, callback
    // -> method, path, data, callback
    // -> method, path, data, options, callback
    //
    $.request = function () {

        var settings = null;

        if ($.matchArguments && (arguments.length > 2)) {

            settings = $.matchArguments([
                ["path", "callback"],
                ["path", "options", "callback"],
                ["method", "path", "data", "callback"],
                ["method", "path", "data", "options", "callback"]
            ], {
                "path": "string",
                "callback": {
                    "acceptTypes": "function",
                    "defaultValue": function () {}
                },
                "method": {
                    "acceptTypes": "string",
                    "defaultValue": "GET"
                },
                "data": "any",
                "options": {
                    "acceptTypes": "object",
                    "defaultValue": {},
                    "timeout": { "!valueType": "number", "!defaultValue": 5000 },
                    "mergeOptions": {
                        "async": { "!valueType": "boolean", "!defaultValue": true },
                        "headers": { "!valueType": "object", "!defaultValue": {} },
                        "responseDataType": { "!valueType": "string", "!defaultValue": "*" },
                        "requestDataType": { "!valueType": "string", "!defaultValue": "*" }
                    }
                }
            }, arguments);

        } else {

            settings = {
                "path": arguments[0],
                "method": "GET",
                "options": {
                    "async": true,
                    "headers": {},
                    "responseDataType": "*",
                    "requestDataType": "*"
                },
                "callback": arguments[1]
            };

        }

        var request = null;
        if (window.XDomainRequest) {
            request = new XDomainRequest();
        } else if (window.XMLHttpRequest) {
            request = new XMLHttpRequest();
        } else {
            request = new ActiveXObject("Microsoft.XMLHTTP");
        }

        request.open(settings.method, settings.path, settings.options.async);

        Object.keys(settings.options.headers).forEach(function (header) {
            request.setRequestHeader(header, settings.options.headers[header]);
        });

        if (["binary", "text", "*"].indexOf(settings.options.responseDataType)) {
            if ($.parse &&
                $.parse.parsers &&
                $.parse.parsers[settings.options.responseDataType] &&
                $.parse.parsers[settings.options.responseDataType].needBinaryData) {
                request.responseType = "arrayBuffer";
            } else {
                request.responseType = "text";
            }
        } else if (settings.options.responseDataType === "binary") {
            request.responseType = "arrayBuffer";
        } else {
            request.responseType = "text";
        }

        var callbacked = false;
        request.addEventListener("readystatechange", function (event) {

            if ((!callbacked) && (request.readyState === 4)) {

                callbacked = true;

                switch (request.status % 100) {

                    case 0:
                    case 2: {

                        var responseDataType = settings.options.responseDataType;
                        if (responseDataType === "*") {
                            if (request.response[0] === "<") {
                                responseDataType = "xml";
                            } else if (["[", "{"].indexOf(request.response[0]) !== -1) {
                                responseDataType = "json";
                            } else {
                                responseDataType = "text";
                            }
                        }

                        if (["binary", "text" ,"xml"].indexOf(responseDataType) !== -1) {
                            settings.callback(null, request.response,request);
                        } else if (responseDataType === "json") {

                            if ($.parse) {
                                settings.callback(null, $.parse(responseDataType, request.response)[0],request);
                            } else {
                                settings.callback(null, JSON.parse(request.response),request);
                            }

                        } else {
                            settings.callback(new Error("No parser found for : "+ responseDataType),null,request);
                        }

                        break;
                    }

                    case 1:
                    case 3:
                    case 4:
                    case 5:
                    default: {

                        settings.callback(new Error("Server response status code " + request.status),null,request);

                        break;
                    }

                }

            }

        });

        if ((settings.data !== null) &&
            (settings.data !== undefined) &&
            (typeof settings.data !== "string") && (!(settings.data instanceof String)) &&
            (!(settings.data instanceof ArrayBuffer))) {

            var requestDataType = settings.options.requestDataType;
            if (requestDataType === "*") {
                if (settings.data instanceof Node) {
                    requestDataType = "xml";
                } else {
                    requestDataType = "json";
                }
            }

            if ($.serialize) {
                settings.data = $.serialize(requestDataType, settings.data);
            } else {
                if (requestDataType === 'json'){
                    settings.data = JSON.stringify(settings.data);
                }
            }
        }

        request.send(settings.data);

        return request;

    };

    $.loadResources = function (paths, callback) {

        if (!(paths instanceof Array)) {
            paths = [paths];
        }

        var contents = {};

        var loop = function (looper) {

            if (looper < paths.length) {

                var path = null;
                var responseDataType = "*";
                if ((typeof paths[looper] !== "string") && (!(paths[looper] instanceof String))) {
                    path = paths[looper].path;
                    responseDataType = paths[looper].type;
                } else {
                    path = paths[looper];
                }

                if (!/^[a-z\-]+:\/\//.test(path)) {
                    path = ((document.documentURI||document.URL).split("#")[0].split("?")[0].split("/").slice(0, -1).join("/") + path)
                        .replace(/\/\.\//g, "/")
                        .replace(/\/[^\/]+\/\.\.\//g, "/");
                }

                if (resources.hasOwnProperty(path)) {

                    var resource = resources[path];

                    var content = resource.content.data;
                    if (resource.content.encoding === "base64") {
                        content = window.atob(content);
                    } else if (["json", "text"].indexOf(resource.content.encoding) === -1) {
                        content = $.parse(resource.content.encoding, content)[0];
                    }

                    contents[paths[looper]] = content;

                    loop(looper + 1);

                } else {

                    $.request(path, function (error, content) {

                        if (error) {
                            //callback(error);
                        } else {

                            contents[paths[looper]] = content;


                        }

                        loop(looper + 1);

                    });

                }

            } else {
                callback(null, contents);
            }

        };

        loop(0);

    };

    var resources = {};

    $.isResourceCached = function (path) {

        if (!/^[a-z\-]+:\/\//.test(path)) {
            path = ((document.documentURI||document.URL).split("#")[0].split("?")[0].split("/").slice(0, -1).join("/") + path)
                .replace(/\/\.\//g, "/")
                .replace(/\/[^\/]+\/\.\.\//g, "/");
        }

        return resources.hasOwnProperty(path);

    };

    $.loadResourcePackage = function (path, callback) {

        if (!/^[a-z\-]+:\/\//.test(path)) {
            path = ((document.documentURI||document.URL).split("#")[0].split("?")[0].split("/").slice(0, -1).join("/") + path)
                .replace(/\/\.\//g, "/")
                .replace(/\/[^\/]+\/\.\.\//g, "/");
        }

        $.request(path, function (error, contents) {

            if (error) {
                callback(error);
            } else {

                Object.keys(contents).forEach(function (subpath) {

                    var url = null;
                    if (/^[a-z\-]+:\/\//.test(subpath)) {
                        url = subpath;
                    }
                    if (subpath[0] !== "/") {
                        url = path.split("/").slice(0, -1).join("/") + subpath;
                    } else {
                        url = (document.documentURI||document.URL).split("#")[0].split("?")[0].split("/").slice(0, -1).join("/") + subpath;
                    }

                    url = url.replace(/\/\.\//g, "/").replace(/\/[^\/]+\/\.\.\//g, "/");

                    resources[url] = contents[subpath];

                });

                callback();
            }

        });

    };

});
