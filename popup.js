//runs when popup is clicked every time.
//first, get some data.
var urgentLowValue;
var lowValue;
var highValue;
var urgentHighValue;

var globalOldData;
var globalOldNumber;
var globalTheme;
var globalUnit;

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
    } else if (h == 0) {
        h = 12
        //ampm = "PM"
    }
    if (h.toString().charAt(0) == "0") {
        h = h.toString().substr(1);
    }
    var dateString = h + ":" + m// + " " + ampm;
    document.getElementById("dateNewText").innerHTML = dateString;
    document.getElementById("dateNewText2").innerHTML = ampm;
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
        var dateString = h + ":" + m// + " " + ampm;
        //return dateString;
        //document.getElementById("date1").innerHTML = dateString;
		var dateObjs = document.getElementsByClassName('dateHolderNew');
		var whiteLineObjs = document.getElementsByClassName('whiteLineNew');
		var wideLineObjs = document.getElementsByClassName('whiteLineWide');
		while(dateObjs[0]){
		    dateObjs[0].parentNode.removeChild(dateObjs[0])
		}
		while(whiteLineObjs[0]){
		    whiteLineObjs[0].parentNode.removeChild(whiteLineObjs[0])
		}
		while(wideLineObjs[0]){
		    wideLineObjs[0].parentNode.removeChild(wideLineObjs[0])
		}
		var lineAddition = 2;
		//FIRST, do white line stuff!
		var whiteLine = document.createElement("div");
		whiteLine.className = "whiteLineNew";
		whiteLine.style.left = 0+lineAddition+"px";
		document.getElementsByClassName("chartBackground")[0].appendChild(whiteLine);
		//NOW DO WIDE LINE STUFF!
		var wideLine = document.createElement("div");
		wideLine.className = "whiteLineWide";
		wideLine.style.left = 0+lineAddition+"px";
		document.getElementsByClassName("chartBackground")[0].appendChild(wideLine);
		//do MORE white line stuff.
		var whiteLine2 = document.createElement("div");
		whiteLine2.className = "whiteLineNew";
		whiteLine2.style.left = 19+lineAddition+"px";
		whiteLine2.style.top = 161+"px"
		document.getElementsByClassName("chartBackground")[0].appendChild(whiteLine2);
		//DATE STUFF!
		var dateClone = document.createElement("div");
		dateClone.className = "dateHolderNew";
		//dateClone.id = "uniqueDateHolder";
		dateClone.style.left = 0+"px";
		var textClone1 = document.createElement("p");
		var textClone2 = document.createElement("p");
		textClone1.className = "dateMarkersNew";
		textClone2.className = "dateMarkersNew";
		textClone1.innerHTML = dateString;
		textClone2.innerHTML = ampm;
		dateClone.appendChild(textClone1);
		dateClone.appendChild(textClone2);
		document.getElementsByClassName("chartBackground")[0].appendChild(dateClone);
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

