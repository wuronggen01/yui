var async      = require('../lab.common/async.js');
var uuid       = require('../lab.common/uuid.js');
var ruler      = require('../lab.common/ruler.js');
var foundation = require("../lab.common/foundation.js");
var CachePool  = require('../lab.common/cache_pool.js');
var Logger     = require('../lab.common/logger.js');

var IDLE = "idle";
var WAITING = "waiting";
var WORKING = "working";

var HELD = "held";
var FOLLOWING = "following";
var FOLLOWED = "followed";
var TIMEOUT = "timeout";
var RELEASED = "released";

var postMewToRemote = function postMewToRemote(kitty, mew) {

	if (kitty.status === WORKING || kitty.status === WAITING) {

		kitty.mewSendQueue.push(mew);

	} else if (kitty.status === IDLE) {

		if (mew) {

			kitty.mewSendQueue.push(mew);
		}

		if (kitty.mewSendQueue.length) {

			kitty.status = WAITING;

			$.async.delay(100, function() {

				kitty.status = WORKING;

				kitty.logger.info("sending mew to server : " + kitty.uri);

				kitty.mewSendQueue.sort(function(firstMew, secondMew) {
					return firstMew.time.getTime() - secondMew.time.getTime();
				});

				kitty.logger.info(kitty.mewSendQueue);

				$.request("POST", kitty.uri, JSON.stringify(kitty.mewSendQueue), {
					"headers": {
						"mew-token": kitty.mewToken
					}
				}, function(error, result, response) {

					var responseMewToken = response.getResponseHeader('mew-token');

					if (responseMewToken) {
						kitty.mewToken = responseMewToken;
					}

					kitty.status = IDLE;
					postMewToRemote(kitty);
				});

				kitty.mewSendQueue = [];

				if (new Date().getTime() - kitty.mewCaches.lastClearDate > 1000) {
					kitty.mewCaches.clearExpired();
				}

			});

		}


	}

};


var startListenFromRemote = function startListenFromRemote(kitty) {

    $.request("GET", kitty.uri, {}, {
        "headers": {
            "mew-token": kitty.mewToken
        }
    }, function(error, mews, response) {

        var responseMewToken = response.getResponseHeader('mew-token');

        if (responseMewToken) {
            kitty.mewToken = responseMewToken;
        }

        kitty.status = IDLE;

        if (mews && Array.isArray(mews)) {

			kitty.logger.info("receiving mew from server : " + kitty.uri);

			kitty.logger.info(mews);

			try{
            	mews.forEach(function(mew) {
					try{
                		kitty.onHeardMew(mew);
					}catch (exi){
					}
            	});
            	kitty.errorNumber = 0;
			}catch (ex){
				kitty.errorNumber = kitty.errorNumber + 1;
			}

        } else {

            kitty.errorNumber = kitty.errorNumber + 1;

        }

        var errorTime = 100;

        $.async.delay(errorTime, function() {
			if (!kitty.closed){
				startListenFromRemote(kitty);
			}
        });

        if (new Date().getTime() - kitty.mewCaches.lastClearDate > 1000) {
            kitty.mewCaches.clearExpired();
        }

    });

};




var KittyMew = function(play, usage, content, options) {

    this.options = foundation.advancedMerge({
        "timeout": {
            "!valueType": "number",
            "!defaultValue": 5000
        },
        "id": {
            "!valueType": "string",
            "!defaultValue": uuid.createUUID()
        },
        "requireReply": {
            "!valueType": "boolean",
            "!defaultValue": false
        },
        "follow": {
            "!valueType": "string"
        },
        "reply": {
            "!valueType": "string"
        }
    }, options);

    this.options.time = foundation.formatDate(new Date(), "YYYY-MM-DDThh:mm:ss.SSSZ");

    this.play = play;
    this.usage = usage;
    this.content = content;

    Object.defineProperty(this, "time", {
		"enumerable": false,
		"value": new Date()
	});

    Object.defineProperty(this.options, "expiredDate", {
        "enumerable": false,
        "value": new Date().getTime() + this.options.timeout
    });

    ["repliedActions", "amendedActions", "replies", "amends"].forEach((function(key) {
        Object.defineProperty(this, key, {
            "enumerable": false,
            "value": []
        });
    }).bind(this));

    Object.defineProperty(this, "status", {
        "enumerable": false,
        "value": WAITING
    });

    if (this.options.requireReply) {

        Object.defineProperty(this, "timeoutSchedule", {
            "enumerable": false,
            "value": async.delay(this.options.timeout,function(){

                var timeoutMew = {
                    "usage" : "mew.timeout",
                    "content" : {
                        "mew.timeout" : null
                    },
                    "options" : {
                        "reply": this.options.id
                    }
                }

                this.repliedActions.forEach(function(action) {
                    action.call({}, timeoutMew);
                });

            }.bind(this))
        });
    }
};

