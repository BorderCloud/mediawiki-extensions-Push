/**
 * JavasSript for the Push tab in the Push extension.
 * @see http://www.mediawiki.org/wiki/Extension:Push
 * 
 * @author Jeroen De Dauw <jeroendedauw at gmail dot com>
 */

(function($) { $( document ).ready( function() {
	
	// Compatibility with pre-RL code.
	// Messages will have been loaded into wgPushMessages.
	if ( typeof mediaWiki === 'undefined' ) {
		mediaWiki = new Object();
		
		mediaWiki.msg = function() {
			message = window.wgPushMessages[arguments[0]];
			
			for ( var i = arguments.length - 1; i > 0; i-- ) {
				message = message.replace( '$' + i, arguments[i] );
			}
			
			return message;
		}
	}
	
	$.each($(".push-button"), function(i,v) {
		getRemoteArticleInfo( $(v).attr( 'targetid' ), $(v).attr( 'pushtarget' ) );
	});	
	
	$('.push-button').click(function() {
		this.disabled = true;
		this.innerHTML = mediaWiki.msg( 'push-button-pushing' );
		
		if ( $('#checkIncTemplates:checked').attr('checked') ) {
			var pages = window.wgPushTemplates;
			pages.unshift( $('#pageName').attr('value') );
		}
		else {
			var pages = [$('#pageName').attr('value')];
		}
		
		initiatePush(
			this,
			pages,
			$(this).attr( 'pushtarget' ),
			$(this).attr( 'targetname' )
		);
	});
	
	$('#push-all-button').click(function() {
		this.disabled = true;
		this.innerHTML = mediaWiki.msg( 'push-button-pushing' );
		$.each($(".push-button"), function(i,v) {
			$(v).click();
		});
	});	
	
	$('#divIncTemplates').hover(
		function() {
			$('#txtTemplateList').fadeTo( 
				( $('#txtTemplateList').css( 'opacity' ) == 0 ? 'slow' : 'fast' ),
				1
			);
		},
		function() {
			$('#txtTemplateList').fadeTo( 'fast', 0.5 )
		}
	);
	
	function getRemoteArticleInfo( targetId, targetUrl ) {
		$.getJSON(
			targetUrl + '/api.php?callback=?',
			{
				'action': 'query',
				'format': 'json',
				'prop': 'revisions',
				'rvprop': 'timestamp|user|comment',
				'titles': $('#pageName').attr('value'),
			},
			function( data ) {
				if ( data.query ) {
					var infoDiv = $( '#targetinfo' + targetId );
					
					for ( first in data.query.pages ) break;
					
					if ( first == '-1' ) {
						$( '#targetlink' + targetId ).attr( {'class': 'new'} );
						var message = mediaWiki.msg( 'push-tab-not-created' );
					}
					else {
						var revision = data.query.pages[first].revisions[0];
						var dateTime = revision.timestamp.split( 'T' );

						var message = mediaWiki.msg(
							'push-tab-last-edit',
							revision.user,
							dateTime[0],
							dateTime[1].replace( 'Z', '' )
						);
					}
					
					infoDiv.css( 'color', 'darkgray' );
					infoDiv.text( message );
					infoDiv.fadeIn( 'slow' );
				}
			}
		);
	}
	
	function initiatePush( sender, pages, targetUrl, targetName ) {
		$.getJSON(
			wgScriptPath + '/api.php',
			{
				'action': 'push',
				'format': 'json',
				'page': pages.join( '|' ),
				'targets': targetUrl
			},
			function( data ) {
				if ( data.error ) {
					handleError( sender, targetUrl, data.error );
				}
				else if ( data.edit && data.edit.captcha ) {
					handleError( sender, targetUrl, { info: mediaWiki.msg( 'push-err-captacha', targetName ) } );
				}
				else {
					sender.innerHTML = mediaWiki.msg( 'push-button-completed' );
					setTimeout( function() {reEnableButton( sender );}, 1000 );
				}
			}
		); 	
	}
	
	function reEnableButton( button ) {
		button.innerHTML = mediaWiki.msg( 'push-button-text' );
		button.disabled = false;
		
		var pushAllButton = $('#push-all-button');
		
		// If there is a "push all" button, make sure to reset it
		// when all other buttons have been reset.
		if ( typeof pushAllButton !== "undefined" ) {
			var hasDisabled = false;
			
			$.each($(".push-button"), function(i,v) {
				if ( v.disabled ) {
					hasDisabled = true;
				}
			});
			
			if ( !hasDisabled ) {
				pushAllButton.attr( "disabled", false );
				pushAllButton.text( mediaWiki.msg( 'push-button-all' ) );
			}
		}
	}
	
	function handleError( sender, targetUrl, error ) {
		alert( error.info );
		sender.innerHTML = mediaWiki.msg( 'push-button-failed' );	
		setTimeout( function() {reEnableButton( sender );}, 3000 );
	}
	
} ); })(jQuery);