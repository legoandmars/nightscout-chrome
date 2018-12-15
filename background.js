  var defaultSite = '';
  var minuteVal = .05;
  var addToUrl = '/api/v1/entries.json?count=';
  var defaultUrgentLowValue = 55;
  var defaultLowValue = 80;
  var defaultHighValue = 180; 
  var defaultUrgentHighValue = 260;
  var snoozeMinutes = 30;

  var urgentLowValue;
  var lowValue;
  var highValue;
  var urgentHighValue;
  var refreshGraphFunc;

  chrome.runtime.onInstalled.addListener(function() {
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

function saveNotifID(notifID){
  chrome.storage.local.set({lastAlarmName: notifID}, function() {
    console.log("Notification Sent!"); 
    //notification has been sent. do nothing.
  });
}
//notification functions
function notificationFunction(bgValue,dateValue,valueText){
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
      var snoozeVal;
      if (snoozeUnixString != "dne"){
        var snoozeUnixTemp = Math.round((new Date()).getTime() / 1000);
        //compare
        var snoozeDiff = -(Number(snoozeUnixString)-Number(snoozeUnixTemp)); //yes i double negated this. got a problem with it?
        console.log("SNOOZED FOR "+(snoozeMinutes - (snoozeDiff/60)).toString()+" MORE MINUTES!");
        if (snoozeDiff>snoozeMinutes * 60){
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
          if(valueText == "High"){
            if(highValue[1] == true){
              //is high and notifs are enabled.
              if(bgValue>=urgentHighValue[0]){
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
              if(bgValue<=urgentLowValue[0]){
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
                  {title:"Snooze ("+snoozeMinutes+"m)"}]
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
function bsAlerts(bloodSugarVal,dateValue,onlyUpdate){
  if (bloodSugarVal <= lowValue[0]){
      notificationFunction(bloodSugarVal,dateValue,"Low");
  }else if(bloodSugarVal >= highValue[0]){
      notificationFunction(bloodSugarVal,dateValue,"High");
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

function bsColors(bgValue){
  var customColor = "gray";
  if (bgValue <= lowValue[0]){
    customColor = "red";
  }else if(bgValue >= highValue[0]){
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
        if(Object.values(result) == responseData){
          var tempTest = Object.values(result);
          var tempTabl = returnCurrentBG(tempTest,true,true);
          tempBG = tempTabl[0];
          if(tempBG != false){
            //bsAlerts(tempBG,tempDate,true);
            //change bg vals.
            bsColors(currentBG);
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
            var currentDATA = returnCurrentBG(responseData,false,true);
            currentBG = currentDATA[0];
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
                bsAlerts(currentBG,currentDate);
                bsColors(currentBG);
              });
            });
          }
        });
        //console.log(result);
    }
  });
}

function returnCurrentBG(data,notif,returnDate){
  var parsed;
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
      if(returnDate==false){
        return Number(sgv);
      }else if(returnDate==true){
        return [Number(sgv),Number(dateStr)];
      }else{
        return Number(sgv);
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
  for(i = 0; i < parsed.length; i++){
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
  }
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

function webError(){
 console.log("ERROR! SITE DOES NOT EXIST!"); 
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
            parseData(xhr.responseText,callbackFunc);
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
