var loadData = function(data, callback) {

}

var initPage = function() {
    this.page.$('[data-toggle="nav-submenu"]').on('click', function(e) {
        // Get link
        var $link = jQuery(this);

        // Get link's parent
        var $parentLi = $link.parent('li');

        if ($parentLi.hasClass('open')) { // If submenu is open, close it..
            $parentLi.removeClass('open');
        } else { // .. else if submenu is closed, close all other (same level) submenus first before open it
            $link
                .closest('ul')
                .find('> li')
                .removeClass('open');

            $parentLi
                .addClass('open');
        }

        // Remove focus from submenu link
        if ($lHtml.hasClass('no-focus')) {
            $link.blur();
        }

        return false;
    });
};

var didEnterForestage = function() {

    $('#page-container').addClass('sidebar-o');

    //$(this.storyboard.dom).show();

    $('#page-container').removeClass('sidebar-o-xs');

};

var leaveForestage = function() {



};

var destroyPage = function() {


};

var menuSwitch = function(page, channel) {
    window.content.switchTo(page, null, {
        "channel": channel
    });
}

var goHomepage = function() {
    if (this.application.homepage) {
        window.location.href = this.application.homepage;
    } else {
        window.content.switchTo('main-index-page', null, {
            "action": "reset",
            "channel": "main"
        }).then(this.next);
    }
};

var doLogout = function() {
    $.jsonrpcLogout(function(error, result) {

        window.content.switchTo('login-login-page', null, {
            "action": "reset",
            "channel": "login"
        });
        delete $admin.token;
        delete $admin.sessions;
        delete $admin.account;
    });
};

var loadData = function(data, callback) {
    var mainMenu = {};
    if (data.application.menus) {
        for (key in data.application.menus) {
            mainMenu[key] = $.advancedMerge({
                "pageID": {
                    "!valueType": "string"
                },
                "sessions": {
                    "!valueType": "array",
                    "!operation": "union",
                    "!stringDelimiter": [",", " "],
                    "!ignoreEmptyElement": true,
                    "!autotrimString": true,
                    "!arrayElement": {
                        "!valueType": "regex-asterisk-dot"
                    },
                    "!defaultValue": []
                }
            }, {
                "pageID": key,
                "sessions": $.convert(data.application.menus[key], "")
            });
        }
    }
    callback(null, {
        "mainMenu": mainMenu
    })
};

var getCurrentMenuPage = function() {
    return window.content.nextPage ? window.content.nextPage.id : "";
};

var sidebarClose = function() {
    jQuery('#page-container').removeClass('sidebar-o-xs');
};

var shouldShowMenu = function(menuID) {
    if (this.mainMenu[menuID]) {
        if ($admin.sessions) {
            var valid = false;
            this.mainMenu[menuID].sessions.forEach(function(session) {
                $admin.sessions.forEach(function(test) {
                    if (session.test(test)) {
                        valid = true;
                    }
                })
            });
            return valid;
        } else {
            return false;
        }
    } else {
        return true;
    }
};

var isActiveMenu = function(test) {
    if ((window.content.nextPage ? window.content.nextPage.id : "") == test) {
        return "active";
    } else {
        return "";
    }
};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "loadData": loadData,
    "didEnterForestage": didEnterForestage,
    "menuSwitch": menuSwitch,
    "goHomepage": goHomepage,
    "doLogout": doLogout,
    "getCurrentMenuPage": getCurrentMenuPage,
    "sidebarClose": sidebarClose,
    "willUpdate": didEnterForestage,
    "isActiveMenu": isActiveMenu
};
