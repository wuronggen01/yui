

# Storyboard 和 TemplateJS 是什么


Storyboard 是一种基于Javascript的实现了Web MVC设计模式的事件驱动类型的轻量级前端框架，即使用了MVC架构模式的思想，将前端页面MVC进行职责解耦，
基于事件驱动指的就是使用事件-回调模型，框架的目的就是帮助我们简化前端开发。

我们设计的理念的是在快速开发的时候，UI和业务逻辑经常需要混合在一起，如果仅仅用声明式的代码，
作为一个Rich HTML5 Client远远是不够的，因此需要准备一个MVC框架进行完整前端业务链。

页面控制器是$.Storyboard类，($.storyboard是生成一个Storyboard对象的快捷写法)，一张页面里面可以包含多个Storyboard，来实现不同部分的控制解耦，
Storyboard使用TemplateJS进行页面渲染器(TemplateJS)进行视图管理；


页面控制器/动作/处理器为Delegate方式
（通过module.exports的方式，实现对某张页面的控制）的实现（可以指定页面的处理脚本）；提供了非常灵活的数据格式化和数据绑定机制（TemplateJS）；
提供了强大的约定大于配置（惯例优先原则）的契约式编程支持。


# Storyboard 能帮我们做什么

1. 让我们能非常简单的设计出干净和优雅的基于页面（模块）的前端代码；
2. 天生与Mewchan前端解决方案集成（如Require管理，事件管理，Async，advancedMerge等）；
3. 提供强大的约定大于配置的契约式编程支持；
4. 能简单的进行Page Level的单元测试；（将来）
5. 支持灵活的URL Hash(URL Query)到页面控制器的映射；（通过插件实现）
6. 非常容易与其他前端技术集成，如Jquery等等，因为模型数据不放在特定的API里，而是放在一个Model里（标准JSON数据因此很容易被其他框架使用）；
7. 非常灵活的数据式化和数据绑定机制，能使用任何对象进行数据绑定，不必实现特定框架的API；
8. 提供一套强大的Template标签库，简化前端页面开发。


# Storyboard架构

Storyboard框架也是一个基于事件驱动的前端框架，并且也使用了前端控制器模式来进行设计，
再根据事件映射规则分发给相应的页面控制器（动作/处理器）进行处理。

# $.Storyboard类

$.Storyboard类是Storyboard生成的基本类，你可以实例化Storyboard对象（通过$.storyboard(String domID,Object ... delegates) ) ，你可以在页面引入的脚本中，
初始化Storyboard对象，下面是生成Storyboard对象的例子：


```javascript
<sb:storyboard id="sample"></sb:storyboard>

<script type="javascript">
$.uiReady(function(){
    window.sample = $.storyboard('#sample');
});
</script>

```

在上述的例子中，一个Storyboard定义的文档节点（通常我们会定义为sb:storyboard标签）会被初始化为Storyboard，并返回该Storyboard对象，同时我们通常会把返回对象赋予一个window上的全局对象，
以方便我们在之后可以很方便获取该Storyboard对象。



每一个Storyboard都有自己独立的上下文，里面的数据和delegates可以通过配置指定去覆盖，让我们再来看一个复杂一点的Storyboard定义：

```
<sb:storyboard id="content" class="storyboard"
    common-script-path="/demo/content/_common/script.js"
    common-style-path="/demo/content/_common/style.css"
    common-data-path="/demo/content/_common/data.json"
    default-data-path="/demo/content/${page.id}/data.json"
    default-template-path="/demo/content/${page.id}/index.xhtml"
    default-script-path="/demo/content/${page.id}/script.js"
    default-style-path="/demo/content/${page.id}/style.css"
    >

    <!-- Demo Page -->
    <sb:page id="channel-mainPage"
        data-header="'hideNav'"
        data-bottom="'hideTab'"
        data-needupdateheader="true"
        data-contentButtonText="'Page title'"
        data-usage="'Demo Page usage'"
        />

</sb:storyboard>
<script type="javascript">
$.uiReady(function(){
    window.content = $.storyboard('#content');
});
</script>
```

在这个例子中，该content的storyboard，我们在定义其文档节点时，通过属性的方式，改变其默认的属性值，下表列出了所有的可以定义的属性类型：


