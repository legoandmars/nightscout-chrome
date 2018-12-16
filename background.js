  var defaultSite = '';
  var minuteVal = .05;
  var addToUrl = '/api/v1/entries.json?count=';
  var defaultUrgentLowValue = 55;
  var defaultLowValue = 80;
  var defaultHighValue = 180; 
  var defaultUrgentHighValue = 260;
  var snoozeMinutesDefault = 30;
  var urgentLowValue;
  var lowValue;
  var highValue;
  var urgentHighValue;
  var refreshGraphFunc;

  chrome.runtime.onInstalled.addListener(function() {
    //note: please clean this code up >_>
    chrome.storage.local.set({siteUrl:defaultSite}, function() {
      console.log('The default site has been set as '+defaultSite);
    });
    chrome.storage.local.set({bsTable: "dne"}, function() {
      console.log('BS values have been set to dne (default)');
    });
    chrome.storage.local.set({dataAmount: 7}, function() {
      console.log('Amount of data has been set to 7 (30 minutes) (default) ');
    });
    //{ {number,enabled(t/f, t by default) } }
    //goes in order of: urgent low, low, high, urgent high.
    chrome.storage.local.set({alarmValues: [ [defaultUrgentLowValue, true],[defaultLowValue, true],[defaultHighValue, true],[defaultUrgentHighValue, true] ]}, function() {
      console.log('Amount of data has been set to 7 (30 minutes) (default) ');
    });
    chrome.storage.local.set({lastAlarmName: "dne"}, function() {
      console.log('Last Alarm Variable created!');
    });
    chrome.storage.local.set({snoozeUnix: "dne"}, function() {
      //snoozeunix is an amazing variable name and you can't convince me otherwise
    });
    chrome.storage.local.set({snoozeMinutes: snoozeMinutesDefault}, function() {
    });
    chrome.storage.local.set({unitValue: "mgdl"}, function() {
    });
  });
//get data from nightscout!
//https://test.herokuapp.com/api/v1/entries <- link stuff

function forceRefreshGraph(){
  if(refreshGraphFunc){
    refreshGraphFunc();
  }
}

function setGraphFunction(callbackFunction){
  refreshGraphFunc = callbackFunction;
}

