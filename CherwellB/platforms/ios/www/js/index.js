var app = {
	// Application Constructor
	initialize: function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function() {

		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener('load', function() {
			//new FastClick(document.body);
		}, false);
		

	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady: function() {
		myApp.start();
	}
};

var myApp = {
	start: function() {
		
		//$(function() {
    FastClick.attach(document.body);
//});
		
		//Code here
	//alert(parseFloat(window.device.version));
		//navigator.splashscreen.show();
		//setTimeout(function(){navigator.splashscreen.hide();},1000);
		
		if (parseFloat(window.device.version) >= 7.0) {
          $('#content').css({'margin-top':'20px'});
    	}
		//Load a template for articles to use (all use the same basic structure)
		var itemtemplate = $('#article-snippet').html();

		//Define how to fill in the template
		prepareTemplate = function(articleDetail) {

			var source = $("#article-snippet").html();
			var template = Handlebars.compile(source);
			var readReplace = "";
			if (articleDetail.Read == 1) {
				readReplace = " readGrey"
			}
			var context = {
				title: articleDetail.Title,
				description: articleDetail.Description,
				storyId: articleDetail.storyId,
				storyDate: articleDetail.PubDate,
				storyAuthor: articleDetail.Author,
				image: articleDetail.Img,
				typeLetter: articleDetail.TypeLetter,
				readGrey: readReplace,
				sectionColour: articleDetail.SectionColour,
				colourLight: articleDetail.ColourLight
			}
			return template(context);

		}


		/* ############## */
		/* EVENT HANDLERS */
		/* ############## */

//Hammer(el).on("swipeleft", function() {
//    alert('you swiped left!');
//});
		$('#content-headlines').on('click','.aStory', function() {
			
			loaderHome("out", "left");
			loaderFooter("out", "left");
			loaderArticle("in", "right");
			
			$(this).addClass('readGrey');

			storyDetails = new Object();
			storyDetails.Title = $(this).children('.item-headline').text();
			storyDetails.Subline = $(this).children('.item-subline').text();
			storyDetails.ImageID = $(this).children('.item-image').html();
			storyDetails.ID = $(this).attr('storyId');
			storyDetails.PubDate = $(this).attr('storydate');
			storyDetails.Author = $(this).attr('storyauthor');

			justID = -1; //Extra details are provided
			switchToArticleView(justID, storyDetails);

		});


/*
		//Skip buttons functionality, powered by a skipID attribute
		$(document).on("click", "#skip-list td", function() {
			var skipID = $(this).attr('skipID');
			$('#content-headlines').scrollTo($('#section-' + skipID), 1000, {
				offset: {
					left: 0,
					top: -10
				}
			});
		});

*/

		$('#header-headlines').click(function() {
			if($('#updating').attr('class') === "spinning1"){
				ajaxAbort();
			} else {
				loadHeadlinesXML();
			}
		});



		$('#header-article').click(function() {
			loaderHome("in", "left");
			loaderFooter("in", "left");
			loaderArticle("out", "right");
		});

		/* ############## */
		/* Clickable footer  */
		/* ############## */


		$('#clickable-home').click(function() {
			if(currentView != "headlines"){
			loaderRemove("right");
			loaderHome("in", "left");
			}
		});
		
		$('#clickable-newsdesk').click(function() {
			if(currentView != "newsdesk"){
			loaderRemove("right");
			loaderNewsdesk("in", "left");
			}
		});
		
		$('#clickable-social').click(function() {
			if(currentView != "social"){
			loaderRemove("right");
			loaderSocial("in", "left");
			}
		});
		
		$('#clickable-fit-college').click(function() {
			if(currentView != "fit-college"){
			loaderRemove("right");
			loaderFitCollege("in", "left");		
			}
			initialiseFitCollege();
		});
		
		

		

		
		$('#content-headlines').on("click", ".sectionmore", function() {
			var moreSectionId = $(this).parent().attr('id').substring(5);
			loadMoreForSection(moreSectionId);
		});



		$('#content-fit-college').on("click", ".voteBtn", function() {
			var voteLink = $(this).attr('voteLink');
			navigator.notification.confirm("Vote for " + $(this).attr('college'), function(button) {
				if (button == 1) {
					commitVote(voteLink)
				}
			}, "Are you sure?", "Yes,Cancel");
		});





		/* ############### */
		/* MODEL FUNCTIONS */
		/* ############### */

		var moreButtonTrackingArray = new Array();
		loadMoreForSection = function(moreSectionId) {
			var moreLastArticleId = moreButtonTrackingArray["latest" + moreSectionId];
			var $q = $('#more-'+moreSectionId);
			var moreSectionHTML = $q.html();
			
			if($q.children('.sectionmore').text().substring(0,7) == "Loading"){
				showAlert('More articles are loading', 'Please wait'); 
				return; //Terminate if already waiting
				}
				
			$q.children('.sectionmore').prepend('Loading ');
			//console.log(moreButtonTrackingArray);
			//("http://www.cherwell.org/app/getMoreFromSection.php?sectionId=" + moreSectionId + "&numArticles=" + 5 + "&startingAfterArticleId=" + moreButtonTrackingArray["latest"+moreSectionId]);
			$.ajax({
				type: "GET",
				cache: true,
				url: "http://www.cherwell.org/app/getMoreFromSection.php?sectionId=" + moreSectionId + "&numArticles=" + 5 + "&startingAfterArticleId=" + moreButtonTrackingArray["latest"+moreSectionId],
				dataType: "xml",
				success: function(xml) {
					$(xml).find('feed').each(function() {
						XMLParseAndPrint(xml, 2, moreSectionId);
					});
					$q.html(moreSectionHTML);
				},
				error: function(xhr) {
					if (xhr.statusText != "abort") { //Checks if the abort was user initiated
						showAlert('Please check that you are connected to the internet', 'Error updating');
						$q.html(moreSectionHTML); //Remove loading to allow for another try
					}
				}
			});
		}





		
		XMLParseAndPrint = function(xml, isMainSection, moreID) { //isMainSection, 1=yes, 2=more
			var lastArticleId = "10000";
			$('#insert-test').html(''); //Off screen display helps rendering
			$(xml).find('section').each(function() {


				if (isMainSection == 1) {
					var sectionTitle = $(this).attr('title');
					var sectionColour = $(this).attr('colour');
					var sectionLightColour = increase_brightness($(this).attr('colour'),90);
					var sectionID = $(this).attr('sectionId'); //Case is correct
					var sectionLength = $(this).find('article').length;
					moreButtonTrackingArray["sectionColour" + sectionID] = sectionColour;
					moreButtonTrackingArray["colourLight" + sectionID] = sectionLightColour;
				} else {
					var sectionID = moreID;
				}

				if (sectionID == 1000) { //ADVERT
					
					$(this).find('advert').each(function() {
					
						var source = $("#advert-template").html();
						var template = Handlebars.compile(source);
						var context = { adlink: $(this).find('link').text(),
										imgaddress: $(this).find('img').text()
										}
					$('#insert-test').append(template(context));
					}); 
					//$('#insert-test').append('<img class="mainpagead" src="http://www.cherwell.org/library/adverts/111.jpg" width="100%" border="0" />');
				}

				var articleCounter = 0;
				$(this).find('article').each(function() {

					articleCounter++;
					
					if (sectionID > 0 && articleCounter == 1 && isMainSection == 1) { //Not an advert or headline or a more section
						
				var source = $("#section-header-template").html();
				var template = Handlebars.compile(source);
			
				var context = {
				sectionID: sectionID,
				sectionTitle: sectionTitle,
				sectionColour: sectionColour
			}
						var prepared = template(context);
						$('#insert-test').append(prepared);
					}

					articleDetail = new Object();
					articleDetail.Title = $(this).find('title').text();
					articleDetail.Description = $(this).find('description').text();
					articleDetail.Img = $(this).find('img').text();
					articleDetail.storyId = $(this).find('articleId').text();
					articleDetail.PubDate = $(this).find('pubDate').text();
					articleDetail.Author = $(this).find('author').text();
					articleDetail.SectionColour = moreButtonTrackingArray["sectionColour" + sectionID]
					articleDetail.ColourLight = moreButtonTrackingArray["colourLight" + sectionID]
					
					
					//Record the latest value for an article in an array
					moreButtonTrackingArray["latest" + sectionID] = articleDetail.storyId;
					
	
					if (window.localStorage.getItem(articleDetail.ArticleID) !== null) {
						articleDetail.Read = 1;
					} else {
						articleDetail.Read = 0;
					}

					if (articleCounter == 1 && sectionID == 0) { //First section first article (headline)
						articleDetail.TypeLetter = "A";
					} else if (articleCounter == 1 || articleCounter <= 5 && sectionID == 0) {
						articleDetail.TypeLetter = "B";
					} else {
						articleDetail.TypeLetter = "C";
					}

					if (isMainSection == 2) { //Loaded through a more request
						articleDetail.TypeLetter = "C";
						//console.log(articleDetail);
					}
					
					articleDetail.TypeLetter = "C"; //Universal set to type C


					var prepared = prepareTemplate(articleDetail);
				//console.log(prepared);
					if (isMainSection == 1) {
						$('#insert-test').append(prepared);
					} else { //must be a more section
					//alert(moreButtonTrackingArray["latest" + sectionID]);
						$('#more-' + moreID).before(prepared);
					}

					if (articleCounter == sectionLength && isMainSection == 1 && sectionID != 0) { //Not an advert or headline and not top story
						var source = $("#more-button-template").html();
						var template = Handlebars.compile(source);
						var context = {
							sectionID: sectionID,
							sectionTitle: sectionTitle,
							sectionColour: sectionColour,
							colourLight: sectionLightColour
						}
						var prepared = template(context);

						$('#insert-test').append(prepared);
					}
				});

				

			});
			if (isMainSection == 1) { //Don't wipe everything for a 'more' request
				$('#insert-placeholder').html($('#insert-test').html()); //Copy the div
				$('#insert-test').html(''); //Off screen display helps rendering
			}
			$('.item-subline').dotdotdot({}); //at the end
			//$('.advert').css({"background-color":"red"});//force show
			//setTimeout(function(){$('.mainpagead').show();}
			//,1000);
		}




		loadHeadlinesXML = function() {
			//var message = '<div id="content-loading">Downloading...</div>';
			//$('#insert-test').html(message);
			$('#updating').attr({'class':'spinning1'});
			$('#content-loading').text('Downloading...');
			ajaxAbort();
			var $t = $(this);
			$.ajax({
				type: "GET",
				cache: false,
				url: "http://www.cherwell.org/app/frontPage.xml",
				dataType: "xml",
				timeout: 30000,
				success: function(xml) {
					
					XMLParseAndPrint(xml, 1);
					
					/*$('#content-headlines').scrollTo($('.typeA'), {
						offset: {
							left: 0,
							top: 0
						}
					}); */
					
					//navigator.notification.vibrate();
					 $("#updating").one('animationiteration webkitAnimationIteration', function() {
						$('#updating').removeClass('spinning1');
						
					});   					
					
				},
				error: function(xhr) {
					$("#updating").one('animationiteration webkitAnimationIteration', function() {
						$('#updating').removeClass('spinning1');
					});
					if (xhr.statusText != "abort") { //Checks if the abort was user initiated
						showAlert('Please check that you are connected to the internet', 'Error updating');
					}
					$('#content-loading').text('Please try again');
				}
			});

			//
			//else clos
		} //Close XML Update function
		
		
		
		
		
		
		switchToArticleView = function(possibleID, storyDetails) {
			//NOTE: currently cannot cope with "just the ID" loading
			articleIDToLoad = possibleID;

			var dateArray = storyDetails.PubDate.split(" ");
			storyDetails.PubDate = dateArray[1] + " " + dateArray[2] + " " + dateArray[3];

			var filledTemplate = '';
			if (storyDetails != -1) { //If extra details were provided, display straight away
				//alert(storyDetails.ImageID);
				var source = $("#content-article-template").html();
				var template = Handlebars.compile(source);
				var context = {
					headline: storyDetails.Title,
					author: storyDetails.Author,
					image: storyDetails.ImageID,
					subline: storyDetails.Subline,
					pubDate: storyDetails.PubDate
				}
				var filledTemplate = template(context);
				//alert(filledTemplate);
				articleIDToLoad = storyDetails.ID;
			}

			$("#content-article").html(filledTemplate);
			$('#content-article').scrollTop(0);
			window.localStorage.setItem(articleIDToLoad, "1");

			ajaxAbort();
			var resultString = ''; //Has to be defined outside of AJAX
			$.ajax({
				type: "GET",
				cache: true,
				url: "http://www.cherwell.org/app/getArticleBody.php?articleId=" + articleIDToLoad + "&add=ios",
				//insert article ID here
				dataType: "html",
				success: function(html2) {
					//alert("http://www.cherwell.org/app/getArticleBody.php?articleId=" + articleIDToLoad + "&add=ios");
					resultString = html2; //Had to be defined outside of AJAX
					resultString = resultString.replace(/<img src\='/g,"<img width='100%' src='http://www.cherwell.org");
					console.log(resultString);
					$('.articleBody').html(resultString); //Inject into placeholder
					$('#content-article').css('background-image', '');
				},
				error: function(xhr) {
					if (xhr.statusText != "abort") { //Checks if the abort was user initiated
						showAlert('Please check that you are connected to the internet', 'Error loading article');
					}
				}
			});

		}





		commitVote = function(voteLink) {

			$("#fitCollegeNotifier").show().css({
				"background-color": "#FF6600"
			}).text("Trying to vote");

			$.ajax({
				type: "GET",
				url: voteLink,
				cache: false,
				dataType: "html",
				success: function(html) {
					showAlert('Your vote was recorded. Please note that only one vote per phone per contest will count towards the total', 'Vote recorded');
					initialiseFitCollege();
				},
				error: function(xhr) {
					if (xhr.statusText != "abort") { //Checks if the abort was user initiated
						showAlert('Please check that you are connected to the internet', 'Error voting');
						$("#footer-fit-college").css({
							"background-color": "#8B0101"
						}).text("Vote failed, try again");
					}
				}
			});
		};






		initialiseFitCollege = function() {

			var context = {
				voteDisplay: "display:none;",
				imageDisplay: "display:none;"
			};
			var source = $("#fit-college-template").html();
			var template = Handlebars.compile(source);


			//alert(context);
			//console.log("printing context: ");
			//console.log(context);
			$("#content-fit-college").html(template(context));

			$("#footer-fit-college").text('Loading the competitors').css({
				'background-color': '#FF6600'
			}); //green
			//Load latest Fit College Competition
			$.ajax({
				type: "GET",
				cache: false,
				url: "http://www.cherwell.org/app/getCurrentFitCollege.php",
				dataType: "xml",
				success: function(xml) {
					var jFC = $.xml2json(xml);
					var context = {
						com1: {
							image: jFC.competitor[0].img,
							college: jFC.competitor[0].college,
							voteLink: jFC.competitor[0].voteLink,
							names: jFC.competitor[0].names,
							score: jFC.competitor[0].currentScore
						},
						com2: {
							image: jFC.competitor[1].img,
							college: jFC.competitor[1].college,
							voteLink: jFC.competitor[1].voteLink,
							names: jFC.competitor[1].names,
							score: jFC.competitor[1].currentScore
						},
						adlink: jFC.competitor[2].adLink,
						imgaddress: jFC.competitor[2].adImg,
						voteButtonDisplay: "block",
						uuid: device.uuid
					};
					//alert(device.uuid);
					$("#content-fit-college").html(template(context));
				
				},
				error: function(xhr) {
					if (xhr.statusText != "abort") { //Checks if the abort was user initiated
						showAlert('Please check that you are connected to the internet', 'Error retrieving');
						$("#footer-fit-college").css({
							"background-color": "#8B0101"
						}).text("Cannot load competitors. Check connection");
					}
				}
			});
		}



		//Alert Message with title

		function alertDismissed() {}
		showAlert = function(message, title, done) {
			title = typeof title !== 'undefined' ? title : 'Message';
			done = typeof done !== 'undefined' ? done : 'Done';
			message = typeof message !== 'undefined' ? message : 'Alert';
			navigator.notification.alert(
			message, // message
			alertDismissed, // callback
			title, // title
			done // buttonName
			);
		}




		/* ############## */
		/* PAGE ANIMATION */
		/* ############## */
		
		//From here https://coderwall.com/p/ahazha
		$.fn.redraw = function(){
  			$(this).each(function(){
   			 var redraw = this.offsetHeight;
  			});
		};

		var currentView = 'headlines'; //Also fit-college, other-page, and article 
		loaderHome = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				currentView = 'headlines';
				$('#content-headlines').attr('class', 'page ' + leftOrRight);
				$('#header-headlines').attr('class', 'header ' + leftOrRight);
				$('#content-headlines').redraw();
				$('#header-headlines').redraw();
				$('#content-headlines').attr('class', 'page transition center');
				$('#header-headlines').attr('class', 'header transition center');
				break;
			case "out":
				$('#content-headlines').attr('class', 'page transition ' + leftOrRight);
				$('#header-headlines').attr('class', 'header transition ' + leftOrRight);
				break;
			}
		}



		loaderFitCollege = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				currentView = 'fit-college';
				
				$('#content-fit-college').attr('class', 'page ' + leftOrRight);
				$('#header-fit-college').attr('class', 'header ' + leftOrRight);
				$('#content-fit-college').redraw();
				$('#header-fit-college').redraw();
				$('#content-fit-college').attr('class', 'page transition center');
				$('#header-fit-college').attr('class', 'header transition center'); 
				
				break;
			case "out":
				$('#content-fit-college').attr('class', 'page transition ' + leftOrRight);
				$('#header-fit-college').attr('class', 'header transition ' + leftOrRight);
				//setTimeout(function(){
				//$('#content-fit-college').attr('class', 'page left');
				//$('#header-fit-college').attr('class', 'header left');
				//},1300);
				//$('#footer-fit-college').attr('class', 'footer transition ' + leftOrRight);
				break;
			}
		}


		
		loaderSocial = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				currentView = 'social'
				$('#content-social').attr('class', 'page ' + leftOrRight);
				$('#header-social').attr('class', 'header ' + leftOrRight);
				$('#content-social').redraw();
				$('#header-social').redraw();
				$('#content-social').attr('class', 'page transition center');
				$('#header-social').attr('class', 'header transition center');
				break;
			case "out":
				$('#content-social').attr('class', 'page transition ' + leftOrRight);
				$('#header-social').attr('class', 'header transition ' + leftOrRight);
				//setTimeout(function(){
				//$('#content-social').attr('class', 'page left');
				//$('#header-social').attr('class', 'header left');
				//},1300);
				break;
			}
		}
		
		loaderNewsdesk = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				currentView = 'newsdesk'
				$('#content-newsdesk').attr('class', 'page ' + leftOrRight);
				$('#header-newsdesk').attr('class', 'header ' + leftOrRight);
				$('#content-newsdesk').redraw();
				$('#header-newsdesk').redraw();
				$('#content-newsdesk').attr('class', 'page transition center');
				$('#header-newsdesk').attr('class', 'header transition center');
				break;
			case "out":
				$('#content-newsdesk').attr('class', 'page transition ' + leftOrRight);
				$('#header-newsdesk').attr('class', 'header transition ' + leftOrRight);
				//setTimeout(function(){
				//$('#content-newsdesk').attr('class', 'page left');
				//$('#header-newsdesk').attr('class', 'header left');
				//},1300);
				break;
			}
		}
		
		loaderRemove = function(leftOrRight) {
			//alert(currentView);
			ajaxAbort();
			switch (currentView) {
			case "headlines":
				loaderHome('out',leftOrRight);
				break;
			case "fit-college":
				loaderFitCollege('out',leftOrRight);
				break;
			case "social":
				loaderSocial('out',leftOrRight);
				break;
			case "newsdesk":
				loaderNewsdesk('out',leftOrRight);
				break;
			}
		}
		
		loaderFooter = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				$('#footer-headlines').attr('class', 'footer ' + leftOrRight);
				$('#footer-headlines').attr('class', 'footer transition center');
				break;
			case "out":
				$('#footer-headlines').attr('class', 'footer transition ' + leftOrRight);
				break;
			}
		}
		
		
				loaderArticle = function(inOrOut, leftOrRight) {
			switch (inOrOut) {
			case "in":
				currentView = 'article';
				$('#content-article').attr('class', 'page ' + leftOrRight);
				$('#header-article').attr('class', 'header ' + leftOrRight);
				$('#content-article').attr('class', 'page transition center');
				$('#header-article').attr('class', 'header transition center');
				break;
			case "out":
				$('#content-article').attr('class', 'page transition ' + leftOrRight);
				$('#header-article').attr('class', 'header transition ' + leftOrRight);
				break;
			}
		}
		

		/* ########## */
		/* BACKGROUND */
		/* ########## */

		var timeClosed = 0;
		var timeUpdated = 0;
		document.addEventListener("resume", onResume, false);
		document.addEventListener("pause", onPause, false);

		function onResume() {
			var d = new Date();
			var n = d.getTime();
			if (n - timeClosed > 600000) { //Auto reload if info older than 10 mins
				loadHeadlinesXML();
			}
		}

		function onPause() {
			var d = new Date();
			timeClosed = d.getTime();
			ajaxAbort();
			//Place pages in strating positions onPause to avoid jerky movements 
			$('#content-headlines').attr('class', 'page center');
			$('#content-article').attr('class', 'page right');
			$('#content-fit-college').attr('class', 'page left');
			$('#content-newsdesk').attr('class', 'page left');
			$('#content-social').attr('class', 'page left');
			
			$('#header-headlines').attr('class', 'header center');
			$('#header-article').attr('class', 'header right');
			$('#header-fit-college').attr('class', 'header left');
			$('#header-social').attr('class', 'header left');
			$('#header-newsdesk').attr('class', 'header left');
			
			$('#footer-headlines').attr('class', 'footer center');
			
			currentView = "headlines";
		}

		//Can cancel all ajax requests at once by calling ajaxAbort
		var xhrPool = [];
		$(document).ajaxSend(function(e, jqXHR, options) {
			xhrPool.push(jqXHR);
		});
		$(document).ajaxComplete(function(e, jqXHR, options) {
			xhrPool = $.grep(xhrPool, function(x) {
				return x != jqXHR
			});
		});
		var ajaxAbort = function() {
			$.each(xhrPool, function(idx, jqXHR) {
				jqXHR.abort();
			});
		};
		
		function increase_brightness(hex, percent){
    // strip the leading # if it's there
    hex = hex.replace(/^\s*#|\s*$/g, '');

    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
    if(hex.length == 3){
        hex = hex.replace(/(.)/g, '$1$1');
    }

    var r = parseInt(hex.substr(0, 2), 16),
        g = parseInt(hex.substr(2, 2), 16),
        b = parseInt(hex.substr(4, 2), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}





		/* ############## */
		/* INIT FUNCTIONS */
		/* ############## */

		//Complex functions to run on startup 2
		loadHeadlinesXML();

	


	} //End of start function
} //End of myApp