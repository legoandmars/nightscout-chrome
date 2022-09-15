var secondVal = 10;
var addToUrl = '/api/v1/entries.json?count=';
var urgentLowValue;
var lowValue;
var highValue;
var urgentHighValue;
var refreshGraphFunc;

//default variables
var defaultSite = '';
var defaultUrgentLowValue = 55;
var defaultLowValue = 80;
var defaultHighValue = 180;
var defaultUrgentHighValue = 260;
var snoozeMinutesDefault = 30;
//array of ALL storage --important
var storageArray = [{
        siteUrl: defaultSite
    }, {
        bsTable: "dne"
    }, {
        dataAmount: 7
    }, {
        alarmValues: [
            [defaultUrgentLowValue, true],
            [defaultLowValue, true],
            [defaultHighValue, true],
            [defaultUrgentHighValue, true]
        ]
    },
    {
        lastAlarmName: "dne"
    }, {
        snoozeUnix: "dne"
    }, {
        snoozeMinutes: snoozeMinutesDefault
    }, {
        unitValue: "mgdl"
    }, {
        tempBsTable: "dne"
    }, {
        gottenProfileAlarms: false
    }, {
        lastProfileUrl: "" 
    }, {
        colors:false
    },{
        gottenColors:false
    }
];
var storageInc = 0; //used for looping through storage

function saveStorageData(callbackFunction){
  chrome.storage.local.get(storageArray[storageInc], function(data){
    chrome.storage.local.getBytesInUse(Object.keys(data), function(bytes){
      //console.log(bytes+"BYTES")
      if(bytes==0){
        //does not exist. make sure to set default.
        chrome.storage.local.set(storageArray[storageInc], function(){
          console.log("SET "+Object.keys(storageArray[storageInc])+" TO "+Object.values(storageArray[storageInc]));
          storageInc++;
          if(storageInc < storageArray.length){
            //do it again.
            saveStorageData(callbackFunction)
          }else{
            if(callbackFunction){
              //go back to loaddefaultvariables function.
              callbackFunction();
            }
          }
        });
      }else{
        //add 1 anyways.. we still need to go up
        storageInc++; 
        if(storageInc < storageArray.length){
          //do it again.
          saveStorageData(callbackFunction)
        }else{
          if(callbackFunction){
            //go back to loaddefaultvariables function.
            callbackFunction();
          }
        }
      }
    });
  });
}

function loadDefaultVariables(){
  saveStorageData(function(){
    console.log("Extension done with initial load!");
    webRequest();
  })
}

chrome.runtime.onInstalled.addListener(function() {
    //note: please clean this code up >_>
    loadDefaultVariables();
});
//get data from nightscout!
//https://test.herokuapp.com/api/v1/entries <- link stuff

function forceRefreshGraph() {
    if (refreshGraphFunc) {
        refreshGraphFunc();
    }
}

function setGraphFunction(callbackFunction) {
    refreshGraphFunc = callbackFunction;
}

function notifClear(id) {
    setTimeout(function() {
        chrome.notifications.clear(id, function() {
            //console.log("wow it cleared!");
        })
    }, 10000);
}

function clearById(id) {
    chrome.notifications.clear(id, function() {
        console.log("cleared succesfully!");
    })
}

function unitToProperString(unitType) {
    //yes i made a function for one if/else statement, deal with it
    if (unitType == "mgdl") {
        return "mg/dL";
    } else if (unitType == "mmol") {
        return "mmol/L";
    }
}