function notifClear(id) {
    setTimeout(function () {
      chrome.notifications.clear(id,function(){
      //console.log("wow it cleared!");
      })
    }, 10000);
}
function clearById(id){
  chrome.notifications.clear(id,function(){
    console.log("cleared succesfully!");
  })
}
function unitToProperString(unitType){
  //yes i made a function for one if/else statement, deal with it
  if(unitType == "mgdl"){
    return "mg/dL";
  }else if(unitType == "mmol"){
    return "mmol/L";
  }
}
function saveNotifID(notifID){
  chrome.storage.local.set({lastAlarmName: notifID}, function() {
    console.log("Notification Sent!"); 
    //notification has been sent. do nothing.
  });
}
//notification functions
function notificationFunction(bgValue,dateValue,valueText,unitType){
  var tempColor;
  if(valueText != "Low" && valueText != "High") return;
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
        if(snoozeMinutesVal == 0){
          //just for old users who don't have old variables.
          snoozeMinutesVal = 30;
        }
        var snoozeVal;
        if (snoozeUnixString != "dne"){
          var snoozeUnixTemp = Math.round((new Date()).getTime() / 1000);
          //compare
          var snoozeDiff = -(Number(snoozeUnixString)-Number(snoozeUnixTemp)); //yes i double negated this. got a problem with it?
          console.log("SNOOZED FOR "+(snoozeMinutesVal - (snoozeDiff/60)).toString()+" MORE MINUTES!");
          if (snoozeDiff>snoozeMinutesVal * 60){
            //reset difference
            snoozeVal = false;
            stopSnooze();
          }
          //console.log("SNOOZE DIFFERENCE IS "+snoozeDiff);
        }else{
          //no alarm - set to dne
          snoozeVal = false;
        }
        if (snoozeVal == false){
          if(dateValue.toString() != lastAlarmString){
            //now double check that it hasn't been snoozed recently
            console.log(dateValue.toString())
            console.log(lastAlarmString);
            //indeed a new data point!
            var urgentLowValueTemp = urgentLowValue[0];
            var urgentHighValueTemp = urgentHighValue[0];
            //var unitAddition = unitToProperString(unitType); this is for adding mg/dL or mmol/L properly
            if(unitType == "mmol"){
              urgentLowValueTemp = mgdlToMMOL(urgentLowValueTemp);
              urgentHighValueTemp = mgdlToMMOL(urgentHighValueTemp);
             //it's mmol, so we have to convert the lowvalues. 
            } //else is mgdl
            //do mmol conversion stuff...
            if(valueText == "High"){
              if(highValue[1] == true){
                //is high and notifs are enabled.
                if(Number(bgValue)>=urgentHighValueTemp){
                  //is an urgent high. adjust accordingly, check notification permissions.
                  if(urgentHighValue[1]==false){
                    valueText=""
                  }else{
                    valueText="Urgent High"
                  }
                }
              }else{
                valueText=""
              }
            }else if(valueText == "Low"){
              if(lowValue[1] == true){
                //is low and notifs are enabled.
                if(Number(bgValue)<=urgentLowValueTemp){
                  //is an urgent low. adjust accordingly, check notification permissions.
                  if(urgentLowValue[1]==false){
                    valueText=""
                  }else{
                    valueText="Urgent Low"
                  }
                }
              }else{
                valueText=""
              }
            }
            var notifID = 'nightscout-alert';
            //double check that notifs were indeed enabled.
            if(valueText==""){
              //notifications are disabled. whoops.
              clearNotifications(notifID);
            }else{
                chrome.notifications.create(
                  notifID,{  
                  type: 'basic', 
                  iconUrl: 'images/nightscout128.png', 
                  title: valueText+" Glucose Alert", 
                  message: "Your blood sugar is "+bgValue,  
                  priority: 1,
                  buttons:[{
                    title:"Dismiss",
                    },
                    {title:"Snooze ("+snoozeMinutesVal+"m)"}]
                  },
                function(){
                  setTimeout(clearNotifications,10000);
                });
            }
          }else{
            //don't clear - we still want the notification visible from last time!
            console.log("sorry man, notification hasn't changed...")
          }
        }
      });
    });
  });
}

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
  if(btnIdx==0){
    clearNotifications();
    //alert("YEET");
  }else if(btnIdx==1){
      var snoozeUnixTemp = Math.round((new Date()).getTime() / 1000);
        chrome.storage.local.set({snoozeUnix: snoozeUnixTemp}, function() {
          console.log("SNOOZED! SEND SNOOZE NOTIF~!");
        });
    //alert("SNOOZE");
    //make a snooze thing!
  }
}); 

function stopSnooze(){
  chrome.storage.local.set({snoozeUnix: "dne"}, function() {
    console.log("ALARM DATA HAS BEEN RESET!");
  });
}

function checkBSvariables(callbackFunc){
  chrome.storage.local.get(['alarmValues'], function(result) {
    var alarmValues = Object.values(result)
    console.log(alarmValues);
    if(alarmValues){
      var urgentLowData = alarmValues[0][0];
      var lowData = alarmValues[0][1];
      var highData = alarmValues[0][2];
      var urgentHighData = alarmValues[0][3];
      //check if any are changed.
      if(urgentLowData != urgentLowValue || lowData != lowValue|| highData != highValue|| urgentHighData != urgentHighValue){
        urgentLowValue = urgentLowData;
        lowValue = lowData;
        highValue = highData;
        urgentHighValue = urgentHighData;
        console.log("Alarm data has been changed!");
        //getData();
        //saveFunc("pushNotifications");
        if(callbackFunc){
          callbackFunc();
        }
      }
    }
  });
}

function changeIconNumber(currentBG){
  console.log(currentBG);
  chrome.browserAction.setBadgeText({text: currentBG.toString()});
  chrome.browserAction.setBadgeBackgroundColor({color:"gray"})
  chrome.browserAction.setTitle({title:"Blood Glucose Level: "+currentBG.toString()})
}

