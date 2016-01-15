"use strict"
/**
 * storyboard 是一组基于template的前端render方案，其主要特性是：
 * 1) 基于channel的page stack管理
 * 2) 插件式delegate管理:

    "init" : {

    },

    "initPage" : {

    },

    "destoryPage" : {

    },

    "willEnterForestage" : {

    },

    "didEnterForestage" : {

    },

    "enterForestage" : {
// equals didEnterForestage
    },

    "loadData" : {
// after load data callback is invoked , page will be rendered

    },

    "willLeaveForestage" : {

    },

    "didLeaveForestage" : {

    },

    "leaveForestage" : {
//equals didLeaveForestage
    },

    "willUpdatePage" : {

    },

    "updatePage" :  {
//equals didUpdatePage

    }

    "didUpdatePage" : {

    },

    "willSwitchToStartPage" : {

    },

    "didSwitchToStartPage" : {

    }


 * 3) 可加载插件支持

 * 4) 基于bundle的resource管理

 * 5) css prefix : 全局开关

 * 6) storyboard specified template functors :

    this is a short hand

        a) switchTo
        b) updatePage
        c) goBackward
        d) env
        e) css

 * 7) storyboard page api :

        1. switchTo
        // match arguments
        pageId, // required
        data, // optional
        options // optional
        switchTo("pageId",data,options).then(function(page,data,storyboard){

        }).backward(function(data){

            // when enter the next page, we should provide a function to decorate data sent back

            this.accept(data);

            this.deny(error);

        }).rejected(function(error){

        });

        2. goBackward

        goBackward().then(function(){

        }).rejected(function(){

        });


 * 8) storyboard provide a default recommanded structure

        template : /${storyboard.id}/${page.id}/index.xhtml,
        style    : /${storyboard.id}/${page.id}/style.css,
        data     : /${storyboard.id}/${page.id}/data.json,
        script   : /${storyboard.id}/${page.id}/script.js

 * 9) storyboard animation

 * 10) start page

 * 11) fixed size

 * 12) splash and inline page

 * 13) self documented page

 * 14) add page api and default switch to page

 * 需要增加的机制：
 * freeze storyboard
 * update queue
 *
 * template：需要讨论的机制：
 *
 * template filler
 * template的namespace : tpl
 * include a js file as a template prefix => page level and storyboard level <tpl:include prefix="tplx" source="xxxxx/js" />
 *
 */
var WAITING = "waiting";
var SWITCHING = "switching";

var PAGE_DELEGATES = ["willEnterForestage", "didEnterForestage", "loadData", "willLeaveForestage", "didLeaveForestage", "initPage", "destroyPage"];
var manager = {
    "queue": {},
    "switchQueue": {},
    "initQueue": $.async()
};

var logger = new $.Logger({
    "logLevel": "error"
});

