var onPressButton

document.getElementById("backButton").onclick = function() {
    console.log("Going Back");
    document.getElementById("backButton").blur();
    window.location.href = "/../popup.html";
    chrome.browserAction.setPopup({
        popup: "/../popup.html"
    });
}

function mgdlToMMOL(mgdlVal) {
    var mmolMult = 18.016;
    var tempMmol = mgdlVal / mmolMult;
    //make sure to round to one decimal place!
    var tempMmolFinal = Math.round(tempMmol * 10) / 10;
    if (tempMmolFinal % 1 == 0) {
        tempMmolFinal = tempMmolFinal + ".0";
    }
    return (tempMmolFinal);
}

function mmoltoMGDL(mmolVal) {
    var mmolMult = 18.016;
    var tempMGDL = mmolVal * mmolMult;
    //make sure to round to one decimal place!
    var tempMgdlFinal = Math.round(tempMGDL);
    return (tempMgdlFinal);
}

function checkBSvariables() {
	if(document){
	    // don't forget to check if mmol or mgdl!!!
	    chrome.storage.local.get(['alarmValues'], function(result) {
	        chrome.storage.local.get(['snoozeMinutes'], function(alarmSnoozeVal) {
	            chrome.storage.local.get(['unitValue'], function(unitResult) {
	            	chrome.storage.local.get(['colors'], function(colorResult) {
		                var unitType = Object.values(unitResult)[0];
		                var alarmValues = Object.values(result);
		                var colorValues = Object.values(colorResult)[0];
		                console.log(alarmValues);
		                if (alarmValues) {
		                    var urgentLowData = alarmValues[0][0];
		                    var lowData = alarmValues[0][1];
		                    var highData = alarmValues[0][2];
		                    var urgentHighData = alarmValues[0][3];
		                    //check if mmol
		                    if (unitType == "mmol") {
		                        urgentLowData[0] = mgdlToMMOL(urgentLowData[0]);
		                        lowData[0] = mgdlToMMOL(lowData[0]);
		                        highData[0] = mgdlToMMOL(highData[0]);
		                        urgentHighData[0] = mgdlToMMOL(urgentHighData[0]);
		                    }
		                    var snoozeData = Number(Object.values(alarmSnoozeVal)[0]);
		                    //check if any are changed.
                            document.getElementById("urgentLowAlertValue").value = urgentLowData[0];
                            document.getElementById("urgentLowAlertValue").placeholder = urgentLowData[0];

                            document.getElementById("lowAlertValue").value = lowData[0];
                            document.getElementById("lowAlertValue").placeholder = lowData[0];

                            document.getElementById("highAlertValue").value = highData[0];
                            document.getElementById("highAlertValue").placeholder = highData[0];

                            document.getElementById("urgentHighAlertValue").value = urgentHighData[0];
                            document.getElementById("urgentHighAlertValue").placeholder = urgentHighData[0];

		                    document.getElementById("urgentLowEnabled").checked = urgentLowData[1];
		                    document.getElementById("lowEnabled").checked = lowData[1];
		                    document.getElementById("highEnabled").checked = highData[1];
		                    document.getElementById("urgentHighEnabled").checked = urgentHighData[1];
		                    console.log("SNOOZE DATA IS " + snoozeData);
		                    if (isNaN(snoozeData)) {
		                        //support for old users who don't have data.
		                        snoozeData = 30;
		                    }
                            document.getElementById("alarmSnoozeLength").value = snoozeData;
                            document.getElementById("alarmSnoozeLength").placeholder = snoozeData;
		                    //set color box value.
		                    if(colorValues == "colors"){
		                    	document.getElementById("themeBox").options[1].selected = 'selected';
		                    }else{
		                    	document.getElementById("themeBox").options[0].selected = 'selected';
		                    }
                            //now, set site url in the same function.
                            chrome.storage.local.get(['siteUrl'], function(siteResult) {
                                var siteUrlValue = Object.values(siteResult);
                                if (siteUrlValue != "") {
                                    document.getElementById("siteURL").value = siteUrlValue;
                                    document.getElementById("siteURL").placeholder = siteUrlValue;
                                }
                            });
                            //now, set site token in the same function.
                            chrome.storage.local.get(['siteToken'], function(siteResult) {
                                var siteTokenValue = Object.values(siteResult);
                                if (siteTokenValue != "") {
                                    document.getElementById("siteToken").value = siteTokenValue;
                                    document.getElementById("siteToken").placeholder = siteTokenValue;
                                }
                            });
		                }
	           		});
	            });
	        });
	    });
	}
}

