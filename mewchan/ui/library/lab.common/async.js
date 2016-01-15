var foundation = require("./foundation.js");


var PENDING = "pending";
var SUSPENDED = "suspended";
var CALLING = "calling";
var HELD = "hold";
var FULFILLED = "fulfilled";
var REJECTED = "rejected";

var setHiddenField = function (that, key, value) {
    Object.defineProperty(that, key, {
        "enumerable": false,
        "configurable": true,
        "value": value
    });
};


var Async = function Async(action, pool, fulfilled) {

    if (!fulfilled) {
        fulfilled = [];
    }

    this.pool = foundation.objectize(pool);

    this.state = PENDING;

    setHiddenField(this, "action", action);

    this.fulfilled = fulfilled;

    setHiddenField(this, "followingAsyncs", []);

    setHiddenField(this, "pendingTaskAsyncs", []);
    setHiddenField(this, "pendingRejectedActions", [(function (error) {

        this.followingAsyncs.forEach((function (async) {

            if (async.state !== PENDING) {
                throw new Error("Invalid state for following async");
            }

            async.state = REJECTED;
            async.fulfilled = this.fulfilled;

            if (async.pendingRejectedActions.length > 0) {
                async.pendingRejectedActions.forEach(function (action) {
                    action.call(async.step, async.fulfilled);
                });
            }

        }).bind(this));

        this.followingAsyncs = [];

    }).bind(this)]);

    setHiddenField(this, "pendingTests", []);

    this.testState = PENDING;

    var self = this;

    var alreadyTimeout = false;

    var step = {

        "pool": this.pool,

        "hold": function () {

            var timeout = 0;
            var action = null;

            if (foundation.isKindOf(arguments[0], Number)) {
                timeout = arguments[0];
            }

            if (foundation.isKindOf(arguments[arguments.length - 1], Function)) {
                action = arguments[arguments.length - 1];
            }

            if (self.state === CALLING) {

                self.state = HELD;

                if (timeout) {

                    async.delay(timeout, function () {
                        if (self.state === HELD) {

                            step.reject(new Error("The hold of the async step has been timeout"));

                            alreadyTimeout = true;

                        }
                    });

                }

                if (action) {
                    action.call(step);
                }

            } else {
                throw new Error("Invalid state for async step");
            }

            return step;

        },

        "test": function (error) {
            if (error) {
                return step.reject(error);
            } else {
                return step.next.apply(step, Array.prototype.slice.call(arguments, 1));
            }
        },

        "next": function () {

            if (alreadyTimeout) {
                return;
            }

            if ((self.state === HELD) ||
                (self.state === CALLING)) {

                self.fulfilled = Array.prototype.slice.call(arguments, 0);

                self.state = FULFILLED;

                var asyncs = self.pendingTaskAsyncs;

                setHiddenField(async, "pendingTaskAsyncs", []);
                setHiddenField(async, "pendingRejectedActions", []);

                asyncs.forEach(function (async2) {
                    call.call(async2, self.fulfilled);
                });

                setHiddenField(async, "followingAsyncs", []);

            } else {
                throw new Error("Invalid state for async step");
            }

        },

        "reject": function (error) {

            if (alreadyTimeout) {
                return;
            }

            if ((self.state === HELD) ||
                (self.state === CALLING)) {

                if (!foundation.isKindOf(error, Error)) {
                    error = new Error(error);
                }

                self.fulfilled = error;
                self.state = REJECTED;

                var actions = self.pendingRejectedActions;

                setHiddenField(async, "pendingTaskAsyncs", []);
                setHiddenField(async, "pendingRejectedActions", []);

                actions.forEach(function (action) {
                    action.call(step, self.fulfilled);
                });

                setHiddenField(async, "followingAsyncs", []);

            } else {
                throw new Error("Invalid state for async step");
            }

        }

    };

    setHiddenField(this, "step", step);

};


Async.prototype.state = PENDING;
Async.prototype.fulfilled = null;