var storyboardSwitchNow = function(storyboard, managedQueue, errorCallback, switchOperation, animated) {

    var swstep = switchOperation.step;

    var settings = switchOperation.settings;

    var page;

    var pageSpec;

    var backward;

    var pagesToDestroy = [];

    var templateOptions = {
        "animated": false,
        "defaultAnimationDuration": 200,
        "defaultAnimation": "fading",
        "parser": "text/html",
        "functors": {},
        "prependNamespaces": {
            "sb": "http://project.spiritate.org/storyboard",
            "tmpl": "http://project.spiritate.org/template",
            "storyboard": "http://project.spiritate.org/storyboard",
            "template": "http://project.spiritate.org/template",
            "templatex": "http://project.spiritate.org/templatex",
            "tmplx": "http://project.spiritate.org/templatex",
            "x": "http://project.spiritate.org/templatex",
            "X": "http://project.spiritate.org/templatex",
            "t": "http://project.spiritate.org/template",
            "T": "http://project.spiritate.org/template"
        }
    };

    if (!storyboard.channels[settings.options.channel]) {
        storyboard.channels[settings.options.channel] = {
            "stack": [],
            "startPageID": null
        };
    };
    var channel = storyboard.channels[settings.options.channel];

    return managedQueue.then(function() {

        logger.debug("get fucking page from current stack");

        var stepError;
        var step = this;
        switch (settings.options.action) {
            case "replace":
                {
                    break;
                }
            case "backward":
                {
                    backward = channel.stack[channel.stack.length - 1].data.settings.backward;

                    if (channel.stack.length >= 2) {

                        //pagesToDestroy.push(channel.stack.pop());

                        page = channel.stack[channel.stack.length - 2];

                        //channel.stack.pop();

                    } else if (channel.stack.length == 1) {

                        page = channel.stack[0];

                    } else {

                        logger.error("No page could be go backward");

                        stepError = new Error("No page could be go backward");

                        logger.error(stepError);

                        errorCallback(stepError);

                        step.reject(stepError);

                        swstep.reject(stepError);

                        return;

                    }
                    break;
                }

            case "channel":
                {
                    if (settings.options.channel === storyboard.channel) {

                        page = storyboard.currentPage;

                    } else {
                        if (channel.stack.length > 0) {

                            page = channel.stack[channel.stack.length - 1];

                        } else {

                            stepError = new Error("chanel switched to an empty channel");

                            logger.error(stepError);

                            errorCallback(stepError);

                            swstep.reject(stepError);

                            step.reject(stepError);

                            return;
                        }
                    }
                    break;
                }
            case "reset":
                {
                    break;
                }

            default:
                {
                    break;
                }
        }

        if (!page) {

            if (settings.pageID) {
                pageSpec = storyboard.options.pageSpecs[settings.pageID];
                page = {

                    "templates" : {},

                    "storyboard": storyboard,

                    "uuid": settings.options.channel + "-" + storyboard.channels[settings.options.channel].stack.length + "-" + settings.pageID + "-" + $.createUUID(),

                    "id": settings.pageID,

                    "spec": storyboard.options.pageSpecs[settings.pageID],

                    "data": settings.data || {},

                    "pool": {},

                    "step": $.async(),

                    "$": function(query) {
                        return $(query, page.dom);
                    },

                    "layout" : function(layoutName){
                        return $.async(function(){

                            if (settings.options.layout == layoutName){

                                this.reject("already switched to layout : "+ layoutName);
                            } else {

                                if (pageSpec.templateSource[layoutName]){
                                    this.next(pageSpec.templateSource[layoutName]);
                                } else {

                                    var step = this;

                                    var templatePath  = pageSpec["templatePath"];

                                    var templateIndex = templatePath.lastIndexOf(".");

                                    var pathToLoad = templatePath.substr(0,templateIndex) + (layoutName && layoutName.length ? "." + layoutName : "" ) + templatePath.substr(templateIndex);

                                    $.loadResources(pathToLoad, function(error, content) {

                                        if (error) {
                                            step.reject(error);
                                        } else {
                                            pageSpec.templateSource[layoutName] = content[pathToLoad];
                                            step.next(content[pathToLoad]);
                                        }

                                    });
                                }
                            }
                        }).then(function(templateContent){

                            if (templateContent) {

                                var step = this;

                                if (page.spec.module.exports.willChangeLayout) {
                                    try{
                                        page.spec.module.exports.willChangeLayout.call(page.data,page);
                                    } catch (ex){
                                        logger.error(ex);
                                    }
                                }

                                storyboardExecuteDelegate(storyboard, "willPageChangeLayout", page, layoutName);

                                settings.options.layout = layoutName;

                                var newDOM = $('<div></div>').attr('id', page.id).addClass('storyboard-page').addClass('storyboard-active');

                                page.templates[layoutName] = page.template = $.template(templateContent, page.data, templateOptions);

                                page.template.render(newDOM,function(){
                                    step.next(newDOM);
                                });

                            } else {
                                this.reject("content not found");
                            }

                        }).then(function(newDOM){

                            var step = this;

                            $(storyboard.dom).append(newDOM);

                            var animation = $.storyboard.animations["fading"];

                            $(page.dom).css("position", "absolute");
                            $(page.dom).addClass('storyboard-animation');
                            $(page.dom).addClass('prev');
                            $(newDOM).addClass('storyboard-animation');
                            $(newDOM).addClass('next');

                            animation(settings.options.duration, function() {

                                $(page.dom).css("position", 'relative');

                                $(page.dom).removeClass("storyboard-active");

                                $(page.dom).removeClass('storyboard-animation');
                                $(page.dom).removeClass('prev');

                                $(page.dom).detach();

                            }, $(page.dom), newDOM, function() {

                                $(newDOM).addClass("storyboard-active");
                                $(newDOM).removeClass('storyboard-animation');
                                $(newDOM).removeClass('next');

                                page.dom = newDOM;
                                step.next();
                            });

                        }).then(function(){


                            if (page.spec.module.exports.didChangeLayout) {
                                try{
                                    page.spec.module.exports.didChangeLayout.call(page.data,page);
                                } catch (ex){
                                    logger.error(ex);
                                }
                            }

                            storyboardExecuteDelegate(storyboard, "didPageChangeLayout", page, layoutName);

                            this.next();

                        });
                    },

                    "update": function(data,noRender) {

                        return $.async(function() {

                            var step = this;

                            if (!data) {
                                data = {};
                            }

                            page.data.settings.update = data;
                            page.data.settings.updateNoRender = noRender ? true : false;

                            var addressOption = function(target, address, setValue) {
                                var cyclicKeys = address.split('.');
                                var lastKey = cyclicKeys.pop();
                                var secondKey = cyclicKeys.pop();

                                var cyclicValus = function(cyclicKey) {
                                    if (cyclicKeys.length) {
                                        return cyclicValus(cyclicKeys.pop())[cyclicKey];
                                    };
                                    return target;
                                }
                                cyclicValus(secondKey, target)[lastKey] = setValue;
                            }

                            Object.keys(data).forEach(function(key) {
                                if (key.indexOf('.') == -1) {
                                    page.data[key] = data[key];
                                } else {
                                    addressOption(page.data[key.substr(0, key.indexOf('.'))], key, data[key]);
                                };
                            });

                            if (page.spec.module.exports.willUpdate) {
                                try{
                                    page.spec.module.exports.willUpdate.call(page.data,page);
                                } catch (ex){
                                    logger.error(ex);
                                }
                            }
                            storyboardExecuteDelegate(storyboard, "willUpdatePage", page, page.data);

                            try {
                                if (!noRender){
                                    page.template.fill(page.data, function() {

                                        if (page.spec.module.exports.didUpdate) {
                                            try{
                                                page.spec.module.exports.didUpdate.call(page.data,page);
                                            } catch (ex){
                                                logger.error(ex);
                                            }
                                        }
                                        storyboardExecuteDelegate(storyboard, "didUpdatePage", page, page.data);

                                        step.next(page.data);

                                    });
                                }
                            } catch (ex) {

                                logger.error(ex);

                                errorCallback(ex);
                                step.reject(stepError);
                                swstep.reject(stepError);

                                return;
                            }
                        });
                    }
                };
            } else {

                logger.error("Page not found");

                stepError = new Error("Page not found");
                logger.error(stepError);
                errorCallback(stepError);
                step.reject(stepError);
                swstep.reject(stepError);

                return;

            }
        } else {
            pageSpec = page.spec;
        }

        step.next();

    }).then(function() {

        storyboard.pageToBeNext = page;

        logger.debug("get fucking page content from cache or load resource from bundle : " + page.uuid);

        switch (settings.options.action) {
            case "replace":
                {
                    settings.options.animation = settings.options.animation ? settings.options.animation : pageSpec.animationForward;
                    break;
                }
            case "backward":
                {
                    settings.options.animation = settings.options.animation ? settings.options.animation : pageSpec.animationBackward;
                    break;
                }

            case "channel":
                {
                    settings.options.animation = settings.options.animation ? settings.options.animation : pageSpec.animationReset;
                    break;
                }
            case "reset":
                {
                    settings.options.animation = settings.options.animation ? settings.options.animation : pageSpec.animationReset;
                    break;
                }

            default:
                {
                    settings.options.animation = settings.options.animation ? settings.options.animation : pageSpec.animationForward;
                    break;
                }
        }

        settings.options.animationDuration = pageSpec.animationDuration;


        var cache = pageSpec["cache"];
        var step = this;
        var pageContent = {
            "template": null,
            "style": null,
            "data": null,
            "script": null,
            "lang": null
        }

        if (cache) {

            ["template", "style", "data", "script", "lang"].forEach(function(resourceType) {

                if (cache[resourceType]) {
                    pageContent[resourceType] = cache[resourceType];
                }

            });

        }

        var resourcesToLoad = [];

        ["template", "style", "data", "script", "lang"].forEach(function(resourceType) {

            try{
                if ((pageSpec[resourceType + "Path"] && pageSpec[resourceType + "Path"] !== "none") && !pageContent[resourceType]) {

                    var pathToLoad;

                    if (resourceType == 'template'){

                        var templatePath  = pageSpec[resourceType + "Path"];

                        var templateIndex = templatePath.lastIndexOf(".");

                        var layout = settings.options.layout;

                        pathToLoad = templatePath.substr(0,templateIndex)  + (layout && layout.length ? "." + layout : "") + templatePath.substr(templateIndex);

                    } else {

                        pathToLoad = pageSpec[resourceType + "Path"];

                    }

                    resourcesToLoad.push({
                        "type": resourceType,
                        "path": pathToLoad
                    });

                }
            } catch (ex){
                logger.error(ex);
            }

        });

        storyboardExecuteDelegate(storyboard, "willPageResourceLoad", page, resourcesToLoad);

        if (resourcesToLoad.length) {

            $.async.all(resourcesToLoad, function(resource) {

                var resourceFetchStep = this;

                $.loadResources(resource.path, function(error, content) {

                    if (error) {
                        throw new Error("resource not found");
                    } else {
                        pageSpec["cache"][resource.type] = content[resource.path];
                        pageContent[resource.type] = content[resource.path];
                        resourceFetchStep.next();
                    }

                });

            }).then(function() {

                if (storyboard.options.cachePage && window.localStorage) {
                    window.localStorage.setItem(storyboard.id + "-page-" + settings.pageID + "-cache", JSON.stringify(pageContent));
                }

                step.next(pageContent, resourcesToLoad.length);

            }).rejected(function(error) {

                logger.error(error);

                errorCallback(error);
                swstep.reject(error);
                step.reject(error);

            });

        } else {

            step.next(pageContent, resourcesToLoad.length);

        }

    }).then(function(pageContent, resourceCount) {

        logger.debug("load stylesheet and module from page content : " + page.uuid);

        storyboardExecuteDelegate(storyboard, "didPageResourceLoad", page, pageContent);

        if (!pageSpec.styleSheetLoaded && pageContent.style) {

            pageSpec.styleSheetLoaded = true;

            var styleObject = $("<style>").html(pageContent.style + "\n/*# sourceURL=" + pageSpec.stylePath + "*/");

            $(storyboard.dom).append(styleObject);

            if (storyboard.options.autoprefixStyles) {
                styleSheetAutoPrefixConvertor(storyboard, pageSpec, styleObject);
            }

            pageSpec.styleSource = pageContent.style;

        }

        if (!pageSpec.templateSource) {

            pageSpec.templateSource = {};

            if (pageContent.template) {
                pageSpec.templateSource[settings.options.layout] = pageContent.template;
            } else {
                pageSpec.templateSource[settings.options.layout] = "";
            }

        }

        if (!pageSpec.moduleLoaded) {

            pageSpec.moduleLoaded = true;

            if (pageContent.script) {

                var pageModule = {};

                window.eval(
                    "(function () { return function (module,$$) {" + pageContent.script + "}; })() " + ("//@ sourceURL=" + pageSpec.scriptPath))(
                    pageModule,function(query){
                        return $(query, storyboard.pageToBeNext.dom);
                    });

                if (pageModule.exports) {
                    pageSpec.module = $.advancedMerge({}, storyboard.commonModule, pageSpec.module, pageModule);
                } else {
                    pageSpec.module = $.advancedMerge({}, storyboard.commonModule, pageSpec.module);
                }


            } else {

                pageSpec.module = {
                    "exports": {}
                }

            }

            if (pageContent.lang) {

                if ($.isKindOf(pageContent.lang, String)) {

                    try {
                        pageSpec.lang = $.advancedMerge({}, storyboard.commonModule.lang, JSON.parse(pageContent.lang));
                    } catch (ex) {
                        pageSpec.lang = {};
                    }

                } else {
                    pageSpec.lang = $.advancedMerge({}, storyboard.commonModule.lang, pageContent.lang);
                }

            } else {

                pageSpec.lang = {};

            }

            if (pageContent.data) {

                if ($.isKindOf(pageContent.data, String)) {
                    try {
                        pageSpec.module = $.advancedMerge({}, storyboard.commonModule, pageSpec.module, {
                            "data": JSON.parse(pageContent.data)
                        });
                    } catch (ex) {

                        pageSpec.module = {};

                    }
                } else {
                    pageSpec.module = $.advancedMerge({}, storyboard.commonModule, pageSpec.module, {
                        "data": pageContent.data
                    });
                }

            }

        }

        Object.keys(storyboard.commonModule.exports).forEach(function(key) {
            templateOptions.functors[key] = function(template, call, parameters, options) {
                return storyboard.commonModule.exports[key].apply(parameters, Array.prototype.slice.call(arguments, 4));
            };
        });


        Object.keys(pageSpec.module.exports).forEach(function(key) {
            templateOptions.functors[key] = function(template, call, parameters, options) {
                return pageSpec.module.exports[key].apply(parameters, Array.prototype.slice.call(arguments, 4));
            };
        });


        this.next();

    }).then(function() {

        logger.debug("bind page function to page itself");

        if (!page.template) {

            Object.keys(pageSpec.module.exports).forEach(function(key) {
                if (PAGE_DELEGATES.indexOf(key) < 0 && !page[key]) {
                    page[key] = function() {
                        return pageSpec.module.exports[key].apply(this.data, arguments);
                    }.bind(page);
                }
            });

            Object.keys(storyboard.commonModule.exports).forEach(function(key) {
                if (PAGE_DELEGATES.indexOf(key) < 0 && !page[key]) {
                    page[key] = function() {
                        return storyboard.commonModule.exports[key].apply(this.data, arguments);
                    }.bind(page);
                }
            });

        }

        this.next();

    }).then(function() {

        logger.debug("fucking load data is the sin of everything : "  + page.uuid);

        var rawData;

        try{
            rawData = $.advancedMerge({
                "storyboard": {
                    "!operation": "assign"
                },
                "page": {
                    "!operation": "assign"
                },
                "settings": {
                    "!operation": "assign"
                },
                "functors": {
                    "!operation": "assign"
                }
            }, page.spec.module.data, page.data, settings.data);
        } catch (ex){
            rawData = $.advancedMerge({
                "storyboard": {
                    "!operation": "assign"
                },
                "page": {
                    "!operation": "assign"
                },
                "settings": {
                    "!operation": "assign"
                },
                "functors": {
                    "!operation": "assign"
                }
            }, page.spec.module.data, settings.data);
        }


        var loadData = pageSpec.module.exports.loadData;
        var loadDataCallbacked = 0;

        var step = this;

        if ($.isKindOf(loadData, Function)) {

            storyboardExecuteDelegate(storyboard, 'willPageLoadData', page, rawData);

            loadData.call({

                "storyboard": storyboard,
                "settings": settings,
                "page": page

            }, rawData, function(error, data) {

                loadDataCallbacked = loadDataCallbacked + 1;

                storyboardExecuteDelegate(storyboard, 'pageLoadDataCallbacked', page, error, {
                    "callbacked": data,
                    "settings": settings.data
                }, loadDataCallbacked);



                if (loadDataCallbacked == 1) {


                    if (error) {

                        logger.error(error);
                        errorCallback(error);
                        swstep.reject(error);
                        step.reject(error);

                    } else {

                        if (data) {

                            try {

                                page.data = $.advancedMerge({
                                    "!operation" : "overwrite",
                                    "storyboard": {
                                        "!operation": "assign"
                                    },
                                    "page": {
                                        "!operation": "assign"
                                    },
                                    "settings": {
                                        "!operation": "assign"
                                    },
                                    "functors": {
                                        "!operation": "assign"
                                    }
                                }, page.data, rawData , data);

                            } catch (ex){
                                console.log(data);
                                logger.error(ex);
                                page.data = rawData;
                            }

                        }  else {
                            page.data = rawData;
                        }

                        storyboardExecuteDelegate(storyboard, 'didPageLoadData', page, page.data);
                        step.next();
                    }

                } else {

                    logger.error("Multiple callback for load data is invoked");

                    throw new Error("Multiple callback for load data is invoked");
                }
            });

        } else {

            page.data = rawData;

            storyboardExecuteDelegate(storyboard, 'didPageLoadData', page, rawData);

            step.next();
        }

    }).then(function() {

        logger.debug("backward is the second sin of everything : " + page.uuid);

        var step = this;

        if (settings.options.action == 'backward') {

            storyboardExecuteDelegate(storyboard, "willPageBackwardDataDecorated", page, page.data);

            backward(page.data).then(function(decorated) {

                if (page.data !== decorated){
                    page.data = $.advancedMerge({

                        "storyboard": {
                            "!operation": "assign"
                        },

                        "page": {
                            "!operation": "assign"
                        },

                        "settings": {
                            "!operation": "assign"
                        },

                        "functors": {
                            "!operation": "assign"
                        }

                    }, page.data, decorated);
                }

                storyboardExecuteDelegate(storyboard, "didPageBackwardDataDecorated", page, page.data);
                step.next();

            }).rejected(function(error) {

                logger.error(error);

                swstep.reject(error);
                step.reject(error);
                errorCallback(error);

            });

        } else {
            step.next();
        }

    }).then(function() {

        logger.debug("you should fuck yourself with the god-like template system : " + page.uuid);
        //

        var step = this;

        if (!page.dom) {
            page.dom = $('<div></div>').attr('id', page.id).addClass('storyboard-page').addClass('storyboard-active');
        }

        page.data = $.advancedMerge({
            "storyboard": {
                "!operation": "assign"
            },
            "page": {
                "!operation": "assign"
            },
            "settings": {
                "!operation": "assign"
            },
            "functors": {
                "!operation": "assign"
            }
        }, {
            "storyboard": storyboard,
            "settings": settings,
            "page": page,
            "functors": templateOptions.functors
        }, storyboard.commonModule.data, pageSpec.module.data, page.data);



        Object.keys(pageSpec.data).forEach(function(key) {
            if (!page.data.hasOwnProperty(key)) {
                page.data[key] = $.template.execute(pageSpec.data[key], page.data, templateOptions);
            }
        });


        var completeCallbacked = false;

        var complete = function() {

            if (!completeCallbacked) {
                logger.debug("template callbacked");

                completeCallbacked = true;
                if (settings.options.action !== 'backward') {
                    if (pageSpec.module.exports && pageSpec.module.exports.initPage) {
                        pageSpec.module.exports.initPage.call(page.data, page);
                    }
                    storyboardExecuteDelegate(storyboard, "initPage", page);
                }
                step.next();

            } else {
                logger.debug("template render twice");
            }

        };

        try {

            if (!page.template) {
                page.templates[settings.options.layout] = page.template = $.template(pageSpec.templateSource[settings.options.layout], page.data, templateOptions);
                page.template.render(page.dom, complete);
            } else {
                page.template.fill(page.data, complete);
            }

        } catch (ex) {

            logger.error(ex);
            errorCallback(ex);
            step.reject(ex);
            swstep.reject(ex);
        }


    }).then(function() {

        logger.debug("correct chennel stack data : " + page.uuid);

        switch (settings.options.action) {
            case "replace":
                {
                    pagesToDestroy.push(channel.stack.pop());
                    break;
                }
            case "backward":
                {
                    pagesToDestroy.push(channel.stack.pop());
                    channel.stack.pop();
                    break;
                }
            case "reset":
                {
                    pagesToDestroy.concat(channel.stack);
                    channel.stack.length = 0;
                    break;
                }
            default:
                {
                    break;
                }
        }

        storyboard.channel = settings.options.channel;

        channel.stack.push(page);

        this.next();

    }).then(function() {

        logger.debug("start animation[" + settings.options.animation + "]  : " + page.uuid + " ? " + animated + " , duration : " + settings.options.duration);

        var step = this;

        storyboard.nextPage = page;

        if (animated) {

            storyboardExecuteDelegate(storyboard, "beforePageSwitchAnimation", page);

            var lastPage = storyboard.currentPage;

            if (lastPage == page) {
                step.next();
                return;
            }

            $(storyboard.dom).append(page.dom);

            if (page.spec.module.exports.willEnterForestage) {
                try {
                    page.spec.module.exports.willEnterForestage.call(page.data, page);
                } catch (ex) {
                    logger.error(ex);
                }
            }

            storyboardExecuteDelegate(storyboard, "willPageEnterForestage", page, page.data);

            if (lastPage || settings.options.forceAnimation) {

                if (lastPage) {
                    if (page.spec.module.exports.willLeaveForestage) {
                        try {
                            page.spec.module.exports.willLeaveForestage.call(lastPage.data, lastPage);
                        } catch (ex) {
                            logger.error(ex);
                        }
                    }

                    storyboardExecuteDelegate(storyboard, "willPageLeaveForestage", lastPage, lastPage.data);
                }

                var animation = $.storyboard.animations[settings.options.animation];

                if (!animation) {
                    logger.warn("animation not found, using fading as default animation");
                    animation = $.storyboard.animations["fading"];
                }

                if (!animation) {

                    logger.error(new Error("No animation"));
                    return step.reject(new Error("No animation found for storyboard"));
                }

                if (lastPage) {
                    $(lastPage.dom).css("position", "absolute");
                    $(lastPage.dom).addClass('storyboard-animation');
                    $(lastPage.dom).addClass('prev');
                }

                $(page.dom).addClass('storyboard-animation');
                $(page.dom).addClass('next');

                animation(settings.options.duration, function() {

                    if (lastPage) {
                        if (lastPage.spec.module.exports.didLeaveForestage) {
                            try {
                                lastPage.spec.module.exports.didLeaveForestage.call(lastPage.data, lastPage);
                            } catch (ex) {
                                logger.error(ex);
                            }
                        }

                        storyboardExecuteDelegate(storyboard, "didPageLeaveForestage", lastPage, lastPage.data);

                        $(lastPage.dom).css("position", 'relative');

                        $(lastPage.dom).removeClass("storyboard-active");

                        $(lastPage.dom).removeClass('storyboard-animation');
                        $(lastPage.dom).removeClass('prev');

                        $(lastPage.dom).detach();
                    }

                }, (lastPage ? $(lastPage.dom) : $()), $(page.dom), function() {

                    if (page.spec.module.exports.didEnterForestage) {
                        try {
                            page.spec.module.exports.didEnterForestage.call(page.data, page);
                        } catch (ex) {
                            logger.error(ex);
                        }
                    }

                    storyboardExecuteDelegate(storyboard, "didPageEnterForestage", page, page.data);
                    $(page.dom).addClass("storyboard-active");
                    $(page.dom).removeClass('storyboard-animation');
                    $(page.dom).removeClass('next');
                    pagesToDestroy.forEach(function(page) {

                        if (page.spec.module.exports.destroyPage) {
                            try {
                                page.spec.module.exports.destroyPage.call(page.data, page);
                            } catch (ex) {
                                logger.error(ex);
                            }
                        }

                        storyboardExecuteDelegate(storyboard, "destoryPage", page, page.data);

                    });

                    storyboard.currentPage = page;

                    storyboardExecuteDelegate(storyboard, "afterPageSwitchAnimation", page);

                    step.next();

                });

            } else {

                if (page.spec.module.exports.didEnterForestage) {
                    try {
                        page.spec.module.exports.didEnterForestage.call(page.data, page);
                    } catch (ex) {
                        logger.error(ex);
                    }
                }
                storyboardExecuteDelegate(storyboard, "didPageEnterForestage", page, page.data);

                storyboard.currentPage = page;

                $(page.dom).addClass("storyboard-active");

                step.next();
            }

        } else {

            step.next();
        }

    }).then(function() {

        logger.debug("oh i have successfully fuck my self  : " + page.uuid);

        swstep.next();

        this.next();

    });

};


