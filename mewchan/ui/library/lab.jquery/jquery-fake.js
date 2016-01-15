if (window && (!window.$))
{
    $ = function (action) {
        action();
    };
}
