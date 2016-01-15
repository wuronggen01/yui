
$.storyboard.animations['bubble'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scale": 0.001
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scale": 1,
            "delay": duration * 0.3
        }, duration * 0.35, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['stamp'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scale": 2
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scale": 1,
            "delay": duration * 0.2
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['compress'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scaleY": 0.001
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scaleY": 1,
            "delay": duration * 0.2
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['narrow'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scaleX": 0.001
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scaleX": 1,
            "delay": duration * 0.2
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['expand'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scaleY": 2
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scaleY": 1,
            "delay": duration * 0.2
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['fat'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scaleX": 2
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scaleX": 1,
            "delay": duration * 0.2
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};
$.storyboard.animations['lianyi'] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    nodesToHide.transition({
        "opacity": 1,
        "translate": [0, 0]
    }, 0, function() {

        action();

        nodesToShow.css({
            "opacity": 0,
            "scaleX": 0.0001,
            "scaleY": 0.0001
        }).transition({
            "opacity": 1,
            "translate": [0, 0],
            "scaleX": 1,
            "scaleY": 1,
            "delay": duration * 0.2,
            "-webkit-transition-timing-function": "ease-in"
        }, duration * 0.4, function() {
            if (complete) {
                complete();
            }
        });

    });
};


$.storyboard.animations["slidedown"] = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    action();
    nodesToShow.css({
        'zIndex': 10000
    });
    nodesToShow
        .css({
            "opacity": 1,
            "translate": [0, -$(window).height()]
        })
        .transition({
            "translate": [0, 0], //动画结束时整个大的页面的位置，x->0,y->0
            "opacity": 1, //动画结束时，页面的透明度
            "delay": duration * 0.2 //动画延时，点击操作之后过一段时间动画才出现
        }, duration * 0.8, function() {
            nodesToShow.css({
                'zIndex': 0
            });
            nodesToHide.css({
                'zIndex': 0
            });
            if (complete) {
                complete();
            }
            nodesToHide.transition({
                "opacity": 0,
                "translate": [0, 200]
            }, duration * 0.4, function() {

            });
        });
};
