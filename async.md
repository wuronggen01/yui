[toc]

#async
由于原生js采用回调函数的异步代码形式，在编码时常常会产生回调地狱，使代码阅读和维护起来都十分困难，为了解决这个问题，可以使用`mew_util.async`，async会帮助你创建一个async对象，通过async提供的promise模式，你可以简单地将异步代码通过链式调用变换为类似于同步代码的形式，使代码更具可读性、更便于维护。同时async还提供了一个封装完备的计划任务模块。

使用mew_util.async前需要先执行`var mew_util = require('mew_util')`

async模块的方法返回值分为Job对象与async对象两类，async对象用于异步代码的链式调用，Job对象用于计划任务功能
当一个方法返回值为async对象时，意味着它可以处于链式调用的任何一个环节

这是一段异步代码的示例：
```javascript
handle1(data, function(data){
    handle2(data, function(data) {
        handle3(data, function() {
            console.log("this data has been handled for three times");
        })
    })
})
```

这是该段代码的async版示例：
```javascript
var mew_util = require('mew_util');

mew_util.async(function() {
    handle1(data, this.next);
}).then(function(data) {
    handle2(data, this.next);
}).then(function(data) {
    handle3(data, this.next);
}).then(function(data) {
    console.log("this data has been handled for three times");
})
```

##async()

 - 返回：async对象

返回一个新创建的async对象

##async(action)

 - action 调用链的第一个步骤，不接受任何参数
 - 返回：async对象

执行action并返回一个async对象

##async.pool
async.pool是一个Object对象，它在async内部提供了一个跨步骤的储存控件，所有在同一个链式调用中的async对象都共用同一个pool对象，这意味着你可以在任何一个步骤中储存数据或通过访问`this.pool`获取之前储存的数据。

示例：
```javascript
var mew_util = require('mew_util');

mew_util.async(function() {
    this.pool.key = "this is a data saved in pool";
    this.next();
}).then(function(handledData) {
    handle(handledData, this.next);
}).then(function(handledData) {
    console.log(this.pool.key)
})

//输出内容：
//>this is a data saved in pool
```

##async.then(action([data][,data2][,data3]))

 - action 下一个步骤所需要执行的函数
 - 返回：async对象

将action定义为当前async的下一步骤
示例可参考 async.next

##async.next([data][,data2][,data3]...)

进入async调用链的下一个步骤

 - 需要注意的是，async.next与return不同，调用async.next并不意味着结束当前步骤代码执行，async.next后的代码依旧会被执行
 - async.next可以作为参数传递给一个需要回调的异步函数，这时候下一步骤action所接受的参数即使该异步函数的回调函数所接受的参数

示例：
```javascript
var mew_util = require("mew_util");
var fs = require("fs");

mew_util.async(function() {
    this.next(1, 2, 3);
}).then(function(a, b, c) {
    console.log("this is the second step while a = " + a + ", b = " + b + ", c = " + c);
    fs.readFile('/etc/passwd', this.next);
}).then(function (err, data) {
    if (err) throw err;
    console.log('fs has read your file');
})

//输出内容：
//>this is the second step while a = 1, b = 2, c = 3
//>fs has read your file
```

##async.test(error[, data][, data2][, data3]...)

进入async调用链的下一个步骤，但是如果存在error，则相当于直接调用了this.reject(error)

示例：
```javascript
var mew_util = require("mew_util");
var fs = require("fs");

mew_util.async(function() {
    this.next(1, 2, 3);
}).then(function(a, b, c) {
    console.log("this is the second step while a = " + a + ", b = " + b + ", c = " + c);
    fs.readFile('/etc/passwd', this.test);
}).then(function (data) {
    console.log('fs has read your file');
}).rejected(function(err) {
    console.log('something is wrong');
})

```
##async.reject(error)

向链式中的async.rejected抛出一个错误，抛出错误后，终止调用链中的代码，之后的代码将不会被执行

示例：
```javascript
var mew_util = require("mew_util")

mew_util.async(function() {
    console.log("this is the first step");
    this.next();
}).then(function() {
    console.log("this is the second step");
    this.reject(new Error("Oops, something is wrong, but it's coooooool!"));
}).then(function() {
    console.log("the third step will never be called");
}).rejected(function(err) {
    console.log(err.message);
})

//输出内容：
//>this is the first step
//>this is the second step
//>Oops, something is wrong, but it's coooooool!
```