function clearNotifications(lastAlarmRaw){
  chrome.notifications.clear("nightscout-alert",function(){
    console.log("cleared notification, boss");
    //now, set last to nothing.
    //chrome.storage.local.set({lastAlarmName: "dne"}, function() {
    //  console.log('Last Alarm Variable created!');
    //});
  });
}
function bsAlerts(bloodSugarVal,dateValue,unitType){
  var lowValueTemp = lowValue[0];
  var highValueTemp = highValue[0];
  if(unitType == "mmol"){
    lowValueTemp = mgdlToMMOL(lowValueTemp);
    highValueTemp = mgdlToMMOL(highValueTemp);
   //it's mmol, so we have to convert the lowvalues. 
  }
  if (Number(bloodSugarVal) <= Number(lowValueTemp)){
      notificationFunction(bloodSugarVal,dateValue,"Low",unitType);
  }else if(Number(bloodSugarVal) >= Number(highValueTemp)){
      notificationFunction(bloodSugarVal,dateValue,"High",unitType);
  }else{
    //not high, not low. let's clear notifications anyways.
    chrome.storage.local.get(['lastAlarmName'], function(lastAlarmRaw) {
      chrome.browserAction.setBadgeBackgroundColor({color:"gray"});
      var lastAlarmString = Object.values(lastAlarmRaw)[0];
      if(lastAlarmString != dateValue){
        //if they're different, clear notifications! 
        clearNotifications(lastAlarmString);
      }
    });
  }
}

function mgdlToMMOL(mgdlVal){
  var mmolMult = 18.016;
  var tempMmol = mgdlVal/mmolMult;
  //make sure to round to one decimal place!
  var tempMmolFinal = Math.round(tempMmol*10)/10;
  if(tempMmolFinal % 1 == 0){
    tempMmolFinal = tempMmolFinal+".0";
  }
  return (tempMmolFinal);
}

function bsColors(bgValue,unitType){
  var lowValueTemp = lowValue[0];
  var highValueTemp = highValue[0];
  if(unitType == "mmol"){
    lowValueTemp = mgdlToMMOL(lowValueTemp);
    highValueTemp = mgdlToMMOL(highValueTemp);
    console.log("COLORS YEET");
   //it's mmol, so we have to convert the lowvalues. 
  }
  var customColor = "gray";
  if (Number(bgValue) <= lowValueTemp){
    customColor = "red";
  }else if(Number(bgValue) >= highValueTemp){
    customColor = "#c6a400";
  }
  chrome.browserAction.setBadgeBackgroundColor({color:customColor});
}
function saveFunc(responseData,callbackFunc){
  console.log("SAVE FUNC ENABLED!");
  //before saving, check BG vals.
  //var convertedString = JSON.stringify(responseData);
    chrome.storage.local.get(['bsTable'], function(result) {
        //data needs to be updated!
        console.log("Updating data!");
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
          if(Object.values(result) == responseData){
            //it's the same.
            var tempTest = Object.values(result);
            var tempTabl = returnCurrentBG(tempTest,true,true,unitType);
            tempBG = tempTabl[0];
            if(tempBG != false){
            //bsAlerts(tempBG,tempDate,true);
            //change bg vals.
              console.log("CURRENT IS "+tempBG);
              bsColors(tempBG,unitType);
            }
            console.log("It's fine - data is already correct.")
            //still, double check!
          }else{
            console.log("Saving Data!");
            chrome.storage.local.set({bsTable: responseData}, function() {
              //now that it's been saved, double check that you callback.
              if(callbackFunc){
                callbackFunc()
              }
              //run more after-save code here.
              forceRefreshGraph();
              console.log('Value succesfully set.');
              //do low, high alerts too!
              var currentDATA = returnCurrentBG(responseData,false,true,unitType);
              currentBG = currentDATA[0];
              //mmol and mgdl have a few problems - for now, notification data is stored in mgdl, so make sure to convert them to mmol when you get into the function!
              currentDate = currentDATA[1];
              if(currentBG != false){
                //currentBG = 70;
                console.log(currentBG);
                //set icon
                changeIconNumber(currentBG);
                //note: add custom alert vars.
                chrome.storage.local.get(['bsTable'], function(result) {
                //not only does this control low/high alerts, but also the colors of the program.
                //get alarmValues
                checkBSvariables(function(){
                  //now that variables are set, do alerts and colors.
                  bsAlerts(currentBG,currentDate,unitType);
                  bsColors(currentBG,unitType);
                });
              });
            }
          });
          //console.log(result);
      }
    });
  });
}

