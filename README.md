# How TO Hack storyboard

## Start Of Everything

1. 找到mewchan/ui文件夹, 把demo文件夹名字改成项目名称。

2. 把项目内所有的demo字符串替换成项目名称。

3. 找到mewchan/ui/script/demo.js 以及 mewchan/ui/style/demo.css 把它改成${项目名称}.js 以及 ${项目名称}.css。


## 顶部导航栏和底部导航栏

### 顶部导航栏

高度修改：最简单暴力无脑有效的方法是，把mewchan/ui/${项目名称}/header下所有的64换成你想要换的高度，即可。

内容修改：修改mewchan/ui/${项目名称}/header/mainNav下面的内容。

### 底部导航栏

内容修改：修改mewchan/ui/${项目名称}/bottom/mainTab下面的内容，因为每个项目都不一样，就直接修改了。

### 不同content切换导航栏的方法

在每个content的page的定义中（在#content中找sb:page），
找到data-header和data-bottom，修改这后面的值（记得要加单引号），来指定其值（对应不同的导航栏的page的ID）。

``` javascript
<sb:page id="channel-mainPage"
    data-header="'hideNav'"
    data-bottom="'hideTab'"
    data-needupdateheader="true"
    data-contentButtonText="'Page title'"
    data-usage="'Demo Page usage'"
    />
```

### 我不要导航栏怎么办

把data-header设置成'hideNav',把data-bottom设置成'hideTab'


### storyboard页面切换注意事项

如果使用了导航栏，那么跳转的时候，
使用storyboard.switchTo中的animation修改成"navForward" 或者 "navFading"，
这样子就可以正常切换带有navigation b ar的storyboard-page了。


# Go ahead And Hack
