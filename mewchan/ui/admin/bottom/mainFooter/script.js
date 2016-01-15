
var loadData = function(data, callback)
{

}

var initPage = function () {

};

var didEnterForestage = function () {

};

var leaveForestage = function () {

};

var destroyPage = function () {

};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "willEnterForestage": function() {
        $('#main-container').removeClass('not-adjustable');
        $lHeader            = jQuery('#header-navbar');
        $lMain              = jQuery('#main-container');
        $lFooter            = jQuery('#page-footer');
        var $lPage = $('#page-container');
        var $hWindow     = jQuery(window).height();
        var $hHeader     = $lHeader.outerHeight();
        var $hFooter     = $lFooter.outerHeight();
        if ($lPage.hasClass('header-navbar-fixed')) {
            $lMain.css('min-height', $hWindow - $hFooter);
        } else {
            $lMain.css('min-height', $hWindow - ($hHeader + $hFooter));
        }
    }
};