var call = function (fulfilled) {

    if (this.state === PENDING) {

        this.state = CALLING;

        if (!foundation.isArrayLike(fulfilled)) {
            fulfilled = [fulfilled];
        }

        var newFulfilled = this.action.apply(this.step, fulfilled);

        // if (this.state === CALLING) {

        //     this.fulfilled = newFulfilled;
        //     this.state = FULFILLED;

        //     var asyncs = this.pendingTaskAsyncs;

        //     this.pendingTaskAsyncs = [];
        //     this.pendingRejectedActions = [];

        //     asyncs.forEach((function (async) {
        //         call.call(async, this.fulfilled);
        //     }).bind(this));

        // }

    } else {
        throw new Error("Invalid state to call async task");
    }

};

setHiddenField(Async.prototype, "then", function (task) {

    var async = new Async(task, this.pool, Array.prototype.slice.call(arguments, 1));

    this.followingAsyncs.push(async);

    switch (this.state) {

        case PENDING:
        case CALLING:
        case HELD: {

            this.pendingTaskAsyncs.push(async);

            break;
        }

        case FULFILLED: {

            call.call(async, this.fulfilled);

            break;
        }

        case REJECTED:
        default: {

            async.fulfilled = this.fulfilled;
            async.state = REJECTED;

            break;
        }

    }

    return async;

});

Object.defineProperty(Async.prototype, "result", {
    "enumerable": false,
    "get": function () {
        if (this.state === FULFILLED) {
            return this.fulfilled[0];
        } else {
            return null;
        }
    }
});

setHiddenField(Async.prototype, "rejected", function (action) {

    switch (this.state) {

        case PENDING:
        case CALLING:
        case HELD: {

            this.pendingRejectedActions.push(action);

            break;
        }

        case REJECTED: {

            action.call(this.step, this.fulfilled);

            break;
        }

        case FULFILLED:
        default: {
            break;
        }
    }

    return this;

});

setHiddenField(Async.prototype, "pipe", function (superasync) {

    return this.then(function () {

        superasync.next.apply(superasync,arguments);

        this.next.apply(superasync,arguments);

    }).rejected(superasync.reject)

});


setHiddenField(Async.prototype, "async", function () {

    var wrapee = this;

    return async(function () {

        wrapee.then(function () {

            wrapee.next.apply(wrapee, arguments);

            this.next.apply(this, arguments);

        }).rejected(wrapee.reject);

    });

});

setHiddenField(Async.prototype, "finished", function (finish) {

    var async = this.then.call(this, function () {
        finish.call(this, this.pool);
    });

    return this;

});

setHiddenField(Async.prototype, "all", function (list, action) {

    return this.then(function () {

        if (foundation.isKindOf(list, String)) {
            list = foundation.copyAsArray(this.pool[list]);
        } else {
            list = foundation.copyAsArray(list);
        }

        var step = this;

        var index = 0;

        var looper = (function () {

            if (index < list.length) {

                var item = list[index];

                ++index;

                var state = CALLING;

                var alreadyTimeout = false;

                var that = {

                    "hold": function () {

                        var timeout = 0;
                        var action = null;

                        if (foundation.isKindOf(arguments[0], Number)) {
                            timeout = arguments[0];
                        }

                        if (foundation.isKindOf(arguments[arguments.length - 1], Function)) {
                            action = arguments[arguments.length - 1];
                        }

                        if (state === CALLING) {

                            state = HELD;

                            if (timeout) {
                                async.delay(timeout, function () {

                                    if (state === HELD) {

                                        that.reject(new Error("The hold of the async all has been timeout"));

                                        alreadyTimeout = true;

                                    }

                                });
                            }

                            if (action) {
                                action.call(that);
                            }

                        } else {
                            throw new Error("Invalid state for async all");
                        }

                        return that;

                    },

                    "test": function (error) {
                        if (error) {
                            return that.reject(error);
                        } else {
                            return that.next.apply(that, Array.prototype.slice.call(arguments, 1));
                        }
                    },

                    "next": function () {

                        if (alreadyTimeout) {
                            return;
                        }

                        if ((state === HELD) || (state === CALLING)) {

                            state = FULFILLED;

                            looper();

                        } else {
                            throw new Error("Invalid state for async all");
                        }

                    },

                    "reject": function () {

                        if (alreadyTimeout) {
                            return;
                        }

                        if ((state !== FULFILLED) && (state !== REJECTED)) {

                            state = REJECTED;

                            step.reject.apply(step, arguments);

                        } else {
                            throw new Error("Invalid state for async all");
                        }

                    },

                    "pool": step.pool

                };

                action.call(that, item, index - 1, list);

                // if (state === CALLING) {

                //     state = FULFILLED;

                //     looper();

                // }

            } else {
                step.next();
            }

        });

        looper();

    });

});

