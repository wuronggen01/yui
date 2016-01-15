$(function () {

    var createCubicBezierInterpolation = function (p1x, p1y, p2x, p2y) {

        var interpolation = function (position) {

            var ax = 0; var bx = 0; var cx = 0;
            var ay = 0; var by = 0; var cy = 0;

            var sampleCurveX = function (position) { 
                return ((ax * position + bx) * position + cx) * position; 
            };
            var sampleCurveY = function (position) { 
                return ((ay * position + by) * position + cy) * position; 
            };
     
            var sampleCurveDerivativeX = function (position) {
                return (3.0 * ax * position + 2.0 * bx) * position + cx; 
            };

            var solveEpsilon = function (duration) { 
                return 1.0 / (200.0 * duration); 
            };

            var solve = function (x,epsilon) { 
                return sampleCurveY(solveCurveX(x, epsilon)); 
            };

            var solveCurveX = function (x, epsilon) {

                var x2, d2;

                var t2 = x;
                var looper = 0;
                while (looper < 8) {

                    x2 = sampleCurveX(t2) - x; 
                    if (Math.abs(x2) < epsilon) {
                        return t2;
                    } 

                    d2 = sampleCurveDerivativeX(t2); 
                    if (Math.abs(d2) < 1e-6) {
                        break;
                    } 

                    t2 = t2 - x2 / d2;

                    ++looper;
                }

                var t0 = 0.0; 
                var t1 = 1.0; 

                t2 = x; 
                if (t2 < t0) {
                    return t0;
                } else if (t2 > t1) {
                    return t1;
                }

                while (t0 < t1) {

                    x2 = sampleCurveX(t2); 

                    if (Math.abs(x2 - x) < epsilon) {
                        return t2;
                    } 

                    if (x > x2) {
                        t0 = t2;
                    } else {
                        t1 = t2;
                    }

                    t2 = (t1 - t0) * 0.5 + t0;
                }

                return t2;
            };

            cx = 3.0 * p1x; 
            bx = 3.0 * (p2x - p1x) - cx; 
            ax = 1.0 - cx - bx; 
            cy = 3.0 * p1y; 
            by = 3.0 * (p2y - p1y) - cy; 
            ay = 1.0 - cy - by;

            return solve(position, solveEpsilon(duration));
        };

        interpolation.cssFunction = "cubic-bezier(" + [p1x, p1y, p2x, p2y].join(", ") + ")";

        return interpolation;
    };

    var createStepInterpolation = function (steps, direction) {

        var interpolation = function (position) {
            if (direction === "start") {
                return Math.ceil(position * steps) / steps;
            } else if (type === "end") {
                return Math.floor(position * steps) / steps;
            }
        };

        interpolation.cssFunction = "steps(" + steps + ", " + direction + ")";

        return interpolation;
    };

    var easeIns = {

        "quad": function (position) {
            return Math.pow(position, 2);
        },
        "cubic": function (position) {
            return Math.pow(position, 3);
        },
        "quart": function (position) {
            return Math.pow(position, 4);
        },
        "quint": function (position) {
            return Math.pow(position, 5);
        },
        "expo": function (position) {
            return Math.pow(position, 6);
        },

        "sine": function (position) {
            return 1 - Math.cos(position * Math.PI / 2);
        },

        "circ": function (position) {
            return 1 - Math.sqrt(1 - position * position);
        },

        "elastic": function (position) {
            if ((position === 0) || (position === 1)) {
                return position;
            } else {
                return -Math.pow(2, 8 * (position - 1)) * Math.sin(((position - 1) * 80 - 7.5) * Math.PI / 15);
            }
        },

        "back": function (position) {
            return position * position * (3 * position - 2);
        },

        "bounce": function (position) {

            var powerOf2 = 0;
            var bounce = 4;

            do {
                --bounce;
                powerOf2 = Math.pow(2, bounce);
            } while (position < (powerOf2 - 1) / 11);

            return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((powerOf2 * 3 - 2) / 22 - position, 2);
        }

    };

    var interpolations = {};

    interpolations["linear"] = function (position) {
        return position;
    };

    interpolations["swing"] = function (position) {
        return 0.5 - Math.cos(position * Math.PI) / 2;
    };

    interpolations["default"] = createCubicBezierInterpolation(0.25, 0.1, 0.25, 1);

    interpolations["ease-in"] = createCubicBezierInterpolation(0.42, 0, 1, 1);
    interpolations["ease-out"] = createCubicBezierInterpolation(0, 0, 0.58, 1);
    interpolations["ease-in-out"] = createCubicBezierInterpolation(0.42, 0, 0.58, 1);

    interpolations["step-start"] = createStepInterpolation(1, "start");
    interpolations["step-end"] = createStepInterpolation(1, "end");

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(function (steps) {
        interpolations["step-" + steps + "-start"] = createStepInterpolation(steps, "start");
        interpolations["step-" + steps + "-end"] = createStepInterpolation(steps, "end");
    });

    Object.keys(easeIns).forEach(function (name) {
        interpolations["ease-in-" + name] = easeIns[name];
        interpolations["ease-out-" + name] = function (position) {
            return 1 - easeIns[name](1 - position);
        };
        interpolations["ease-in-out-" + name] = function (position) {
            if (position < 0.5) {
                return easeIns[name](position * 2) / 2;
            } else {
                return 1 - easeIns[name](position * (-2) + 2) / 2;
            }
        };
    });

    $.interpolations = interpolations;

});

