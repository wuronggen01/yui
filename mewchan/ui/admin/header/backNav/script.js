var initPage = function () {

    $("#header").show();
    
};

var didEnterForestage = function () {
    

};

var leaveForestage = function () {

};

var destroyPage = function () {   

};

var onRightButtonClick = function () {
    this.storyboard.onRightButtonClick();
}

var onLeftButtonClick = function () {
    this.storyboard.onLeftButtonClick();
}

// 暴露函数
module.exports = { 
    "initPage": initPage,   
    "didEnterForestage": didEnterForestage,
    "leaveForestage": leaveForestage,
    "destroyPage": destroyPage,
    "onRightButtonClick": onRightButtonClick,
    "onLeftButtonClick": onLeftButtonClick
};
