var AdminPlatform = function(){
    var admin = this;
    var $resizeTimeout;
    this.sessions = [];
    this.token    = $.accessToken;
    this.account  = null;
    admin.adjustUI();
    jQuery(window).on('resize orientationchange', function(){
        clearTimeout($resizeTimeout);

        $resizeTimeout = setTimeout(function(){
            admin.adjustUI();
        }, 150);
    });
};

Dropzone.autoDiscover = false;

AdminPlatform.prototype.adjustUI = function (first_argument) {
    var $lHeader     = $('#header-navbar');
    var $lMain       = $('#main-container');
    var $lFooter     = $('#page-footer');
    var $hWindow     = $(window).height();
    var $windowW     = $(window).width();
    var $hHeader     = $lHeader.outerHeight();
    var $hFooter     = $lFooter.outerHeight();
    var $lPage = $('#page-container');
    var $lSidebar = $('#sidebar');
    var $lSidebarScroll = $('#sidebar-scroll');
    var $lSideOverlay = $('#side-overlay');
    var $lSideOverlayScroll = $('#side-overlay-scroll');

    if ($lMain.hasClass('not-adjustable')){
        $lMain.css('min-height', 0);
    } else {
        $lMain.css('min-height', $hWindow - $hFooter - $hHeader);
    }

    if ($windowW > 991 && $lPage.hasClass('side-scroll')) {
        // Turn scroll lock off (sidebar and side overlay - slimScroll will take care of it)
        jQuery($lSidebar).scrollLock('off');
        jQuery($lSideOverlay).scrollLock('off');

        // If sidebar scrolling does not exist init it..
        if ($lSidebarScroll.length && (!$lSidebarScroll.parent('.slimScrollDiv').length)) {
            $lSidebarScroll.slimScroll({
                height: $lSidebar.outerHeight(),
                color: '#fff',
                size: '5px',
                opacity: .35,
                wheelStep: 15,
                distance: '2px',
                railVisible: false,
                railOpacity: 1
            });
        } else { // ..else resize scrolling height
            $lSidebarScroll
                .add($lSidebarScroll.parent())
                .css('height', $lSidebar.outerHeight());
        }

        // If side overlay scrolling does not exist init it..
        if ($lSideOverlayScroll.length && (!$lSideOverlayScroll.parent('.slimScrollDiv').length)) {
            $lSideOverlayScroll.slimScroll({
                height: $lSideOverlay.outerHeight(),
                color: '#000',
                size: '5px',
                opacity: .35,
                wheelStep: 15,
                distance: '2px',
                railVisible: false,
                railOpacity: 1
            });
        } else { // ..else resize scrolling height
            $lSideOverlayScroll
                .add($lSideOverlayScroll.parent())
                .css('height', $lSideOverlay.outerHeight());
        }
    } else {
        // Turn scroll lock on (sidebar and side overlay)
        jQuery($lSidebar).scrollLock();
        jQuery($lSideOverlay).scrollLock();

        // If sidebar scrolling exists destroy it..
        if ($lSidebarScroll.length && $lSidebarScroll.parent('.slimScrollDiv').length) {
            $lSidebarScroll
                .slimScroll({
                    destroy: true
                });
            $lSidebarScroll
                .attr('style', '');
        }

        // If side overlay scrolling exists destroy it..
        if ($lSideOverlayScroll.length && $lSideOverlayScroll.parent('.slimScrollDiv').length) {
            $lSideOverlayScroll
                .slimScroll({
                    destroy: true
                });
            $lSideOverlayScroll
                .attr('style', '');
        }
    }
};

var $admin = new AdminPlatform();