setHiddenField(Async.prototype, "race", function () {
    return this.any(arguments, function (action) {
        action.call(this);
    });
});

setHiddenField(Async.prototype, "any", function (list, action) {

    return this.then(function () {

        if (foundation.isKindOf(list, String)) {
            list = foundation.copyAsArray(this.pool[list]);
        } else {
            list = foundation.copyAsArray(list);
        }

        var step = this;

        var passed = 0;
        var failed = 0;

        var index = 0;

        list.forEach(function (item, index) {

            var state = CALLING;

            var alreadyTimeout = false;

            var that = {

                "hold": function () {

                    var timeout = 0;
                    var action = null;

                    if (foundation.isKindOf(arguments[0], Number)) {
                        timeout = arguments[0];
                    }

                    if (foundation.isKindOf(arguments[arguments.length - 1], Function)) {
                        action = arguments[arguments.length - 1];
                    }

                    if (state === CALLING) {

                        state = HELD;

                        if (timeout) {
                            async.delay(timeout, function () {

                                if (state === HELD) {

                                    that.reject(new Error("The hold of the async step has been timeout"));

                                    alreadyTimeout = true;

                                }

                            });
                        }

                        if (action) {
                            action.call(that);
                        }

                    } else {
                        throw new Error("Invalid state for async step");
                    }

                    return that;

                },

                "test": function (error) {
                    if (error) {
                        return that.reject(error);
                    } else {
                        return that.next.apply(that, Array.prototype.slice.call(arguments, 1));
                    }
                },

                "next": function () {

                    if (alreadyTimeout) {
                        return;
                    }

                    if ((state === HELD) || (state === CALLING)) {

                        state = FULFILLED;

                        ++passed;
                        if (passed === 1) {
                            step.next();
                        }

                    } else {
                        throw new Error("Invalid state for async all");
                    }

                },

                "reject": function () {

                    if (alreadyTimeout) {
                        return;
                    }

                    if ((state !== FULFILLED) && (state !== REJECTED)) {
                        state = REJECTED;

                        ++failed;
                        if ((passed === 0) && (failed === list.length)) {
                            step.reject.apply(step, arguments);
                        }

                    } else {
                        throw new Error("Invalid state for async all");
                    }

                },

                "pool": step.pool

            };

            action.call(that, item, index, list);

            // if (state === CALLING) {

            //     state = FULFILLED;

            //     ++passed;
            //     if (passed === 1) {
            //         step.next();
            //     }

            // }

        });

    });

});

