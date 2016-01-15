var loadData = function(data, callback)
{

}

var initPage = function () {

};

var didEnterForestage = function () {
    if ($('#page-container').hasClass('sidebar-o') || $('#page-container').hasClass('sidebar-o-xs') ){
        $('#page-container').removeClass('sidebar-o');
        $('#page-container').removeClass('sidebar-o-xs');
    }
};

var leaveForestage = function () {



};

var destroyPage = function () {


};

// 暴露函数
module.exports = {
    "initPage": initPage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "didEnterForestage": didEnterForestage,
    "willUpdate" : didEnterForestage
};
