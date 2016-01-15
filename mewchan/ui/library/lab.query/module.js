$(function () {

    $.require = function (map, callback) {

        if ((typeof map === "string") || (map instanceof String)) {
            map = [map];
        }

        map = map.map(function (file) {
            if ((typeof file === "string") || (file instanceof String)) {
                return {
                    "path": file
                };
            } else {
                return file;
            }
        });

        var loop = function (looper) {

            if (looper < map.length) {

                var key = map[looper].path;

                var path = key;

                if (!/^[a-z\-]:\/\//.test(path)) {

                    if (path[0] !== "/") {
                        path = "/" + path;
                    }

                    path = ((document.documentURI||document.URL).split("#")[0].split("?")[0].split("/").slice(0, 3).join("/") + path)
                        .replace(/\/\.\//g, "/")
                        .replace(/\/[^\/]+\/\.\.\//g, "/");

                }

                require(path, function (error, exports) {

                    if (error) {

                        if (callback) {
                            callback(error);
                        } else {
                            throw error;
                        }

                    } else {

                        if (map[looper].map) {
                            Object.keys(map[looper].map).forEach(function (key2) {

                                var target = $;
                                key2.split(".").forEach(function (component, index, components) {

                                    if (index < components.length - 1) {

                                        if (!target[component]) {
                                            target[component] = {};
                                        }

                                        target = target[component];

                                    } else {

                                        var source = exports;

                                        if (map[looper].map[key2] && (map[looper].map[key2].length > 0)) {
                                            map[looper].map[key2].split(".").forEach(function (component, index, components) {
                                                if (source) {
                                                    source = source[component];
                                                }
                                            });
                                        }

                                        target[component] = source;
                                    }

                                });

                            });
                        } else {
                            Object.keys(exports).forEach(function (key) {
                                $[key] = exports[key];
                            });
                        }

                        loop(looper + 1);
                    }

                });

            } else {
                if (callback) {
                    callback();
                }
            }

        };

        loop(0);

    };

});