| 属性名                      |  默认键值                                     |  含义  |
| ----                       |   --:                                        | :--------  |
| start-page-id              |   null                                       | 初始化页面ID   |
| fixed-size                 |   if (ui-mobile \|\| ui-tablet)              | 该Storyboard是否撑满整个屏幕 |
| skip-switch-animation      |   true                                       | 当发生多次Switch的时候，是否跳开中间动画 |
| common-style-path          |   null                                       | 公共样式表路径   |
| common-script-path         |   null                                       | 公共脚本路径     |
| common-data-path           |   null                                       | 公共数据模型路径  |
| default-template-path      |   "/${storyboard.id}/${page.id}/index.xhtml" | 页面默认的模板路径    |
| default-style-path         |   "/${storyboard.id}/${page.id}/style.css"   | 页面默认的样式表路径     |
| default-script-path        |   "/${storyboard.id}/${page.id}/script.js"   | 页面默认的脚本路径  |
| default-data-path          |   "/${storyboard.id}/${page.id}/data.json"   | 页面默认的数据模型路径  |
| default-animation-forward  |   forward                                    | 当发生“前进”动作时，默认动画  |
| default-animation-backward |   backward                                   | 当发生“后退”动作时，默认动画  |
| default-animation-reset    |   reset                                      | 当发生“重置”动作时，默认动画  |
| default-animation-duration |   250                                        | 页面切换动画补间时间  |
| plugins                    |   null                                       | 指定加载的Storyboard的插件列表 |
| autoprefix-styles          |   true                                       | 是否自动为样式表加前缀  |
| cache-page                 |   false                                      | 是否通过LocalStorage 缓存页面 |

当你设置完成Storyboard后，Storyboard会按照以下顺序进行初始化：

1. 加载公共样式表、公共脚本、公共数据模型
2. 将目标DOM内部所有的sb:page进行解析，并初始化页面的基本参数
3. 如果缓存页面，则从缓存中取出页面的内容。
4. 执行"init" delegate
5. 执行"willSwitchToStartPage" delegate
6. 如果此时startPageID不为空，则切换到startPageID对应的页面。
7. 执行"didSwitchToStartPage" delegate

## Storyboard API

Storyboard对象实例有一些内置方法可以调用，详细见下表：


| 方法名                      |  参数                                         |  含义  |
| ----                       |   --:                                        | :--------  |
| switchTo                   |   pageID,data,options                        | 切换当前storyboard页面 |
| goBackward                 |   无                                         | 切回当前记录中上一张页面 |
| update                     |   data                                       | 更新当前页面的数据模型 |


# Storyboard页面定义

每一个storyboard包含若干页面，页面必须在sb:storyboard中通过sb:page标签显式申明，

Storyboard提供了每一个页面独立的逻辑空间，页面中通常需要定义４个文件：模板、脚本、数据模型、样式，
来帮助Storyboard定义每一个页面的表现和行为，下面是一个定义页面的例子：

```
<sb:page id="intro"/>
```

在上述例子中，我们申明了一个ID为intro的页面，其模板、脚本、样式、数据模型的加载路径都跟随Storyboard定义的default-template-path等等
，页面也可以自己指定这四个文件加载路径，如下例子：

```
<sb:page id="intro"
    template-path="/intro/index.xhtml"
    />
```

可以看出，Storyboard页面的定义方式和Storyboard类似，即通过属性的方式，改变其默认的属性值，下表列出了所有的可以定义的属性类型：

| 属性名                      |  默认键值                                      |  含义  |
| ----                       |   --:                                         | :--------  |
| template-path              |   storyboard.options.defaultTemplatePath      | 模板路径   |
| style-path                 |   storyboard.options.options.defaultStylePath | 样式表路径 |
| script-path                |   storyboard.options.defaultScriptPath        | 脚本路径 |
| data-path                  |   storyboard.options.defaultDataPath          | 数据模型路径   |
| animation-forward          |   storyboard.options.defaultAnimationForward  | 当以“前进”动作进入该页面时的动画     |
| animation-backward         |   storyboard.options.defaultAnimationBackward | 当以“后退”动作进入该页面时的动画  |
| animation-reset            |   storyboard.options.defaultAnimationReset    | 当以“重置”动作进入该页面时的动画    |
| animation-duration         |   storyboard.options.defaultAnimationDuration | 页面切换动画默认持续时间     |
| data-*                     |                                               | 会将data-${key}进行解析，并将${key}:${value}合并入页面数据模型  |

