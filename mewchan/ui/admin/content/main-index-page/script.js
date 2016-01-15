
var initPage = function () {
};

var destroyPage = function () {

};

var leaveForestage = function () {

};

var loadData = function(data,callback){
    if ($admin.token){
        callback(null,{
            dashboardTime : new Date()
        });
    } else {
        callback("login error");
        window.content.switchTo('login-login-page',null,{
            "action"  : "reset",
            "channel" : "login"
        });
    }
};

var isTimePeriodHour = function(start,end){
    var hour = this.time ? this.time : new Date().getHours();
    if (end < start ){
        end = end + 24;
    }
    return hour >= start && hour < end;
}

// 暴露函数
module.exports = {
    "initPage": initPage,
    "loadData": loadData,
    "destroyPage": destroyPage,
    "isTimePeriodHour" : isTimePeriodHour,
    "didEnterForestage" : function(){

    },

    "didLeaveForestage" : function(){

    }
};
