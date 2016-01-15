/**
 * 1. push state manager
 * 2. keyboard layout solution :
 * ::focus => mewchan receive message => element => postion(record) => parent find scroll top
 * mewchan receive message => element => postion(record) => blank area problem ?  framework7 problem.
 * 3. url data input => rewrite rule => activity switch logic.
 * 4. ui components {
        1. modals [alert , confirm, prompt, loading],
        list, gallery, table, switch(on-off checkbox, radio).
        image view (preloading image view), button, textfield, textarea.
        content editor(find good solution),
        slide, tab
        scrollable.
        date picker, calendar.
        picker,
        2. pull to refresh. pull to fetch.
        slider.
        3. notification
        4. sidebar drawer we require a solution.
        5. context menu
 * }
 * 5. geasture : pan, swipe, tap, (replace jquery mobile) : atom geasture solution.
 * 6. hint solution.
 * 7. status bar helper, action bar helper.
 * 8. theme support.
 * 9. gobackward key solution => hardware button solution
 * 10. ui debugger support!!!
 * 11. safe-click (async click support)
 * 12. disable inline script
 * 13. ui touch start fixed.
 * 14. font solution.
 * 15. spirte bundle debug, dist, solution.
 */

var Activity = function() {
    this.storyboards = {};
    this.rules = {};
    this.bulletCurtain = {};
    this.viewLayers = {};
    this.uiAsyncStep = 0;
    var activity = this;
    var defaultActivityTester = /^\/activity\/(.*)\/(.*)/;
    this.addHashRuleHandler(defaultActivityTester, function(hash) {
        var match = hash.match(defaultActivityTester);
        var channel = match[1];
        var pageID = match[2].split("?")[0];
        var query = match[2].split("?")[1];
        if (query) {
            query = buildQueryObject(query);
        }
        if (currentActivity.getMainboard().currentPage && currentActivity.getMainboard().currentPage.id == pageID) {
            currentActivity.getMainboard().update(query);
        } else {
            currentActivity.getMainboard().switchTo(pageID, query, {
                channel: channel
            })
        }

    });
    this.defaultOptions = {
        "mainStoryboard": {
            "!valueType": "string",
            "!defaultValue": "content"
        },
        "interceptStartPage": {
            "!valueType": "boolean",
            "!defaultValue": false
        },
        "enableBridge": {
            "!valueType": "boolean",
            "!defaultValue": true
        },
        "anchorMovementDuration": {
            "!valueType": "number",
            "!defaultValue": 500
        },
        "useDefaultKeyboardSolution" : {
            "!valueType": "boolean",
            "!defaultValue": true
        },
        "bulletOptions": {
            "!valueType": "object",
            "!defaultValue": {

            },
            "width": {
                "!valueType": "number",
                "!defaultValue": "1"
            },
            "height": {
                "!valueType": "number",
                "!defaultValue": 0.4
            },
            "defaultSpeed": {
                "!valueType": "number",
                "!defaultValue": 400
            },
            "maxCountInScreen": {
                "!valueType": "number",
                "!defaultValue": 40
            },
            "maxCountPerSec": {
                "!valueType": "number",
                "!defaultValue": 10
            },
            "fontSize": {
                "!valueType": "number",
                "!defaultValue": 18
            },
            "topBottonBulletTimeRatio": {
                "!valueType": "number",
                "!defaultValue": 0.6
            },
            "enableSubtitleProtection": {
                "!valueType": "boolean",
                "!defaultValue": false
            },
            "defaultPosition": {
                "!valueType": "string",
                "!defaultValue": "row"
            },
            "opacity": {
                "!valueType": "number",
                "!defaultValue": 0.8
            },
            "defaultColor": {
                "!valueType": "string",
                "!defaultValue": "#000000"
            }
        }
    };
    this.options = $.advancedMerge(this.defaultOptions, {});

    var keyboardHandlers = {
        "bottom-input" : {
            "onKeyboardShow": function(frame, height, focused) {
                var findParentStoryboard = function(currentCheck){
                    if ($(currentCheck).is('body')){
                        return null;
                    } else if ($(currentCheck).hasClass('storyboard')){
                        return currentCheck;
                    } else {
                        return findParentStoryboard($(currentCheck).parent());
                    }
                }
                var parentStoryboard = findParentStoryboard($(focused));
                if (parentStoryboard != null && $(parentStoryboard).attr("id") !== activity.options.mainStoryboard){
                    $(parentStoryboard).css('background-color',$('body').css('background-color'));
                    $(parentStoryboard).css('padding-bottom',height + 'px');
                    if ($('body').hasClass('system-ios')){
                        $("body").scrollTop(0);
                    }
                }

            },
            "onKeyboardHide": function(frame, height, focused) {
                var findParentStoryboard = function(currentCheck){
                    if ($(currentCheck).is('body')){
                        return null;
                    } else if ($(currentCheck).hasClass('storyboard')){
                        return currentCheck;
                    } else {
                        return findParentStoryboard($(currentCheck).parent());
                    }
                }
                var parentStoryboard = findParentStoryboard($(focused));
                if (parentStoryboard != null && $(parentStoryboard).attr("id") !== activity.options.mainStoryboard){
                    $(parentStoryboard).css('background-color','transparent');
                    $(parentStoryboard).css('padding-bottom','0px');
                }
            }
        }
    }

    this.lastFocused = $("body");

    this.lastKeyboardFrame = {
        "origin": {
            "x": 0,
            "y": $(window).height()
        },
        "size": {
            "height": 0,
            "width": $(window).height() / 2
        }
    };

    this.defaultKeyboardHandler = {

        "onKeyboardShow": function(frame, height, focused) {
            console.log("executing default keyboard show handler");

            var positionToPage = $(focused).positionToPage({
                "x": 0,
                "y": 0
            });

            var heightDiff = positionToPage.y - frame.origin.y + 50;
            $('body').css('padding-bottom', height + 'px');
            $('html,body').css('height', 'auto');
            $('html,body').css('overflow', 'auto');
            $('body').css('overflow-x', 'hidden');
            $('body').css('overflow-y', 'auto');
            $('html,body').css('position', 'static');
            if (heightDiff > 0) {
                $('body').scrollTop(heightDiff);
            } else {
                $('body').scrollTop(0);
            }
        },

        "onKeyboardHide": function(frame, height, focused) {
            console.log("executing default keyboard hide handler");
            $('body').css('padding-bottom', '0px');
            $('body').scrollTop(0);
            $('html,body').css('overflow', 'hidden');
            $('html,body').css('height', '100%');
            $('html,body').css('position', 'fixed');
            $('body').css('overflow-x', 'hidden');
            $('body').css('overflow-y', 'hidden');
            $(focused).blur();
        }
    }

    $.uiReady(function(){
        $(window).resize(function() {
            var width = $(window).width();
            var height = $(window).height();
            if ($.currentActivity.getMainboard() && $.currentActivity.getMainboard().currentPage &&  $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onWindowResize"]) {
                $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports["onWindowResize"].apply($.currentActivity.getMainboard().currentPage.data, [width,height]);
            }
        });
    });

    $.uiReady(function() {

        $.uiKitty.heard(["android"], "android.wantToGoBackward").then(function(mew) {

            var mainBoard = $.currentActivity.getMainboard();

            if (mainBoard != null){
                mainBoard.goBackward();
            };

        });

        $.uiKitty.heard(["android", "ios"], "device.willShowKeyboard").then(function(mew) {

            if (keyboardStatus === 0){

                var frame = mew.content["device.willShowKeyboard"].newFrame;

                if (frame.size.height >0 ){
                    keyboardStatus = 2;
                }
            }

        });

        $.uiKitty.heard(["android", "ios"], "device.willHideKeyboard").then(function(mew) {

            if (keyboardStatus === 0 ){
                keyboardStatus = 3;
            }

        });

        //0 : undefined keyboard status
        //1 : keyboard is shown
        //2 : keyboard is hidden
        var keyboardStatus = 0;

        $.uiKitty.heard(["android", "ios"], "device.willChangeKeyboardFrame").then(function(mew) {


            if (keyboardStatus > 0) {

                var keyboardJudgeFunction = function(){


                    if (keyboardStatus == 2 || keyboardStatus == 3) {

                        var frame = mew.content["device.willChangeKeyboardFrame"].newFrame;
                        var height = frame.size.height;
                        var focused = $(document.activeElement).is("body") ? activity.lastFocused : $(document.activeElement);

                        var callback = keyboardStatus == 2 ? "onKeyboardShow" : "onKeyboardHide";
                        console.log(callback);
                        if ($.currentActivity.getMainboard() && $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports[callback]) {
                            console.log("executing delegate for keyboard : " + callback);
                            try{
                                $.currentActivity.getMainboard().options.pageSpecs[$.currentActivity.getMainboard().currentPage.id].module.exports[callback].apply($.currentActivity.getMainboard().currentPage.data, [frame, height, focused]);
                            } catch (ex){

                            }
                        } else {

                            var found = false;
                            Object.keys(keyboardHandlers).forEach(function(clz) {
                                if (focused.hasClass(clz) && keyboardHandlers[clz][callback]) {
                                    keyboardHandlers[clz][callback](frame, height, focused);
                                    found = true;
                                }
                            });

                            if (!found && $.currentActivity.options.useDefaultKeyboardSolution) {
                                activity.defaultKeyboardHandler[callback](frame, height, focused);
                            } else {
                                console.log("handler not found");
                            }

                        }

                        if (callback == "onKeyboardShow"){
                            activity.lastFocused = focused;
                        } else {
                            activity.lastFocused = $("body");
                        }

                        activity.lastKeyboardFrame = frame;
                    }

                    keyboardStatus = 0;

                };

                keyboardJudgeFunction();

            }

        });



    });
};