##async.rejected(handle)
 - 返回： async对象

接收async任一步骤中由async.reject抛出的错误,并交给handle处理，示例可参照 async.reject

 - rejected 可以写在调用链的任何一个步骤后，不会影响正常链式调用的顺序

##async.all(list, action(currentValue[,index][,array]))
 - list String或Array
 - action 在数组每一项上执行的函数，接收三个参数：
    - currentValue 当前项（指遍历时正在被处理那个数组项）的值
    - index 当前项的索引（或下标）
    - array 数组本身
 - 返回： async对象

async.all方法让数组的每一项按顺序执行一次给定的函数
当list为字符串时，async会将async.pool[list]作为list参数

在action内执行this.next()时意味着进入list的下一项或下一个步骤(当list内元素已全部执行完时)
```javascript
var mew_util = require('mew_util');

//下列两种方法输出等同

//方法1
mew_util.async.all([1, 2, 3], function(value, index, array) {
    console.log("the " + index + "element in the " + array + "is " + value);
    this.next();
}).then(function() {
    console.log("async.all ended");
})

//方法2
mew_util.async(function() {
    this.pool.testList = [1, 2, 3];
    this.next();
}).all("testList", function(value, index, array) {
    console.log("the " + index + "element in the " + array + "is " + value);
    this.next();
}).then(function() {
    console.log("async.all ended");
})

//输出内容：
//>the 0 element in the [1,2,3] is 1
//>the 1 element in the [1,2,3] is 2
//>the 2 element in the [1,2,3] is 3
//>async.all ended
```

##async.any(list, action)

 - list String或Array
 - action 在数组每一项上执行的函数，接收三个参数：
    - currentValue 当前项（指遍历时正在被处理那个数组项）的值
    - index 当前项的索引（或下标）
    - array 数组本身
 - 返回： async对象

async.any方法让数组的每一项都按原有顺序执行一次给定的函数
当list为字符串时，async会将async.pool[list]作为参数进行执行。

在action内执行this.next()时意味着进入下一步骤，与async.all不同的是，当你使用async.any时，list内每一项都一定会被执行，只要任何一次调用this.next()就会在所有数组参数执行完毕后进入链式调用的下一步骤，而不是如同aysnc.all一样可以精确控制list内每一项是否被调用

```javascript
var mew_util = require('mew_util');

mew_util.async.any([1,2,3], function(data) {
    console.log(data);
    //this.next();
}).then(function(){
    console.log("this step will never be called");
})

//输出内容：
//>1
//>2
//>3
```

对比async.all:
```javascript
var mew_util = require('mew_util');

mew_util.async.all([1,2,3], function(data) {
    console.log(data);
    //this.next();
}).then(function(){
    console.log("this step will never be called");
})

//输出内容：
//>1
```

##async.race(action[, action2][, action3]...)

 - action 需要执行的函数
 - 返回： async对象

async.race 会按顺序执行参数内的所有函数，这些函数不接受任何参数，在任何一个函数中调用this.next()都会在所有函数运行结束后进入链式调用的下一步骤

```javascript
var mew_util = require("mew_util");

mew_util.async(function() {
    this.next();
}).race(function() {
    console.log("西园寺世界: nice boat");
    this.next();
}, function() {
    console.log("桂言叶: nice boat");
    this.next();
}, function() {
    console.log("伊藤诚 -DEADED-");
    //this.next();
}).then(function() {
    console.log("School Days end");
})

//>西园寺世界: nice boat
//>桂言叶: nice boat
//>伊藤诚 -DEADED-
//>School Days end
```

##async.test(action)

 - action 测试函数,不接受任何参数
 - 返回： async对象[test]

首先需要注意的是，async.test方法返回的async对象与其他async对象并不相同，但是他仍然可以加在调用链的任何一个步骤中，与一般async对象不同的是，`async对象[test]` 内并没有async.next与async.reject方法，取而代之的是async.succeed和async.fail方法。在了解这两个方法前我们首先需要知道的是，在调用链中相邻的多个`async对象[test] `处于同等地位，他们会被依次调用，如果有任何一个action中调用了 this.succeed()，那么会放弃调用其他同等地位的test并进入调用链的下一步骤
调用async.fail()，会进入下一个同等地位的test，直到所有同等地位test都执行完后，进入调用链的下一步骤。