// configure for single storyboard
// delegate + once listener
var Storyboard = function Storyboard(dom, delegates) {

    var storyboard = this;

    this.dom = dom;

    // add unique id to storyboard
    if (!dom.id) {
        dom.id = "storyboard-" + $.createUUID();
    }

    this.id = dom.id;

    manager.queue[this.id] = $.async();

    this.delegate = {

        "init": [],

        "initPage": [],

        "destoryPage": [],

        "willPageEnterForestage": [],

        "didPageEnterForestage": [],

        "willPageBackwardDataDecorated": [],

        "didPageBackwardDataDecorated": [],

        "willPageResourceLoad": [],

        "didPageResourceLoad": [],

        "willPagePushToSwithingQueue": [],

        "didPagePopFromSwitchingQueue": [],

        "willPageLeaveForestage": [],

        "didPageLeaveForestage": [],

        "willPageLoadData": [],

        "pageLoadDataCallbacked": [],

        "didPageLoadData": [],

        "beforePageSwitchAnimation": [],

        "afterPageSwitchAnimation": [],

        "willUpdatePage": [],

        "didUpdatePage": [],

        "willSwitchToPage": [],

        "didSwitchToPage": [],

        "willSwitchToStartPage": [],

        "didSwitchToStartPage": [],

        "willPageChangeLayout" : [],

        "didPageChangeLayout" : []

    };

    Object.defineProperty(this, "switchQueue", {
        "value": []
    });

    Object.defineProperty(this, "switchState", {
        "writable": true,
        "value": WAITING
    });

    // initialization
    Object.defineProperty(this, "options", {

        "value": $.advancedMerge({
            "!valueType": "object",
            "!defaultValue": {},
            "startPageID": {
                "!valueType": "string"
            },
            "startChannel": {
                "!valueType": "string",
                "!defaultValue": "main"
            },
            "supportsVirtualPage": {
                "!valueType": "boolean",
                "!defaultValue": false
            },
            "fixedSize": {
                "!valueType": "boolean",
                "!defaultValue": $(document.body).hasClass('ui-mobile') || $(document.body).hasClass('ui-tablet')
            },
            "commonStylePath": {
                "!valueType": "string"
            },
            "commonScriptPath": {
                "!valueType": "string"
            },
            "commonDataPath": {
                "!valueType": "string"
            },
            "commonLangPath": {
                "!valueType": "string"
            },
            "defaultTemplatePath": {
                "!valueType": "string",
                "!defaultValue": "/" + this.id + "/${page.id}/index.xhtml"
            },
            "defaultStylePath": {
                "!valueType": "string",
                "!defaultValue": "/" + this.id + "/${page.id}/style.css"
            },
            "defaultScriptPath": {
                "!valueType": "string",
                "!defaultValue": "/" + this.id + "/${page.id}/script.js"
            },
            "defaultDataPath": {
                "!valueType": "string",
                "!defaultValue": "/" + this.id + "/${page.id}/data.json"
            },
            "autoprefixStyles": {
                "!valueType": "boolean",
                "!defaultValue": true
            },
            "enableSourcemap": {
                "!valueType": "boolean",
                "!defaultValue": false
            },
            "pageSpecs": {
                "!valueType": "object",
                "!defaultValue": {}
            },
            "enablePlugin": {
                "!valueType": "boolean",
                "!defaultValue": true
            },
            "plugins": {
                "!valueType": "array",
                "!operation": "union",
                "!stringDelimiter": [",", " "],
                "!ignoreEmptyElement": true,
                "!autotrimString": true,
                "!arrayElement": {
                    "!valueType": "string"
                },
                "!defaultValue": []
            },
            "cachePage": {
                "!valueType": "boolean",
                "!defaultValue": false
            },
            "freezeUserInteraction": {
                "!valueType": "boolean",
                "!defaultValue": false
            },
            "skipSwitchAnimation": {
                "!valueType": "boolean",
                "!defaultValue": true
            },
            "defaultAnimationForward": {
                "!valueType": "string",
                "!defaultValue": "forward"
            },
            "defaultAnimationBackward": {
                "!valueType": "string",
                "!defaultValue": "backward"
            },
            "defaultAnimationReset": {
                "!valueType": "string",
                "!defaultValue": "reset"
            },
            "defaultAnimationDuration": {
                "!valueType": "number",
                "!defaultValue": 250
            },
            "defaultLang": {
                "!valueType": "string"
            },
            "defaultLangPath": {
                "!valueType": "string",
                "!defaultValue": "/" + this.id + "/${page.id}/${page.lang}.lang.json"
            },
            "defaultLayout" : {
                "!valueType": "string",
                "!defaultValue": ""
            }
        }, {
            "startPageID": $(dom).attr("start-page-id"),
            "startChannel": $(dom).attr("start-channel"),
            "fixedSize": {
                "yes": true,
                "no": false,
                "true": true,
                "false": false
            }[$(dom).attr("fixed-size")],
            "skipSwitchAnimation": {
                "yes": true,
                "no": false,
                "true": true,
                "false": false
            }[$(dom).attr("skip-switch-animation")],
            "supportsVirtualPage": {
                "yes": true,
                "no": false,
                "true": true,
                "false": false
            }[$(dom).attr("supports-virtual-page")],
            "commonLangPath": $(dom).attr("common-lang-path"),
            "commonStylePath": $(dom).attr("common-style-path"),
            "commonScriptPath": $(dom).attr("common-script-path"),
            "commonDataPath": $(dom).attr("common-data-path"),
            "defaultLang": $(dom).attr("default-lang"),
            "defaultLangPath": $(dom).attr("default-lang-path"),
            "defaultTemplatePath": $(dom).attr("default-template-path"),
            "defaultStylePath": $(dom).attr("default-style-path"),
            "defaultScriptPath": $(dom).attr("default-script-path"),
            "defaultDataPath": $(dom).attr("default-data-path"),
            "defaultAnimationForward": $(dom).attr("default-animation-forward"),
            "defaultAnimationBackward": $(dom).attr("default-animation-backward"),
            "defaultAnimationReset": $(dom).attr("default-animation-reset"),
            "defaultAnimationDuration": $(dom).attr("default-animation-duration"),
            "plugins": $(dom).attr("plugins"),
            "autoprefixStyles": {
                "yes": true,
                "no": false,
                "true": true,
                "false": false
            }[$(dom).attr("autoprefix-styles")],
            "cachePage": {
                "yes": true,
                "no": false,
                "true": true,
                "false": false
            }[$(dom).attr("cache-page")],
            "defaultLayout" : $(dom).attr("default-layout")
        })
    });

    this.channel = this.options.startChannel;
    this.channels = {};

    this.channels[this.channel] = {
        "stack": [],
        "startPageID": this.options.startPageID
    }

    this.currentPage = null;

    if (this.options.enablePlugin) {

        delegates = delegates ? delegates : [];

        storyboard.options.plugins.forEach(function(plugin) {

            if ($.storyboard.plugins[plugin] && delegates.indexOf($.storyboard.plugins[plugin]) < 0) {
                delegates.push($.storyboard.plugins[plugin]);
            }

        });

        delegates.sort(function(delegateA, delegateB) {

            delegateA.index = delegateA.index ? delegateA.index : 0;
            delegateB.index = delegateB.index ? delegateB.index : 0;

            return delegateA.index - delegateB.index;

        });

        delegates.forEach(function(externalDelegate) {

            Object.keys(storyboard.delegate).forEach(function(key) {

                var delegateArray = storyboard.delegate[key];

                if (externalDelegate[key] && delegateArray.indexOf(externalDelegate[key]) < 0) {
                    delegateArray.push(externalDelegate[key]);
                }

            });

        });

    }

    this.commonModule = {
        "data": {},
        "exports": {
            "switchTo": function(page, data, options) {
                this.storyboard.switchTo(page, data, options ? options : {});
            },
            "update": function(data) {
                this.page.update(data);
            },
            "goBackward": function(data, options) {
                this.storyboard.goBackward(data, options);
            },
            "lang": function(langText) {

                if (this.page.spec.lang[langText]) {

                    langText = $.template(this.page.spec.lang[langText], this);

                } else {

                    langText = $.template(langText, this);

                }
                return langText.trim();
            },
            "env": function(name) {

                switch (name) {

                    case "viewport.left":
                        {
                            return document.body.scrollLeft;
                        }
                    case "viewport.top":
                        {
                            return document.body.scrollTop;
                        }

                    case "viewport.width":
                        {
                            return $(window).width();
                        }
                    case "viewport.height":
                        {
                            return $(window).height();
                        }

                    case "document.width":
                        {
                            return $(document).width();
                        }
                    case "document.height":
                        {
                            return $(document).height();
                        }

                    case "browser":
                        {
                            return $.browser();
                        }
                    case "browser.system":
                        {
                            return $.browser.system();
                        }
                    case "browser.layout":
                        {
                            return $.browser.layout();
                        }
                    case "browser.ui":
                        {
                            return $.browser.ui();
                        }

                    case "browser.touchable":
                        {
                            return $.browser.touchable();
                        }

                    case "browser.pixelate":
                        {
                            return $.browser.pixelate();
                        }
                    case "browser.pixelate.real":
                        {
                            return $.browser.pixelate(true);
                        }
                    case "page.res":
                        {
                            var path = this.page.spec.templatePath.split('/');
                            path.splice(path.length - 1, 1, 'res', '');
                            return path.join('/');
                        }
                    default:
                        {
                            return null;
                        }
                }

            }
        }
    };

};

