// Create UUID
//
var createUUID = function () {

    var date = new Date().getTime();

    var factors = ((date * date) >> 8) & 0xffff;
    factors = (factors * factors).toString(16);
    factors = factors + factors + factors + factors;

    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (character) {

        var random = ((parseInt(factors[factors.length - 1], 16) + Math.random() * 16) % 0xF) | 0;

        --factors.length;

        return ((character === "x") ? random : (random & 0x3 | 0x8)).toString(16);

    });

    return uuid;
};

module.exports = {
    "createUUID": createUUID
};