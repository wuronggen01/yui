
## CoolCTO 接口

### 获得应用信息


```javascript

// API
$.uiKitty.mew.rpc("coolcto.appInfo",{
    //这里没神卵用, 不用填
}).replied(function(error,result){console.log(arguments)})


//例子

$.uiKitty.mew.rpc("coolcto.appInfo",{

}).replied(function(error,result){console.log(arguments)})

// ;

// 返回

{
    "application": {
        "id": 1,
        "name": "yuki",
        "valid": true
    },
    "appVersion": "0.1", //服务器版本
    "autoActivateAccount": "NO", //自动激活账号
    "canDulplicateNickname": "NO", //可以重复昵称
    "canSearchUserInfoByOpenID": "NO", //可以通过openID搜索用户
    "emailAsAccount": null,//邮箱作为账号
    "enableRegister": "YES", //允许注册
    "enableResetPassword": "NO", //允许注册
    "enableUserInfoExpose": "YES", //允许获取用户信息
    "id": 1,
    "isOnAppStore": "NO", // 是否在AppStore上架
    "lastUpdate": "2015-11-11T05:33:35+08:00", // 最后更新时间
    "mobilePhoneAsAccount": null, // 手机作为账号
    "pushServiceMewchanURL": null, // push服务地址
    "pushServiceVendor": "MIPUSH" // push服务供应商
}


```
