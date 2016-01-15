$(function () {

    var IntegerAnimation = function IntegerAnimation(reference, from, to, interpolation) {

        this.reference = reference;

        this.from = parseInt(from);
        this.to = parseInt(to);
        this.interpolation = interpolation;

    };

    IntegerAnimation.prototype.calculate = function (position) {
        return Math.round(this.from + this.interpolation(position) * (this.to - this.from));
    };

    var FloatAnimation = function FloatAnimation(reference, from, to, interpolation) {

        this.reference = reference;

        this.from = parseFloat(from);
        this.to = parseFloat(to);
        this.interpolation = interpolation;

    };

    FloatAnimation.prototype.calculate = function (position) {
        return this.from + this.interpolation(position) * (this.to - this.from);
    };

    var colors = {
        "aliceblue": "#f0f8ff",
        "antiquewhite": "#faebd7",
        "aqua": "#00ffff",
        "aquamarine": "#7fffd4",
        "azure": "#f0ffff",
        "beige": "#f5f5dc",
        "bisque": "#ffe4c4",
        "black": "#000000",
        "blanchedalmond": "#ffebcd",
        "blue": "#0000ff",
        "blueviolet": "#8a2be2",
        "brown": "#a52a2a",
        "burlywood": "#deb887",
        "cadetblue": "#5f9ea0",
        "chartreuse": "#7fff00",
        "chocolate": "#d2691e",
        "coral": "#ff7f50",
        "cornflowerblue": "#6495ed",
        "cornsilk": "#fff8dc",
        "crimson": "#dc143c",
        "cyan": "#00ffff",
        "darkblue": "#00008b",
        "darkcyan": "#008b8b",
        "darkgoldenrod": "#b8860b",
        "darkgray": "#a9a9a9",
        "darkgreen": "#006400",
        "darkkhaki": "#bdb76b",
        "darkmagenta": "#8b008b",
        "darkolivegreen": "#556b2f",
        "darkorange": "#ff8c00",
        "darkorchid": "#9932cc",
        "darkred": "#8b0000",
        "darksalmon": "#e9967a",
        "darkseagreen": "#8fbc8f",
        "darkslateblue": "#483d8b",
        "darkslategray": "#2f4f4f",
        "darkturquoise": "#00ced1",
        "darkviolet": "#9400d3",
        "deeppink": "#ff1493",
        "deepskyblue": "#00bfff",
        "dimgray": "#696969",
        "dodgerblue": "#1e90ff",
        "firebrick": "#b22222",
        "floralwhite": "#fffaf0",
        "forestgreen": "#228b22",
        "fuchsia": "#ff00ff",
        "gainsboro": "#dcdcdc",
        "ghostwhite": "#f8f8ff",
        "gold": "#ffd700",
        "goldenrod": "#daa520",
        "gray": "#808080",
        "green": "#008000",
        "greenyellow": "#adff2f",
        "honeydew": "#f0fff0",
        "hotpink": "#ff69b4",
        "indianred ": "#cd5c5c",
        "indigo ": "#4b0082",
        "ivory": "#fffff0",
        "khaki": "#f0e68c",
        "lavender": "#e6e6fa",
        "lavenderblush": "#fff0f5",
        "lawngreen": "#7cfc00",
        "lemonchiffon": "#fffacd",
        "lightblue": "#add8e6",
        "lightcoral": "#f08080",
        "lightcyan": "#e0ffff",
        "lightgoldenrodyellow": "#fafad2",
        "lightgray": "#d3d3d3",
        "lightgreen": "#90ee90",
        "lightpink": "#ffb6c1",
        "lightsalmon": "#ffa07a",
        "lightseagreen": "#20b2aa",
        "lightskyblue": "#87cefa",
        "lightslategray": "#778899",
        "lightsteelblue": "#b0c4de",
        "lightyellow": "#ffffe0",
        "lime": "#00ff00",
        "limegreen": "#32cd32",
        "linen": "#faf0e6",
        "magenta": "#ff00ff",
        "maroon": "#800000",
        "mediumaquamarine": "#66cdaa",
        "mediumblue": "#0000cd",
        "mediumorchid": "#ba55d3",
        "mediumpurple": "#9370db",
        "mediumseagreen": "#3cb371",
        "mediumslateblue": "#7b68ee",
        "mediumspringgreen": "#00fa9a",
        "mediumturquoise": "#48d1cc",
        "mediumvioletred": "#c71585",
        "midnightblue": "#191970",
        "mintcream": "#f5fffa",
        "mistyrose": "#ffe4e1",
        "moccasin": "#ffe4b5",
        "navajowhite": "#ffdead",
        "navy": "#000080",
        "oldlace": "#fdf5e6",
        "olive": "#808000",
        "olivedrab": "#6b8e23",
        "orange": "#ffa500",
        "orangered": "#ff4500",
        "orchid": "#da70d6",
        "palegoldenrod": "#eee8aa",
        "palegreen": "#98fb98",
        "paleturquoise": "#afeeee",
        "palevioletred": "#db7093",
        "papayawhip": "#ffefd5",
        "peachpuff": "#ffdab9",
        "peru": "#cd853f",
        "pink": "#ffc0cb",
        "plum": "#dda0dd",
        "powderblue": "#b0e0e6",
        "purple": "#800080",
        "rebeccapurple": "#663399",
        "red": "#ff0000",
        "rosybrown": "#bc8f8f",
        "royalblue": "#4169e1",
        "saddlebrown": "#8b4513",
        "salmon": "#fa8072",
        "sandybrown": "#f4a460",
        "seagreen": "#2e8b57",
        "seashell": "#fff5ee",
        "sienna": "#a0522d",
        "silver": "#c0c0c0",
        "skyblue": "#87ceeb",
        "slateblue": "#6a5acd",
        "slategray": "#708090",
        "snow": "#fffafa",
        "springgreen": "#00ff7f",
        "steelblue": "#4682b4",
        "tan": "#d2b48c",
        "teal": "#008080",
        "thistle": "#d8bfd8",
        "tomato": "#ff6347",
        "turquoise": "#40e0d0",
        "violet": "#ee82ee",
        "wheat": "#f5deb3",
        "white": "#ffffff",
        "whitesmoke": "#f5f5f5",
        "yellow": "#ffff00",
        "yellowgreen": "#9acd32",

        "transparent": "rgba(0, 0, 0, 0)"

    };

    var Color = function Color(color) {

        if (colors.hasOwnProperty(color)) {
            color = colors[color];
        }

        if (color.hasOwnProperty("red") && 
            color.hasOwnProperty("green") && 
            color.hasOwnProperty("blue") && 
            color.hasOwnProperty("alpha")) {

            this.red = parseFloat(color.red);
            this.green = parseFloat(color.green);
            this.blue = parseFloat(color.blue);
            this.alpha = parseFloat(color.alpha);

        } else if (color[0] === "#") {

            if (color.length === 4) {

                this.red = parseInt(color.substring(1, 2), 16) / 15;
                this.green = parseInt(color.substring(2, 3), 16) / 15;
                this.blue = parseInt(color.substring(3, 4), 16) / 15;
                this.alpha = 1;

            } else if (color.length = 7) {

                this.red = parseInt(color.substring(1, 3), 16) / 255;
                this.green = parseInt(color.substring(3, 5), 16) / 255;
                this.blue = parseInt(color.substring(5, 7), 16) / 255;
                this.alpha = 1;

            } else {
                throw new Error("Invalid color");
            }

        } else if (color.substring(0, 4) === "rgb(") {

            var units = color.slice(4, -1).split(",");

            this.red = parseInt(units[0]) / 255;
            this.green = parseInt(units[1]) / 255;
            this.blue = parseInt(units[2]) / 255;
            this.alpha = 1;

        } else if (color.substring(0, 5) === "rgba(") {

            var units = color.slice(5, -1).split(",");

            this.red = parseInt(units[0]) / 255;
            this.green = parseInt(units[1]) / 255;
            this.blue = parseInt(units[2]) / 255;
            this.alpha = parseFloat(units[3]);

        } else {
            throw new Error("Invalid color");
        }

    };

    Color.prototype.toString = function () {
        return "rgba(" + 
            Math.round(this.red * 255) + ", " + 
            Math.round(this.green * 255) + ", " + 
            Math.round(this.blue * 255) + ", " + 
            this.alpha.toFixed(2) + ")";
    };

    var ColorAnimation = function ColorAnimation(reference, from, to, interpolation) {

        this.reference = reference;

        this.from = new Color(from);
        this.to = new Color(to);

        this.interpolation = interpolation;

    };

    ColorAnimation.prototype.calculate = function (position) {

        var value = this.interpolation(position);

        return new Color({
            "red": this.from.red + value * (this.to.red - this.from.red),
            "green": this.from.green + value * (this.to.green - this.from.green),
            "blue": this.from.blue + value * (this.to.blue - this.from.blue),
            "alpha": this.from.alpha + value * (this.to.alpha - this.from.alpha)
        });

    };

    var Length = function Length(reference, length) {

        if (length.hasOwnProperty("unit")) {

            this.unit = length.unit;
            this.number = length.number;

        } else {

            var index = length.indexOf(/[^0-9]/);
            if (index != -1) {
                this.unit = length.substring(index);
            } else {
                this.unit = "px";
            }

            this.number = parseFloat(length);

        }

        this.reference = reference;

    };

    Object.defineProperty(Length.prototype, "numberInPixels", {
        "enumerable": false,
        "get": function () {
            switch (this.unit) {

                case "px": { return this.number; }
                case "pt": { return this.number * 72 / 96; }
                case "pc": { return this.number * 6 / 96; }
                case "in": { return this.number * 96; }
                case "cm": { return this.number * 96 * 2.54; }
                case "mm": { return this.number * 96 * 25.4; }

                case "em": { return new Length(this.reference.reference, this.reference.value).numberInPixels * this.number; }
                case "rem": { return new Length(null, $(document.body).style("font-size")).numberInPixels * this.number; }
                case "ex": { return new Length(this.reference.reference, this.reference.value).numberInPixels * this.number * 0.65; }
                case "rex": { return new Length(null, $(document.body).style("font-size")).numberInPixels * this.number * 0.65; }

                case "vh": { return document.body.clientHeight * this.number / 100; }
                case "vw": { return document.body.clientWidth * this.number / 100; }

                case "vmin": { return Math.min(document.body.clientWidth, document.body.clientHeight) * this.number / 100; }
                case "vmax": { return Math.max(document.body.clientWidth, document.body.clientHeight) * this.number / 100; }

                case "%": { return this.number * new Length(this.reference.reference, this.reference.value).numberInPixels / 100; }

                default: { return NaN; }
            }
        }
    });

    Length.prototype.toString = function () {
        return this.number.toFixed(2) + this.unit;
    };

    var LengthAnimation = function LengthAnimation(reference, from, to, interpolation) {

        this.reference = reference;

        this.from = new Length(reference, from);
        this.to = new Length(reference, to);

        this.interpolation = interpolation;

    };

    LengthAnimation.prototype.calculate = function (position) {
        return new Length(null, {
            "number": (this.from.numberInPixels + this.interpolation(position) * (this.to.numberInPixels - this.from.numberInPixels)) / 96 * 25.4,
            "unit": "mm"
        });
    };

    var LengthListAnimation = function LengthListAnimation(reference, from, to, interpolation) {

    };

    var propertyAnimations = {};

    [
        "column-count", 
        "order",
        "z-index",
        "font-weight", "font-stretch"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": IntegerAnimation,
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "opacity", 
        "flex-grow", "flex-shrink",
        "font-size-adjust",
        "shape-image-threshold"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": FloatAnimation,
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "perspective", 
        "column-width", "column-gap", "column-rule-width", 
        "flex-basis", 
        "border-left-width", "border-right-width", 
        "border-bottom-left-radius", "border-bottom-right-radius", "border-top-left-radius", "border-top-right-radius",
        "margin-left", "margin-right", 
        "padding-left", "padding-right", 
        "min-width", "max-width", 
        "left", "right", 
        "width", 
        "outline-offset", "outline-width",
        "shape-margin"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": LengthAnimation,
            "reference": "width",
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "border-bottom-width", "border-top-width",
        "margin-bottom", "margin-top",
        "padding-bottom", "padding-top",
        "min-height", "max-height",
        "bottom", "top",
        "height"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": LengthAnimation,
            "reference": "height",
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "letter-spacing", "tab-size", "text-indent", "word-spacing", "font-size", "line-height"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": LengthAnimation,
            "reference": "font-size",
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "color", 
        "column-rule-color",
        "text-decoration-color",
        "background-color",
        "border-bottom-color", "border-left-color", "border-right-color", "border-top-color",
        "outline-color"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": ColorAnimation,
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "transform",
        "text-shadow",
        "box-shadow"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    [
        "transform-origin", "perspective-origin",
        "background-position", "background-size",
        "clip",
        "object-position"
    ].forEach(function (key) {
        propertyAnimations[key] = {
            "animation": LengthListAnimation,
            "field": "style",
            "property": key,
            "cssTransition": true
        };
    });

    var combinedAnimations = {
        "border-width": ["border-bottom-width", "border-left-width", "border-right-width", "border-top-width"],
        "border-color": ["border-bottom-color", "border-left-color", "border-right-color", "border-top-color"],
        "border-radius": ["border-bottom-left-radius", "border-bottom-right-radius", "border-top-left-radius", "border-top-right-radius"],
        "padding": ["padding-bottom", "padding-left", "padding-right", "padding-top"],
        "margin": ["margin-bottom", "margin-left", "margin-right", "margin-top"]
    };

    var Reference = function Reference(object, field, property) {

        this.object = object;
        this.field = field;
        this.property = property;

    };

    Object.defineProperty(Reference.prototype, "reference", {
        "enumerable": false,
        "get": function () {
            if (this.field === "style") {
                return this.object.parentElement;
            } else {
                return null;
            }
        }
    });

    Object.defineProperty(Reference.prototype, "value", {
        "enumerable": false,
        "get": function () {
            if (this.field === "style") {
                return $(this.object).style(this.property);
            } else {
                return null;
            }
        }
    });

    var INITED = "inited";
    var PLAYING = "playing";
    var FINISHED = "finished";
    var CANCELED = "canceled";

    var animatorsSymbol = Symbol("animators");

    var transitionEndEventNames = (function () {

        var transitionEndEventNames = {
            "WebkitTransition": ["webkitTransitionEnd"],
            "MozTransition": ["transitionend"],
            "OTransition": ["oTransitionEnd", "otransitionend"],
            "transition": ["transitionend"]
        };

        for (var name in transitionEndEventNames) {
          if (document.body.style.hasOwnProperty(name)) {
              return transitionEndEventNames[name];
          }
        }

        return ["transitionend"];

    })();

    var Animator = function Animator(object, property, to, delay, duration, interpolation, listeners, usingCSSTransition) {

        this.id = $.createUUID();

        this.usingCSSTransition = usingCSSTransition;

        if (!object[animatorsSymbol]) {
            object[animatorsSymbol] = {};
        }

        var settings = propertyAnimations[property];

        var referenceObject = null;

        var from = null;
        if (settings.field === "style") {
            from = $(object).style(settings.property);
            referenceObject = object.parentElement;
        }

        this.object = object;
        this.property = property;
        this.settings = settings;

        this.listeners = listeners;
        if (!this.listeners) {
            this.listeners = {};
        }

        this.delay = delay;
        this.duration = duration;

        if  (this.settings.animation) {
            this.animation = new this.settings.animation(
                new Reference(referenceObject, settings.field, settings.reference),
                from, to,
                interpolation);
        } else {
            this.animation = {
                "interpolation": interpolation,
                "reference": new Reference(referenceObject, settings.field, settings.reference),
                "from": from,
                "to": to,
            };
        }

        this.state = INITED;
        this.version = $.createUUID();

        if (this.listeners.inited) {
            this.listeners.inited(this);
        }

    };

    Animator.prototype.play = function () {

        if (this.state === INITED) {

            var animator = this;

            Object.keys(this.object[animatorsSymbol]).slice(0).forEach((function (id) {
                if (!(this.object[animatorsSymbol][id] instanceof Array)) {
                    if ((this.object[animatorsSymbol][id]) && 
                        (this.object[animatorsSymbol][id].settings.field === animator.settings.field) && 
                        (this.object[animatorsSymbol][id].property === animator.property)) {
                        this.object[animatorsSymbol][id].cancel();
                    }
                }
            }).bind(this));

            this.object[animatorsSymbol][this.id] = this;

            this.state = PLAYING;
            var version = $.createUUID();
            this.version = version;

            if (this.listeners.prepared) {
                this.listeners.prepared(this);
            }

            if (this.usingCSSTransition && 
                this.settings.cssTransition && 
                (this.settings.field === "style") &&
                this.animation.interpolation.cssFunction) {

                var query = $(this.object);

                var styles = query.style();

                var transitingProperties = styles["transition-property"].split(",").map(function (item) {
                    return item.trim();
                });
                var transitingDurations = styles["transition-duration"].split(",").map(function (item) {
                    return item.trim();
                });
                var transitingDelays = styles["transition-delay"].split(",").map(function (item) {
                    return item.trim();
                });

                var transitingTimingFunctions = [];
                styles["transition-timing-function"].split(",").forEach(function (item) {
                    if (transitingTimingFunctions.length > 0) {

                        var last = transitingTimingFunctions[transitingTimingFunctions.length - 1];
                        if (last.split("(").length === last.split(")").length) {
                            transitingTimingFunctions.push(item);
                        } else {
                            transitingTimingFunctions[transitingTimingFunctions.length - 1] = last + item;
                        }

                    } else {
                        transitingTimingFunctions.push(item)
                    }
                });
                transitingTimingFunctions = transitingTimingFunctions.map(function (item) {
                    return item.trim();
                });

                var index = transitingProperties.indexOf("all");

                if (index !== -1) {

                    transitingProperties.splice(index, 1);
                    transitingDurations.splice(index, 1);
                    transitingDelays.splice(index, 1);
                    transitingTimingFunctions.splice(index, 1);

                }

                var index = transitingProperties.indexOf(animator.settings.property);

                if (index !== -1) {

                    transitingProperties.splice(index, 1);
                    transitingDurations.splice(index, 1);
                    transitingDelays.splice(index, 1);
                    transitingTimingFunctions.splice(index, 1);

                    query.style(animator.settings.property, query.style(animator.settings.property));

                }

                transitingProperties.push(animator.settings.property);
                transitingDurations.push(this.duration + "ms");
                transitingDelays.push(this.delay + "ms");
                transitingTimingFunctions.push(this.animation.interpolation.cssFunction);

                query.styles({
                    "transition-property": transitingProperties.join(", "),
                    "transition-duration": transitingDurations.join(", "),
                    "transition-delay": transitingDelays.join(", "),
                    "transition-timing-function": transitingTimingFunctions.join(", ")
                });

                query.on(transitionEndEventNames.map(function (eventName) {
                    return "animation." + animator.id + "." + animator.settings.property + "." + eventName;
                }).join(" "), (function (event) {

                    if (event.propertyName === animator.settings.property) {

                        query.off("animation." + animator.id + "." + animator.settings.property + ".*");

                        stopCSSTransition.call(this);

                        if ((this.state === PLAYING) && (version === this.version)) {
                            if (this.listeners.finished) {
                                this.listeners.finished(this);
                            }
                        }

                    }

                }).bind(this));

                query.styles(animator.settings.property, animator.animation.to.toString());

            } else {

                this.delayHandle = $.delay(this.delay, (function () {

                    delete this.delayHandle;

                    if ((this.state === PLAYING) && (version === this.version)) {

                        if (this.listeners.started) {
                            this.listeners.started(this);
                        }

                        var start = new Date().getTime();

                        var animate = (function () {
                            window.requestAnimationFrame((function () {
                                if ((this.state === PLAYING) && (version === this.version)) {

                                    var time = new Date().getTime() - start;
                                    if (time < this.duration) {

                                        if (this.listeners.playing) {
                                            this.listeners.playing(this);
                                        }

                                        var value = this.animation.calculate(time / this.duration);

                                        if (this.settings.field === "style") {
                                            $(this.object).style(this.settings.property, value.toString());
                                        }

                                        animate();

                                    } else {

                                        this.state = FINISHED;

                                        if (this.settings.field === "style") {
                                            $(this.object).style(this.settings.property, this.animation.to.toString());
                                        }

                                        delete this.object[animatorsSymbol][this.id];

                                        if (this.listeners.finished) {
                                            this.listeners.finished(this);
                                        }

                                    }

                                }
                            }).bind(this));
                        }).bind(this);

                        animate();

                    }

                }).bind(this));

            }

        } else {
            throw new Error("Animator not prepared");
        }

    };

    Animator.prototype.reset = function () {

        if (this.state !== INITED) {

            this.state = INITED;
            this.version = $.createUUID();

            delete this.object[animatorsSymbol][this.id];

            if (this.delayHandle) {

                this.delayHandle.cancel();

                delete this.delayHandle;
            }

            if (this.state === PLAYING) {
                if (this.listeners.canceled) {
                    this.listeners.canceled(this);
                }
            }

            if (this.listeners.reset) {
                this.listeners.reset(this);
            }

            stopCSSTransition.call(this);

        }

    };

    var stopCSSTransition = function () {

        if (this.usingCSSTransition && 
            this.settings.cssTransition && 
            (this.settings.field === "style") &&
            this.animation.interpolation.cssFunction) {

            var animator = this;

            var query = $(this.object);

            var styles = query.style();

            var transitingProperties = styles["transition-property"].split(",").map(function (item) {
                return item.trim();
            });
            var transitingDurations = styles["transition-duration"].split(",").map(function (item) {
                return item.trim();
            });
            var transitingDelays = styles["transition-delay"].split(",").map(function (item) {
                return item.trim();
            });

            var transitingTimingFunctions = [];
            styles["transition-timing-function"].split(",").forEach(function (item) {
                if (transitingTimingFunctions.length > 0) {

                    var last = transitingTimingFunctions[transitingTimingFunctions.length - 1];
                    if (last.split("(").length === last.split(")").length) {
                        transitingTimingFunctions.push(item);
                    } else {
                        transitingTimingFunctions[transitingTimingFunctions.length - 1] = last + item;
                    }

                } else {
                    transitingTimingFunctions.push(item)
                }
            });
            transitingTimingFunctions = transitingTimingFunctions.map(function (item) {
                return item.trim();
            });

            var index = transitingProperties.indexOf("all");

            if (index !== -1) {

                transitingProperties.splice(index, 1);
                transitingDurations.splice(index, 1);
                transitingDelays.splice(index, 1);
                transitingTimingFunctions.splice(index, 1);

            }

            var index = transitingProperties.indexOf(animator.settings.property);

            if (index !== -1) {
                transitingProperties.splice(index, 1);
                transitingDurations.splice(index, 1);
                transitingDelays.splice(index, 1);
                transitingTimingFunctions.splice(index, 1);
            }

            query.styles({
                "transition-property": transitingProperties.join(", "),
                "transition-duration": transitingDurations.join(", "),
                "transition-delay": transitingDelays.join(", "),
                "transition-timing-function": transitingTimingFunctions.join(", ")
            });

        }

    };

    Animator.prototype.cancel = function (stopAtCurrentState) {

        if (this.state === PLAYING) {

            this.state = CANCELED;
            this.version = $.createUUID();

            delete this.object[animatorsSymbol][this.id];

            if (this.delayHandle) {

                this.delayHandle.cancel();

                delete this.delayHandle;
            }

            if (this.listeners.canceled) {
                this.listeners.canceled(this);
            }

            var styleValue = $(this.object).style(this.settings.property);

            stopCSSTransition.call(this);

            if (!stopAtCurrentState) {
                if (this.settings.field === "style") {
                    $(this.object).style(this.settings.property, this.animation.to.toString());
                }
            } else {
                if (this.settings.field === "style") {
                    $(this.object).style(this.settings.property, styleValue);
                }
            }
        }

    };

    var versionSymbol = Symbol("version");

    var nextVersion = 1;

    $.upgrade({
        "domain": "dom",
        "addons": {
            "then": function (action) {

                var query = this;

                var next = query.clone();

                var version = nextVersion;

                Object.defineProperty(next, "async", {
                    "enumerable": false,
                    "value": $.async(function () {

                        if (query.async) {
                            query.async.pipe(this);
                        } else {
                            this.next();
                        }

                    }).then(function () {

                        if (query.filter(function (element) {

                            if (element[versionSymbol]) {
                                return (element[versionSymbol] >= version);
                            } else {
                                return false;
                            }

                        }).length === 0) {

                            action.apply(this, [next]);

                        } else {
                            this.reject(new Error("Animation canceled"));
                        }

                    })
                });

                return next;
            },
            "rejected": function (action) {

                if (this.async) {
                    this.async.rejected(action);
                }

                return this;
            },
            "delay": function (delay) {

                var version = nextVersion;

                return this.then(function (query) {

                    $.delay(delay, (function () {

                        if (query.filter(function (element) {

                            if (element[versionSymbol]) {
                                return (element[versionSymbol] >= version);
                            } else {
                                return false;
                            }

                        }).length === 0) {

                            this.next();

                        } else {

                            this.reject(new Error("Animation canceled"));

                        }

                    }).bind(this));

                });

            },
            "stop": function (deep, stopAtCurrentState) {

                var query = this;
                if (deep) {
                    query = this.clone();
                    query.query("*").forEach(function (element) {
                        query.include(element);
                    });
                }

                var version = nextVersion;
                ++nextVersion;

                query.forEach(function (element) {

                    if (element[animatorsSymbol]) {
                        Object.keys(element[animatorsSymbol]).slice(0).forEach(function (animator) {
                            element[animatorsSymbol][animator].cancel(stopAtCurrentState);
                        });
                    }

                    element[versionSymbol] = version;

                });

                return this;

            },
            "animate": function () {

                var properties = {};
                var options = {};

                if (arguments.length === 1) {
                    properties = arguments[0];
                } else if (arguments.length > 1) {
                    if ($.isKindOf(arguments[0], String)) {
                        properties[arguments[0]] = properties[arguments[1]];
                        if (arguments.length > 2) {
                            options = arguments[2];
                        }
                    } else {
                        properties = arguments[0];
                        options = arguments[1];
                    }
                }

                options = $.advancedMerge({
                    "!valueType": "object",
                    "!numberFields": "duration",
                    "duration": { "!valueType": "number", "!defaultValue": 1000 },
                    "delay": { "!valueType": "number", "!defaultValue": 0 },
                    "noCSSTransition": { "!valueType": "boolean", "!defaultValue": false },
                    "interpolation": { "!defaultValue": "default" }
                }, options);

                var interpolation = options.interpolation
                if ($.isKindOf(interpolation, String)) {
                    interpolation = $.interpolations[interpolation];
                }

                if (!interpolation) {
                    interpolation = $.interpolations["default"];
                }

                var allProperties = {};

                Object.keys(properties).forEach(function (key) {
                    if (combinedAnimations[key]) {
                        combinedAnimations[key].forEach(function (key2) {
                            if (!properties.hasOwnProperty(key2)) {
                                allProperties[key2] = properties[key];
                            }
                        });
                    } else {
                        allProperties[key] = properties[key];
                    }
                });

                var version = nextVersion;

                return this.then(function (query) {

                    var step = this;

                    var finishedElement = 0;
                    var canceledElement = 0;
                    var nextCalled = false;

                    var testNext = function () {
                        if (!nextCalled) {
                            if (canceledElement > 0) {

                                nextCalled = true;

                                step.reject(new Error("Animation canceled"));

                            } else if (finishedElement === query.length) {

                                nextCalled = true;

                                step.next();

                            }
                        }
                    };

                    if (query.filter(function (element) {

                        if (element[versionSymbol]) {
                            return (element[versionSymbol] >= version);
                        } else {
                            return false;
                        }

                    }).length === 0) {

                        query.forEach(function (element) {

                            var animators = {};

                            var finished = 0;
                            var canceled = 0;

                            var callbacked = false;
                            var test = function () {
                                if (!callbacked) {
                                    if (canceled > 0) {

                                        callbacked = true;

                                        ++canceledElement;

                                        testNext();

                                    } else if (finished === Object.keys(allProperties).length) {

                                        callbacked = true;

                                        ++finishedElement;

                                        testNext();

                                    }
                                }
                            };

                            Object.keys(allProperties).forEach(function (key) {
                                animators[key] = new Animator(element, 
                                    key, allProperties[key], 
                                    options.delay, options.duration, 
                                    interpolation, 
                                    {
                                        "finished": function (animator) {
                                            ++finished; test();
                                        },
                                        "canceled": function (animator) {
                                            ++canceled; test();
                                        }
                                    },
                                    !options.noCSSTransition);
                            });

                            Object.keys(animators).slice(0).forEach(function (key) {
                                animators[key].play();
                            });

                        });

                    } else {
                        step.reject(new Error("Animation canceled"));
                    }

                });

            }
        }        
    });

    // -> animations
    // -> query, animations
    //
    // "animations": {
    //     "animationX": {
    //         "query": [ {"!duration": 0, "!delay": 0, "!query": "element", "property": "8px" }, ... ]
    //     }
    // }
    //
    var AnimationSet = function AnimationSet() {

        var query = null;
        var animations = {};

        if (arguments.length === 1) {
            query = $("html");
            animations = arguments[0];
        } else if (arguments.length > 1) {
            query = $(arguments[0]);
            animations = arguments[1];
        }

        this.query = query;

        this.animations = animations;

    };

    AnimationSet.prototype.play = function (animation, data) {

        var animationSet = this;

        if (this.animations.hasOwnProperty(animation)) {

            return $.async(function () {

                var animationObjects = animationSet.animations[animation];

                var callbacked = 0;
                var failed = 0;

                var tryNext = (function () {
                    if (callbacked === Object.keys(animationObjects).length) {
                        if (failed > 0) {
                            this.reject(new Error("Animation canceled"));
                        } else {
                            this.next();
                        }
                    }
                }).bind(this);

                Object.keys(animationObjects).forEach(function (selector) {

                    var query = null;

                    animationObjects[selector].forEach(function (settings) {

                        var newQuery = null;
                        if (settings.selector) {

                            if ((settings.selector === "&") || (settings.selector.length === 0)) {
                                newQuery = animationSet.query.clone();
                            } else if (query === null) {
                                newQuery = animationSet.query.query(settings.selector);
                            } else {
                                newQuery = query.query(settings.selector);
                            }
                            console.log(2);

                        } else if (query === null) {

                            if ((selector === "&") || (selector.length === 0)) {
                                newQuery = animationSet.query.clone();
                            } else {
                                newQuery = animationSet.query.query(selector);
                            }

                            query = newQuery;

                        } else {
                            newQuery = query;
                        }

                        var properties = {};
                        var options = {};

                        Object.keys(settings).forEach(function (key) {

                            var value = $.template(settings[key] + "", data);

                            if (key[0] === "!") {
                                options[key.substring(1)] = value;
                            } else {
                                properties[key] = value;
                            }

                        });

                        if (query != newQuery) {

                            var oldQuery = query;

                            query = newQuery.then(function () {

                                var step = this;

                                oldQuery.then(function () {

                                    newQuery.clone().animate(properties, options).then(function () {

                                        this.next();

                                        step.next();

                                    }).rejected(function (error) {

                                        step.reject(error);

                                    });

                                    this.next();


                                }).rejected(function (error) {

                                    step.reject(error);

                                });

                            });

                        } else {
                            query = query.animate(properties, options);
                        }

                    });

                    query.then(function () {
                        ++callbacked;
                        tryNext();
                    }).rejected(function (error) {
                        ++failed;
                        ++callbacked;
                        tryNext();
                    });

                });

            });

        } else {
            return $.async.reject(new Error("Animation not found"));
        }

    };

    $.animationSet = function (settings) {
        return new AnimationSet(settings);
    };

});