KittyMew.prototype.replied = function(action) {

    this.repliedActions.push(action);

    this.replies.slice(0).forEach(function(reply) {
        action.call({}, reply);
    });

    return this;

};

KittyMew.prototype.amended = function(action) {

    this.amendedActions.push(action);

    this.amends.slice(0).forEach(function(amend) {
        action.call({}, amend);
    });

    return this;

};


var MewContent = function(raw) {

    Object.keys(raw).forEach((function(key) {

        if (key[0] !== "!") {
            this[key] = raw[key];
        }

    }).bind(this));

};


MewContent.ensure = function(data, type) {

    if (data instanceof MewContent) {

        return data;

    } else {

        if (data && data["!content"]) {

            return new MewContent(data);

        } else {

            if (!type) {
                type = "mew.unknown";
            }

            var raw = {};

            raw[type] = data;

            return new MewContent(raw);

        }

    }

};

MewContent.unwrap = function(content) {

    if (content instanceof MewContent) {

        var raw = {
            "!content": true
        };

        Object.keys(content).forEach(function(key) {
            raw[key] = content[key];
        });

        return raw;

    } else {

        if (content["!content"]) {

            return content;

        } else {

            return {
                "!content": true,
                "mew.unknown": content
            };

        }

    }

};

var KittyMewReceived = function KittyMewReceived(kitty, theMew) {

    this.play = theMew.play;
    this.usage = theMew.usage;
    this.content = theMew.content;
    this.options = theMew.options;
    this.kitty = kitty;

    var theMew = this;

    Object.defineProperty(this, "options", {
        "enumerable": false,
        "value": foundation.advancedMerge({

            "timeout": {
                "!valueType": "number",
                "!defaultValue": 5000
            },

            "holdTimeout": {
                "!valueType": "number"
            },

            "minHoldTimeout": {
                "!valueType": "number",
                "!defaultValue": 0
            }

        }, theMew.options ? theMew.options : {})
    });

    if (!foundation.isKindOf(theMew.options.holdTimeout, Number)) {
        this.options.holdTimeout = theMew.options.timeout / 20;
    }

    if (this.options.holdTimeout < theMew.options.minHoldTimeout) {
        this.options.holdTimeout = theMew.options.minHoldTimeout;
    }

    if (this.options.timeout < theMew.options.holdTimeout) {
        this.options.holdTimeout = theMew.options.timeout;
    }

    this.options.expiredDate = new Date().getTime() + this.options.timeout;
    this.options.holdExpiredDate = new Date().getTime() + this.options.holdTimeout;

    Object.defineProperty(this, "state", {
        "enumerable": false,
        "value": WAITING
    });



};

Object.defineProperty(KittyMewReceived.prototype, "getContent", {
    "enumerable": false,
    "value": function() {

        var mew = this;

        var froms = Object.keys(this.content);

        var looper = 0;
        while (looper < arguments.length) {

            var type = arguments[looper];
            if (this.content.hasOwnProperty(type)) {
                return async(function() {
                    this.next(type, mew.content[type]);
                });
            }

            ++looper;
        }

        return async.reject(new Error("No data matched preferred types"));

    }
});

