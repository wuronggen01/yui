$.uiReadyListeners = [];
$.uiReadyStatus    = "NOT_READY";
$.uiReady  = function (listener) {
    if ($.uiReadyStatus == 'NOT_READY'){
        $.uiReadyListeners.push(listener);
    } else {
        try{
			listener($.uiKitty);
		} catch(ex){
			console.log(ex);
		}
    }
};

$(function () {

    var loaded = function () {

        $.require(
            [

                {
                    "path": "/library/lab.common/foundation.js",
                    "map": {

                        "deprecated": "deprecated",

                        "getScriptEngineName": "getScriptEngineName",

                        "objectize": "objectize",

                        "isNull": "isNull",
                        "isKindOf": "isKindOf",

                        "isArrayLike": "isArrayLike",

                        "copyAsArray": "copyAsArray",

                        "iterateArray": "iterateArray",
                        "iterateObject": "iterateObject",

                        "formatDate": "formatDate",

                        "couldBeAcceptedAs": "couldBeAcceptedAs",
                        "simplify": "simplify",
                        "convert": "convert",

                        "mergeTo": "merge",
                        "advancedMerge": "advancedMerge",

                        "prepadZero": "prepadZero",

                        "getStack": "getStack",

                        "jsonize": "jsonize",

                        "matchArguments": "matchArguments",

                        "getProperty": "getProperty",
                        "getIndex": "getIndex",

                        "keys": "keys"
                    }
                },
                {
                    "path": "/library/lab.common/logger.js",
                    "map": { "Logger": "" }
                },
                {
                    "path": "/library/lab.kitty/http_kitty.js",
                    "map": { "HTTPKittyClient": "" }
                },
                "/library/lab.common/comparator.js",
                "/library/lab.common/uuid.js",
                {
                    "path" : "/library/lab.common/template.js",
                    "map"  : {
                        "template" : "format"
                    }
                },
                {
                    "path" : "/library/lab.common/ruler.js",
                    "map"  : {
                        "ruler" : ""
                    }
                },
                {
                    "path": "/library/lab.common/async.js",
                    "map": {
                        "async": "",
                        "delay": "delay",
                        "plan": "plan",
                        "timer": "timer",
                        "schedule": "schedule"
                    }
                },
                {
                    "path": "/library/lab.common/cache_pool.js",
                    "map": { "CachePool": "" }
                },
                "/library/lab.dom/template.js",
                "/library/lab.dom/browser.js",
                "/library/lab.dom/xml.js",
                "/library/lab.dom/reinit.js",
                "/library/lab.dom/transition.js",
                "/library/lab.dom/position.js",
                {
                    "path": "/library/lab.dom/storyboard.js",
                    "map": { "Storyboard": "" }
                },
                "/library/lab.dom/storyboard.animation.js",
                {
                    "path": "/library/lab.dom/activity.js",
                    "map": { "currentActivity": "" }
                },
                {
                    "path": "/library/lab.dom/coolcto.js",
                    "map": { "CoolFramework": "" }
                }
            ],
            function (error) {
                if (error) {
                    throw error;
                } else {
                    $.require("/library/lab.module/ready.js");
                }
            });

    };

    if (__filename.indexOf("/library/lab.web/jquery.js") === -1) {

        $.loadResourcePackage(window.packageURL ? window.packageURL : "/script/jquery.json", function (error) {

            if (error) {
                console.error(error);
            }
            
            loaded();
        });

    } else {
        loaded();
    }

});