function saveNotifID(notifID) {
    chrome.storage.local.set({
        lastAlarmName: notifID
    }, function() {
        console.log("Notification Sent!");
        //notification has been sent. do nothing.
    });
}
//notification functions
function notificationFunction(bgValue, dateValue, valueText, unitType) {
    var tempColor;
    if (valueText != "Low" && valueText != "High") return;
    //chrome.browserAction.setBadgeBackgroundColor({color:tempColor});
    chrome.storage.local.get(['lastAlarmName'], function(lastAlarmRaw) {
        var lastAlarmString = Object.values(lastAlarmRaw)[0];
        //audioNotification()
        //now, see if it's snoozed.
        chrome.storage.local.get(['snoozeUnix'], function(snoozeUnixRaw) {
            var snoozeUnixString = Object.values(snoozeUnixRaw)[0];
            //now we can see if the snooze has been within x (default 30?? minutes)
            chrome.storage.local.get(['snoozeMinutes'], function(snoozeMinutesRaw) {
                var snoozeMinutesVal = Number(Object.values(snoozeMinutesRaw)[0]);
                if (snoozeMinutesVal == 0) {
                    //just for old users who don't have old variables.
                    snoozeMinutesVal = 30;
                }
                var snoozeVal;
                if (snoozeUnixString != "dne") {
                    var snoozeUnixTemp = Math.round((new Date()).getTime() / 1000);
                    //compare
                    var snoozeDiff = -(Number(snoozeUnixString) - Number(snoozeUnixTemp)); //yes i double negated this. got a problem with it?
                    console.log("SNOOZED FOR " + (snoozeMinutesVal - (snoozeDiff / 60)).toString() + " MORE MINUTES!");
                    if (snoozeDiff > snoozeMinutesVal * 60) {
                        //reset difference
                        snoozeVal = false;
                        stopSnooze();
                    }
                    //console.log("SNOOZE DIFFERENCE IS "+snoozeDiff);
                } else {
                    //no alarm - set to dne
                    snoozeVal = false;
                }
                if (snoozeVal == false) {
                    if (dateValue.toString() != lastAlarmString) {
                        //now double check that it hasn't been snoozed recently
                        //console.log(dateValue.toString())
                        //console.log(lastAlarmString);
                        //indeed a new data point!
                        var urgentLowValueTemp = urgentLowValue[0];
                        var urgentHighValueTemp = urgentHighValue[0];
                        //var unitAddition = unitToProperString(unitType); this is for adding mg/dL or mmol/L properly
                        if (unitType == "mmol") {
                            urgentLowValueTemp = mgdlToMMOL(urgentLowValueTemp);
                            urgentHighValueTemp = mgdlToMMOL(urgentHighValueTemp);
                            //it's mmol, so we have to convert the lowvalues. 
                        } //else is mgdl
                        //do mmol conversion stuff...
                        if (valueText == "High") {
                            if (highValue[1] == true) {
                                //is high and notifs are enabled.
                                if (Number(bgValue) >= urgentHighValueTemp) {
                                    //is an urgent high. adjust accordingly, check notification permissions.
                                    if (urgentHighValue[1] == false) {
                                        valueText = ""
                                    } else {
                                        valueText = "Urgent High"
                                    }
                                }
                            } else {
                                valueText = ""
                            }
                        } else if (valueText == "Low") {
                            if (lowValue[1] == true) {
                                //is low and notifs are enabled.
                                if (Number(bgValue) <= urgentLowValueTemp) {
                                    //is an urgent low. adjust accordingly, check notification permissions.
                                    if (urgentLowValue[1] == false) {
                                        valueText = ""
                                    } else {
                                        valueText = "Urgent Low"
                                    }
                                }
                            } else {
                                valueText = ""
                            }
                        }
                        var notifID = 'nightscout-alert';
                        //double check that notifs were indeed enabled.
                        if (valueText == "") {
                            //notifications are disabled. whoops.
                            clearNotifications(notifID);
                        } else {
                            chrome.notifications.create(
                                notifID, {
                                    type: 'basic',
                                    iconUrl: 'images/nightscout128.png',
                                    title: valueText + " Glucose Alert",
                                    message: "Your blood sugar is " + bgValue,
                                    priority: 1,
                                    buttons: [{
                                            title: "Dismiss",
                                        },
                                        {
                                            title: "Snooze (" + snoozeMinutesVal + "m)"
                                        }
                                    ]
                                },
                                function() {
                                    setTimeout(clearNotifications, 10000);
                                });
                        }
                    } else {
                        //don't clear - we still want the notification visible from last time!
                        console.log("sorry man, notification hasn't changed...")
                    }
                }
            });
        });
    });
}

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
    if (btnIdx == 0) {
        clearNotifications();
        //alert("YEET");
    } else if (btnIdx == 1) {
        var snoozeUnixTemp = Math.round((new Date()).getTime() / 1000);
        chrome.storage.local.set({
            snoozeUnix: snoozeUnixTemp
        }, function() {
            console.log("SNOOZED! SEND SNOOZE NOTIF~!");
        });
        //alert("SNOOZE");
        //make a snooze thing!
    }
});