KittyMewReceived.prototype.makeSnapshot = function() {

    var mew = this;
    var holdID = uuid.createUUID();
    var snapshot = foundation.advancedMerge({},{
        play: mew.play,
        usage: mew.usage,
        content: mew.content
    });

    Object.defineProperty(snapshot, "options", {
        "enumerable": false,
        "value": foundation.advancedMerge({},{
            "requireReply": mew.options.requireReply,
            "holdTimeout": mew.options.holdTimeout,
            "holdExpiredDate": mew.options.holdExpiredDate,
            "timeout": mew.options.timeout,
            "expiredDate": mew.options.expiredDate
        })
    });

    Object.defineProperty(snapshot, "getContent", {
        "enumerable": false,
        "value": function() {
            var froms = Object.keys(snapshot.content);
            var looper = 0;
            while (looper < arguments.length) {

                var type = arguments[looper];
                if (snapshot.content.hasOwnProperty(type)) {
                    return async(function() {
                        this.next(type, mew.content[type]);
                    });
                }
                ++looper;
            }
            return async.reject(new Error("No data matched preferred types"));
        }
    });

    Object.defineProperty(snapshot, "hold", {
        "enumerable": false,
        "value": function() {

            var timeout = undefined;
            var action = undefined;

            if (foundation.isKindOf(arguments[0], Number)) {
                timeout = arguments[0];
            }

            if (foundation.isKindOf(arguments[0], Function)) {
                action = arguments[0];
            } else if (foundation.isKindOf(arguments[1], Function)) {
                action = arguments[1];
            }

            return mew.hold(timeout, action, false, holdID);
        }
    });

    Object.defineProperty(snapshot.hold, "thread", {
        "enumerable": false,
        "value": function() {

            var timeout = undefined;
            var action = undefined;

            if (foundation.isKindOf(arguments[0], Number)) {
                timeout = arguments[0];
            }

            if (foundation.isKindOf(arguments[0], Function)) {
                action = arguments[0];
            } else if (foundation.isKindOf(arguments[1], Function)) {
                action = arguments[1];
            }

            return mew.hold(timeout, action, true, holdID);
        }
    });

    return snapshot;
};

