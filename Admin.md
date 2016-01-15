# Admin Template开发指南

1. 安装php，通过命令行访问oneui文件夹，输入php -S 127.0.0.1:9040的方式可以在本地开启一个web server。
2. 在浏览器上访问127.0.0.1:9040来访问oneui的界面，这个是模板。

# 配置远程服务器

1. 找到/mewchan/ui/script/bridge.js
2. 根据需求配置远程服务器的三个参数：burl, appID, appSecret.

# 应用基本配置

1. 找到/mewchan/ui/admin/app/appinfo.json
2. application基本上是应用相关的显示参数配置，包括名字、版本、默认语言等信息。
3. menus里面配置的是用户在获得何种权限的情况下，显示的菜单的权限。

# 剩下就是各种刷了