function stopSnooze() {
    chrome.storage.local.set({
        snoozeUnix: "dne"
    }, function() {
        console.log("ALARM DATA HAS BEEN RESET!");
    });
}

function checkBSvariables(callbackFunc) {
    chrome.storage.local.get(['alarmValues'], function(result) {
        var alarmValues = Object.values(result)
        //console.log(alarmValues);
        //console.log("ARE ALARM VALUES");
        if (alarmValues) {
            var urgentLowData = alarmValues[0][0];
            var lowData = alarmValues[0][1];
            var highData = alarmValues[0][2];
            var urgentHighData = alarmValues[0][3];
            //check if any are changed.
            if (urgentLowData != urgentLowValue || lowData != lowValue || highData != highValue || urgentHighData != urgentHighValue) {
                urgentLowValue = urgentLowData;
                lowValue = lowData;
                highValue = highData;
                urgentHighValue = urgentHighData;
                //console.log("Alarm data has been changed!");
                //getData();
                //saveFunc("pushNotifications");
                if (callbackFunc) {
                    callbackFunc();
                }
            }
        }
    });
}


function clearNotifications(lastAlarmRaw) {
    chrome.notifications.clear("nightscout-alert", function() {
        //console.log("cleared notification, boss");
        //now, set last to nothing.
        //chrome.storage.local.set({lastAlarmName: "dne"}, function() {
        //  console.log('Last Alarm Variable created!');
        //});
    });
}

function bsAlerts(bloodSugarVal, dateValue, unitType) {
    var lowValueTemp = lowValue[0];
    var highValueTemp = highValue[0];
    if (unitType == "mmol") {
        lowValueTemp = mgdlToMMOL(lowValueTemp);
        highValueTemp = mgdlToMMOL(highValueTemp);
        //it's mmol, so we have to convert the lowvalues. 
    }
    if (Number(bloodSugarVal) <= Number(lowValueTemp)) {
        notificationFunction(bloodSugarVal, dateValue, "Low", unitType);
    } else if (Number(bloodSugarVal) >= Number(highValueTemp)) {
        notificationFunction(bloodSugarVal, dateValue, "High", unitType);
    } else {
        //not high, not low. let's clear notifications anyways.
        chrome.storage.local.get(['lastAlarmName'], function(lastAlarmRaw) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: "gray"
            });
            var lastAlarmString = Object.values(lastAlarmRaw)[0];
            if (lastAlarmString != dateValue) {
                //if they're different, clear notifications! 
                clearNotifications(lastAlarmString);
            }
        });
    }
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

function arrowValues(direction) {
    var exportString = "";
    switch (direction) {
        case "NONE":
            exportString = ""
            break;
        case "DOUBLEUP":
            exportString = "↑"
            break;
        case "SINGLEUP":
            exportString = "↑"
            break;
        case "FORTYFIVEUP":
            exportString = "↗"
            break;
        case "FLAT":
            exportString = "→"
            break;
        case "FORTYFIVEDOWN":
            exportString = "↘"
            break;
        case "SINGLEDOWN":
            exportString = "↓"
            break;
        case "DOUBLEDOWN":
            exportString = "↓"
            break;
        case "NOT COMPUTABLE":
            exportString = ""
            break;
        case "RATE OUT OF RANGE":
            exportString = ""
            break;
    }
    return exportString;
}