function getValueText(stringName, unitType) {
    //sanitize user input so they aren't mean
    var getString = document.getElementById(stringName).value;
    if (isNaN(getString)) {
        //NOT A number! return false;
        return false;
    } else {
        //we good boys
        if (Number(getString) <= 0) {
            //below 0.
            return false;
        } else {
            if (unitType) {
                if (unitType == "mmol") {
                    //it's mmol, do conversion stuff!
                    console.log("mmol is " + Number(getString));
                    getString = mmoltoMGDL(Number(getString));
                    console.log("mgdl is " + Number(getString));
                }
            }
            //give plain number.
            return Number(getString);
        }
    }
}
function stringManipBoth(urlString){
	var urlStringBase = urlString;
	var httpsVal;

	if (urlStringBase.endsWith("/")) {
        //we're fine. we have a slash.
    } else {
        //no slash, add one.
        urlStringBase = urlStringBase + "/";
    }

    if (urlStringBase.startsWith("https://") ) {
        //it starts with https
        httpsVal = urlStringBase;
    } else if(urlStringBase.startsWith("http://")){
    	//starts with http.
        httpsVal = "https"+urlStringBase.slice(4);
    } else {
        //no http, add to string.
        httpsVal = "https://" + urlStringBase;
    }
	return [httpsVal,httpsVal];
}

function possibleUrlValues(callbackFunction){
	var urlString = document.getElementById("siteURL").value;
	var stringSplit = urlString.split(".");
	var isHeroku = false;
	for(i=0;i<stringSplit.length;i++){
		if(stringSplit[i] == "herokuapp"){
			//console.log("it's heroku.")
			isHeroku = true;
		}
	}
	if(isHeroku == true){
		//just return
		if(callbackFunction){
			callbackFunction([],true);
			return;
		}
	}else{
		//now that it's NOT heroku, we can manipulate the string and ask for perms.
		var valuesArray = stringManipBoth(urlString);
		if(callbackFunction){
			callbackFunction(valuesArray,false);
		}
	}
}

function getURLText(callbackFunction) {
    //sanitize user input so they aren't mean
    var urlString = document.getElementById("siteURL").value;
    var siteToken = document.getElementById("siteToken").value;
    //now you have string, check if it's valid.
    //check if it starts with https/http and manipulate accordingly
    if (urlString.startsWith("https://")) {
        //it starts with https/http, we should be good.
    } else if(urlString.startsWith("http://")){
        urlString = urlString.replace("http://", "https://") ;
    } else {
        //no http, add to string.
        urlString = "https://" + urlString;
    }
    //make sure it ends in a big ol slash
    if (urlString.endsWith("/")) {
        //we're fine. we have a slash.
    } else {
        //no slash, add one.
        urlString = urlString + "/";
    }
    //v this should not be needed, simply testing for web api response.
    //urlString = urlString+ 'api/v1/entries.json?count=';
    console.log("URL IS " + urlString);
    var urlCallString =  urlString + "?token=" + siteToken;
    console.log("TOKEN IS " + siteToken);
    //check if site exists
    var xhr = new XMLHttpRequest();
    xhr.open("GET", urlCallString, true);
    xhr.onload = function(e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                //console.log(xhr.responseText);
                callbackFunction(urlString);
            } else {
                callbackFunction(false);
            }
        } else {
            callbackFunction(false);
        }
    };
    xhr.onerror = function(e) {
        //console.error(xhr.statusText);
        callbackFunction(false);
    };
    xhr.send(null);

}

