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
    // don't forget to check if mmol or mgdl!!!
    chrome.storage.local.get(['alarmValues'], function(result) {
        chrome.storage.local.get(['snoozeMinutes'], function(alarmSnoozeVal) {
            chrome.storage.local.get(['unitValue'], function(unitResult) {
                var unitType = Object.values(unitResult)[0];
                var alarmValues = Object.values(result)
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
                    document.getElementById("lowAlertValue").value = lowData[0];
                    document.getElementById("highAlertValue").value = highData[0];
                    document.getElementById("urgentHighAlertValue").value = urgentHighData[0];
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
                    //now, set site url in the same function.
                    chrome.storage.local.get(['siteUrl'], function(siteResult) {
                        var siteUrlValue = Object.values(siteResult);
                        if (siteUrlValue != "") {
                            document.getElementById("siteURL").value = siteUrlValue;
                        }
                    });
                }
            });
        });
    });
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

function getURLText(callbackFunction) {
    //sanitize user input so they aren't mean
    var urlString = document.getElementById("siteURL").value;
    //now you have string, check if it's valid.
    //check if it starts with https/http and manipulate accordingly
    if (urlString.startsWith("https://") || urlString.startsWith("http://")) {
        //it starts with https/http, we should be good.
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
    //check if site exists
    var xhr = new XMLHttpRequest();
    xhr.open("GET", urlString, true);
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

function alertFunc(errCd) {
    var message = "whoops you shouldn't be seeing this"
    if (errCd == 1) {
        message = "ERROR: Invalid Number.";
    } else if (errCd = 2) {
        message = "ERROR: Invalid Site URL.";
    }
    alert(message);
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

        var snoozeLength = getValueText("alarmSnoozeLength");

        console.log(uLSaved, lSaved, hSaved, uHSaved);
        //double check that they're all actual 
        if (uLSaved != false && lSaved != false && hSaved != false && uHSaved != false) {
            //now, parse the site url and see if it's a real site.
            getURLText(function(returnVal) {
                if (returnVal != false) {
                    chrome.storage.local.set({
                        siteUrl: returnVal
                    }, function() {
                        console.log("SAVED SITE URL!");
                        chrome.storage.local.set({
                            alarmValues: [
                                [uLSaved, uLCheckbox],
                                [lSaved, lCheckbox],
                                [hSaved, hCheckbox],
                                [uHSaved, uHCheckbox]
                            ]
                        }, function() {
                            console.log('SAVED DATA!');
                            chrome.storage.local.set({
                                snoozeMinutes: snoozeLength
                            }, function() {
                                //once saved, force reload.
                                chrome.extension.getBackgroundPage().webRequest(function() {
                                    //it is done reloading, force reload settings page!
                                    checkBSvariables();
                                });
                            });
                        });
                    });
                } else {
                    alertFunc(2);
                }
            });
        } else {
            //whoopsies, we got some bad data owo
            alertFunc(1);
        }
    });
}



document.getElementsByClassName("submitButton")[0].onclick = function() {
    //when submit button clicked, do some stuff.
    saveFunction();
}
window.onload = function() {
    //just loading! load all the data to display in settings now.
    checkBSvariables();
}