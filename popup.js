//runs when popup is clicked every time.
//first, get some data.
var urgentLowValue;
var lowValue;
var highValue;
var urgentHighValue;

var globalOldData;

function arrowValues(direction) {
    var baseUrl = "arrows/"
    var extension = ""
    var arrowNumberVal = null;
    switch (direction) {
        case "NONE":
            arrowNumberVal = 0;
            break;
        case "DOUBLEUP":
            arrowNumberVal = 1;
            break;
        case "SINGLEUP":
            arrowNumberVal = 2;
            break;
        case "FORTYFIVEUP":
            arrowNumberVal = 3;
            break;
        case "FLAT":
            arrowNumberVal = 4;
            break;
        case "FORTYFIVEDOWN":
            arrowNumberVal = 5;
            break;
        case "SINGLEDOWN":
            arrowNumberVal = 6;
            break;
        case "DOUBLEDOWN":
            arrowNumberVal = 7;
            break;
        case "NOT COMPUTABLE":
            arrowNumberVal = 8;
            break;
        case "RATE OUT OF RANGE":
            arrowNumberVal = 9;
            break;
    }
    //alert(direction);
    if (arrowNumberVal == null) {
        arrowStringVal = "arrows/0";
    } else {
        arrowStringVal = baseUrl + arrowNumberVal + extension;
    }

    return arrowStringVal;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function convertDate(dateObject) {
    var convertedDate = new Date(dateObject);
    var h = addZero(convertedDate.getHours());
    var m = addZero(convertedDate.getMinutes());
    var ampm = "AM"
    if (h > 12) {
        h = h - 12
        ampm = "PM"
    } else if (h == 00) {
        h = 12
        //ampm = "PM"
    }
    if (h.toString().charAt(0) == "0") {
        h = h.toString().substr(1);
    }
    var dateString = h + ":" + m + " " + ampm;
    return dateString;
}

function convertDateNoSpace(dateObject) {
    var convertedDate = new Date(dateObject);
    var h = addZero(convertedDate.getHours());
    var m = addZero(convertedDate.getMinutes());
    var ampm = "AM"
    if (h > 12) {
        h = h - 12
        ampm = "PM"
    } else if (h == 00) {
        h = 12
        //ampm = "PM"
    }
    if (h.toString().charAt(0) == "0") {
        h = h.toString().substr(1);
    }
    var dateString = h + ":" + m + ampm;
    return dateString;
}

function convertDateFinal(dateObject) {
    chrome.storage.local.get(['dataAmount'], function(result) {
        var getNumber = Object.values(result);
        var convertedDate = new Date(dateObject);
        convertedDate.setMinutes(convertedDate.getMinutes() - ((Number(getNumber) * 5) - 5));
        var h = addZero(convertedDate.getHours());
        var m = addZero(convertedDate.getMinutes());
        var ampm = "AM"
        console.log(h + " IS H");
        if (h > 12) {
            h = Number(h) - 12
            ampm = "PM"
        } else if (h == 00) {
            h = 12
            //ampm = "PM"
        }
        if (h.toString().charAt(0) == "0") {
            h = h.toString().substr(1);
        }
        var dateString = h + ":" + m + " " + ampm;
        //return dateString;
        document.getElementById("date1").innerHTML = dateString;
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

function parseData(response) {
    //make sure to double check alarm values first of all!
    if (response != "dne") {
        //there is a response. now get unit type.
        chrome.storage.local.get(['unitValue'], function(unitResult) {
            var unitType = Object.values(unitResult)[0];
            document.getElementsByClassName("errorText")[0].innerHTML = ""
            //make sure to delete all previous dots.
            var parsed = JSON.parse(response);
            console.log("LENGTH IS " + parsed.length);
            console.log("PARSING DATA NOW!");
            for (i = 0; i < parsed.length; i++) {
                var firstValue = false;
                if (i == 0) {
                    firstValue = true;
                }
                var indivString = parsed[i];
                //get variables from data.
                //main variables
                var date = indivString["date"];
                var dateString = indivString["dateString"];
                var sgv = indivString["sgv"];
                //now we need to do mmol stuff. is it mmol? if so, convert!
                var sgvMgdl = sgv;
                if (unitType == "mmol") {
                    sgv = mgdlToMMOL(sgv);
                    //also, change delta to mmol!
                }
                var bloodSugar = sgv; //just for the purpose of making variable names easier to understand
                var delta = indivString["delta"];
                //DOUBLE CHECK DELTA
                console.log(delta + " IS DELTA");
                //other variables
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
                //get arrow values!
                /*if (firstValue==true){
                  alert("CURRENT BLOOD SUGAR VALUE IS "+sgv);
                }*/
                //create ONE dot for this singular data point. also, double check how much data is being used.
                //double check it's the right type of point.. if not, stop now.
                if (sgv) {
                    if (isNaN(delta)) {
                        console.log("YEET");
                        //calculate yourself!	
                        var indivString2 = parsed[i + 1];
                        if (indivString2) {
                            var newDeltaCalc1 = indivString2["sgv"];
                            //again, do some mmol stuff.
                            if (unitType == "mmol") {
                                newDeltaCalc1 = mgdlToMMOL(newDeltaCalc1);
                            }
                            if (newDeltaCalc1) {
                                //console.log("YEEEEET");
                                delta = (Number(sgv) - Number(newDeltaCalc1)).toString();
                            }
                        } else {
                            delta = 0;
                        }
                    }
                    console.log(delta);
                    var newDot = document.createElement("div");
                    newDot.className = "dot";
                    document.getElementsByClassName("innerChart")[0].appendChild(newDot);
                    newDot.style.top = 154 - (((sgvMgdl - 40) / 40) * 16.666) + "px";
                    newDot.style.left = 258 - (i * (243 / (parsed.length - 1))) + "px";
                    //dotMOEvent(newDot,bloodSugar,dateString);
                    //define vars for following functions
                    var timeText = document.getElementsByClassName("mouseOverTimeValue")[0];
                    var bsText = document.getElementsByClassName("mouseOverBGV")[0];
                    var mainTooltip = document.getElementsByClassName("mouseOverDiv")[0];
                    var onMouseOver = function(dotObject, bsValue, timeValue) {
                        dotObject.onmouseover = function() {
                            //alert("OVER");
                            timeText.innerHTML = convertDateNoSpace(timeValue);
                            bsText.innerHTML = "BG: " + bsValue;
                            var styleFromDot = Number((dotObject.style.left).slice(0, -2));
                            var styleFromDotTop = Number((dotObject.style.top).slice(0, -2));
                            var topPreCalc = (styleFromDotTop + 22)
                            if (topPreCalc <= 68) {
                                topPreCalc = 68;
                            }
                            mainTooltip.style.left = (styleFromDot + 5) + "px";
                            mainTooltip.style.top = (topPreCalc) + "px";
                            mainTooltip.style.visibility = "visible"
                        };
                        dotObject.onmouseout = function() {
                            mainTooltip.style.visibility = "hidden";
                        }
                    };
                    onMouseOver(newDot, sgv, dateString);
                    /*var dots = document .getElementsByClassName("dot");
		    //var dotStuff=document.getElementById("dot"+(i+1));
		    if(dots[i]){
		    	dots[i].style.top = 154-(((sgv-40)/40)*16.666)+"px";
		    	//dots[i].style.left="258px";
		    } */
                    if (firstValue == true) {
                        //also, set time correctly.
                        document.getElementById("date2").innerHTML = convertDate(dateString);
                        convertDateFinal(dateString);
                        //document.getElementById("date1").innerHTML = convertDateFinal(dateString);
                        var arrowUrlString = arrowValues(direction.toUpperCase());
                        //set main bs text to bloodSugar.
                        var mainText = document.getElementsByClassName("mainText");
                        var mainTextHolder = document.getElementsByClassName("mainTextHolder");
                        mainText[0].innerHTML = bloodSugar;
                        var arrowStr = "";
                        var lowValueTemp = lowValue[0];
                        var highValueTemp = highValue[0];
                        //var unitAddition = unitToProperString(unitType); this is for adding mg/dL or mmol/L properly
                        if (unitType == "mmol") {
                            lowValueTemp = mgdlToMMOL(lowValueTemp);
                            highValueTemp = mgdlToMMOL(highValueTemp);
                            //it's mmol, so we have to convert the lowvalues. 
                        } //else is mgdl
                        if (Number(bloodSugar) <= Number(lowValueTemp)) {
                            mainTextHolder[0].style.backgroundColor = "red"
                            mainText[0].style.color = "black";
                        } else if (Number(bloodSugar) >= Number(highValueTemp)) {
                            mainTextHolder[0].style.backgroundColor = "#c6a400"
                            mainText[0].style.color = "black";
                        } else {
                            mainTextHolder[0].style.backgroundColor = "black"
                            mainText[0].style.color = "gray";
                            arrowStr = "gray";
                        }
                        //set arrow to correct image. 
                        var arrowImage = document.getElementsByClassName("arrowImage");
                        arrowImage[0].src = arrowStringVal + arrowStr + ".png";
                        //set delta to correct value.
                        newNum = Math.round(Number(delta));
                        if (newNum >= 0) {
                            newNum = "+" + newNum;
                        }
                        //additionally, set to mgdl or mmol depending on whether is chosen.
                        //unitToProperString
                        var fullDeltaLabel = document.getElementsByClassName("fullDeltaLabel");
                        var fullInnerDeltaLabel = document.getElementsByClassName("fullInnerDeltaLabel");
                        fullDeltaLabel[0].innerHTML = unitToProperString(unitType);
                        if (unitType == "mmol") {
                            newNum = mgdlToMMOL(newNum);
                            fullInnerDeltaLabel[0].style.fontSize = "12px"
                            fullInnerDeltaLabel[0].style.top = "-10px"
                            fullDeltaLabel[0].style.top = "-9px";
                            fullDeltaLabel[0].style.fontSize = "12px"
                            //change side values PLEASE MAKE THIS MORE EFFICENT SOMETIME!
                            document.getElementById("text400").innerHTML = "22.2";
                            document.getElementById("text400").style.left = "285px";
                            document.getElementById("text340").innerHTML = "18.9";
                            document.getElementById("text340").style.left = "285px";
                            document.getElementById("text280").innerHTML = "15.5";
                            document.getElementById("text280").style.left = "285px";
                            document.getElementById("text220").innerHTML = "12.2";
                            document.getElementById("text220").style.left = "285px";
                            document.getElementById("text160").innerHTML = "8.9";
                            document.getElementById("text100").innerHTML = "5.6";
                            document.getElementById("text40").innerHTML = "2.2";
                        } else {
                            fullInnerDeltaLabel[0].style.fontSize = "14px"
                            fullInnerDeltaLabel[0].style.top = "-14px"
                            fullDeltaLabel[0].style.top = "-16px";
                            fullDeltaLabel[0].style.fontSize = "16px"
                            //change side values PLEASE MAKE THIS MORE EFFICENT SOMETIME!
                            document.getElementById("text400").innerHTML = "400";
                            document.getElementById("text340").innerHTML = "340";
                            document.getElementById("text280").innerHTML = "280";
                            document.getElementById("text220").innerHTML = "220";
                            document.getElementById("text160").innerHTML = "160";
                            document.getElementById("text100").innerHTML = "100";
                            document.getElementById("text40").innerHTML = "40";
                        }
                        fullInnerDeltaLabel[0].innerHTML = newNum;
                    }
                }

                //make sure the html is set correctly!
            }
        });
    } else if (response == "dne") {
        //no data yet!
        //alert("ERROR, NO DATA YET!");
        console.log("ERROR, NO DATA YET");
        document.getElementsByClassName("mainText")[0].style.color = "white";
        document.getElementsByClassName("errorText")[0].innerHTML = "ERROR: No data!<br>Check the site URL<br> in the settings."
    }
    //}
}

function unitToProperString(unitType) {
    //yes i made a function for one if/else statement, deal with it
    if (unitType == "mgdl") {
        return "mg/dL";
    } else if (unitType == "mmol") {
        return "mmol/L";
    }
}

function checkForUpdates() {
    chrome.storage.local.get(['bsTable'], function(exportedData) {
        var convertedData = Object.values(exportedData);
        if (JSON.stringify(convertedData) == JSON.stringify(globalOldData)) {
            //do nothing, data is same.
            console.log("DATA IS NOT UPDATED.")
        } else {
            //we did it! update!
            globalOldData = convertedData;
            console.log("BEEN UPDATED");
            var dots = document.getElementsByClassName('dot');

            while (dots[0]) {
                dots[0].parentNode.removeChild(dots[0]);
            }
            console.log("REMOVED ALL DOTS");
            //alert("DATA BEEN UPDATED FOO");
            parseData(convertedData);
        }
    });
}

/*document.getElementById("twohour").onclick = function(){
	alert("HOLY CRAP IT GOT PRESSED!");
	document.getElementById("twohour").blur();
};*/

function setButtons(button) {
    var newButtons = document.getElementsByTagName('button');
    for (var a = 0; a < newButtons.length; a++) {
        var exportButton = newButtons[a];
        if (exportButton != button && exportButton.className != "gear" && exportButton.className != "nightscoutButton") {
            if (exportButton) {
                exportButton.className = "hourButtonPressed"
            }
        } else if (exportButton == button) {
            exportButton.className = "hourButton"
        }
    }
}

function getHighlightedFromValue() {
    chrome.storage.local.get(['dataAmount'], function(exportedData) {
        var exportedNumber = Number(Object.values(exportedData));
        console.log(exportedNumber)
        var idString;
        switch (exportedNumber) {
            case 7:
                idString = "halfhour";
                break;
            case 25:
                idString = "twohour";
                break;
            case 73:
                idString = "sixhour";
                break;
            case 145:
                idString = "twelvehour";
                break;
            case 289:
                idString = "twentyfourhour";
                break;
        }
        console.log(idString);
        var allButtons = document.getElementsByTagName('button');
        for (var i = 0; i < allButtons.length; i++) {
            var button = allButtons[i];
            var buttonId = button.id;
            console.log(buttonId);
            if (buttonId) {
                if (buttonId == idString) {
                    button.className = "hourButton";
                } else if (buttonId.className != "gear" && buttonId.className != "nightscoutButton") {
                    button.className = "hourButtonPressed";
                }
            }
            //if(button.id = idString){
            //if it is the RIGHT button, light er up!
            //button.className = "hourButton";
            //}else{
            //else make it sad.
            //button.className = "hourButtonPressed";
            //}
            //buttonClickFunc(button);
        }
    });
}

function manipulateURL(urlObj) {
    var siteUrlBase = Object.values(urlObj)[0];
    console.log(siteUrlBase);
    //check if it starts with https/http and manipulate accordingly
    if (siteUrlBase.startsWith("https://") || siteUrlBase.startsWith("http://")) {
        //it starts with https/http, we should be good.
    } else {
        //no http, add to string.
        siteUrlBase = "http://" + siteUrlBase;
    }
    //make sure it ends in a big ol slash
    if (siteUrlBase.endsWith("/")) {
        //we're fine. we have a slash.
    } else {
        //no slash, add one.
        siteUrlBase = siteUrlBase + "/";
    }
    //siteUrlBase = siteUrlBase+ 'api/v1/entries.json?count=';
    //console.log("URL IS "+siteUrlBase); 
    //return url with correct values.
    return siteUrlBase;
}

function buttonClickFunc(button) {
    if (button.className != "gear" && button.className != "nightscoutButton") {
        button.onclick = function() {
            //alert(button.id);
            var exportNumber;
            switch (button.id) {
                case "halfhour":
                    exportNumber = 7;
                    break;
                case "twohour":
                    exportNumber = 25;
                    break;
                case "sixhour":
                    exportNumber = 73;
                    break;
                case "twelvehour":
                    exportNumber = 145;
                    break;
                case "twentyfourhour":
                    exportNumber = 289;
                    break;
            }
            chrome.storage.local.set({
                dataAmount: exportNumber
            }, function() {
                console.log('Amount of data has been set to ' + exportNumber);
                console.log('now, forcing load.')
                chrome.extension.getBackgroundPage().webRequest(function() {
                    //data saving is done - it has returned!
                    checkForUpdates();
                    //force refresh graph;
                });
                getHighlightedFromValue();
                //setTimeout(getHighlightedFromValue(), 100);
            });

            //save some data - additionally, make SURE that all the buttons get colored correctly.
            setButtons(button);
            button.blur();
        };
    } else if (button.className == "gear") {
        button.onclick = function() {
            console.log("HOLY COG BATMAN");
            button.blur();
            window.location.href = "settings/settings.html";
            chrome.browserAction.setPopup({
                popup: "settings/settings.html"
            });
        };
    } else if (button.className == "nightscoutButton") {
        //do stuf here
        button.onclick = function() {
            chrome.storage.local.get(['siteUrl'], function(siteData) {
                var siteUrlBase = manipulateURL(siteData);
                chrome.tabs.create({
                    'url': siteUrlBase
                });
            });
        };
    } else {

    }
}
var buttons = document.getElementsByTagName('button');
for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];
    buttonClickFunc(button);
}

//maybe remove this shit?
function checkBSvariables() {
    chrome.storage.local.get(['alarmValues'], function(result) {
        var alarmValues = Object.values(result)
        console.log(alarmValues);
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
                console.log("Alarm data has been changed!");
                //getData();
            }
        }
    });
}

//now, make a shitty force refresh function.

window.onload = function() {
    //this function lets you remotely activate the graph refresh.
    chrome.extension.getBackgroundPage().setGraphFunction(function() {
        //graph has been "force refreshed"
        try {
            checkForUpdates();
        } catch {
            console.log("Wow.. I guess he didn't like that");
        }
    });
    getHighlightedFromValue();
    checkBSvariables();
    chrome.storage.local.get(['bsTable'], function(exportedData) {
        var convertedData = Object.values(exportedData);
        //alert(convertedData);
        parseData(convertedData);
        globalOldData = convertedData;
        //setInterval(checkForUpdates, 500);
    });
}