var storyboardExecuteDelegate = function(storyboard, delegateName) {

    logger.debug("executing delegate : " + storyboard.id + "@" + delegateName);

    if (storyboard.delegate[delegateName].length) {

        var args = Array.prototype.slice.call(arguments, 2);

        args.unshift(storyboard);

        storyboard.delegate[delegateName].forEach(function(initFunction) {

            try{
                initFunction.apply(storyboard, args);
            } catch (ex){
                logger.error(ex);
            }
        });

    }
}

/**
 * this will add prefix for stylesheet for storyboard
 */
var styleSheetAutoPrefixConvertor = function(storyboard, page, styleObject) {

    var convertRule = function(cssRule) {

        if ((cssRule instanceof CSSMediaRule) ||
            (window.CSSSupportsRule && (cssRule instanceof CSSSupportsRule)) ||
            (cssRule instanceof CSSStyleSheet)) {

            cssRule.prefixedCSSText = Array.prototype.map.call(cssRule.cssRules, function(cssRule) {

                convertRule(cssRule);

                if (cssRule.prefixedCSSText) {
                    return cssRule.prefixedCSSText;
                } else {
                    return cssRule.cssText;
                }

            }).join("\n");

            if (cssRule.media && cssRule.media.length) {
                cssRule.prefixedCSSText = "@media " + cssRule.media.mediaText + "{\n" + cssRule.prefixedCSSText + "\n}";
            }

        } else if (cssRule instanceof CSSStyleRule) {

            var selectorText = cssRule.selectorText.split(",").filter(function(selector) {
                return (selector.trim().length > 0);
            }).map(function(selector) {

                var prefix = "#" + storyboard.id + ".storyboard ";

                if (page) {
                    prefix = prefix + "> #" + page.id + ".storyboard-page ";
                }

                if (page) {
                    if (!/\.storyboard\-page(\s|{|$)/g.test(selector)) {
                        return prefix + selector;
                    } else {
                        return selector.replace(/\.storyboard\-page(\s|\{|$)/g, function(content) {
                            if (content[content.length - 1] !== "{") {
                                return prefix;
                            } else {
                                return prefix + "{";
                            }
                        }).trim();
                    }
                } else {
                    if (!/\.storyboard(\s|\{|$)/g.test(selector)) {
                        return prefix + selector;
                    } else {
                        return selector.replace(/\.storyboard(\s|\{|$)/g, function(content) {
                            return prefix;
                        }).trim();
                    }
                }



            }).join(",");

            cssRule.prefixedCSSText = selectorText + cssRule.cssText.substring(cssRule.selectorText.length);

        }
    };

    Array.prototype.forEach.call(document.styleSheets, function(styleSheet) {

        if (styleSheet.ownerNode === styleObject[0]) {

            convertRule(styleSheet);

            var rules = [];

            Array.prototype.forEach.call(styleSheet.cssRules, function(cssRule) {

                if (cssRule.prefixedCSSText) {
                    rules.push(cssRule.prefixedCSSText);
                } else {
                    rules.push(cssRule.cssText);
                }

            });

            styleObject.html(rules.join("\n") + (storyboard.options.enableSourcemap ? ("\n/*# sourceURL=" + storyboard.options.commonStylePath + "*/") : ""));

        }

    });
};

var initStoryboard = function(storyboard) {

    manager.queue[storyboard.id].then(function() {

        // load resource
        $.loadResources([storyboard.options.commonStylePath, storyboard.options.commonScriptPath, storyboard.options.commonDataPath, storyboard.options.commonLangPath].filter(function(value) {
            return $.isKindOf(value, String) && value != "none";
        }), this.test);

    }).then(function(data) {

        // add class storyboard class
        if (!$(storyboard.dom).hasClass('storyboard')) {
            $(storyboard.dom).addClass("storyboard");
        }

        // check if it has fixed size option and
        if (storyboard.options.fixedSize) {
            $(storyboard.dom).addClass("storyboard-fixed-size");
        }

        if (storyboard.options.freezeUserInteraction) {
            $(storyboard.dom).addClass("storyboard-freeze");
        }

        this.next(data);

    }).then(function(data) {

        //load script from common data
        if (storyboard.options.commonScriptPath && data[storyboard.options.commonScriptPath]) {

            var script = data[storyboard.options.commonScriptPath];

            var newCommonModule = {};

            window.eval(
                "(function () { return function (module) {" + script + "}; })() " + ("//@ sourceURL=" + storyboard.options.commonScriptPath))(
                newCommonModule);

            if (newCommonModule.exports) {
                storyboard.commonModule = $.advancedMerge({}, storyboard.commonModule, newCommonModule);
            }
        }

        this.next(data);

    }).then(function(data) {

        //load lang from common lang
        if (storyboard.options.commonLangPath && data[storyboard.options.commonLangPath]) {

            var langDataString = data[storyboard.options.commonDataPath];

            var langData = null;

            try {
                if ($.isKindOf(langDataString, String)) {
                    langData = JSON.parse(langDataString);
                } else {
                    langData = langDataString;
                }
            } catch (error) {
                console.warn("Failed to parse JSON file at " + storyboard.options.commonDataPath);
            }

            storyboard.commonModule = $.advancedMerge({}, storyboard.commonModule, {
                "lang": langData
            });

        } else {

            storyboard.commonModule = $.advancedMerge({}, storyboard.commonModule, {
                "lang": {}
            });

        }

        this.next(data);

    }).then(function(data) {

        storyboard.commonData = {};

        Array.prototype.forEach.call(storyboard.dom.attributes, function(attribute) {
            var localName = attribute.localName;
            if (localName.indexOf("data-") === 0) {
                storyboard.commonData[localName.substring("data-".length)] = attribute.value;
            }
        });

        this.next(data);

    }).then(function(data) {

        //load data from common data

        if (storyboard.options.commonDataPath && data[storyboard.options.commonDataPath]) {

            var dataString = data[storyboard.options.commonDataPath];

            var jsonData = null;
            try {
                if ($.isKindOf(dataString, String)) {
                    jsonData = JSON.parse(dataString);
                } else {
                    jsonData = dataString;
                }
            } catch (error) {
                console.warn("Failed to parse JSON file at " + storyboard.options.commonDataPath);
            }

            storyboard.commonModule = $.advancedMerge({}, storyboard.commonModule, {
                "data": jsonData
            });
        }

        this.next(data);

    }).then(function(data) {

        //convert style sheet with auto prefix check
        if (storyboard.options.commonStylePath && data[storyboard.options.commonStylePath]) {

            var styles = data[storyboard.options.commonStylePath];

            var styleObject = $("<style>").html(styles + "\n/*# sourceURL=" + storyboard.options.commonStylePath + "*/");

            $(storyboard.dom).append(styleObject);

            if (storyboard.options.autoprefixStyles) {
                styleSheetAutoPrefixConvertor(storyboard, null, styleObject);
            }

        }

        this.next();
    }).then(function() {

        storyboardExecuteDelegate(storyboard, 'init');

        this.next();

    }).then(function() {

        $.async.all(storyboard.dom.getElementsByTagName("div"), function(page) {

            $.async(function() {
                // process PageID

                var step = this;

                if (page.id) {

                    if (!storyboard.options.pageSpecs[page.id]) {
                        storyboard.options.pageSpecs[page.id] = {};
                    }

                    var options = {
                        "templatePath": $(page).attr("template-path"),
                        "stylePath": $(page).attr("style-path"),
                        "scriptPath": $(page).attr("script-path"),
                        "dataPath": $(page).attr("data-path"),
                        "usage": $(page).attr("usage"),
                        "animationForward": $(page).attr("animation-forward"),
                        "animationBackward": $(page).attr("animation-backward"),
                        "animationReset": $(page).attr("animation-reset"),
                        "animationDuration": $(page).attr("animation-duration"),
                        "langPath": $(page).attr("lang-path"),
                        "lang": $(page).attr("lang"),
                        "layout" : $(page).attr("layout")
                    };

                    var pageID = page.id;

                    addPageToStoryboard(storyboard, pageID, options);

                    Array.prototype.forEach.call(page.attributes, function(attribute) {

                        var localName = attribute.localName;

                        if (localName.indexOf("data-") === 0 && localName !== 'data-path') {
                            storyboard.options.pageSpecs[page.id].data[localName.substring("data-".length)] = attribute.value;
                        }

                    });

                    step.next();

                } else {
                    logger.error(new Error("Invalid page"));
                    step.reject(new Error("Invalid page without ID"));
                }

            }).then(function() {

                $(page).detach();

                this.next();

            }).pipe(this);

        }).pipe(this);

    }).then(function() {

        if (window.localStorage) {

            Object.keys(storyboard.options.pageSpecs).forEach(function(pageID) {

                var cacheID = storyboard.id + "-page-" + pageID + "-cache";

                if (storyboard.options.cachePage) {

                    var pageCache = window.localStorage.getItem(cacheID);

                    if (pageCache) {
                        try {
                            var pageCacheStore = JSON.parse(pageCache);
                            if (pageCacheStore) {
                                storyboard.options.pageSpecs[pageID]["cache"] = pageCacheStore;
                            } else {
                                storyboard.options.pageSpecs[pageID]["cache"] = {};
                            }
                        } catch (ex) {
                            storyboard.options.pageSpecs[pageID]["cache"] = {};
                        }
                    } else {
                        storyboard.options.pageSpecs[pageID]["cache"] = {};
                    }

                } else {
                    window.localStorage.setItem(cacheID, null);
                    storyboard.options.pageSpecs[pageID]["cache"] = {};
                }
            });
        }
        this.next();

    }).then(function() {

        storyboardExecuteDelegate(storyboard, 'willSwitchToStartPage');

        if (!storyboard.channels[storyboard.channel]) {
            storyboard.channels[storyboard.channel] = {
                "stack": [],
                "startPageID": null
            }
        }

        storyboard.channels[storyboard.channel].startPageID = storyboard.options.startPageID;

        if (storyboard.options.startPageID) {

            var step = this;

            storyboard.switchTo(storyboard.options.startPageID, null, {
                "channel": storyboard.channel,
                "action": "reset",
                "animation": "fading"
            }).then(function() {

                storyboardExecuteDelegate(storyboard, 'didSwitchToStartPage', storyboard.currentPage);

                step.next();

            }).rejected(this.next);

        } else {

            this.next();
        }

    });

    return manager.queue[storyboard.id];
};

Storyboard.prototype.destoryChannel = function() {

    var storyboard = this;

    var channelsToDestory = [];

    Array.prototype.forEach.call(arguments, function(index, arg) {
        if (storyboard.channels[arg]) {
            channelsToDestory.push(arg);
        }
    });

    return $.async(function() {

        var destoryStep = this;

        storyboard.taskQueue.then(function() {

            $.async.all(channelsToDestory, function(channel) {

                storyboard.channels[channel].stack.forEach(function(page) {


                    if (page.spec.module.exports.destroyPage) {
                        page.spec.module.exports.destroyPage.call(page.data, page);
                    }

                    storyboardExecuteDelegate(storyboard, "destoryPage", page, page.data);

                    $(page.dom).detach();

                });

                delete storyboard.channels[channel];

                this.next();

            }).then(function() {

                this.next();

                destoryStep.next();

            }).pipe(this);
        });
    });

};

Storyboard.prototype.update = function(data) {

    return this.currentPage.update(data);

};


Storyboard.prototype.goBackward = function(data, options) {

    if (options) {
        delete options.action;
    } else {
        options = {};
    }

    if (!data) {
        data = {};
    }

    return this.switchTo(null, data, $.advancedMerge({}, {
        "action": "backward"
    }, options));

};

Object.defineProperty(Storyboard.prototype, "switchNext", {
    "value": function(errorCallback) {

        var storyboard = this;

        manager.switchQueue[storyboard.id].then(function() {

            if (storyboard.switchState == SWITCHING) {

                if (storyboard.switchQueue.length == 0) {

                    storyboard.switchState = WAITING;

                    delete manager.switchQueue[storyboard.id];

                } else {

                    var nextQueue = storyboard.switchQueue.slice(0);

                    storyboard.switchQueue.length = 0;

                    $.async.all(nextQueue, function(swstep, index, queue) {

                        var step = this;

                        if (index == queue.length - 1) {

                            storyboardSwitchNow(storyboard, manager.switchQueue[storyboard.id], errorCallback, swstep, true).then(function() {
                                step.next();
                                this.next();
                            });

                        } else {

                            storyboardSwitchNow(storyboard, manager.switchQueue[storyboard.id], errorCallback, swstep, storyboard.options.skipSwitchAnimation ? false : true).then(function() {
                                step.next();
                                this.next();
                            });

                        }

                    }).then(function() {

                        storyboard.switchNext(errorCallback);

                    });
                }

            }
            this.next();
        });

    }
});

var addPageToStoryboard = function(storyboard, pageID, options) {

    options = options ? options : {};

    var pathData = {
        "storyboard": storyboard,
        "page": {
            "id": pageID,
            "lang": options.lang || storyboard.options.defaultLang
        }
    };

    // update page configuration
    storyboard.options.pageSpecs[pageID] = $.advancedMerge({}, {
        "id": pageID,
        "templatePath": $.template(storyboard.options.defaultTemplatePath, pathData),
        "stylePath": $.template(storyboard.options.defaultStylePath, pathData),
        "scriptPath": $.template(storyboard.options.defaultScriptPath, pathData),
        "dataPath": $.template(storyboard.options.defaultDataPath, pathData),
        "usage": "no-comment storyboard page",
        "cache": {},
        "module": {
            "data": {}
        },
        "data": {},
        "animationForward": storyboard.options.defaultAnimationForward,
        "animationBackward": storyboard.options.defaultAnimationBackward,
        "animationReset": storyboard.options.defaultAnimationReset,
        "animationDuration": {
            "!valueType": "number",
            "!defaultValue": storyboard.options.defaultAnimationDuration
        },
        "langPath": pathData.page.lang ? $.template(storyboard.options.defaultLangPath, pathData) : "none",
    }, options);

    ["scriptPath", "stylePath", "dataPath", "templatePath", "langPath"].forEach(function(key) {
        if ("none" === storyboard.options.pageSpecs[pageID][key]) {
            delete storyboard.options.pageSpecs[pageID][key];
        }
    });

    storyboard.options.pageSpecs[pageID].data = $.advancedMerge({}, storyboard.commonData, storyboard.options.pageSpecs[pageID].data);

}

Storyboard.prototype.addPage = function(pageID, options) {
    var storyboard = this;
    if (!pageID) {
        throw new Error("pageid not found");
    }
    if (storyboard.options.pageSpecs[pageID]) {
        throw new Error("pageid already defined");
    }
    return manager.queue[this.id].then(function() {
        try {
            addPageToStoryboard(storyboard, pageID, options);
        } catch (ex) {

        }
        this.next();
    })
};

/**
pageId, // required
data, // optional
options // optional
switchTo("pageId",data,options).then(function(page,data,storyboard){

}).backward(function(data){

    // when enter the next page, we should provide a function to decorate data sent back

    this.accept(data);

    this.deny(error);

}).rejected(function(error){

}).skipped(functon(queue){

});
*/
Storyboard.prototype.switchTo = function() {

    var storyboard = this;

    var settings = $.matchArguments([
        ["pageID"],
        ["pageID", "data"],
        ["pageID", "data", "options"]
    ], {
        "pageID": "string",
        "data": "any",
        "options": {
            "acceptTypes": "object",
            "defaultValue": {
                "delay": 0
            },
            "mergeOptions": {
                "channel": {
                    "!valueType": "string",
                    "!defaultValue": storyboard.channel
                },
                "action": {
                    "!valueType": "string",
                    "!defaultValue": "forward"
                },
                "animation": {
                    "!valueType": "string"
                },
                "delay": {
                    "!valueType": "number",
                    "!defaultValue": 0
                },
                "duration": {
                    "!valueType": "number",
                    "!defaultValue": storyboard.options.defaultAnimationDuration
                },
                "active": {
                    "!valueType": "boolean",
                    "!defaultValue": true
                },
                "lang": {
                    "!valueType": "string",
                    "!defaultValue": storyboard.options.defaultLang
                },
                "forceAnimation": {
                    "!valueType": "boolean",
                    "!defaultValue": false
                },
                "layout": {
                    "!valueType": "string",
                    "!defaultValue": storyboard.options.defaultLayout
                }
            }
        }
    }, arguments);

    if (settings.pageID && !storyboard.options.pageSpecs[settings.pageID]) {

        if (storyboard.options.supportsVirtualPage) {

            if (!storyboard.options.pageSpecs[settings.pageID]) {
                storyboard.options.pageSpecs[settings.pageID] = {};
            }

            addPageToStoryboard(storyboard, settings.pageID);

        } else {
            throw new Error("Page id [" +settings.pageID+ "] not found");
        }
    }

    storyboardExecuteDelegate(storyboard, 'willSwitchToPage', settings.pageID, settings.data, settings.options);

    if (!settings.pageID) {
        if (settings.options.action === 'backward' || settings.options.action === 'channel') {

        } else {
            throw new Error("Page id [" +settings.pageID+ "] is not defined");
        }
    }

    if (!storyboard.channels[settings.options.channel]) {
        storyboard.channels[settings.options.channel] = {
            "stack": [],
            "startPageID": settings.pageID
        }
    }

    var backwardAction = null;

    var backward = function(data) {

        return $.async(function() {

            var step = this;

            var backwardStep = {

                "accept": function(decorated) {
                    step.next(decorated);
                },

                "deny": function(error) {
                    step.reject(error);
                }
            }

            if (backwardAction) {

                try{
                    backwardAction.call(backwardStep, data);
                } catch (ex){
                    step.next(data);
                }


            } else {

                step.next(data);
            }

        });
    }

    settings.backward = backward;

    var asyncStep = $.async(function() {

        var switchStep = this;

        setTimeout(function(){
            manager.queue[storyboard.id].then(function() {

                try {
                    var switchOperation = {
                        "settings": settings,
                        "step": switchStep
                    };

                    if (storyboard.switchState == WAITING) {

                        storyboard.switchState = SWITCHING;

                        manager.switchQueue[storyboard.id] = $.async();

                        var errorCallback = function(error) {
                            logger.error(error);
                            storyboard.switchState = WAITING;
                            storyboard.switchQueue.length = 0;
                            delete manager.switchQueue[storyboard.id];
                        }

                        storyboardSwitchNow(storyboard, manager.switchQueue[storyboard.id], errorCallback, switchOperation, true).then(function() {

                            storyboard.switchNext(errorCallback);
                            this.next();

                        });

                    } else {
                        storyboard.switchQueue.push(switchOperation);
                    }
                } catch (ex) {

                }
                this.next();

            });
        },0);

    }).then(function() {
        storyboardExecuteDelegate(storyboard, 'didSwitchToPage', settings.pageID, settings.data, settings.options);
        this.next();
    });

    asyncStep.backward = function(action) {

        if (backwardAction) {
            throw new Error("only one backward action can be defined");
        } else {
            backwardAction = action;
        }

    }

    return asyncStep;

};

// entrance
$.storyboard = function(query) {

    var delegates = arguments[1] instanceof Array ? arguments[1] : Array.prototype.slice.call(arguments, 1);

    var storyboards = [];

    $(query).map(function(index, dom) {

        var storyboardInstance = new Storyboard(dom, delegates);

        manager.initQueue.then(function() {

            var initStep = this;

            initStoryboard(storyboardInstance).then(function() {

                this.next();
                initStep.next();

            }).rejected(function() {
                initStep.next();
            })

        });

        storyboards.push(storyboardInstance);

    });

    if (storyboards.length == 1) {
        return storyboards[0];
    } else {
        return storyboards;
    }
};

$.storyboard.plugins = {};

$.storyboard.animations = {};

// 动画体系貌似有更新
$.storyboard.animations["none"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    $("<div>").animate({
        "opacity": 0,
        "translate": [0, 0]
    }, duration, function() {

        action();

        if (complete) {
            complete();
        }

    });
};

$.storyboard.animations["fading"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    nodesToHide.transition({
        "opacity": 0,
        "translate": [0, 0]
    }, duration, function() {
        action();
    });

    nodesToShow.css({
        "opacity": 0,
        "translate": [0, 0]
    }).transition({
        "opacity": 1,
        "translate": [0, 0]
    }, duration, function() {
        if (complete) {
            complete();
        }
    });
};

$.storyboard.animations["forward"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    nodesToHide.transition({
        "translate": [-parseFloat(nodesToHide.css("width")), 0]
    }, duration, function() {
        action();
    });

    nodesToShow.css({
        "opacity": 1,
        "translate": [parseFloat(nodesToShow.css("width")), 0]
    }).transition({
        "translate": [0, 0]
    }, duration, function() {
        if (complete) {
            complete();
        }
    });
};

$.storyboard.animations["backward"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    nodesToHide.transition({
        "translate": [parseFloat(nodesToHide.css("width")), 0]
    }, duration, function() {
        action();
    });

    nodesToShow.css({
        "opacity": 1,
        "translate": [-parseFloat(nodesToShow.css("width")), 0]
    }).transition({
        "translate": [0, 0]
    }, duration, function() {
        if (complete) {
            complete();
        }
    });
};

$.storyboard.animations["reset"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {

    nodesToHide.transition({
        "translate": [0, -parseFloat(nodesToHide.css("height"))]
    }, duration, function() {
        action();
    });

    nodesToShow.css({
        "opacity": 1,
        "translate": [0, parseFloat(nodesToShow.css("height"))]
    }).transition({
        "translate": [0, 0]
    }, duration, function() {
        if (complete) {
            complete();
        }
    });
};



$.template.functors['money'] = function(template, call, parameters, options, inputMoney, fixedNumber, seperator,delimmter) {
    var n = parseFloat(inputMoney),
        c = isNaN(fixedNumber = Math.abs(fixedNumber)) ? 2 : fixedNumber,
        d = seperator == undefined ? "." : seperator,
        t = delimmter == undefined ? "," : delimmter,
        s = (!isNaN(n) && n < 0) ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    if (isNaN(n)){
        return "";
    } else {
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    }
};

$.template.functors['srank'] = function(template, call, parameters, options, rating){
    if (isNaN(rating)){
        return "";
    } else {
        return "★★★★★☆☆☆☆☆".substring(5 - rating, 10 - rating);
    }
}

$.template.external['lang'] = function(node, callback) {

    var langText = $(node).text();

    if (this.page.spec.lang[langText]) {
        langText = $.template(this.page.spec.lang[langText], this);
    } else {
        langText = $.template(langText, this);
    }

    callback(null, $("<span>" + langText + "</span>"));
};

module.exports = Storyboard;
