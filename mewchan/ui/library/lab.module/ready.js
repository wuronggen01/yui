$(function () {

	var defaultUIKittyInterface = "/mewchan.ui";

	var uiKittyURL ;

	if ($.uiKittyBURL){
		uiKittyURL = $.uiKittyBURL;
	} else if (window.uiKittyBURL){
		uiKittyURL = window.uiKittyBURL;
	} else {
		uiKittyURL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port  : "") + defaultUIKittyInterface;
	}

	$.uiKitty = new $.HTTPKittyClient(uiKittyURL,{
		"logLevel" : "info"
	});
	$.uiReadyStatus    = "READY";
	$.uiReadyListeners.forEach(function(listener){
		try{
			listener($.uiKitty);
		} catch(ex){
			console.log(ex);
		}
	});

});