KittyMewReceived.prototype.hold = function(timeout, action, threaded, holdID) {

    var mew = this;

    var state = HELD;

    var timeouts = [];

    if (action) {
        timeouts.push(action);
    }

    var timeoutHandle = null;

    if ((this.state === HELD) || (this.state === WAITING)) {

        var now = new Date().getTime();
        if ((timeout === undefined) || (timeout === null) || (now + timeout > this.options.expiredDate)) {
            timeout = this.options.expiredDate - now;
        }

        var holdExpiredDate = this.options.holdExpiredDate;
        if (this.state === WAITING) {
            this.state = HELD;
        } else {
            holdExpiredDate = this.options.expiredDate;
        }

        if (now < holdExpiredDate) {

            timeoutHandle = async.delay(timeout, function() {

                timeoutHandle = null;

                var allTimeouts = timeouts;

                timeouts = [];

                if ((state === HELD) || (state === FOLLOWING)) {

                    state = TIMEOUT;

                    allTimeouts.forEach(function(timeout) {
                        timeout.call({
                            "follow": follow,
                            "release": release
                        });
                    });

                }

            });

            var holdSignalMew = foundation.advancedMerge({},{
                "play": {},
                "usage": "@mew.hold",
                "content": {
                    "!content": true,
                    "@mew.hold": {
                        "play": mew.play,
                        "usage": mew.usage,
                        "content": mew.content,
                        "threaded": threaded,
                        "holdID": holdID
                    }
                },
                "options": {
                    "time": new Date(),
                    "follow": mew.options.id,
                    "id": uuid.createUUID(),
                    "reply": null
                }
            });


            Object.defineProperty(holdSignalMew, "time", {
                "enumerable": false,
                "value": new Date()
            });

            postMewToRemote(mew.kitty, holdSignalMew);

        } else if ((timeout !== undefined) && (timeout !== null)) {
            state = TIMEOUT;
        }

    }

    var follow = function(usage, content, options) {

        if (timeoutHandle) {
            timeoutHandle.cancel();
            timeoutHandle = null;
        }

        timeouts = [];

        if ((state === FOLLOWING) || threaded) {

            state = FOLLOWED;

            options = foundation.advancedMerge({},{}, options);

            if (!options.id) {
                options.id = uuid.createUUID();
            }

            options.follow = mew.options.id;

            options.time = new Date();

            options.holdID = holdID;

            var followMew = foundation.advancedMerge({},{
                "play": mew.play,
                "usage": usage,
                "content": content,
                "options": options
            });

            Object.defineProperty(followMew, "time", {
				"enumerable": false,
				"value": new Date()
			});

            postMewToRemote(mew.kitty, followMew);

            //send followed mew to server

            //var followMew = mew.mewchan.mew(name, mew.play, usage, content, options);

            if (!threaded) {

                var releaseMew = foundation.advancedMerge({},{
                    "play": null,
                    "usage": "@mew.release",
                    "content": {
                        "!content": true,
                        "@mew.release": {
                            "play": mew.play,
                            "usage": mew.usage,
                            "content": mew.content,
                            "threaded": threaded,
                            "holdID": holdID
                        }
                    },
                    "options": {
                        "time": new Date(),
                        "follow": mew.options.id,
                        "id": uuid.createUUID()
                    }
                });

                Object.defineProperty(releaseMew, "time", {
			        "enumerable": false,
			        "value": new Date()
			    });

                postMewToRemote(mew.kitty, releaseMew);
            }

            return followMew;

        } else if (state === TIMEOUT) {

            var allTimeoutsToCall = timeouts;

            timeouts = [];

            allTimeoutsToCall.forEach(function (timeout) {
                timeout.call({
                    "follow": follow,
                    "release": release
                });
            });

        } else {
            throw new Error("Duplicated reactios is not allowed for one hold");
        }

    };

    var release = function(usage, content, options) {

        if (timeoutHandle) {
            timeoutHandle.cancel();
            timeoutHandle = null;
        }

        timeouts = [];

        if ((state === FOLLOWING) || threaded) {

            state = RELEASED;

            var releaseMew = foundation.advancedMerge({},{
                "play": null,
                "usage": "@mew.release",
                "content": {
                    "!content": true,
                    "mew.hold": {
                        "play": mew.play,
                        "usage": mew.usage,
                        "content": mew.content,
                        "threaded": threaded,
                        "holdID": holdID
                    }
                },
                "options": {
                    "time": new Date(),
                    "follow": mew.options.id,
                    "id": uuid.createUUID()
                }
            });

            postMewToRemote(mew.kitty, releaseMew);

        } else {
            throw new Error("Duplicated reactions is not allowed for one hold");
        }
    };

    var step = {

        "then": function(action) {

            if (state === HELD) {

                state = FOLLOWING;

                action.call({
                    "follow": follow,
                    "release": release
                });
            } else {
                throw new Error("Only one then action could be set currently");
            }

            return step;

        },

        "timeout": function(timeout) {

            if (state === TIMEOUT) {

                timeout.call({
                    "follow": follow,
                    "release": release
                });

            } else if ((state === HELD) || (state === FOLLOWING)) {
                timeouts.push(timeout);
            }

            return step;

        }

    };

    return step;

};