function bsColors(bgValue, unitType, fullData) {
    var lowValueTemp = lowValue[0];
    var highValueTemp = highValue[0];
    var directionValue = fullData["direction"];
    var deltaValue = fullData["delta"];
    if (unitType == "mmol") {
        lowValueTemp = mgdlToMMOL(lowValueTemp);
        highValueTemp = mgdlToMMOL(highValueTemp);
        //console.log("COLORS YEET");
        //it's mmol, so we have to convert the lowvalues. 
    }
    var newNum = "NaN";
    if(deltaValue){
        newNum = Math.round(Number(deltaValue));
        if (newNum >= 0) {
            newNum = "+" + newNum;
        }
    }

    //get arrow value, too.
    var customColor = "gray";
    if (Number(bgValue) <= lowValueTemp) {
        customColor = "red";
    } else if (Number(bgValue) >= highValueTemp) {
        customColor = "#c6a400";
    }
    chrome.browserAction.setBadgeBackgroundColor({
        color: customColor
    });
    var bgValueString = bgValue;
    if(directionValue){
        //double check it's not mmol above ten.
        if(unitType == "mmol"){
            if(Number(bgValue) < 10){
                bgValueString = bgValue.toString() + arrowValues(directionValue.toUpperCase());
            }else{
            //no luck. mmol above ten is ba d.
            }
        }else{
            bgValueString = bgValue.toString() + arrowValues(directionValue.toUpperCase());
        }
    }
    chrome.browserAction.setBadgeText({
        text: bgValueString.toString()
    });
    //chrome.browserAction.setBadgeBackgroundColor({color:"gray"})
    chrome.browserAction.setTitle({
        title: "Blood Glucose: " + bgValue.toString()+unitToProperString(unitType)+"\n"+"Delta: "+newNum+" ("+arrowValues(directionValue.toUpperCase())+")"
    });
}

function saveFunc(responseData, callbackFunc) {
    //console.log("SAVE FUNC ENABLED!");
    //before saving, check BG vals.
    //var convertedString = JSON.stringify(responseData);
    chrome.storage.local.get(['tempBsTable'], function(result) {
        //data needs to be updated!
        //console.log("Updating data!");
        /* if(responseData.toString() == "pushNotifications"){
           //only push notifications!
           var tempTest = Object.values(result);
           var tempTabl = returnCurrentBG(tempTest,true,true);
           tempBG = tempTabl[0];
           tempDate = tempTabl[1];
           if(tempBG != false){
             //bsAlerts(tempBG,tempDate);
           } else if here */
        //but first, double check unit type.
        chrome.storage.local.get(['unitValue'], function(unitResult) {
            var unitType = Object.values(unitResult)[0];
            if (Object.values(result) == responseData) {
                //it's the same.
                var tempTest = Object.values(result);
                var tempTabl = returnCurrentBG(tempTest, true, true, unitType);
                tempBG = tempTabl[0];
                var currentPointData = tempTabl[2];
                if (tempBG != false) {
                    checkBSvariables(function() {
                        //bsAlerts(tempBG,tempDate,true);
                        //change bg vals.
                        console.log("Current blood sugar is: " + tempBG);
                        bsColors(tempBG, unitType,currentPointData);
                    });
                }
                //console.log("No change in data.")
                //still, double check!
            } else {
                console.log("Saving Data!");
                chrome.storage.local.set({
                    tempBsTable: responseData
                }, function() {
                    //web request AGAIN, this time with the full dataTable.
                    webRequest(function(dataReturned){
                      chrome.storage.local.set({bsTable: dataReturned},function(){
                        //parse
                        //now that it's been saved, double check that you callback.
                        if (callbackFunc) {
                            callbackFunc()
                        }
                        //run more after-save code here.
                        forceRefreshGraph();
                        //console.log('Value succesfully set.');
                        //do low, high alerts too!
                        var currentDATA = returnCurrentBG(responseData, false, true, unitType);
                        currentBG = currentDATA[0];
                        //mmol and mgdl have a few problems - for now, notification data is stored in mgdl, so make sure to convert them to mmol when you get into the function!
                        currentDate = currentDATA[1];
                        var currentPointData = currentDATA[2];
                        if (currentBG != false) {
                            //currentBG = 70;
                            //console.log(currentBG);
                            //set icon
                            //note: add custom alert vars.
                            //not only does this control low/high alerts, but also the colors of the program.
                            //get alarmValues
                            checkBSvariables(function() {
                                //now that variables are set, do alerts and colors.
                                bsAlerts(currentBG, currentDate, unitType);
                                bsColors(currentBG, unitType,currentPointData);
                            });
                        }
                      });
                    },true);
                });
                //console.log(result);
            }
        });
    });
}

