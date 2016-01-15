
## Activity 接口

### 存数据


```javascript

// API
$.uiKitty.mew.rpc("activity.data.store",{

    //这里填写需要存储的数据

}).replied(function(error,result){console.log(arguments)})


//例子

$.uiKitty.mew.rpc("activity.data.store",{
    "login" : {
        "status" : {
            "what" : "the fuck"
        }
    }
}).replied(function(error,result){console.log(arguments)})

// ;

// 返回

{
    //刚刚存储进去的数据
}

```

### 取数据

```javascript

// API
$.uiKitty.mew.rpc("activity.data.load","这里填写你需要取的数据的路径").replied(function(error,result){console.log(arguments)});


//例子

$.uiKitty.mew.rpc("activity.data.load",["login.status","login.new"]).replied(function(error,result){console.log(arguments)});

// 返回

{
    "login.status" : {
        "what" : "the fuck"
    },
    "login.new" : null
}


```