Storyboard初始化每一张页面的时候会按照以下顺序进行：

1. 加载页面样式表、页面脚本、页面数据模型。
2. 将公共脚本定义的delegate和页面脚本合并成一个对象。
3. 在文档中插入页面样式表。　
4. 调用loadData这个delegate，更新数据模型
5. 切换进入该页面。


## 页面模板

在每一个Storyboard的页面中，必须定义模板路径，该路径所指向的文件（注：该页面模板必须是xhtml）
，指定了Storyboard在加载该页面后，向HTML中插入的DOM的内容，下面是一个模板的例子：

```html
<div class="container">

	<div class="starter-template">
		<h4>这张界面被反复切换了10次</h4>
		<p class="lead">你可以点击下面的按钮，并观察这个数字的变化：<span>${data + 1}</span>：</p>
		<p tmpl:on-click="goBackward()" style="text-align:right;" >点我可以后退！</p>
	</div>
</div>
```

在上述例子中，我们通过${data + 1} 来把页面的数据模型渲染到页面上去
，并且使用了tmpl:on-click="goBackward()" ，将该p标签的click事件，绑定到goBackward这个方法上。

### TemplateJS

页面模板是一种标记性文本语言，其通过 ${} 来渲染数据
，并通过tmpl:on-${eventName}来定义事件绑定，更复杂的事件绑定和模板渲染，以下是一些TemplateJS的用法的例子：

#### 条件判断

```html
<tmpl:if test="fakeData">
<!-- 如果数据模型中fakeData为true，那么显示以下内容-->


</tmpl:if>
```

```html
<!-- 进行switch判断的条件-->
<tmpl:switch condition="list.length" >

    <tmpl:case value="0" >
        <!-- 如果数据模型中list.length为0的话，则执行这段-->

    </tmpl:case>

    <tmpl:case >
        <!-- 如果数据模型中list.length不为0的话，则执行这段-->

    </tmpl:case>

</tmpl:if>
```


```html
<!-- 如果只是条件判断输出的话，有个简单的方法 -->
${if(index % 2 == 0, 'r-foot' ,'l-foot')}
<!-- 使用方法累死excel -->
```


#### 列表循环

```html
<!-- list即为数据模型的对象 -->
<!-- id-getter中是list中对象的唯一性标识符获取方法，需要带{}，这个是为了更新列表时用的 -->
<!-- item-variant-name 规定了循环变量的名称 -->
<!-- index-variant-name 规定了循环序号的变量名称　-->
<template:map list="if(searchList, searchList, [])" id-getter="{item}" item-variant-name="item" index-variant-name="index">

    <!-- 在这里searchSel这个delegate被调用的时候，this.item获取的就是当前循环变量，会动态绑定 -->
    <li class="item-content" tmpl:on-click="searchSel()">
        <div class="item-inner">
            <div class="item-title">${item.name}</div>
        </div>
    </li>
</template:map>
```

#### HTML输出

```html
<!-- 其中news.content是一个html富文本字符串 -->
<tmpl:html>news.content</tmpl:html>
```




## 页面样式表

我们可以单独定义每一个页面的样式表，并且storyboard会在加载页面的同时，加载该样式表，并使该样式表中的样式自动加上前缀，下面是一个样式表的例子：

```css
.container{
    width : 990px;
}

@media screen and (max-width : 600px ) {
    .container {
        width : 550px;
    }
}

.ui-android .storyboard{
    width : 1100px;
}

.storyboard-page{
    width : 950px;
}
```

如果其被定义在#content的storyboard的#intro页面中，那么在HTML中会被插入以下的style sheet：