function returnCurrentBG(data, notif, returnDate, unitType) {
    var parsed;
    if (!unitType) {
        //no unit type, assume mgdl!
        unitType = "mgdl";
    }

    if (notif == true) {
        //actually fixing errors: small brain
        //just using a try catch statement: galaxy brain
        try {
            parsed = JSON.parse(data[0]);
        } catch (err) {
            console.log("aaaand the json parse crashed!");
            return [false,false];
        }
    } else {
        parsed = JSON.parse(data);
    }
    for (i = 0; i < parsed.length; i++) {
        var firstValue = false;
        if (i == 0) {
            firstValue = true;
        }
        var indivString = parsed[i];
        var sgv = indivString["sgv"];
        var dateStr = indivString["date"];
        if (firstValue == true) {
            //first bg value, meaning we need to C O N V E R T!
            if (unitType == "mmol") {
                //mmol, convert!
                sgv = mgdlToMMOL(sgv);
                //console.log("MMOL VERSION IS " + sgv);
            } else if (unitType == "mgdl") {
                //mgdl, make sure to change to number
                sgv = Number(sgv);
            }
            if (returnDate == false) {
                return [sgv, indivString];
            } else if (returnDate == true) {
                return [sgv, Number(dateStr), indivString];
            } else {
                return [sgv, indivString];
            }
        }
    }
}

function parseData(response, callbackFunc) {
    if (callbackFunc) {
        saveFunc(response, callbackFunc);
    } else {
        saveFunc(response);
    }
}

function manipulateURL(urlObj,count) {
    var siteUrlBase = urlObj['siteUrl'];
    var siteTokenBase = urlObj['siteToken'];
    //check if it starts with https/http and manipulate accordingly
    if (siteUrlBase.startsWith("https://")) {
        //it starts with https/http, we should be good.
    } else if (siteUrlBase.startsWith("http://")){
        siteUrlBase = siteUrlBase.replace("http://", "https://") 
        // force https 
    } else {
        //no http, add to string.
        siteUrlBase = "https://" + siteUrlBase;
    }
    //make sure it ends in a big ol slash
    if (siteUrlBase.endsWith("/")) {
        //we're fine. we have a slash.
    } else {
        //no slash, add one.
        siteUrlBase = siteUrlBase + "/";
    }
    siteUrlBase = siteUrlBase + 'api/v1/entries.json?count='+count;
    siteUrlBase = siteUrlBase + '&token=' + siteTokenBase
    console.log("URL IS "+siteUrlBase);
    console.log("TOKEN IS " + siteTokenBase)
    //return url with correct values.
    return siteUrlBase;
}

