var onPressButton

document.getElementById("backButton").onclick = function(){
	console.log("Going Back");
	document.getElementById("backButton").blur();
	window.location.href="/../popup.html";
	chrome.browserAction.setPopup({popup: "/../popup.html"});
}

function checkBSvariables(){
  chrome.storage.local.get(['alarmValues'], function(result) {
    var alarmValues = Object.values(result)
    console.log(alarmValues);
    if(alarmValues){
      var urgentLowData = alarmValues[0][0];
      var lowData = alarmValues[0][1];
      var highData = alarmValues[0][2];
      var urgentHighData = alarmValues[0][3];
      //check if any are changed.
      document.getElementById("urgentLowAlertValue").value = urgentLowData[0];
      document.getElementById("lowAlertValue").value = lowData[0];
      document.getElementById("highAlertValue").value = highData[0];
      document.getElementById("urgentHighAlertValue").value = urgentHighData[0];
      document.getElementById("urgentLowEnabled").checked = urgentLowData[1];
      document.getElementById("lowEnabled").checked = lowData[1];
      document.getElementById("highEnabled").checked = highData[1];
      document.getElementById("urgentHighEnabled").checked = urgentHighData[1];
      //now, set site url in the same function.
      chrome.storage.local.get(['siteUrl'], function(siteResult) {
      	var siteUrlValue = Object.values(siteResult);
      	if(siteUrlValue != ""){
      		document.getElementById("siteURL").value = siteUrlValue;
      	}
      });
    }
  });
}
function getValueText(stringName){
	//sanitize user input so they aren't mean
    var getString = document.getElementById(stringName).value;
    if(isNaN(getString)){
    	//NOT A number! return false;
    	return false;
    }else{
    	//we good boys
    	if(Number(getString) <= 0){
    		//below 0.
    		return false;
    	}else{
    		//give plain number.
    		return Number(getString);
    	}
    }
}

function getURLText(callbackFunction){
	//sanitize user input so they aren't mean
    var urlString = document.getElementById("siteURL").value;
    //now you have string, check if it's valid.
    //check if it starts with https/http and manipulate accordingly
    if(urlString.startsWith("https://") || urlString.startsWith("http://")){
      //it starts with https/http, we should be good.
    }else{
      //no http, add to string.
      urlString = "https://"+urlString;
    } 
    //make sure it ends in a big ol slash
    if(urlString.endsWith("/")){
      //we're fine. we have a slash.
    }else{
      //no slash, add one.
      urlString = urlString+"/";
    }
    //v this should not be needed, simply testing for web api response.
    //urlString = urlString+ 'api/v1/entries.json?count=';
    console.log("URL IS "+urlString);
    //check if site exists
	var xhr = new XMLHttpRequest();
	xhr.open("GET", urlString, true);
	  xhr.onload = function (e) {
	    if (xhr.readyState === 4){
	      if (xhr.status === 200){
	        //console.log(xhr.responseText);
	        callbackFunction(urlString);
	      }else{
	      	callbackFunction(false);
	      }
	    }else{
	      callbackFunction(false);
	    }
	  };
	  xhr.onerror = function (e){
	    //console.error(xhr.statusText);
	    callbackFunction(false);
	  };
	  xhr.send(null);

}

function getCheckValue(stringName){
    var getCheck = document.getElementById(stringName).checked;
    return getCheck;
}

function alertFunc(errCd){
	var message = "whoops you shouldn't be seeing this"
	if(errCd ==1){
		message = "ERROR: Invalid Number.";
	}else if(errCd=2){
		message = "ERROR: Invalid Site URL.";
	}
	alert(message);	
}
function saveFunction(){
	var uLSaved = getValueText("urgentLowAlertValue");
	var lSaved = getValueText("lowAlertValue");
	var hSaved = getValueText("highAlertValue");
	var uHSaved = getValueText("urgentHighAlertValue");
	var uLCheckbox = getCheckValue("urgentLowEnabled");
	var lCheckbox = getCheckValue("lowEnabled");
	var hCheckbox = getCheckValue("highEnabled");
	var uHCheckbox = getCheckValue("urgentHighEnabled");

	console.log(uLSaved,lSaved,hSaved,uHSaved);
	//double check that they're all actual 
	if(uLSaved != false && lSaved != false && hSaved != false && uHSaved != false){
		//now, parse the site url and see if it's a real site.
		getURLText(function(returnVal){
			if(returnVal!=false){
				chrome.storage.local.set({siteUrl:returnVal}, function() {
					console.log("SAVED SITE URL!");
					chrome.storage.local.set({alarmValues: [ [uLSaved, uLCheckbox],[lSaved, lCheckbox],[hSaved, hCheckbox],[uHSaved, uHCheckbox] ] }, function() {
				      console.log('SAVED DATA!');
				      //once saved, force reload.
				      chrome.extension.getBackgroundPage().webRequest();
				    });
			    });
			}else{
				alertFunc(2);
			}
		});
	}else{
		//whoopsies, we got some bad data owo
		alertFunc(1);
	}
}



document.getElementsByClassName("submitButton")[0].onclick = function(){
	//when submit button clicked, do some stuff.
	saveFunction();
}
window.onload = function() {
//just loading! load all the data to display in settings now.
	checkBSvariables();
}