Activity.prototype.uiAsync = function(callback,force) {
    var activity = this;
    var safeAsync = function() {
        return $.async(function() {
            var step = this;
            if ($.isKindOf(callback,Function)){
                var callbacked = false;
                var timeout = setTimeout(function() {
                    if (!callbacked && force) {
                        callbacked = true;
                        step.next();
                    }
                }, 1500);

                var asyncStep = {
                    "next" : function(){
                        if (!callbacked) {
                            callbacked = true;
                            step.next();
                            clearTimeout(timeout);
                        }
                    }
                };
                try{
                    callback.call(asyncStep);
                } catch (ex){
                    step.next();
                }
            } else {
                step.next();
            };
        });
    };

    if (activity.uiAsyncStep == 0) {
        activity.uiAsyncStep = 1;
        $.async(function() {
            safeAsync().then(this.next);
        }).then(function() {
            activity.uiAsyncStep = 0;
            this.next();
        });
    }
};

Activity.prototype.shootBullet = function() {
    var activity = this;

    var bulletOptions = this.options.bulletOptions;

    if (!this.bulletCurtain.viewLayer) {

        var rowCount = Math.round(($(window).height() * this.options.bulletOptions.height) / (this.options.bulletOptions.fontSize + 6));
        if (rowCount < 1) {
            rowCount = 1;
        }
        this.bulletCurtain.viewLayer = this.createViewLayer();
        this.bulletCurtain.screen = {
            "top": [],
            "row": [],
            "bottom": []
        };
        Object.keys(this.bulletCurtain.screen).forEach(function(key) {

            for (var i = 0; i < rowCount; ++i) {
                activity.bulletCurtain.screen[key].push({
                    "index": i,
                    "count": 0,
                    "offset": 0
                });
            }
        })
        $(this.bulletCurtain.viewLayer).css('opacity', this.options.bulletOptions.opacity);
    }

    var bulletCurtain = this.bulletCurtain;

    var viewLayer = this.bulletCurtain.viewLayer;

    var bullets = $.matchArguments([
        ["bullets"],
    ], {
        "bullets": {
            "acceptTypes": "any",
            "defaultValue": [],
            "mergeOptions": {
                "!valueType": "array",
                "!arrayElement": {
                    "!valueType": "object",
                    "!stringFields": "text",
                    "!defaultValue": {},
                    "position": {
                        "!valueType": "string",
                        "!defaultValue": this.options.bulletOptions.defaultPosition
                    },
                    "text": {
                        "!valueType": "string",
                        "!defaultValue": null
                    },
                    "speed": {
                        "!valueType": "number",
                        "!defaultValue": this.options.bulletOptions.defaultSpeed
                    },
                    "color": {
                        "!valueType": "string",
                        "!defaultValue": this.options.bulletOptions.defaultColor
                    },
                    "click": {
                        "!valueType": "function",
                        "!defaultValue": function() {}
                    }
                },
                "!stringFields": 0
            }
        }
    }, arguments).bullets;
    bullets.forEach(function(bullet) {

        if (bullet.text) {

            var duration = 2000 * (bullet.text.length * activity.options.bulletOptions.fontSize + $(window).width() * activity.options.bulletOptions.width) / bullet.speed;
            var textDuration = 2000 * (bullet.text.length * activity.options.bulletOptions.fontSize) / bullet.speed;
            var time = Date.now().toString();

            var rowArray = bulletCurtain.screen[bullet.position].sort(function(a, b) {
                if (a.count == b.count) {
                    return a.index - b.index;
                } else {
                    return a.count - b.count;
                }
            });

            var rowIndex = rowArray[0].index;
            var rowOffset = bullet.text.length * activity.options.bulletOptions.fontSize + 10;
            var rowCount = rowArray[0].count;
            rowArray[0].count = rowArray[0].count + 1;

            setTimeout(function() {

                var bdiv = $('<div>' + bullet.text + '</div>')
                    .css('position', 'absolute')
                    .css('width', rowOffset + 'px')
                    .css('line-height', (activity.options.bulletOptions.fontSize + 6) + "px")
                    .css('font-size', activity.options.bulletOptions.fontSize + "px")
                    .css('color', bullet.color);

                bdiv.appendTo(viewLayer);

                bdiv.on('click', bullet.click);

                var complete = function() {
                    bdiv.remove();
                    bulletCurtain.screen[bullet.position].forEach(function(row) {
                        if (row.index == rowIndex) {
                            row.count = row.count - 1;
                        }
                    })
                }

                switch (bullet.position) {
                    case "top":
                        {
                            bdiv.css({
                                "opacity": 0
                            });
                            break;
                        }
                    case "row":
                        {
                            bdiv.css({
                                "opacity": 1,
                                "translate": [(bulletOptions.width * 0.5 + 0.5) * $(window).width(), rowIndex * (activity.options.bulletOptions.fontSize + 6)]
                            }).transition({
                                "opacity": 1,
                                "translate": [(0.5 - bulletOptions.width * 0.5) * $(window).width() - rowOffset, rowIndex * (activity.options.bulletOptions.fontSize + 6)],
                                "easing": "linear"
                            }, duration, complete);
                            break;
                        }

                    case "bottom":
                        {
                            bdiv.css({
                                "opacity": 0
                            });
                            break;
                        }
                }
            }, textDuration * rowCount);

        }

    });

};