function returnCurrentBG(data,notif,returnDate,unitType){
  var parsed;
  if(!unitType){
    //no unit type, assume mgdl!
    unitType = "mgdl";
  }

  if(notif == true){
    //actually fixing errors: small brain
    //just using a try catch statement: galaxy brain
    try{
        parsed = JSON.parse(data[0]);
    }
    catch(err){
      console.log("aaaand the json parse crashed!");
      return false;
    }
  }else{
        parsed = JSON.parse(data);
  }
  for(i = 0; i < parsed.length; i++){
    var firstValue = false;
    if (i==0){
      firstValue = true;
    }
    var indivString = parsed[i];
    var sgv = indivString["sgv"];
    var dateStr = indivString["date"];
    if (firstValue==true){
      //first bg value, meaning we need to C O N V E R T!
      if(unitType == "mmol"){
        //mmol, convert!
        sgv = mgdlToMMOL(sgv);
        console.log("MMOL VERSION IS "+sgv);
      }else if(unitType == "mgdl") {
        //mgdl, make sure to change to number
        sgv = Number(sgv);
      }
      if(returnDate==false){
        return sgv;
      }else if(returnDate==true){
        return [sgv,Number(dateStr)];
      }else{
        return sgv;
      }
    }
  }
};

function parseData(response,callbackFunc){
  if(callbackFunc){
    saveFunc(response,callbackFunc);
  }else{
    saveFunc(response);
  }
  var parsed = JSON.parse(response);
  console.log("SUCCESSFUL, PARSING DATA NOW!");
  //example of datatypes below.
 /* for(i = 0; i < parsed.length; i++){
    var firstValue = false;
    if (i==0){
      firstValue = true;
    }
    var indivString = parsed[i];
    //get variables from data.
    //main variables
    var date = indivString["date"];
    var dateString = indivString["dateString"];
    var sgv = indivString["sgv"];
    var bloodSugar = sgv; //just for the purpose of making variable names easier to understand
    //other variables
    var delta = indivString["delta"];
    var device = indivString["device"];
    var direction = indivString["direction"];
    var filtered = indivString["filtered"];
    var noise = indivString["noise"];
    var rssi = indivString["rssi"];
    var sysTime = indivString["sysTime"];
    var type = indivString["type"];
    var unfiltered = indivString["unfiltered"];
    var id = indivString["id"];
    //finish parsing, do some other stuff.
    if (firstValue==true){
      console.log("CURRENT BLOOD SUGAR VALUE IS "+sgv);
      //send notification test!
      //createNotif(sgv);
    }
  }*/
  //}
}

function manipulateURL(urlObj){
  var siteUrlBase = Object.values(urlObj)[0];
  console.log(siteUrlBase);
  //check if it starts with https/http and manipulate accordingly
  if(siteUrlBase.startsWith("https://") || siteUrlBase.startsWith("http://")){
    //it starts with https/http, we should be good.
  }else{
    //no http, add to string.
    siteUrlBase = "http://"+siteUrlBase;
  } 
  //make sure it ends in a big ol slash
  if(siteUrlBase.endsWith("/")){
    //we're fine. we have a slash.
  }else{
    //no slash, add one.
    siteUrlBase = siteUrlBase+"/";
  }
  siteUrlBase = siteUrlBase+ 'api/v1/entries.json?count=';
  //console.log("URL IS "+siteUrlBase); 
  //return url with correct values.
  return siteUrlBase;
}

function manipulateProfileURL(urlObj){
  var siteUrlBase = Object.values(urlObj)[0];
  console.log(siteUrlBase);
  //check if it starts with https/http and manipulate accordingly
  if(siteUrlBase.startsWith("https://") || siteUrlBase.startsWith("http://")){
    //it starts with https/http, we should be good.
  }else{
    //no http, add to string.
    siteUrlBase = "http://"+siteUrlBase;
  } 
  //make sure it ends in a big ol slash
  if(siteUrlBase.endsWith("/")){
    //we're fine. we have a slash.
  }else{
    //no slash, add one.
    siteUrlBase = siteUrlBase+"/";
  }
  siteUrlBase = siteUrlBase+ 'api/v1/profile';
  //console.log("URL IS "+siteUrlBase); 
  //return url with correct values.
  return siteUrlBase;
}