function manipulateProfileURL(urlObj) {
    var siteUrlBase = urlObj['siteUrl'];
    var siteTokenBase = urlObj['siteToken'];
    //console.log(siteUrlBase);
    //check if it starts with https/http and manipulate accordingly
    if (siteUrlBase.startsWith("https://")) {
        //it starts with https/http, we should be good.
    } else if (siteUrlBase.startsWith("http://")){
        siteUrlBase = siteUrlBase.replace("http://", "https://") 
        // force https 
    } else {
        //no http, add to string.
        siteUrlBase = "https://" + siteUrlBase;
    }
    //make sure it ends in a big ol slash
    if (siteUrlBase.endsWith("/")) {
        //we're fine. we have a slash.
    } else {
        //no slash, add one.
        siteUrlBase = siteUrlBase + "/";
    }
    siteUrlBase = siteUrlBase + 'api/v1/status.json';
    siteUrlBase = siteUrlBase + '?token=' + siteTokenBase
    //console.log("URL IS "+siteUrlBase); 
    //return url with correct values.
    return siteUrlBase;
}

function webError() {
    console.log("ERROR! SITE DOES NOT EXIST!");
}

function alarmProfileFunction2(alarmTempArray,callbackFunc){
  chrome.storage.local.get(['gottenProfileAlarms'], function(gottenResult){
  var gottenValue = Object.values(gottenResult)[0];
    if(gottenValue == false){
      console.log("Pulling alarm data from the Nightscout site!");
      chrome.storage.local.set({alarmValues: alarmTempArray}, function(){
        //set old profile url too!
        console.log("GETTING ALARM VALUES FROM NIGHTSCOUT!");
        chrome.storage.local.set({gottenProfileAlarms: true}, function(){
          if (callbackFunc) {
            callbackFunc();
          }
        });
      });
    }else{
      //console.log("SORRY, WE'VE GOTTEN IT.");
      if (callbackFunc) {
        callbackFunc();
      }
    }
  });
}

function alarmProfileFunction(alarmTempArray,callbackFunc){
  //get to see if changed from default site stuff yet;
  //NOTE: IF PROFILE URL SAVED VALUE IS DIFFERENT, RESET THE VALUESS OF gottenProfileAlarms!
  // this will ALSO handle profile url stuff.
  chrome.storage.local.get(['lastProfileUrl'], function(lastProfileURLResult){
    var profileUrlValue = Object.values(lastProfileURLResult)[0];
    chrome.storage.local.get(['siteUrl'], function(siteUrlResult){
      var siteUrlValue = Object.values(siteUrlResult)[0];
      if(profileUrlValue == siteUrlValue){
        alarmProfileFunction2(alarmTempArray,callbackFunc);
        //nothing has changed. the url is still the same.
      }else{
        //it has changed. set the new profile url, and set gottenProfileAlarms to false.
        chrome.storage.local.set({gottenProfileAlarms: false}, function(){
            chrome.storage.local.set({gottenColors: false}, function(){
              //it has been set to false.
              chrome.storage.local.set({lastProfileUrl: siteUrlValue}, function(){
                //new profile url set.
                alarmProfileFunction2(alarmTempArray,callbackFunc);
              });
            });
        });
      }
    });
  });
}

function colorProfileFunction(colorValue,callbackFunc){
   //!!!   
    chrome.storage.local.get(['gottenColors'], function(gottenResult){
      var gottenValue = Object.values(gottenResult)[0];
        if(gottenValue == false){
          console.log("Pulling color data from the Nightscout site!");
          chrome.storage.local.set({colors: colorValue}, function(){
            //set old profile stuff too!
            chrome.storage.local.set({gottenColors: true}, function(){
              if (callbackFunc) {
                callbackFunc();
              }
            });
          });
        }else{
          //console.log("SORRY, WE'VE GOTTEN IT.");
          if (callbackFunc) {
            callbackFunc();
          }
        }
    });
}