var HTTPKitty = function HTTPKitty(uri, options) {

    this.options = foundation.advancedMerge({
        "!valueType": "object",
        "!defaultValue": {},
        "defaultMewTimeout": {
            "!valueType": "number",
            "!defaultValue": 5000
        },
        "logLevel" : {
            "!valueType": "string",
            "!defaultValue": "error"
        },
        "delegate" : {
            "!valueType": "object",
            "!defaultValue": null
        }
    }, options);

    var kitty = this;

    this.logger = new Logger({
        "logLevel" : this.options.logLevel
    });

    this.interestsIndex = {};

    this.rulebase = {};

    this.ruler    = "simple";

    this.uri      = uri;

    this.mewToken = null;

    if (this.options.delegate) {
        this.delegate = this.options.delegate;
    } else {
        this.delegate = {};
    }

    this.sessionContext = {};

    this.closed = false;

    this.respondents = {};

    this.connected = false;

    this.mewCaches = new CachePool(this.options.defaultMewTimeout);

    this.mewSendQueue = [];

    this.errorNumber = 0;

    this.status = IDLE;

    Object.defineProperty(this, "mew", {
		"enumerable": false,
		"value": function(){

            var play = null;
            var usage = null;
            var content = null;
            var options = null;

            if (foundation.isKindOf(arguments[0], String)) {
                usage = arguments[0];
                content = arguments[1];
                options = arguments[2];
            } else {
                play = arguments[0];
                usage = arguments[1];
                content = arguments[2];
                options = arguments[3];
            }

			if (!/^[a-z0-9_\.]+$/gim.test(usage)) {
				throw new Error("Invalid usage for mew: " + usage);
			}

			if (!options) {
				options = {};
			}

			var mew = new KittyMew(play, usage, content, options);

			if (new Date().getTime() - this.mewCaches.lastClearDate > 1000) {
				this.mewCaches.clearExpired();
			}

			this.mewCaches.put(mew.options.id, mew, mew.options.timeout * 2);

			postMewToRemote(this, mew);

			return mew;
		}
	});

	Object.defineProperty(this, "heard", {
		"enumerable": false,
		"value": function(friends, usages) {
			var kitty = this;
			var finalFriends = [];
			friends.toString().split(/[,\s]/g).forEach(function(friend) {

				friend = friend.trim();

				if ((friend.length > 0) && (finalFriends.indexOf(friend) === -1)) {
					finalFriends.push(friend);
				}

			});

			var finalUsages = [];
			usages.toString().split(/[,\s]/g).forEach(function(usage) {

				usage = usage.trim();

				if ((usage.length > 0) && (finalUsages.indexOf(usage) === -1)) {
					finalUsages.push(usage);
				}

			});

			var actions = [];

			finalFriends.forEach(function(friend) {
				finalUsages.forEach(function(usage) {

					if (!kitty.respondents[friend]) {
						kitty.respondents[friend] = {};
					}

					if (!kitty.respondents[friend][usage]) {
						kitty.respondents[friend][usage] = [];
					}

					kitty.respondents[friend][usage].push(actions);

				});
			});

			var listener = {
				"then": function(action) {

					actions.push(action);

					return listener;
				}
			};

            var interest = {
                "usages": finalUsages,
                "friends": finalFriends
            };
            var interestIndex = JSON.stringify(interest);

            if (!kitty.interestsIndex[interestIndex]) {

                kitty.interestsIndex[interestIndex] = interest;

                var heardSignal = new KittyMew(null, "@mew.interests", {
                    "!content": true,
                    "@mew.interests": [interest]
                }, {});

                postMewToRemote(kitty, heardSignal);

            }

			return listener;
		}
	});

    Object.defineProperty(this.heard, "hold", {
        "enumerable": false,
        "value": function(froms, usages) {
            var holdAction = null;

            this.heard(froms, usages).then(function (mew) {
                mew.hold().then(function () {
                    holdAction.call(this, mew);
                });
            });

            var step = {
                "then": function (action) {

                    if (holdAction) {
                        throw new Error("Only one then could be followed currently");
                    }

                    holdAction = action;

                    return step;
                }
            };

            return step;
        }.bind(this)
    });

    Object.defineProperty(this.mew, "rpc", {
        "enumerable": false,
        "value": function() {

            var play = null;
            var usage = null;
            var content = null;
            var options = null;

            if (foundation.isKindOf(arguments[0], String)) {
                usage = arguments[0];
                content = arguments[1];
                options = arguments[2];
            } else {
                play = arguments[0];
                usage = arguments[1];
                content = arguments[2];
                options = arguments[3];
            }
            var rpcContent;

            if ($.isKindOf(content,Object) && content['!content']) {
                rpcContent = content;
            } else {
                rpcContent = {
                    "!content": true
                }
                rpcContent["rpc.call." + usage] = content;
            }

            var step = kitty.mew.call(kitty, play, "rpc.call." + usage, rpcContent, foundation.merge({
                "requireReply": true
            },options ? options : {}));

            Object.defineProperty(step, "replied", {
                "enumerable": false,
                "value": (function(replied) {

                    return function(listener) {

                        if (listener.length === 2) {

                            listener = (function(listener) {

                                return function(mew) {

                                    if (mew.content.hasOwnProperty("mew.exception")) {
                                        listener.call(this, mew.content["mew.exception"], null, mew);
                                    } else if (mew.usage === "mew.ignore") {
                                        listener.call(this, new Error("Mew has been ignored by kitties"), null, mew);
                                    } else if (mew.usage === "mew.timeout") {
                                        listener.call(this, new Error("RPC procedure has been timeout"), null, mew);
                                    } else {
                                        listener.call(this, null, mew.content["rpc.reply." + usage], mew);
                                    }

                                };

                            })(listener);

                        }

                        return replied.call(this, listener);

                    };

                })(step.replied)
            });

            return step;
        }
    });

    Object.defineProperty(this.heard, "rpc", {
        "enumerable": false,
        "value": function() {

            var froms = null;
            var usages = null;
            if (arguments.length > 1) {
                froms = [arguments[0]].join(" ");
                usages = [arguments[1]].join(" ");
            } else {
                froms = "*";
                usages = [arguments[0]].join(" ");
            }

            var holdAction = null;

            kitty.heard(froms, usages.split(/[,\s]+/).map(function(usage) {
                if (usage) {
                    return "rpc.call." + usage.trim();
                } else {
                    return "";
                }
            }).filter(function(usage) {
                return usage && (usage.length > 0);
            }).join(" ")).then(function(mew) {

                mew.hold().then(function() {

                    step = this;

                    var usage = mew.usage.split(".").slice(2).join(".");

                    var callback = function(error, result) {

                        if (error) {
                            rpcStep.error(error);
                        } else {
                            rpcStep.reply(result);
                        }

                    };

                    var rpcStep = {

                        "reply": function(content) {


                            if ((!content) || (!content["!content"])) {

                                var newContent = {
                                    "!content": true,
                                };

                                newContent["rpc.reply." + usage] = content;

                                content = newContent;

                            }

                            step.follow("rpc.reply." + usage, content);

                        },

                        "error": function(content) {

                            if (!foundation.isKindOf(content, Content)) {

                                if ((!content) || (!content["!content"])) {

                                    if (foundation.isKindOf(content, String)) {
                                        content = new Error(content);
                                    }

                                    if (foundation.isKindOf(content, Error)) {

                                        content = {
                                            "!content": true,
                                            "mew.exception": {
                                                "message": content.message,
                                                "stack": content.stack
                                            }
                                        };

                                    } else if ((!content) || (!content["!content"])) {

                                        content = {
                                            "!content": true,
                                            "mew.exception": content
                                        };

                                    }

                                }

                            }

                            step.follow("rpc.reply." + usage, content);

                        }

                    };

                    holdAction.call(rpcStep, usage, mew.content["rpc.call." + usage], callback, mew);
                });

            });

            var step = {
                "then": function(action) {

                    if (holdAction) {
                        throw new Error("Only one then could be followed currently");
                    }

                    holdAction = action;

                    return step;
                }
            };

            return step;

        }
    });

    startListenFromRemote(this);

};

