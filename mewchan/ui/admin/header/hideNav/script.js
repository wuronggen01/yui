var loadData = function(data, callback)
{

}

var initPage = function () {

};

var didEnterForestage = function () {
    $('#page-container').addClass('login');
    $('#page-container').removeClass('header-navbar-fixed');
};

var leaveForestage = function () {
    $('#page-container').addClass('header-navbar-fixed');
};

var destroyPage = function () {

};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage
};
