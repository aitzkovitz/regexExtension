document.addEventListener('DOMContentLoaded', function(){
	"use strict";

	// store useful elements
	var manualCheck = $('#manual-select');
	var modifiers = $('#modifiersTextbox');
	var userRegex = $('#manualTextbox');

	var submitSearch = function(){
		var checkedArray = []; 
		$('input:checked').each(function(){
    		checkedArray.push($(this).attr('name'));
		});
		
		// make custom object to be turned into regex
		var userRegexObject = {"expression" : userRegex.val(), "mods" : modifiers.val()};
		var eventInfo = { "mode": manualCheck.is(':checked') , "formInfo": checkedArray, "userRegexInfo": userRegexObject }; 

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  			chrome.tabs.sendMessage(tabs[0].id, {
  				"regexInfo": userRegexObject,
  				"eventInfo": eventInfo,
				"clearMatches": false
  			}, function(response) {
    			console.log(response.result);
  			});
		});



	};
	
	function clearMatches(){
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
  				"clearMatches": true
  			}, function(response) {
    			console.log(response.result);
  			});
		});
	}
	
	submitSearch();
	
	// update on form changes
	$("li[class*='parent']").click(function(){
		$(this).children("ul[class*='child']").slideToggle("slow", function(){
			console.log('toggled');
		});
	});
	
	// clear form
	$('#clear').click(function(){
		clearMatches();
	});
	
	// only toggle child when parent is clicked
	$(".child").on("click", function(event) {
        event.stopPropagation();
   });
	
	
	$('#autoForm').change( function(){
		!manualCheck.is(':checked') && submitSearch();
	});

	$('#submit-manual').click(function(){
		manualCheck.is(':checked') && userRegex.val() !== "" && submitSearch();
	});

    $('#manual-select').change(function(){
	    if(this.checked){
			$('#autoForm').fadeOut('fast');
	        $('#manual').fadeIn('fast');
			
	    } else {
	        $('#manual').fadeOut('fast');
			$('#autoForm').fadeIn('fast');
	    }
	});
});