Activity.prototype.createViewLayer = function(uuid) {

    if (!uuid) {
        uuid = $.createUUID();
    }

    if (!this.viewLayers[uuid]) {
        var zindex = 1000000 + Object.keys(this.viewLayers).length;
        this.viewLayers[uuid] = $('<div></div>').attr('id', 'view-' + uuid).addClass('activity-view-layer').css('zIndex', zindex);
        this.viewLayers[uuid].appendTo('body');
    }

    return this.viewLayers[uuid];
};

Activity.prototype.addHashRuleHandler = function(rule, handler) {
    if (!this.rules.hasOwnProperty(rule.toString()) && $.isKindOf(handler, Function)) {
        this.rules[rule.toString()] = {
            "rule": rule,
            "handler": handler
        }
    }
};


Activity.prototype.addHashRewriteRule = function(rule) {

};

Activity.prototype.configure = function(option) {
    this.options = $.advancedMerge(this.defaultOptions, option);
};

Activity.prototype.buildStoryboard = function(storyboardID) {

    var delegates = Array.prototype.slice.call(arguments, 1);

    var id =  $(storyboardID).attr("id");

    if (this.options && this.options.mainStoryboard == id) {
        delegates.push($.storyboard.plugins["activity"]);
    }

    this.storyboards[id] = $.storyboard(storyboardID, delegates);

    return this.storyboards[id];
}

