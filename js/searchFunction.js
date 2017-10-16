//TBI: function to check if a date is passed or not
//TBI: clear errors will be highlighted red
//TBI: user selects tag to be searched
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse){
	"use strict";
	if (request.clearMatches === true){
		// function to remove previous matches and normalize groups of nodes
		$('.foundMatch').each(function(){
			$(this).contents().unwrap();
			document.getElementsByTagName('body')[0].normalize();
		});
		sendResponse({result: "success"});
		return;
	}

	// function to find and replace matching textNodes
	function replaceNodes(node, regexToMatch) {
		var stringToMatch = node.nodeValue, extraNodes = [];
		
		function replaceSingleNode(newNode, regexToMatch){
			var theMatch = stringToMatch.match(regexToMatch)[0];
			var matchStart = stringToMatch.indexOf(theMatch);
			var remainder = newNode.splitText(matchStart).splitText(theMatch.length);
			var matchTextNode = remainder.previousSibling;
			var newSpan = document.createElement('span');
			newSpan.className = 'foundMatch';
			var newTextNode = document.createTextNode(theMatch);
			newSpan.appendChild(newTextNode);
			var parentNode = matchTextNode.parentNode;
			parentNode.replaceChild(newSpan, matchTextNode);
			extraNodes.push(newNode);
			return remainder;	
		}

		if (stringToMatch.match(regexToMatch) === null ){
			return;
		} else if (stringToMatch.match(regexToMatch).length === 1){
			// save the node on the right that was created because of the split
			var remainder = replaceSingleNode(node,regexToMatch);
			extraNodes.push(remainder);
		} else {
			// save the node on the right that was created because of the split
			var remainderNode = replaceSingleNode(node,regexToMatch);
			replaceNodes(remainderNode, regexToMatch);
		}
		return extraNodes;
	}

	
	// function to get textNodes
	function getTextNodesIn(node, includeWhitespaceNodes) {
    	var textNodes = [], nonWhitespaceMatcher = /\S/;

    	function getTextNodes(node) {
			// if it's a text node, add according to white space param 
			if (node.nodeType === 3 && node.parentNode.nodeName !== 'STYLE' ) {
				if (includeWhitespaceNodes || nonWhitespaceMatcher.test(node.nodeValue)) {
					textNodes.push(node);
				}
			} else {
				// go through recursively call on each node
				for (var i = 0, len = node.childNodes.length; i < len; ++i) {
					getTextNodes(node.childNodes[i]);
				}
			}
		}
    	getTextNodes(node);
    	return textNodes;
	}

	
	// function to remove characters that break matching patterns
	function removeSpecialChars(node){
		var newNode = node.nodeValue.replace(/[\u200B-\u200D\uFEFF]/g, '');
		newNode = newNode.replace(/\u2011/g, '-');
		node.nodeValue = newNode;
		console.log(node.nodeValue);
	}

	
	// function to remove previous matches and normalize groups of nodes
	$('.foundMatch').each(function(){
		$(this).contents().unwrap();
		document.getElementsByTagName('body')[0].normalize();
	});

	
	// whether we are using the manual box or not	
	var manualMode = request.eventInfo.mode;
	
	// regex patterns used to match text
	var regexObj = {
		'disclaimers' 	: new RegExp(/(?:\*{1,3}|\u2021|\u2020)/, 'iug'),
		'phone' 		: new RegExp(/(?:\d[\.\-\x20]?)?\(?\d{3}\)?[\.\-\x20]?\d{3}[\.\-\x20]?\d{4}/, 'ig'),
		'full-date'		: new RegExp(/\d{1,2}\/\d{1,2}\/\d{2,4}/, 'ig'),
		'day' 			: new RegExp(/(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day[^\w]/, 'ig'),
		'month' 		: new RegExp(/(?:(?:January|Jan\.)|(?:February|Feb\.)|(?:March|Mar\.)|April|May|June|July|(?:August|Aug\.)|(?:September|Sept\.)|(?:October|Oct\.)|(?:November|Nov\.)|(?:December|Dec\.))[^\w]/, 'g'),
		'year'			: new RegExp(/\b20[0-5][0-9]\b/, 'g'),
		'state' 		: new RegExp(/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/, 'g'),
		'zip' 			: new RegExp(/\b\d{5}\b(?:\-\d{4})?/, 'g'),
		'email' 		: new RegExp(/(?:\w*\.)*\w*@(?:\w*\.)+(?:com|net|edu|gov)/, 'ig'),
		'price1'		: new RegExp(/\$(?:\d{1,3}\,?)+(?:\.\d{2})?/, 'g'),
		'percent'		: new RegExp(/\d{0,2}\.?\d+\%/,'g'),
		'time'			: new RegExp(/\d?\d\:\d\d(?:\s(?:p|a)\.?m\.?)?/, 'g'),
		'address'		: new RegExp(/\d{1,5}.*\,\x20[A-Z]{2}\x20\d{5}\b(?:\-\d{4})?/,'ig')
	};	

	// get checked items from form
	var formArray = request.eventInfo.formInfo;
	
	// TBI: user selects tag to be searched
	var selector = 'body', i = 0, leftOvers = [];
	var textNodes = getTextNodesIn( document.getElementsByTagName('body')[0], false );
	
	// get rid of zw spaces and other characters that will break pattern matching
	for (var k = 0; k < textNodes.length; k++){
		removeSpecialChars( textNodes[k] );
		console.log( textNodes[k] );
	}
	
	var j;
	if(!manualMode){
		// while there are sill nodes in the list
		while(typeof(textNodes[i]) !== 'undefined'){
			// for each node, go through all selected regex
			for (j = 0; j < formArray.length; j++){
				// replacing nodes creates leftOvers, that also need to be checked by other regex
				leftOvers = replaceNodes(textNodes[i],regexObj[formArray[j]]);
				if (typeof(leftOvers) !== 'undefined'){
					textNodes = textNodes.concat(leftOvers);
				}
			}
			i++;
		}
	} else {		
		var regexMatch = new RegExp(request.regexInfo.expression, request.regexInfo.mods);
		while(i < textNodes.length){
			replaceNodes(textNodes[i], regexMatch);
			i++;
		}
	}
	
	// highlight all matches
	$('.foundMatch').addClass('highlighted');
	
	sendResponse({result: "success"});
});