$.uiReady(function() {

    // Navtabbr height
    navTabHeight = 0;

    $.currentActivity.configure({
        "mainStoryboard" : "content",
        "interceptStartPage" : false
    })

    var language = {
        "init": function(storyboard) {
            if (storyboard.commonModule.data.application.language){
                storyboard.options.defaultLang = storyboard.commonModule.data.application.language;
            }
            if (storyboard.commonModule.data.application.name) {
                document.title = storyboard.commonModule.data.application.name;
            }
        }
    };

    var header  = window.header = $.currentActivity.buildStoryboard("#header",language);

    var bottom  = window.bottom = $.currentActivity.buildStoryboard("#bottom",language);

    var sidebar = window.sidebar = $.currentActivity.buildStoryboard("#sidebar",language);

    var docker  = window.docker = $.currentActivity.buildStoryboard("#side-overlay",language);

    var content = window.content = $.currentActivity.buildStoryboard("#content",language, {

        "willSwitchToStartPage": function(storyboard, page) {

            delete storyboard.options.startPageID;

            $.jsonrpc("other.checkLoginStatus",[],function(error,result){
                if (result) {
                    $admin.sessions = result.sessions;
                    $admin.token = result.token;
                    $admin.account  = result.account;
                } else {
                    $admin.sessions = []
                    $admin.token    =  null;
                    $admin.account  = null;
                    $.accessToken   = null;
                }
                if ($admin.token){
                    storyboard.switchTo("main-index-page", {
                        "token" : $admin.token
                    }, {
                        "channel": "login"
                    });
                } else {
                    storyboard.switchTo("login-login-page", null, {
                        "channel": "login"
                    });
                }
            });

        },
        "willPageEnterForestage": function(storyboard, page, data) {

            // Navbar
            if (page.data.header) {

                if (header.currentPage && page.data.header != header.currentPage.id) {
                    window.header.switchTo(page.data.header, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                } else if (window.header.currentPage){
                    window.header.update(page.data.settings.data);
                }
            }

            // Sidebar
            if (page.data.sidebar) {
                if (sidebar.currentPage && page.data.sidebar != sidebar.currentPage.id) {
                    window.sidebar.switchTo(page.data.sidebar, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                } else if (window.sidebar.currentPage){
                    window.sidebar.update(page.data.settings.data);
                }
            }

            // Tabbar
            if (page.data.bottom) {
                if (bottom.currentPage && page.data.bottom != bottom.currentPage.id) {
                    bottom.switchTo(page.data.bottom, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                } else  if (window.bottom.currentPage){
                    window.bottom.update(page.data.settings.data);
                }
            }

            // Docker
            if (page.data.docker) {
                if (docker.currentPage && page.data.docker != docker.currentPage.id) {
                    docker.switchTo(page.data.docker, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                } else  if (window.docker.currentPage){
                    window.docker.update(page.data.settings.data);
                }
            }
        }
    });

    window.header.onLeftButtonClick = function() {
        if (content.currentPage.spec.module.exports.onBackClick) {
            content.currentPage.spec.module.exports.onBackClick.call(content.currentPage.data);
        } else {
            content.goBackward();
        }
    };

    window.header.onRightButtonClick = function() {
        if (content.currentPage.spec.module.exports.onHeaderRightButtonClick) {
            content.currentPage.spec.module.exports.onHeaderRightButtonClick.call(content.currentPage.data);
        }
    };
    //
    // // Navtabbar switchTo animation
    // navForward = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    //
    //     nodesToHide.transition({
    //         "translate": [-parseFloat(nodesToHide.css("width")), 0]
    //     }, duration, function() {
    //         action();
    //     });
    //
    //     nodesToShow.css({
    //         "opacity": 1,
    //         "translate": [parseFloat(nodesToShow.css("width")), 0],
    //         "padding-top": window.navHeight
    //     }).transition({
    //         "translate": [0, 0],
    //         "padding-top": window.navHeight
    //     }, duration, function() {
    //         if (complete) {
    //             complete();
    //         }
    //     });
    //
    // };
    //
    // // Navtabbar switchTo animation
    // navFading = function(duration, action, nodesToHide, nodesToShow, complete, options) {
    //
    //     nodesToHide.transition({
    //         "opacity": 0,
    //         "translate": [0, 0]
    //     }, duration, function() {
    //         action();
    //     });
    //
    //     nodesToShow.css({
    //         "opacity": 0,
    //         "translate": [0, 0],
    //         "padding-top": window.navHeight
    //     }).transition({
    //         "opacity": 1,
    //         "translate": [0, 0]
    //     }, duration, function() {
    //         if (complete) {
    //             complete();
    //         }
    //     });
    //
    // };
    //
    // $.storyboard.animations["navForward"] = navForward;
    // $.storyboard.animations["navFading"] = navFading;

});