```css
#content.storyboard #intro.storyboard-page .container{
    width : 990px;
}

@media screen and (max-width : 600px ) {
    #content.storyboard #intro.storyboard-page .container {
        width : 550px;
    }
}

.ui-android #content.storyboard{
    width : 1100px;
}

#content.storyboard #intro.storyboard-page {
    width : 950px;
}
```

以下是storyboard页面样式表定义的要点：

1. 目前storyboard对于图片素材路径的处理，一般建议使用绝对路径。
2. .storyboard 以及.storyboard-page会被特殊处理，可以在这个特殊的css之前加前缀来区分不同设备、环境情况下的storyboard表现。

## 页面数据模型

每一个页面都可以定义一个json文件作为该页面的数据模型的基础
，其在初始化时会和storyboard的公共数据进行混合，并加入一些特殊的字段，最终成为页面渲染中可以引用的数据，下面是一个页面数据模型定义的

```
{
    "data" : 1
}
```

页面数据模型会按照以下步骤生成：

1. storyboard加载页面指定的data-path路径中的json文件，获取的json和storyboard的common-data-path获取的json文件进行混合（页面覆盖全局）
2. 调用页面的"loadData"的delegate进行数据装饰。

在最终初始化结束的页面数据模型中，会有以下特殊字段：

| 属性名                      |  含义  |
| ----                       | :--------  |
| storyboard                 | 页面所属的storyboard对象|
| page                       | 页面对象，下面是页面对象的一些常用属性. |
| page.$                     | 页面的query对象|
| page.id                    | 页面的ID  |

下面是使用页面数据模型时，值得注意的地方：

1. 在调用页面delegate的时候，页面的数据模型会被绑定在this对象上，
2. 关于$ ：由于一个页面会在storyboard中被实例化多次，所以每个页面的DOM空间是独立的
，如果要在页面上面绑定一些方法或者初始化某些插件的话，JQuery选择器需要使用this.page.$来进行选择。

## 定义页面的行为

storyboard通过绑定delegate到页面来实现对页面行为的扩展，并实现事件驱动模式，下面是一个定义页面脚本的例子：

```javascript

module.exports = {
    "clickME" : function(){
        alert("Hello World");
    }
}

```

该delegate方法在页面的模板中以以下方式调用：

```html
<p tmpl:on-click="clickME()" >Hello</p>
```

当用户点击该p标签时，那么storyboard会去调用clickME()方法，以实现页面的交互。

在delegate调用中，this对象始终指向的是当前调用该delegate的页面的数据模型，因此经常会出现一些需要bind(this)的情况，请多注意。

有一些特殊的delegate方法是storyboard在页面加载、载入到不同阶段时自动调用的，下面的列表列出了全部会被调用的delegate和场景：


| delegate                   | 参数            |  含义  |
| ----                       | ----:          |  :--------  |
| willUpdatePage             | 无              | 当页面数据更新之前 |
| didUpdatePage              | 无              | 当页面数据更新之后 |
| loadData                   | data,callback  | 当页面加载数据的时候 |
| initPage                   | 无              | 当页面初始化成功之后 |
| willEnterForestage         | 无              | 当页面将要被切入 |
| willLeaveForestage         | 无              | 当页面将要被切出    |
| didLeaveForestage          | 无              | 当页面被切出之后  |
| didEnterForestage          | 无              | 当页面被切入之后 |
| destroyPage                | 无              | 当该页面对象被销毁　|


其中loadData这个delegate比较特殊，以下将作详细说明：

1. loadData事件发生于页面切换的时候，storyboard会把数据模型放在第一个参数传入，并传入一个callback作为第二个参数用于异步返回。
2. 在callback执行过后，storyboard才会继续接下去的页面切换动作。
3. callback接收两个参数：error,data
4. 如果传入error，那么这次页面切换会终止，所以一般会传入null，data则是经装饰后，需要并入页面数据模型的对象
5. 为了切换页面顺畅，通常会先传入一组假数据，等到服务器数据加载完成后，再通过页面的api来更新数据。

以下两个例子分别展示了两种loadData的方式：

