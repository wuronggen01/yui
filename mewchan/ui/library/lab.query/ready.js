(function () {

    var actions = [];

    $.reportError = function (error) {
        setTimeout(function () {
            throw error;
        }, 0);
    };

    $.ready = function (action) {
        if (document.readyState === "complete") {
            try {
                action();
            } catch (error) {
                $.reportError(error);
            }
        } else {
            actions.push(action);
        }
    };

    $.upgrade({
        "domain": "ready",
        "test": function (list) {
            return ((list.length === 1) && (typeof list[0] === "function"));
        },
        "initializer": function (list) {
            $.ready(list[0]);
        }
    });

    if (document.readyState !== "complete") {
        window.addEventListener("load", function () {

            var loadActions = actions;
            actions = [];

            loadActions.forEach(function (action) {
                try {
                    action();
                } catch (error) {
                    $.reportError(error);
                }
            });

        });
    }

})();