function getCheckValue(stringName) {
    var getCheck = document.getElementById(stringName).checked;
    return getCheck;
}
function getListValue(stringName){
	var gottenId = document.getElementById(stringName).value;
	if(Number(gottenId) == 1){
		//colors
		return "colors";
	}else if(Number(gottenId) == 0){
		//default
		return "default"
	}else{return "default";}
}
function getStringValue(stringName){
    var getString = document.getElementById(stringName).value;
    return getString
}
function alertFunc(customMessage) {    
    alert(customMessage);
}

function saveFunction() {
    //first check if mmol
    chrome.storage.local.get(['unitValue'], function(unitResult) {
        var unitType = Object.values(unitResult)[0];
        var uLSaved = getValueText("urgentLowAlertValue", unitType);
        var lSaved = getValueText("lowAlertValue", unitType);
        var hSaved = getValueText("highAlertValue", unitType);
        var uHSaved = getValueText("urgentHighAlertValue", unitType);
        var uLCheckbox = getCheckValue("urgentLowEnabled");
        var lCheckbox = getCheckValue("lowEnabled");
        var hCheckbox = getCheckValue("highEnabled");
        var uHCheckbox = getCheckValue("urgentHighEnabled");
        var themeList = getListValue("themeBox");
        var snoozeLength = getValueText("alarmSnoozeLength");
        var siteToken = getStringValue("siteToken");
        console.log(themeList);
        console.log(uLSaved, lSaved, hSaved, uHSaved);
        //double check that they're all actual 
        if (uLSaved != false && lSaved != false && hSaved != false && uHSaved != false) {
        	if(uLSaved < lSaved){}else{alertFunc("ERROR: Urgent low alert value must be below the low alert value."); return;}
        	if(uHSaved > hSaved){}else{alertFunc("ERROR: Urgent high alert value must be above the high alert value."); return;}
        	if(lSaved < hSaved){}else{alertFunc("ERROR: Low alert value must be below the high alert value."); return;}
        	//make sure low values and high values are correct.
            //now, parse the site url and see if it's a real site.
            getURLText(function(returnVal) {
                if (returnVal != false) {
                    chrome.storage.local.set({
                        siteUrl: returnVal
                    }, function () {
                        console.log("SAVED SITE URL!");
                        console.log(returnVal);
                        chrome.storage.local.set({
                            alarmValues: [
                                [uLSaved, uLCheckbox],
                                [lSaved, lCheckbox],
                                [hSaved, hCheckbox],
                                [uHSaved, uHCheckbox]
                            ]
                        }, function () {
                            console.log('SAVED DATA!');
                            chrome.storage.local.set({
                                snoozeMinutes: snoozeLength
                            }, function () {
                                chrome.storage.local.set({colors: themeList}, function () {
                                    chrome.storage.local.set({
                                        siteToken: siteToken
                                    }, function () {
                                        //once saved, force reload.
                                        chrome.extension.getBackgroundPage().webRequest(function () {
                                            //it is done reloading, force reload settings page!
                                            checkBSvariables();
                                        });
                                    });
                                });
                            });
                        });
                    });
                }else {
                    alertFunc("ERROR: Invalid Site URL.");
                }
            });
        } else {
            //whoopsies, we got some bad data owo
            alertFunc("ERROR: Invalid Number.");
        }
    });
}



document.getElementsByClassName("submitButton")[0].onclick = function() {
    //when submit button clicked, do some stuff.
    //
	possibleUrlValues(function(urlArray,isHeroku){
		//console.log(isHeroku);
		//console.log(urlArray);
		if(isHeroku == true){
			saveFunction();
		}else{
			console.log("NOT HEROKU");
			//request permissions
			chrome.permissions.request({
		      origins: [urlArray[1]]
		    }, function(granted) {
		      // The callback argument will be true if the user granted the permissions.
		      if (granted) {
		      	//we good. save NOW!
		      	saveFunction();
		      } else {
		      	//they denied it. send alert.
		      	alertFunc("ERROR: Permissions must be manually granted on non-heroku sites.");
		      }
		    });
		}
	});
}
window.onload = function() {
    //just loading! load all the data to display in settings now.
    checkBSvariables();
}