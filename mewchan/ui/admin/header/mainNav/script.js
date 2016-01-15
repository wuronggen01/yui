var initPage = function () {

    $("#header").show();

};

var didEnterForestage = function () {
    $('#page-container').removeClass('login');
};

var leaveForestage = function () {

};

var destroyPage = function () {

};

var toggleSidebar = function(){
    var $lPage              = jQuery('#page-container');
    var $windowW = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if ($windowW > 991) {
        $lPage.toggleClass('sidebar-o');
    } else {
        $lPage.toggleClass('sidebar-o-xs');
    }
};

var doLogout = function(){
    $.jsonrpcLogout(function(error,result){

        window.content.switchTo('login-login-page' ,null ,{
            "action"  : "reset",
            "channel" : "login"
        });

        delete $admin.token;
        delete $admin.sessions;
        delete $admin.account;
    });
};

var dockerToggle = function(){
    var $lPage              = jQuery('#page-container');
    $lPage.toggleClass('side-overlay-o');
}

var profile = function(){

}

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "toggleSidebar" : toggleSidebar,
    "doLogout" : doLogout,
    "profile" : profile,
    "dockerToggle" : dockerToggle
};