Activity.prototype.getMainboard = function() {
    if (this.storyboards[this.options.mainStoryboard]) {
        return this.storyboards[this.options.mainStoryboard];
    } else {
        return null;
    }
};

Activity.prototype.isMainboard = function(storyboard) {
    return storyboard.id == this.options.mainStoryboard;
};


Activity.prototype.switchTo = function() {
    var board = this.getMainboard()
    return board.switchTo.apply(board, arguments);
};

Activity.prototype.goBackward = function() {
    var board = this.getMainboard();
    return board.goBackward.apply(board, arguments);
};

window.onpopstate = function(event) {
    if (event.state) {
        currentActivity.getMainboard().switchTo(event.state.pageID, event.state.query, {
            channel: event.state.channel
        });
    } else {
        switchToHash();
    }
};

var switchToHash = function() {
    var hashStr = location.hash.replace("#", "");
    var handled = false;
    if (hashStr[0] === '!') {
        hashStr = hashStr.substr(1);
        Object.keys($.currentActivity.rules).forEach(function(key) {
            if (!handled) {
                var ruleInfo = $.currentActivity.rules[key];
                if (ruleInfo.rule.test(hashStr)) {
                    try {
                        ruleInfo.handler(hashStr);
                        handled = true;
                    } catch (ex) {
                        console.error(ex);
                    }
                }
            }
        });
    }
};