function webError(){
 console.log("ERROR! SITE DOES NOT EXIST!"); 
}

function profileWebRequest(profileURL,callbackFunctionWeb){
  var defaultUnit = "mgdl"; 
  var unit;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", profileURL, true);
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        //we got the data, boys!
        var webData = JSON.parse(xhr.responseText);
        console.log("WE GOT SOME PROFILE DATA:");
        var dataLength = Object.values(webData[0]).length;
        var defaultProfileName;
        var profileStorage;
        for(i=0;i<dataLength;i++){
          if(Object.keys(webData[0])[i] == "defaultProfile"){
            //we found the default profile - get the value!;
            defaultProfileName = Object.values(webData[0])[i];
          }else if(Object.keys(webData[0])[i] == "store"){
            profileStorage = Object.values(webData[0])[i];
          }
        }
        console.log(" PROFILE DATA STORAGE: ")
        console.log(profileStorage);
        var profileDataLength = Object.values(profileStorage).length;
        console.log(profileDataLength);
        var defaultProfileData;
        for(i=0;i<profileDataLength;i++){
          if(Object.keys(profileStorage)[i] == defaultProfileName){
            //we found the default profile - get the value!;
            defaultProfileData = Object.values(profileStorage)[i]
            console.log("WE FOUND IT!");
          }
        }
        var profileDataLengthInner = Object.values(defaultProfileData).length;
        for(i=0;i<profileDataLengthInner;i++){
          if(Object.keys(defaultProfileData)[i] == "units"){
            //we found the default profile - get the value!;
            var unitTemp = Object.values(defaultProfileData)[i];
            console.log("UNITS ARE: ")
            console.log(unitTemp)
            if(unitTemp == "mmol"){
              //mmol
              unit = "mmol";
            }else if(unitTemp == "md/dl" || unitTemp == "mg/dl"){
              //mgdl
              //also cmon nightscout devs.. it's spelled md/dl in the api... LITERALLY UN-USEABLE....
              unit = "mgdl";
            }
          }  
        }
        //we got the default profile, now parse.
        if(unit){
          //we got the unit. do nothing.
        }else{
          unit = defaultUnit;
          //something went wrong, set to default (mgdl)
        }
        //unit is stored in "mgdl" or "mmol". save this and return.
        chrome.storage.local.set({unitValue:unit}, function() {
          //set unit. do callback now yay!
          console.log("SAVED UNIT AS "+unit);
          if(callbackFunctionWeb){
            callbackFunctionWeb();
          }
        });
      } else {
        webError();
      }
    }
  };

  xhr.onerror = function (e) {
    //console.error(xhr.statusText);
    webError();
  };
  xhr.send(null);
}

function webRequest(callbackFunc){
 //we need a couple of variables. first of all, get the site URL.
  chrome.storage.local.get(['siteUrl'], function(siteData) {
    var siteUrlBase = manipulateURL(siteData);
    //now, we need to see how much data we're supposed to load.
    chrome.storage.local.get(['dataAmount'], function(dataData) {
      //yes... the data has data.
      var getNumber = Object.values(dataData);
      var xhr = new XMLHttpRequest();
      if(getNumber){
        xhr.open("GET", siteUrlBase+getNumber, true);
      }else{
        xhr.open("GET", siteUrlBase+7, true);
      }
      xhr.onload = function (e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            //console.log(xhr.responseText);
            //everything is done. now, get the profile data and set to mgdl/mmol.
            var profileURLBase = manipulateProfileURL(siteData);
            profileWebRequest(profileURLBase,function(){
              console.log("PARSING DATA!");
              parseData(xhr.responseText,callbackFunc);
            });
            // we are done. find a way to callback after all the data, too.
          } else {
            webError();
          }
        }
      };
      xhr.onerror = function (e) {
        //console.error(xhr.statusText);
        webError();
      };
      xhr.send(null);
    });

  });
}

setInterval(webRequest, minuteVal * 60 * 1000);