HTTPKitty.prototype.close = function(){
    this.closed = true;
};

HTTPKitty.prototype.addRules = function(rules){
	this.rulebase = ruler[this.ruler].addRules(this.rulebase,rules);
	var heardSignal = new KittyMew(null, "@mew.interests", {
		"!content": true,
		"@mew.rules": {
			"ruler" : this.ruler,
			"rules" : rules
		}
	}, {});
	postMewToRemote(this, heardSignal);
	return this.rules;
};

Object.defineProperty(HTTPKitty.prototype, "executeDelegate", {
    "enumerable": false,
    "value": function(type) {
        if (type && foundation.isKindOf(this.delegate[type],Function)){
            this.delegate[type].apply(this,Array.prototype.slice.call(arguments,1));
        }
    }
});

Object.defineProperty(HTTPKitty.prototype, "onHeardMew", {
    "enumerable": false,
    "value": function(mew) {

        var kitty = this;

        var isSignalMew = false;

        if (mew.usage[0] == '@') {
            isSignalMew = true;
        }

        if (isSignalMew) {

            switch (mew.usage) {
                case "@connection.reset":
                    {

                        if (kitty.connected) {

                            kitty.executeDelegate("didConnectionReset",kitty.mewToken);

                            var interests = [];

							var rules = ruler[kitty.ruler].exportRules(kitty.rulebase);

                            Object.keys(kitty.interestsIndex).forEach(function(key) {
                                var interest = kitty.interestsIndex[key];
                                interests.push(interest);
                            });

                            if (interests.length || rules.length) {
                                var heardSignal = new KittyMew(null, "@mew.interests", {
                                    "!content": true,
                                    "@mew.interests": interests,
									"@mew.rules" : {
										"rules" : rules,
										"ruler" : kitty.ruler
									}
                                }, {});
                                postMewToRemote(kitty, heardSignal);
                            }

                        } else {
                            kitty.executeDelegate("didConnectionConnected",kitty.mewToken);
                            kitty.connected = true;
                        }

                        break;
                    }
                case "@mew.reply":
                    {

                        var repliedMew = mew.content['@mew.reply'];
                        if (foundation.isKindOf(repliedMew.options.reply, String)) {
                            replyToMew = kitty.mewCaches.get(repliedMew.options.reply);
                            if (replyToMew) {

                                var timeout = new Date().getTime() > replyToMew.options.expiredDate;

                                if (!timeout) {

                                    if (replyToMew.timeoutSchedule) {
                                        replyToMew.timeoutSchedule.cancel();
                                    }

                                    replyToMew.repliedActions.forEach(function(action) {
                                        action.call({}, repliedMew);
                                    });

                                } else {

                                    replyToMew.amendedActions.forEach(function(action) {
                                        action.call({}, repliedMew);
                                    });

                                }

                            }
                        }
                        break;
                    }
            }

        } else {

            // shall we filter those replied mew and followed mew ?

            var respondents = [];

            if (kitty.respondents.hasOwnProperty("*")) {
                respondents.push(kitty.respondents["*"]);
            }

            mew.from.split(".").forEach(function(component, index, components) {

                if (index !== components.length - 1) {

                    var wildcard = components.slice(0, index + 1).join(".") + ".*";
                    if (kitty.respondents.hasOwnProperty(wildcard)) {
                        respondents.push(kitty.respondents[wildcard]);
                    }

                } else {
                    if (kitty.respondents.hasOwnProperty(mew.from)) {
                        respondents.push(kitty.respondents[mew.from]);
                    }
                }

            });

            var actions = [];

            respondents.forEach(function(usages) {

                if (usages.hasOwnProperty("*")) {
                    usages["*"].forEach(function(actionSet) {
                        actionSet.forEach(function(action) {
                            if (actions.indexOf(action) === -1) {
                                actions.push(action);
                            }
                        });
                    });
                }

                mew.usage.split(".").forEach(function(component, index, components) {

                    if (index !== components.length - 1) {

                        var wildcard = components.slice(0, index + 1).join(".") + ".*";

                        if (usages.hasOwnProperty(wildcard)) {
                            usages[wildcard].forEach(function(actionSet) {
                                actionSet.forEach(function(action) {
                                    if (actions.indexOf(action) === -1) {
                                        actions.push(action);
                                    }
                                });
                            });
                        }

                    } else {

                        if (usages.hasOwnProperty(mew.usage)) {
                            usages[mew.usage].forEach(function(actionSet) {
                                actionSet.forEach(function(action) {
                                    if (actions.indexOf(action) === -1) {
                                        actions.push(action);
                                    }
                                });
                            });
                        }

                    }

                });

            });

            var heardMew = new KittyMewReceived(kitty, mew);

            actions.forEach(function(action) {
                action.call(kitty, heardMew.makeSnapshot());
            });
        }

    }
});


module.exports = HTTPKitty;