//http://127.0.0.1:8000/#!/activity/main/main-index-page?data.token=2121&data.key=122
var buildQueryObject = function(query) {
    var queries = query.split("&");
    var object = {};
    for (var i = 0; i < queries.length; ++i) {
        var querySingle = queries[i];
        var splitedQuery = querySingle.split("=");
        var key = splitedQuery[0];
        var value = splitedQuery[1];
        var keyArray = key.split(".");
        var reference = object;
        for (var j = 0; j < keyArray.length; ++j) {
            if (j == keyArray.length - 1) {
                reference[keyArray[j]] = value;
            } else {

                if (!reference[keyArray[j]]) {
                    reference[keyArray[j]] = {};
                }
                reference = reference[keyArray[j]];
            }
        }
    }
    return object;
};

var buildObjectQuery = function(prefix, object) {
    var query = "";
    Object.keys(object).forEach(function(key) {
        if (object[key]) {
            var queryKey = "";
            if (prefix) {
                queryKey = prefix + "." + queryKey;
            }
            queryKey = queryKey + key;

            switch (typeof object[key]) {
                case "object":
                    {
                        if (Array.isArray(object[key])) {
                            for (var i = 0; i < object[key].length; ++i) {
                                var arrayElement = object[key][i];
                                if (!$.isKindOf(arrayElement, Object)) {
                                    if (query.length) {
                                        query = query + "&";
                                    }
                                    query = query + queryKey + "[" + i + "]=" + arrayElement;
                                }
                            }
                        } else {
                            if (query.length) {
                                query = query + "&";
                            }
                            query = query + buildObjectQuery(queryKey, object[key]);
                        }
                    }
                    break;
                default:
                    {

                        if (query.length) {
                            query = query + "&";
                        }
                        query = query + queryKey + "=" + object[key];
                    }
            }
        }
    });
    return query;
};

var buildHashURL = function(pageID, channel, data) {
    var hashURL = "#!/activity/" + channel + "/" + pageID;
    if (data) {
        var query = buildObjectQuery(null, data);
        if (query) {
            hashURL = hashURL + "?" + query;
        }
    }
    return hashURL;
};

var anchorHandler = function(storyboard, page) {
    if (currentActivity.isMainboard(storyboard)) {
        if (page.data.anchor) {
            var anchor = $(page.dom).find("#" + page.data.anchor);
            if (anchor.length) {
                var positionToPage = $(anchor).positionToPage({
                    "x": 0,
                    "y": 0
                });
                var anchorHeight = positionToPage.y - $(anchor).height();
                var currentHeight = $(document.body).css('height');
                $(document.body).css('height', 'auto');
                $(document.body).animate({
                    "scrollTop": anchorHeight
                }, $.currentActivity.options.anchorMovementDuration, function() {
                    $(document.body).css('height', currentHeight);
                });
            }
        }
    }
}