function mouseOverFunction(dotObject, bsValue, timeValue){
	var timeText = document.getElementsByClassName("mouseOverTimeValue")[0];
    var bsText = document.getElementsByClassName("mouseOverBGV")[0];
    var mainTooltip = document.getElementsByClassName("mouseOverDiv")[0];
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
}
function createDot(dotData,dataAmount,[bottomValue,topValue],previousDot,finalDot,totalGraph){
	//TODO: ADD MMOL SUPPORT TO EVERYTHING!!!
	//bottomValue = 40;
	//topValue = 400;
	var dotBottomValue = 154;
	var dotTopValue = 4;
	//VARIABLES
	var date = dotData["date"];
	var dateString = dotData["dateString"];
	var sgv = dotData["sgv"];
	//var delta = indivString["delta"]; delta value is NOT needed EXCEPT for the first value!
	var preconversionSgv = sgv;
	//ALARM VARIABLES
    var lowValueTemp = lowValue[0];
	var urgentLowValueTemp = urgentLowValue[0];
	var urgentHighValueTemp = urgentHighValue[0];
    var highValueTemp = highValue[0];
	//MMOL FUNCTIONS HERE!
	if (globalUnit == "mmol") {
	    sgv = mgdlToMMOL(sgv);
	    lowValueTemp = mgdlToMMOL(lowValueTemp);
        urgentLowValueTemp = mgdlToMMOL(urgentLowValueTemp);
        urgentHighValueTemp = mgdlToMMOL(urgentHighValueTemp);
        highValueTemp = mgdlToMMOL(highValueTemp);
	}
	//CREATE NEW DOT, SET POSITION AND PARENT
	var newDot = document.createElement("div");
    newDot.className = "dot";
    document.getElementsByClassName("innerChart")[0].appendChild(newDot);
    //in this example, the lowest will be 40 and highest will be 400. set correctly.
    //newDot.style.top = 154 - (((preconversionSgv - 40) / 40) * 16.666) + "px";
    //bg of 400 should be 154
    //bg of 40 should be 4
    //340 = -150
    //switch bg values. max = min and min = max.
    //first, calculate left value from timestamp.
    var originalTimestamp = totalGraph[0]["date"];
    var newTimestampDifference = originalTimestamp-date;
    var newRounded = Math.round(newTimestampDifference/300000);
    //console.log(newRounded+" IS ROUNDED ONE");
    var diff1 = (topValue-bottomValue)/(dotBottomValue-dotTopValue);
    var newDotCalcNum = 4 + ((topValue-sgv)/diff1);
	newDot.style.top = newDotCalcNum+"px";
    newDot.style.left = 258 - (newRounded * (258 / (dataAmount - 1))) + "px";
    //halfhour = 7
    //two hour = 25
    //six hour = 73;
    //twelve hour = 145;
    //24 hour = 289
    newDot.style.opacity=0;
    var canvasDotWidth;
    if(dataAmount== 7){
    	canvasDotWidth = 3;
    }else if(dataAmount==25){
    	//2 hr value.
    	canvasDotWidth = 1;
	}else if(dataAmount>25){
    	//although this looks visually better, it makes the "hitbox" of the dots smaller, making it significantly harder to mouse over. perhaps look into this more later.
    	canvasDotWidth = .25;
    	//newDot.style.opacity=0;
    	//newDot.style.width = 2+"px";
    	//newDot.style.height = 2+"px";
    	//newDot.style.left = ((258 - (i * (258 / (dataAmount - 1))))+2) + "px";
    	//newDot.style.top = (newDotCalcNum+2)+"px";
    }else{
    	//smaller or = to two hour.
    }
   // var dotSize = 5;
    //newDot.style.height = dotSize+"px";
    //newDot.style.width = dotSize+"px";
    //ADD CHECK FOR SGV LATER
    //SET DOT COLOR BASED ON STORED COLOR VALUES
    dotColor = "#bbb"
    if(globalTheme == "colors"){
	    if(Number(sgv) >= urgentHighValueTemp || Number(sgv) <= urgentLowValueTemp){
	    	dotColor = "red";
	    }else if(Number(sgv) >= highValueTemp || Number(sgv) <= lowValueTemp){
	    	dotColor = "yellow";
	    }else{
	    	dotColor = "#4CFF00";
	    }
    }
    newDot.style.backgroundColor = dotColor;
    //MOUSEOVER FUNCTION
	mouseOverFunction(newDot, sgv, dateString);
	//JS CANVAS DOT FUNCTION
	var c=document.getElementsByClassName("canvasObject")[0];
	var ctx=c.getContext("2d");
	//NEW CANVAS DOT POSITION VARIABLES
	var dotTopValue = 3;
	var dotBottomValue = 140;
	var diff1 = (topValue-bottomValue)/(dotBottomValue-dotTopValue);
	var newDotCalcNum = 3 + ((topValue-sgv)/diff1);

	var firstTop = newDotCalcNum;
	var firstLeft = 269 - (newRounded * (269 / (dataAmount - 1)))
	//LINE FUNCTION
	if(previousDot != "dne"){
		//this is NOT a first dot. CREATE A LINE!
		var secondDotSGV = previousDot["sgv"];
		if(secondDotSGV){
			var previousDotDate = previousDot["date"];
    		var previousTimestampDifference = previousDotDate-date;
    		var previousRounded = Math.round(previousTimestampDifference/300000);
    		if(previousRounded==1){
				if(globalUnit=="mmol"){
					secondDotSGV = mgdlToMMOL(secondDotSGV);
				}
				var newDotCalcNum2 = 3 + ((topValue-secondDotSGV)/diff1);
				//get COLOR of last dot
				var newDotColor = "#bbb"
			    if(globalTheme == "colors"){
				    if(Number(secondDotSGV) >= urgentHighValueTemp || Number(secondDotSGV) <= urgentLowValueTemp){
				    	newDotColor = "red";
				    }else if(Number(secondDotSGV) >= highValueTemp || Number(secondDotSGV) <= lowValueTemp){
				    	newDotColor = "yellow";
				    }else{
				    	newDotColor = "#4CFF00";
				    }
			    }
				//CALCULATE
				var nextTop = newDotCalcNum2;
				var nextLeft = 269 - ((newRounded-1) * (269 / (dataAmount - 1)))
				//CREATE GRADIENT
				if(dotColor == newDotColor){
					//do nothing. Same color! yay!
				}else{
					//create a gradient.
					try{
					var newGradient = ctx.createLinearGradient(nextLeft+3, nextTop+3, firstLeft+3, firstTop+3);
					newGradient.addColorStop(1,dotColor);
					newGradient.addColorStop(0,newDotColor);
					ctx.strokeStyle = newGradient;
					}catch(gradError){
						console.log(gradError);
						ctx.strokeStyle = dotColor;
					}
				}
				//DRAW LINE!
				ctx.lineWidth ="3";
				ctx.moveTo(nextLeft+3,nextTop+3);
				ctx.lineTo(firstLeft+3,firstTop+3);
				ctx.stroke();
			}
		}
	}else{
		//since there is NOT a previous dot, this is the first dot.
		//REGARDLESS of settings, make a dot to display the first datapoint.
		ctx.beginPath(); 
		ctx.lineWidth="1";
		ctx.strokeStyle=dotColor; 
		ctx.fillStyle=dotColor;
		ctx.beginPath();
		ctx.arc(firstLeft+3, firstTop+3, 3, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
	}
	if (finalDot==true){
		//final dot. draw regardless of settings for LAST datapoint.
		ctx.beginPath(); 
		ctx.lineWidth="1";
		ctx.strokeStyle=dotColor; 
		ctx.fillStyle=dotColor;
		ctx.beginPath();
		ctx.arc(firstLeft+3, firstTop+3, 3, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
	}
	//DOT STUFF!
	ctx.beginPath(); 
	ctx.lineWidth="1";
	ctx.strokeStyle=dotColor; 
	ctx.fillStyle=dotColor;
	ctx.beginPath();
	ctx.arc(firstLeft+3, firstTop+3, canvasDotWidth, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
}

function firstDot(dotData,nextDotData){
	var sgv = dotData["sgv"];
	var previousSgv = nextDotData["sgv"];
	var direction = dotData["direction"];
	var dateString = dotData["dateString"];
	var delta = dotData["delta"];
	//ALARM VARIABLES
    var lowValueTemp = lowValue[0];
	var urgentLowValueTemp = urgentLowValue[0];
	var urgentHighValueTemp = urgentHighValue[0];
    var highValueTemp = highValue[0];
	//MMOL FUNCTIONS HERE!
	if (globalUnit == "mmol") {
	    sgv = mgdlToMMOL(sgv);
	    lowValueTemp = mgdlToMMOL(lowValueTemp);
        urgentLowValueTemp = mgdlToMMOL(urgentLowValueTemp);
        urgentHighValueTemp = mgdlToMMOL(urgentHighValueTemp);
        highValueTemp = mgdlToMMOL(highValueTemp);
        previousSgv = mgdlToMMOL(previousSgv);
	}
	//DELTA LOGIC
	console.log("DELTA IS "+delta);
	if(Object.values(dotData).indexOf("delta") >= 0 || delta == "undefined" || !delta || delta == null){
		//delta does not exist. time to calculate manually.
		var calculateDelta = sgv-previousSgv; 
		delta = calculateDelta;
	}
	//SET DATES ON POPUP
	convertDate(dateString);
    //document.getElementById("date2").innerHTML = convertDate(dateString);
    convertDateFinal(dateString);
    //SET MAIN BLOOD SUGAR VALUE AND GET SOME POPUP ELEMENTS
    var mainText = document.getElementsByClassName("mainText");
    var mainTextHolder = document.getElementsByClassName("mainTextHolder");
    mainText[0].innerHTML = sgv;
    //ARROW VARIABLES
    var arrowUrlString = arrowValues(direction.toUpperCase());
    var arrowStr = "";
    //COLOR VALUE VARIABLES
    var backgroundColorVal;
    var textColor;
    //COLOR VALUE LOGIC
   	if(globalTheme == "colors"){
		backgroundColorVal = "black";
    	//mainTextHolder[0].style.borderColor = "black";
	    if(Number(sgv) >= Number(urgentHighValueTemp) || Number(sgv) <= Number(urgentLowValueTemp)){
	    	textColor = "red";
	    	arrowStr = "red";
	    }else if(Number(sgv) >= Number(highValueTemp) || Number(sgv) <= Number(lowValueTemp)){
	    	textColor = "yellow";
	    	arrowStr = "yellow";
	    }else{
	    	textColor = "#4CFF00";
	    	arrowStr = "green";
	    }
   	}else{
   		//assume it's the DEFAULT value (gray)
	    if (Number(sgv) <= Number(lowValueTemp)) {
	        backgroundColorVal = "red";
	        textColor = "black";
	    } else if (Number(sgv) >= Number(highValueTemp)) {
	        backgroundColorVal = "#c6a400";
	        textColor = "black";
	    } else {
	        backgroundColorVal = "black";
	        textColor = "gray";
	        arrowStr = "gray";
	    }
   	}
   	//SET COLORS OF ELEMENTS
   	mainTextHolder[0].style.backgroundColor = backgroundColorVal;
   	mainText[0].style.color = textColor;
   	//SET ARROW ELEMENT
    var arrowImage = document.getElementsByClassName("arrowImage");
    arrowImage[0].src = arrowStringVal + arrowStr + ".png";
    //DELTA LOGIC
    newNum = Math.round(Number(delta));
    if (newNum >= 0) {
        newNum = "+" + newNum;
    }

    var fullDeltaLabel = document.getElementsByClassName("fullDeltaLabel");
    var fullInnerDeltaLabel = document.getElementsByClassName("fullInnerDeltaLabel");
    fullDeltaLabel[0].innerHTML = unitToProperString(globalUnit);
    if (globalUnit == "mmol") {
        newNum = mgdlToMMOL(newNum);
        fullInnerDeltaLabel[0].style.fontSize = "12px"
        fullInnerDeltaLabel[0].style.top = "-10px"
        fullDeltaLabel[0].style.top = "-9px";
        fullDeltaLabel[0].style.fontSize = "12px"
    } else {
        fullInnerDeltaLabel[0].style.fontSize = "14px"
        fullInnerDeltaLabel[0].style.top = "-14px"
        fullDeltaLabel[0].style.top = "-16px";
        fullDeltaLabel[0].style.fontSize = "16px"
    }
    fullInnerDeltaLabel[0].innerHTML = newNum;

}

function clearLines(){
	var lineObjs = document.getElementsByClassName('destroyLine');
	var textObjs = document.getElementsByClassName('destroyMarkers');
	while(lineObjs[0] ){
	    lineObjs[0].parentNode.removeChild(lineObjs[0])
	}
	while( textObjs[0] ){
	    textObjs[0].parentNode.removeChild(textObjs[0])
	}
}
function createLines(amount,[bottomVal,topVal]){
	//CLEAR LINES AND SET VARIABLES
	clearLines();
	amount = amount -1;
	var topLine = Number(document.getElementById("linetop").offsetTop);
	var bottomLine = Number(document.getElementById("linebottom").offsetTop);
	var differenceBetween = topLine-bottomLine;
	var differencePer = differenceBetween/amount;
	//LOOP THROUGH AND GENERATE THE LINES
	for(var i = 0; i < amount; i++){
		//CREATE LINE AND SET PROPERTIES
		var newLinePos = bottomLine+(i*differencePer)
		var lineClone = document.createElement("div");
		lineClone.className = "destroyLine";
		lineClone.style.top = newLinePos+"px";
		document.getElementsByClassName("lines")[0].appendChild(lineClone);
	}
	for(var i = 0; i < amount+1; i++){
		//CREATE TEXT AND SET PROPERTIES
		//var bottomVal = 40;
		//var topVal = 400;
		var theDifference = topVal-bottomVal;
		var newLineText = 400-(i*((400-40)/amount));
		var newLinePos = bottomLine+(i*differencePer)
		var textClone = document.createElement("p");
		textClone.className = "destroyMarkers";
		textClone.style.top = newLinePos-(17/2)+"px";
		textClone.innerHTML = bottomVal + (theDifference/(amount))*i;
		document.getElementsByClassName("chartBackground")[0].appendChild(textClone);
	}
}
function intervalLines(topVal,bottomVal,inputInterval,callbackfunc){
	var testValues = [1,2,5,10,25,50,100]; //mgdl
	if(globalUnit=="mmol"){
		//it's mmol. change the values to be more accurate to mmol.
		testValues = [.05,.1,.25,.50,1,2,2.5,4,5];
	}
	//var amountValues = [];
	var setInterval = "dne";
	var setNumber = 0;
	for(var i =0;i<testValues.length;i++){
		var tempInterval = testValues[i];
		var newTopValueTemp = Math.ceil(topVal/tempInterval)*tempInterval;
		var newBottomValueTemp = Math.floor(bottomVal/tempInterval)*tempInterval;
		var newAmountTemp = newTopValueTemp-newBottomValueTemp;
		var newAmountCalcTemp = ((newAmountTemp/tempInterval)+1)	
		if(globalUnit=="mmol"){
			newTopValueTemp = Math.ceil(mgdlToMMOL(topVal)/tempInterval)*tempInterval;
			newBottomValueTemp = Math.floor(mgdlToMMOL(bottomVal)/tempInterval)*tempInterval;
			newAmountTemp = newTopValueTemp-newBottomValueTemp;
		 	newAmountCalcTemp = ((newAmountTemp/tempInterval)+1)	
		}
		//get one CLOSEST to the interval AMOUNT!
		//amountValues[i] = newAmountCalc;
		console.log("CALCULATED "+newAmountCalcTemp+" FROM "+tempInterval);
		if(setInterval == "dne"){
			//null, just set it.
			setInterval = newAmountCalcTemp;
			setNumber = tempInterval;
		}else{
			//not null. do math.
			var mathA = Math.abs(newAmountCalcTemp - inputInterval);
			var mathB = Math.abs(setInterval - inputInterval);
			//IF MATH A IS SMALLER, SET IT!
			console.log("A IS ");
			console.log(mathA);
			console.log(mathB);
			if(mathA > mathB){
				//
			}else if(mathA < mathB){
				//again, do nothing.
				setInterval = newAmountCalcTemp;
				setNumber = tempInterval;
			}else{
				//they're the same, go with more data.
				if(newAmountCalcTemp > setInterval){
					setInterval = newAmountCalcTemp;
				}
				//do nothing
			}
		}
	}
	//round up now
	console.log("WENT WITH"+setNumber);
	var newTopValue = Math.ceil(topVal/setNumber)*setNumber;
	var newBottomValue = Math.floor(bottomVal/setNumber)*setNumber;
	var newAmount = newTopValue-newBottomValue;
	var newAmountCalc = ((newAmount/setNumber)+1)	
	if(globalUnit=="mmol"){
		newTopValue = Math.ceil(mgdlToMMOL(topVal)/setNumber)*setNumber;
		newBottomValue = Math.floor(mgdlToMMOL(bottomVal)/setNumber)*setNumber;
		newAmount = newTopValue-newBottomValue;
		newAmountCalc = ((newAmount/setNumber)+1)
	}
	//console.log("NEW AMOUNT IS "+newAmountCalc)
	//createLines(newAmountCalc,[newBottomValue,newTopValue]);
	if(callbackfunc){
		callbackfunc(newAmountCalc,[newBottomValue,newTopValue]);
	}
}
function createGraph(dataParsed,dataAmount){
	var c=document.getElementsByClassName("canvasObject")[0];
	var ctx=c.getContext("2d");
	ctx.clearRect(0, 0, c.width, c.height);
	//BEFORE we create the graph, we should get some simple data.
	var lowestGraphNum = null;
	var highestGraphNum = null;
	var marginOfError = .20;
	var actualTotal = 0;
	var actualGraphTable = [];
	var hitLimitYet = false;
	for(i=0;i<289&&hitLimitYet==false;i++){
		if(Object.values(dataParsed[i]).indexOf("sgv") >= 0){
			if(dataAmount == actualGraphTable.length){
				console.log("WE HIT THE LIMIT");
				hitLimitYet=true;
			}else{
				//add checking for date.
				if(i>0){
					var tempDate = dataParsed[i]["date"];
					var oldDate = dataParsed[0]["date"];
   			 		var newTimestampDifference = oldDate-tempDate;
    				var newRounded = Math.round(newTimestampDifference/300000);
    				//console.log("NEW ROUNDED IS "+newRounded);
    				if(newRounded>=dataAmount){
    					//too much data. break.
    					console.log("TOO MUCH DATA");
    					hitLimitYet=true;
    					break
    				}
    				//console.log("NEW ROUNDED IS "+newRounded);
				}
				//sgv exists. add to new table.
				actualGraphTable.push(dataParsed[i]);
				var tempSGV = dataParsed[i]["sgv"];
				actualTotal++;
				if(Number(tempSGV) < lowestGraphNum || lowestGraphNum == null){
					lowestGraphNum = Number(tempSGV);
				}
				if(Number(tempSGV) > highestGraphNum || highestGraphNum == null){
					highestGraphNum = Number(tempSGV);
				}
			}
		}else{
			//not a proper datapoint. could be used for a NON-bg data point, however.
			//console.log("BAD DATA");
			//insert an EMPTY datapoint.
		}
	}
	//
	console.log(actualGraphTable.length)
	console.log(actualTotal);
	console.log("THESE ARE BETTER");
	var graphDiff = (highestGraphNum-lowestGraphNum); 
	//lowestGraphNum=lowestGraphNum-(graphDiff*marginOfError);
	//highestGraphNum=highestGraphNum+(graphDiff*marginOfError);
	console.log("LOWEST IS "+lowestGraphNum);
	console.log("HIGHEST IS "+highestGraphNum);
	//createLines(5,[lowestGraphNum,highestGraphNum],25)
	intervalLines(highestGraphNum,lowestGraphNum,5,
	function(newAmountCalc,[newBottomValue,newTopValue]){
		createLines(newAmountCalc,[newBottomValue,newTopValue]);
		for (i = 0; i < dataAmount; i++) {
			var firstValue = false;
			var indivString = actualGraphTable[i];
			if (i == 0) {
				firstDot(actualGraphTable[i],actualGraphTable[i+1]);
			    firstValue = true;
			}
			if(indivString){
				var isLastDot = false;
				if(i==(actualGraphTable.length-1)){
					isLastDot = true;
				}
				createDot(indivString,dataAmount,[newBottomValue,newTopValue],actualGraphTable[i-1] || "dne",isLastDot,actualGraphTable);
			}
		}
	});
       
}

function parseData(response) {
    //make sure to double check alarm values first of all!
    if (response != "dne") {
        //there is a response. now get unit type.
        chrome.storage.local.get(['unitValue'], function(unitResult) {
        	chrome.storage.local.get(['dataAmount'], function(dataResult) {
	            var unitType = Object.values(unitResult)[0];
	            var dataAmount = Number(Object.values(dataResult)[0]);
	            document.getElementsByClassName("errorText")[0].innerHTML = ""
	            globalOldNumber = dataAmount;
	            //make sure to delete all previous dots.
	            var parsed = JSON.parse(response);
	            //console.log("LENGTH IS " + parsed.length);
	            console.log("PARSING DATA NOW!");
	            globalUnit = unitType;
	            createGraph(parsed,dataAmount);
       		});
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
        chrome.storage.local.get(['dataAmount'], function(dataResult) {
	        var convertedData = Object.values(exportedData);
	        var dataAmount = Number(Object.values(dataResult)[0]);
	        if (JSON.stringify(convertedData) == JSON.stringify(globalOldData) && dataAmount == globalOldNumber) {
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
    });
}

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
        }
    });
}

function manipulateURL(urlObj) {
    var siteUrlBase = urlObj['siteUrl'];
    var siteTokenBase = urlObj['siteToken'];/*Object.values(urlObj)[0];*/
	console.log("manipulateURL " + siteUrlBase);
	console.log("manipulateURL " + siteTokenBase);
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
    siteUrlBase = siteUrlBase + '?token=' + siteTokenBase;
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
                //chrome.extension.getBackgroundPage().webRequest(function() {
                    //data saving is done - it has returned!
                    checkForUpdates();
                    //force refresh graph;
                //});
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
            chrome.storage.local.get(['siteUrl', 'siteToken'], function(siteData) {
				console.log(siteData);
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

function checkColorVariables(){
	chrome.storage.local.get(['colors'], function(result) {
		globalTheme = Object.values(result)[0];
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
    checkColorVariables();
    chrome.storage.local.get(['bsTable'], function(exportedData) {
        var convertedData = Object.values(exportedData);
        //alert(convertedData);
        parseData(convertedData);
        globalOldData = convertedData;
        //setInterval(checkForUpdates, 500);
    });
}