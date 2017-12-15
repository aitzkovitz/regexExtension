document.addEventListener('DOMContentLoaded', function(){
	"use strict";

	// store useful elements
	var manualCheck = $('#myonoffswitch');
	var modifiers = $('#modifiersTextbox');
	var userRegex = $('#manualTextbox');

	var submitSearch = function(){
		var checkedArray = []; 
		$('input:checked').not('#myonoffswitch').each(function(){
    		checkedArray.push($(this).attr('name'));
		});
		
		// make custom object to be turned into regex
		var userRegexObject = {"expression" : userRegex.val(), "mods" : modifiers.val()};
		var eventInfo = { "mode": !manualCheck.is(':checked') , "formInfo": checkedArray, "userRegexInfo": userRegexObject }; 

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  			chrome.tabs.sendMessage(tabs[0].id, {
  				"action"		: "initialSearch",
  				"regexInfo"		: userRegexObject,
  				"eventInfo"		: eventInfo,
				"clearMatches"	: false
  			}, function(response) {
    			console.log(response.result);
  			});
		});

	};

	function updateView(clearFlag){
		// get array of checked boxes
		var checkedArray = [];
		if (!clearFlag){
			$('input:checked').not('#myonoffswitch').each(function(){
    			checkedArray.push($(this).attr('name'));
			});	
		}
		console.log('update');

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				"action"	: "updateView",
  				"updateView": checkedArray
  			}, function(response) {
    			console.log(response.result);
  			});
		});	
	}
	
	submitSearch();
	
	// update on form changes
	$("li[class*='parent']").click(function(){
		$(this).children("ul[class*='child']").slideToggle("fast", function(){
			console.log('toggled');
		});
	});
	
	// clear form
	$('#clear').click(function(){
		//clearMatches();
		updateView(1);
	});
	
	// only toggle child when parent is clicked
	$(".child").on("click", function(event) {
        event.stopPropagation();
   	});
	
	
	$('#autoForm').change( function(){
		if (manualCheck.is(':checked')){
			updateView(0);
		}
	});

	$('#submit-manual').click(function(){
		if (manualCheck.is(':checked') && userRegex.val() !== ""){
			submitSearch();
		}
	});

    $('#myonoffswitch').change(function(){
	    if(this.checked){
			$('#autoForm').fadeOut('fast', function(){
				$('#manual').fadeIn('fast');
			});
			
	    } else {
	        $('#manual').fadeOut('fast', function(){
	        	$('#autoForm').fadeIn('fast');
	        });
	    }
	});
});