function profileWebRequest(profileURL, callbackFunctionWeb) {
    var defaultUnit = "mgdl";
    var unit;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", profileURL, true);
    xhr.onload = function(e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                //we got the data, boys!
                var webData = JSON.parse(xhr.responseText);
                //console.log("WE GOT SOME PROFILE DATA:");
                var dataLength = Object.values(webData).length;
                var settingsArray = webData["settings"];
                var settingsArrayLength = Object.values(settingsArray).length;
                //certain values we need
                var thresholds = settingsArray["thresholds"];
                var unitValueSetting = settingsArray["units"];
                var userTheme = settingsArray["theme"];
                var urgLowArray = [thresholds["bgLow"],settingsArray["alarmUrgentLow"]];
                var lowArray = [thresholds["bgTargetBottom"],settingsArray["alarmLow"]];
                var urgHighArray = [thresholds["bgHigh"],settingsArray["alarmUrgentHigh"]];
                var highArray = [thresholds["bgTargetTop"],settingsArray["alarmHigh"]];
                //var urgLowArray = [thresholds["bgLow"],true];
                //var lowArray = [thresholds["bgTargetBottom"],true];
                //var urgHighArray = [thresholds["bgHigh"],true];
                //var highArray = [thresholds["bgTargetTop"],true];
                //these are ONLY when you want the alarms to be true by default.
                var alarmArray = [urgLowArray,lowArray,highArray,urgHighArray];
                //console.log(alarmArray);
                //we got the default profile, now parse.
                if (unitValueSetting.toLowerCase() == "md/dl") {
                  //nightscout devs... why is it saved as md/dl... EXPLAIN THIS....
                  unitValueSetting = "mgdl";
                }else if (unitValueSetting == "mmol"){
                  //nothing
                }else{
                  unitValueSetting = "mgdl";
                }
                /*alarmValues: [
                [defaultUrgentLowValue, true],
                [defaultLowValue, true],
                [defaultHighValue, true],
                [defaultUrgentHighValue, true]
                ]*/
                //unit is stored in "mgdl" or "mmol". save this and return.
                //check if unit has changed.
                chrome.storage.local.get(['unitValue'], function(unitResult) {
                  var unitType = Object.values(unitResult)[0];
                  if(unitType==unitValueSetting){
                    //it's the same.
                    alarmProfileFunction(alarmArray,callbackFunctionWeb)
                  }else{
                    //change it.
                    chrome.storage.local.set({unitValue: unitValueSetting}, function(){
                      //set unit. do callback now yay!
                      console.log("SAVED UNIT AS " + unitValueSetting);
                      alarmProfileFunction(alarmArray,function(){
                        colorProfileFunction(userTheme,callbackFunctionWeb);
                      });
                    });
                  }
                });
            } else {
                webError();
            }
        }
    };

    xhr.onerror = function(e) {
        //console.error(xhr.statusText);
        webError();
    };
    xhr.send(null);
}

function webRequest(callbackFunc,fullChart) {
    //we need a couple of variables. first of all, get the site URL.
    chrome.storage.local.get(['siteUrl', 'siteToken'], function(siteData) {
        var siteUrlBase
        if(fullChart == true){
          siteUrlBase = manipulateURL(siteData,289);
        }else{
          siteUrlBase = manipulateURL(siteData,1);
        }
        //now, we need to see how much data we're supposed to load.
        //yes... the data has data.
        var xhr = new XMLHttpRequest();
            xhr.open("GET", siteUrlBase, true);
        xhr.onload = function(e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    //console.log(xhr.responseText);
                    //everything is done. now, get the profile data and set to mgdl/mmol.
                    if(fullChart == true){
                      //since it's the full chart, just return the data ASAP!; 
                      if(callbackFunc){
                        callbackFunc(xhr.responseText);
                      }
                    }else{
                      var profileURLBase = manipulateProfileURL(siteData);
                      profileWebRequest(profileURLBase, function() {
                          //console.log("PARSING DATA!");
                          parseData(xhr.responseText, callbackFunc);
                      });
                    }
                    // we are done. find a way to callback after all the data, too.
                } else {
                    webError();
                }
            }
        };
        xhr.onerror = function(e) {
            //console.error(xhr.statusText);
            webError();
        };
        xhr.send(null);
    });
}

setInterval(webRequest, secondVal * 1000);