```javascript
var mew_util = require("mew_util");

mew_util.async.test(function() {
    console.log('this is test 1, i failed');
    this.fail();
}).test(function() {
    console.log('this is test 2, i succeed');
    this.succeed();
}).test(function() {
    console.log('this is test 3, i will not be called');
    this.succeed();
}).then(function() {
    console.log('test end');
})

//输出内容：
//>this is test 1, i failed
//>this is test 2, i succeed
//>test end
```

##async.isAsync(obj)
 - obj: Object
 - 返回： Boolean

测试`obj`是否是一个async对象

##async.ensure(obj[, data2][, data3]...)
 - obj: Object
 - 返回： async对象
如果obj是一个async对象则直接返回该对象，否则将构造一个async对象并直接将所有参数传入该async对象的下一个步骤

```javascript
var mew_util = require("mew_util");

mew_util.async.ensure('i am not async')
.then(function(str) {
    console.log(str);
})

mew_util.async.ensure(async(function() {
    console.log('i am async');
    this.next();
})).then(function() {
    console.log('end');
})

//输出内容：
//>i am not async
//>i am async
//>end
```

##async.plan(date, action[, name])
 - date Date类型数据，是需要执行action的时间
 - action 是你想要在date时间执行的函数
 - name 是该Job对象的名称，用于区分不同的Job对象，会储存在job.name中

指定计划任务，在date时间执行action函数


##async.delay([interval, ]action[, name])
- interval 是延迟的毫秒数，默认为0，或是执行的时间（Date类型）
- action 是你想要在延迟后执行的函数
- name 是该Job对象的名称，用于区分不同的Job对象，会储存在job.name中
- 返回： Job对象

延迟time毫秒后，或当时间为time时执行action函数

##async.timer(interval， action[, name])
 - interval 执行action的间隔时间
 - action 是你想要执行的函数
 - name 是该Job对象的名称，用于区分不同的Job对象，会储存在job.name中
 - 返回： Job对象

每间隔interval时间执行一次action函数

##async.schedule(interval， action[, name])
 - interval 是延迟的毫秒数，默认为0
 - action 是你想要在interval时间后执行的函数
 - name 是该Job对象的名称，用于区分不同的Job对象，会储存在job.name中
 - 返回： Job对象

async.schedule在大多数情况下与async.delay效果相同，但是async.schedule会在返回的Job对象中增加schedule方法，schedule方法将会重复延迟interval毫秒-执行action函数的过程，同时，schedule也可作为async.delay的action参数，schedule和delay的组合可以形成一个类似async.timer的效果，通常是用于满足以下需求的：

当我们需要多次执行一个耗时比较长的异步函数且多次执行之间需要延迟时，如果简单地使用timer而间隔时间比较短时可能造成某次异步函数的回调函数尚未执行，下一次异步函数就已经执行造成错误。

通过schedule和delay的组合可以解决这个问题，示例：
```javascript
var mew_util = require('mew_util');

var job = mew_util.async.schedule(1000, function() {
    handle(data, function() { //handle通常是一个需要时间比较长的异步函数，如ajax请求/IO操作等
        console.log('i am callbacked');
        mew_util.async.delay(job.schedule);
    })
})

//输出内容：
//>i am callbacked
[delay 1000ms]
//>i am callbacked
[delay 1000ms]
//>i am callbacked
//...
```

##job.cancel()
取消一个计划任务

示例：
```javascript
var mew_util = require('mew_util');

var job = mew_util.async.delay(1000, function() {
    console.log('the job is canceled, so you will not see this message');
})

job.cancel();
console.log('end');

//输出内容：
//>end
```

##job.suspend()
暂停一个计划任务

示例：
```javascript
var mew_util = require('mew_util');

var job = mew_util.async.timer(1000, function() {
    console.log(new Date());
})

mew_util.async.delay(3000, function() {
    console.log('job suspend');
    job.suspend();
})

mew_util.async.delay(5000, function() {
    console.log('job resume');
    job.resume();
})

//输出内容：
//>Thu Dec 03 2015 19:45:29 GMT+0800
//>Thu Dec 03 2015 19:45:30 GMT+0800
//>job suspend
//>job resume
//>Thu Dec 03 2015 19:45:34 GMT+0800
//>Thu Dec 03 2015 19:45:35 GMT+0800
//>Thu Dec 03 2015 19:45:36 GMT+0800
//...
```

##job.resume()
恢复一个计划任务

示例可参考job.suspend()