setHiddenField(Async.prototype, "test", function (test) {

    switch (this.state) {

        case PENDING:
        case CALLING:
        case HELD: {

            this.pendingTests.push(test);

            break;
        }

        case FULFILLED: {

            switch (this.testState) {

                case PENDING: {

                    var async = this;

                    this.pendingTests.push(test);

                    var alreadyTimeout = false;

                    var that = {

                        "fail": function () {

                            if (alreadyTimeout) {
                                return;
                            }

                            if ((async.testState === CALLING) || (async.testState === HELD)) {

                                async.testState = PENDING;

                                testOnce();

                            } else {
                                throw new Error("Invalid test state for async test");
                            }

                        },

                        "succeed": function () {

                            if (alreadyTimeout) {
                                return;
                            }

                            if ((async.testState === CALLING) || (async.testState === HELD)) {
                                async.testState = FULFILLED;
                            } else {
                                throw new Error("Invalid test state for async test");
                            }

                        },

                        "hold": function () {

                            var timeout = 0;
                            var action = null;

                            if (foundation.isKindOf(arguments[0], Number)) {
                                timeout = arguments[0];
                            }

                            if (foundation.isKindOf(arguments[arguments.length - 1], Function)) {
                                action = arguments[arguments.length - 1];
                            }

                            if (async.testState === CALLING) {

                                async.testState = HELD;

                                if (timeout) {

                                    async.delay(timeout, (function () {

                                        if (async.testState === HELD) {

                                            this.fail(new Error("The hold of the async test has been timeout"));

                                            alreadyTimeout = true;

                                        }

                                    }).bind(this));

                                }

                                if (action) {
                                    action.call(that);
                                }

                            } else {
                                throw new Error("Invalid test state for async test");
                            }

                            return that;

                        },

                        "pool": async.pool

                    };

                    var testOnce = function () {

                        if (async.pendingTests.length > 0) {

                            var test = async.pendingTests.shift();

                            async.testState = CALLING;

                            test.call(that);

                            // if (async.testState === CALLING) {

                            //     async.testState = PENDING;

                            //     testOnce();

                            // }

                        }

                    };

                    testOnce();

                    break;

                }

                case CALLING:
                case HELD: {

                    this.pendingTests.push(test);

                    break;
                }

                case FULFILLED: {
                    break;
                }

            }

            break;
        }

        case REJECTED:
        default: {
            break;
        }

    }

    return this;

});


var async = function (start) {

    var initial = start;
    if (!foundation.isKindOf(start, Function)) {
        initial = function () {
            this.next(start);
        };
    }

    var async = new Async(initial);

    call.call(async);

    return async;

};

async.resolve = function () {

    var data = foundation.copyAsArray(arguments);

    return async(function () {
        this.next.apply(this, data);
    });

};

async.all = function (list, action) {
    return async().all(list, action);
};

async.race = function () {

    var raceAsync = async();

    return raceAsync.race.apply(raceAsync, arguments);

};

async.any = function (list, action) {
    return async().any(list, action);
};


async.reject = function (error) {
    return async(function () {
        this.reject(error);
    });
};

async.test = function (action) {
    return async().test(action);
};

var nextJobs = [];

var scheduledJobs = [];

var Job = function Job(type, time, name, action) {

    this.id = null;

    this.type = type;
    this.time = time;

    this.state = SUSPENDED;
    this.called = false;

    this.action = action;

    this.name = name;

};

Object.defineProperty(Job.prototype, "act", {
    "enumerable": false,
    "get": function () {

        var job = this;

        var act = function () {

            if ((job.type.split(".")[0] === "once") && job.called) {
                return;
            }

            if ((job.type === "repeated.schedule") && job.handle) {

                clearTimeout(job.handle);

                delete job.handle;
            }

            if ([REJECTED, SUSPENDED].indexOf(job.state) === -1) {

                job.called = true;

                job.action.apply(this, arguments);

                if (job.type.split(".")[0] === "once") {
                    job.cancel();
                }

            }

            return job;

        };

        act.job = job;

        return act;

    }
});

Object.defineProperty(Job.prototype, "cancel", {
    "enumerable": false,
    "get": function () {

        var job = this;

        return function () {

            if (job.state !== REJECTED) {

                var index = scheduledJobs.indexOf(job);
                if (index !== -1) {
                    scheduledJobs.splice(index, 1);
                }

                job.state = REJECTED;

                switch (job.type) {

                    case "once.next": {

                        var index = nextJobs.indexOf(job);
                        if (index !== -1) {
                            nextJobs.splice(index, 1);
                        }

                        break;
                    }
                    case "once.timeout":
                    case "once.date":
                    case "repeated.schedule": {

                        clearTimeout(job.handle);

                        delete job.handle;

                        break;
                    }

                    case "repeated.timer": {

                        clearInterval(job.handle);

                        break;
                    }

                    case "once.tick":
                    default: {
                        break;
                    }

                }

            }

            return job;

        };

    }
});

