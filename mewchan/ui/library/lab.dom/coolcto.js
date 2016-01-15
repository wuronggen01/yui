var Navbar = function(headerSB, bottomSB, navTabHeight) {

    return {
        "init": function(storyboard, page, data) {
            headerSB.onLeftButtonClick = function() {
                if (storyboard.currentPage.spec.module.exports.onBackClick) {
                    storyboard.currentPage.spec.module.exports.onBackClick.call(storyboard.currentPage.data);
                } else {
                    storyboard.goBackward();
                }
            };
            headerSB.onRightButtonClick = function() {
                if (storyboard.currentPage.spec.module.exports.onHeaderRightButtonClick) {
                    storyboard.currentPage.spec.module.exports.onHeaderRightButtonClick.call(storyboard.currentPage.data);
                }
            };
        },
        "willSwitchToPage": function(storyboard, pageID, data, options) {

        },
        "didSwitchToPage": function(storyboard, pageID, data, options) {

        },
        "willPageEnterForestage": function(storyboard, page, data) {

            // padding-top css

            if (data.navnormal) {
                var navTabHeightNormal = 20;
                if ($('body').hasClass('system-android')){
                    navTabHeightNormal = 25;
                }
                $(storyboard.dom).find('.storyboard-page').css('padding-top', navTabHeightNormal + 'px');
            } else {
                $(storyboard.dom).find('.storyboard-page').css('padding-top', navTabHeight + 'px');
            }

            // header linkage
            if (data.header && headerSB.currentPage) {

                if (headerSB.currentPage.id == data.header) {
                    if (data.needupdateheader) {
                        headerSB.update(page.data.settings.data);
                    }
                } else {
                    headerSB.switchTo(data.header, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                }
            };

            // bottom linkage
            if (data.bottom && bottomSB.currentPage) {

                if (bottomSB.currentPage.id == data.bottom) {
                    bottomSB.update(page.data.settings.data);
                } else {
                    bottomSB.switchTo(data.bottom, page.data.settings.data, {
                        "action": "reset",
                        "animation": "fading"
                    });
                }

            };


        }
    };
}

module.exports.Navbar = Navbar;