var currentActivity = new Activity();

$.storyboard.plugins["activity"] = {
    "init": function(storyboard) {
        if (currentActivity.isMainboard(storyboard) && !$('body').hasClass('ui-desktop')) {
            $(storyboard.dom).height($(window).height());
        }
    },
    "willSwitchToStartPage": function(storyboard) {

        if (currentActivity.isMainboard(storyboard)) {
            if (currentActivity.options.interceptStartPage && history.state) {

                delete storyboard.options.startPageID;

                storyboard.switchTo(history.state.pageID, history.state.query, {
                    channel: history.state.channel,
                    forceAnimation: true
                });

            } else if (currentActivity.options.interceptStartPage) {

                var hashStr = location.hash.replace("#", "");

                if (hashStr[0] === '!') {

                    delete storyboard.options.startPageID;

                    switchToHash();

                }
            }
        }
    },
    "willPageEnterForestage": function(storyboard, page) {
        if (currentActivity.isMainboard(storyboard)) {
            if ($('body').hasClass('ui-mobile')){
                if (storyboard.options.pageSpecs[page.id].module.exports["onKeyboardHide"]) {
                    try{
                        storyboard.options.pageSpecs[page.id].module.exports["onKeyboardHide"].apply(page.data, [$.currentActivity.lastKeyboardFrame,$.currentActivity.lastKeyboardFrame.size.height,$.currentActivity.lastFocused]);
                    } catch (ex){

                    }
                }
            }
        }
    },
    "didPageEnterForestage": function(storyboard, page) {
        if (currentActivity.isMainboard(storyboard)) {
            var channel = storyboard.channel;
            var settings = page.data.settings;
            history.pushState({
                pageID: page.id,
                channel: channel,
                query: settings.data
            }, "", buildHashURL(page.id, channel, settings.data));
        }
        anchorHandler(storyboard, page);
    },
    "willUpdatePage": function(storyboard, page) {
        if (currentActivity.isMainboard(storyboard)) {
            var channel = storyboard.channel;
            var settings = page.data.settings;
            if (!page.data.updateNoRender && !page.data.updateNoHash){
                history.pushState({
                    pageID: page.id,
                    channel: channel,
                    query: settings.update
                }, "", buildHashURL(page.id, channel, settings.update));
            }
        }
    },
    "didUpdatePage": function(storyboard, page) {
        if (currentActivity.isMainboard(storyboard)) {
            anchorHandler(storyboard, page);
        }
    },
    "destoryPage": function(storyboard, page) {
        if (page.data.viewLayer){
            $(page.data.viewLayer).remove();
        } else {
            console.log("111");
        }
    }
};


//
//
// <x:plugin tmpl:on-load="whatTheFuck()" on-update="whatTheFuck"   >
//     <tmpl:map></tmpl:map>
// </x:plugin>
//  script.js
//  whatTheFuck : function(template,callback){
//
//  }
//
$.template.external['plugin'] = function(template, callback) {

};