Object.defineProperty(Job.prototype, "suspend", {
    "enumerable": false,
    "get": function () {

        var job = this;

        return function () {

            if ((job.type.split(".") === "once") && job.called) {
                return;
            }

            if ((job.state !== SUSPENDED) && (job.state !== REJECTED)) {

                job.state = SUSPENDED;

                var index = scheduledJobs.indexOf(job);
                if (index !== -1) {
                    scheduledJobs.splice(index, 1);
                }

                switch (job.type) {

                    case "once.next": {

                        var index = nextJobs.indexOf(job);
                        if (index !== -1) {
                            nextJobs.splice(index, 1);
                        }

                        break;
                    }

                    case "once.timeout":
                    case "repeated.schedule":
                    case "once.date": {

                        clearTimeout(job.handle);

                        delete job.handle;

                        break;
                    }

                    case "repeated.timer": {

                        clearInterval(job.handle);

                        delete job.handle;

                        break;
                    }

                    case "once.tick":
                    default: {
                        break;
                    }

                }

            }

            return job;
        };
    }
});

Object.defineProperty(Job.prototype, "resume", {
    "enumerable": false,
    "get": function () {

        var job = this;

        return function () {

            if (job.state === SUSPENDED) {

                job.state = PENDING;

                scheduledJobs.push(job);

                switch (job.type) {

                    case "once.next": {

                        if (nextJobs.length === 0) {
                            process.nextTick(function () {

                                var jobs = nextJobs;
                                nextJobs = [];

                                jobs.forEach(function (job) {
                                    job.act();
                                });

                            });
                        }

                        nextJobs.push(job);

                        break;
                    }

                    case "once.timeout":
                    case "once.date": {

                        job.handle = setTimeout(job.act, job.time - new Date().getTime());

                        break;
                    }

                    case "repeated.schedule": {

                        job.handle = setTimeout(job.act, job.time);

                        break;
                    }

                    case "repeated.timer": {

                        job.handle = setInterval(job.act, job.time);

                        break;
                    }

                    case "once.tick": {

                        process.nextTick(job.act);

                        break;
                    }

                    default: {
                        break;
                    }

                }

            }

            return job;

        };
    }
});

Object.defineProperty(Job.prototype, "schedule", {
    "enumerable": false,
    "get": function () {

        var job = this;

        return function () {

            if ((job.state === PENDING) && (job.type === "repeated.schedule") && job.called) {

                job.called = false;

                if (job.handle) {
                    clearTimeout(job.handle);
                }

                job.handle = setTimeout(job.act, job.time);

            }

            return job;

        };

    }
});

Object.defineProperty(async, "jobs", {
    "enumerable": false,
    "get": function () {
        return scheduledJobs.slice(0);
    }
});

// action, name
// time, action, name
//
async.delay = function () {

    var time = null;
    var action = null;
    var name = null;

    if (foundation.isKindOf(arguments[0], Function)) {
        time = -1;
        action = arguments[0];
        name = arguments[1];
    } else {
        time = arguments[0];
        action = arguments[1];
        name = arguments[2];
    }

    var job = null;
    if (time === -2) {
        job = new Job("once.tick", 0, name, action);
    } else if (time === -1) {
        job = new Job("once.next", 0, name, action);
    } else if (foundation.isKindOf(time, Number)) {
        job = new Job("once.timeout", new Date().getTime() + time, name, action);
    } else if (foundation.isKindOf(time, Date)) {
        job = new Job("once.date", time.getTime(), name, action);
    } else {
        throw new Error("Unknown type of time for job to delay");
    }

    job.resume();

    return job;

};

async.plan = function (date, action, name) {

    if (foundation.isKindOf(date, Number)) {
        date = new Date(date);
    }

    return async.delay(date, action, name);

};

async.schedule = function (interval, action, name) {
    return new Job("repeated.schedule", interval, name, action).resume();
};

async.timer = function (interval, action, name) {
    return new Job("repeated.timer", interval, name, action).resume();
};

async.isAsync = function (value) {
    return value instanceof Async;
};

async.ensure = function (value) {

    if (async.isAsync(value)) {
        return value;
    } else {
        return async.resolve(value);
    }

};

module.exports = async;