```javascript
module.exports = {
    "loadData" : function(data,callback){
        // 这里我们需要去服务器检查用户是否有进入该页面的权限:
        var mav = this;
        checkPermission(mav.page.id, function(hasPermission){
            if (hasPermission) {
                callback();
            } else {
                callback("No Permission");
            }
        });
    }
}

module.exports = {
    "loadData" : function(data,callback){
        // 这里我们需要去服务器获取页面的数据:
        var mav = this;
        // 这里直接callback，并置位，告诉渲染器这是假数据
        callback(null,{
            fakeData : true
        })
        getNewsListFromServer(mav.newsID,function(error,newsList){
            // 在远程获取数据后，通过update这个API来更新数据。
            if (!error) {
                mav.page.update({
                    fakeData : false,
                    newsList : newsList
                })
            }
        })
    }
}

```

## 页面对象API

页面对象API和Storyboard API一致：

| 方法名                      |  参数                                         |  含义  |
| ----                       |   --:                                        | :--------  |
| switchTo                   |   pageID,data,options                        | 切换当前storyboard页面 |
| goBackward                 |   无                                         | 切回当前记录中上一张页面 |
| update                     |   data                                       | 更新当前页面的数据模型 |

# 页面切换


通过switchTo方法可以让Storyboard切换页面，这个方法的参数一共有三个：pageID,data,options，其中data和options可以省略，三个参数含义如表所列：

| 参数名                            |  说明                            |                                 
| ----                             |   :--                           |   
| pageID                           |  指定需要切换到的页面的ID，当页面操作为backward的时候无效。      |
| data                             |  切换页面的时候，需要传递的数据模型参数对象。     |
| options                          |  指定一系列切换页面时的选项，包括操作、动画、channel等等。 |


最常见操作Storyboard页面切换的例子如下：


```html
<p tmpl:on-click="switchTo('intro')" >Hello</p>
```

switchTo方法第一个参数是页面ID，在上述例子中，点击该p标签，就会将当前storyboard切换到intro这个页面，intro这个页面必须存在（以sb:page的方式显式定义）
，否则会失败，storyboard可以通过以下方式来获取页面切换成功或者失败后的回调：

```javascript
this.storyboard.switchTo('intro').then(function(){
    //切换成功后调用

}).rejected(function(){
    //切换失败后调用
})
```

## 页面切换数据传递

switchTo方法第二个参数是用于页面切换传递参数的，该参数对象会被并入切入页面的数据模型，从而可以显示，如以下例子：

```html
<p tmpl:on-click="switchTo('news',{newsID : 5})" >Hello</p>
```

在上述例子中，点击Hello后，在news那张页面的数据模型中，newsID便为5。

某些情况下，我们需要拿到传入的页面数据，而非整体经处理和合并后的数据模型，这个情况下，可以通过this.settings.data取到通过API传入的参数。

## 页面切换动作

storyboard提供了完整的页面历史管理方式，其通过页面堆栈，来管理所有经storyboard切换操作的页面，并且支持
前进、后退、替换、重置这5种操作，来对页面堆栈进行管理，每种操作对堆栈的变化如下：


| 操作名                            |  说明                            |     应用场景 |
| ----                             |   :--                           |    :-- |                            
| forward（前进）                    |  新建页面并将当前页面压入页面栈      |　正常使用 |
| backward （后退）                  |  将当前页面栈最后一张页面弹出并显示，此时第一个指定页面ID的参数无效。   |　回退页面 |
| replace（替换）                    |  将当前页面栈最后一张页面弹出，但显示的是ID指定的页面。 | 多步骤wizard  |
| reset   （重置）                   |  将当前页面栈所有页面弹出，但显示的是ID指定的页面。 | 开始一轮新的 |

下面的例子介绍了如何指定页面切换动作：

```javascript
this.storyboard.switchTo('intro',null,{
    // 通过action属性来指定操作，默认的action是forward
    "action" : "replace"
});
```

## Channel

一个storyboard可以管理多个页面堆栈，这个经常用于切换底部tab的时候，进行页面堆栈的切换，
如果没有指定channel，则为上一次的操作channel，默认的channelID是main，一个简单的例子介绍channel切换是如何操作的：


```javascript
this.storyboard.switchTo('intro',null,{
    //这里可以指定切到news channel。
    "channel" : "news"
})
```

# Storyboard插件和Storyboard Delegate

需要完善