$.template.external['viewLayer'] = function(template, callback) {
    var data = this;
    var isShadowRoot = {
        "yes": true,
        "no": false,
        "true": true,
        "false": false
    }[$(template).attr('shadow')];

    var readyFunction = template.getAttributeNS ? template.getAttributeNS($.template.namespaceURI, "on-ready") : null;

    if ($('body').hasClass('ui-mobile')){
        isShadowRoot = false;
    }

    var templateOptions = {
        "animated": isShadowRoot ? false : true,
        "defaultAnimationDuration": 1000,
        "defaultAnimation": isShadowRoot ? "none" : "left",
        "parser": "text/html",
        "functors": data.functors,
        "prependNamespaces": {
            "sb": "http://project.spiritate.org/storyboard",
            "tmpl": "http://project.spiritate.org/template",
            "storyboard": "http://project.spiritate.org/storyboard",
            "template": "http://project.spiritate.org/template",
            "templatex": "http://project.spiritate.org/templatex",
            "tmplx": "http://project.spiritate.org/templatex",
            "t": "http://project.spiritate.org/template",
            "x": "http://project.spiritate.org/templatex"
        }
    };


    var viewDOM = document.createElement('div');

    var viewLayer = $.currentActivity.createViewLayer(data.page.uuid);

    var firstTime = false;

    if (!data.viewLayer) {

        firstTime = true;

        data["viewLayer"] = data.page.data["viewLayer"] = viewLayer;

        var pageSpec = data.storyboard.options.pageSpecs[data.page.id];
        var styleSource = pageSpec.styleSource;
        var styleObject = $("<style>").html(styleSource + "\n/*# sourceURL=" + pageSpec.stylePath + "*/");
        $(viewLayer).append(styleObject);

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
                    var prefix = "#" + $(data["viewLayer"]).attr('id') + " ";
                    if (!/\.storyboard\-page(\s|{|$)/g.test(selector)) {
                        return prefix + selector;
                    } else {
                        return selector;
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

                styleObject.html(rules.join("\n"));

                $(viewLayer).data('ruledCSS',rules.join("\n"));

            }

        });

        viewLayer.templates = {};

    }

    var viewTemplate = $.template($(template).html(), data, templateOptions);

    viewTemplate.render(viewDOM, function() {

        if (isShadowRoot){
            var shadow = document.createElement("div");
            viewLayer.append(shadow);
            var shadowRoot = shadow.createShadowRoot();
            var template = document.createElement("template");
            template.innerHTML = "<style>" + $(viewLayer).data('ruledCSS') + "</style>\n";
            shadowRoot.appendChild(template.content);
            shadowRoot.appendChild($(viewDOM)[0]);
        } else {
            viewLayer.append(viewDOM);
        }

        if (firstTime){
            if (readyFunction){
                var eventParameters = {};
                for (var name in data) {
                    eventParameters[name] = data[name];
                }
                eventParameters["template"] = template;
                $.template.execute(readyFunction, eventParameters, templateOptions);
            }
        }

        callback(null,null,viewDOM);

    });

};

$.fn.ancestor = function(clz) {

    if ($(this).hasClass(clz)){
        return $(this);
    } else if ($(this).is('body')){
        return null;
    } else {
        return $(this).parent().ancestor(clz);
    }
};

$.fn.serializeForm = function() {
    var a = {};
    var b = function(d, c) {
        var e = a[c.name];
        if ("undefined" !== typeof e && e !== null) {
            if ($.isArray(e)) {
                e.push(c.value)
            } else {
                a[c.name] = [e, c.value]
            }
        } else {
            a[c.name] = c.value
        }
    };
    $.each(this.serializeArray(), b);
    this.find(".js-summernote-air,.js-summernote,.js-div-form").each(function(){
        if ($(this).attr('name')){
            a[$(this).attr('name')]  = $(this).code();
        }
    });
    return a;
};


(function(){

var pressed = false;
var currentTarget = null;

var clearTarget = function () {

    if (currentTarget) {

        $(currentTarget).removeClass("selecting");

        currentTarget = null;
    }

}

var clearSelection = function () {

    clearTarget();

    $(document.body).removeClass("user-selecting");

};

var correctSelection = function () {

    if (!$(document.body).hasClass("user-selecting")) {

        var target = document.getSelection().anchorNode;
        if (target) {
            target = $(target).ancestor("selectable", true);
        }

        if (target) {

            if (currentTarget !== target) {

                clearTarget();

                currentTarget = target;

                $(currentTarget).addClass("selecting");

            }

        } else {

            clearTarget();

        }

        $(document.body).addClass("user-selecting");

    }

};

document.addEventListener("mousedown", function (event) {

    var selection = document.getSelection();

    if (!selection.isCollapsed) {

        clearSelection();

        document.getSelection().removeAllRanges();

    }

});

document.addEventListener("mousemove", function (event) {

    pressed = (event.buttons !== 0);

    var selection = document.getSelection();

    if ((!pressed) && selection.isCollapsed) {
        clearSelection();
    } else {
        correctSelection();
    }

});

document.addEventListener("selectionchange", function (event) {

    var selection = document.getSelection();

    if ((!pressed) && selection.isCollapsed) {
        clearSelection();
    } else {
        correctSelection();
    }

});

})();


module.exports = currentActivity;
