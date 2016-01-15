$(function () {

    var loaded = function () {

        $.require(
            [

                "/module/lab.common/foundation.js",
                { 
                    "path": "/module/lab.common/logger.js",
                    "map": { "Logger": "" }
                },
                "/module/lab.common/comparator.js", 
                "/module/lab.common/uuid.js", 
                {
                    "path": "/module/lab.common/template.js",
                    "map": {}
                },
                {
                    "path": "/module/lab.common/async.js", 
                    "map": { 
                        "async": "",
                        "delay": "delay",
                        "plan": "plan",
                        "timer": "timer",
                        "schedule": "schedule"
                    }
                },
                {
                    "path": "/module/lab.common/cache_pool.js",
                    "map": { "CachePool": "" }
                },
                {
                    "path": "/module/lab.kitty/http_kitty.js",
                    "map": { "HTTPKittyClient": "" }
                },
                "/module/lab.dom/foundation.js",
                "/module/lab.dom/browser.js",
                "/module/lab.dom/interpolation.js",
                "/module/lab.dom/animation.js",
                "/module/lab.dom/storyboard.js"

            ],
            function (error) {
                if (error) {
                    throw error;
                } else {
                    $.require("/script/ready.js");
                }
            });

    };

    if (__filename.indexOf("/module/lab.web/query.js") === -1) {
        
        $.loadResourcePackage("/script/query.json", function (error) {

            if (error) {
                console.error(error);
            }

            loaded();

        });

    } else {
        loaded();
    }

});