document.addEventListener("DOMContentLoaded", function(){ window.addEventListener( 'load', function() {
	UAGBCounter.init( '.uagb-block-0180ba56', {"layout":"number","heading":"Add Your Title Here\u2026","numberPrefix":"","numberSuffix":"%","startNumber":0,"endNumber":80,"totalNumber":100,"decimalPlaces":0,"animationDuration":1500,"thousandSeparator":",","circleSize":230,"circleStokeSize":8,"isFrontend":true} );
});
var ssLinksParent = document.querySelector( '.uagb-block-c42b8136' );
ssLinksParent?.addEventListener( 'keyup', function ( e ) {
var link = e.target.closest( '.uagb-ss__link' );
if ( link && e.keyCode === 13 ) {
	handleSocialLinkClick( link );
}
});

ssLinksParent?.addEventListener( 'click', function ( e ) {
var link = e.target.closest( '.uagb-ss__link' );
if ( link ) {
	handleSocialLinkClick( link );
}
});

function handleSocialLinkClick( link ) {
var social_url = link.dataset.href;
var target = "";
if ( social_url == "mailto:?body=" ) {
	target = "_self";
}
var request_url = "";
if ( social_url.indexOf("/pin/create/link/?url=") !== -1 ) {
	request_url = social_url + encodeURIComponent( window.location.href ) + "&media=" + 'https://i0.wp.com/basheerawanazeera.com/wp-content/uploads/2019/06/79a91-waterdroplet.jpg?fit=820%2C452&#038;ssl=1';
} else {
	request_url = social_url + encodeURIComponent( window.location.href );
}
window.open( request_url, target );
}
window.addEventListener("DOMContentLoaded", function(){
	var swiper = new Swiper( ".uagb-block- .uagb-swiper",
		{"autoplay":{"delay":3000,"disableOnInteraction":false,"pauseOnMouseEnter":true,"stopOnLastSlide":false},"loop":true,"speed":800,"effect":"slide","direction":"horizontal","flipEffect":{"slideShadows":false},"fadeEffect":{"crossFade":true},"pagination":{"el":".uagb-block- .swiper-pagination","clickable":true,"hideOnClick":false},"navigation":{"nextEl":".uagb-block- .swiper-button-next","prevEl":".uagb-block- .swiper-button-prev"}}	);
});

window.addEventListener( 'load', function(){
	UAGBTableOfContents._run( {"mappingHeaders":[true,true,true,true,true,true],"scrollToTop":false,"makeCollapsible":false,"enableCollapsableList":false,"initialCollapse":false,"markerView":"disc","isFrontend":true,"initiallyCollapseList":false}, '.uagb-block-02edcf6a' );
} );
var ssLinksParent = document.querySelector( '.uagb-block-c9d48030' );
ssLinksParent?.addEventListener( 'keyup', function ( e ) {
var link = e.target.closest( '.uagb-ss__link' );
if ( link && e.keyCode === 13 ) {
	handleSocialLinkClick( link );
}
});

ssLinksParent?.addEventListener( 'click', function ( e ) {
var link = e.target.closest( '.uagb-ss__link' );
if ( link ) {
	handleSocialLinkClick( link );
}
});

function handleSocialLinkClick( link ) {
var social_url = link.dataset.href;
var target = "";
if ( social_url == "mailto:?body=" ) {
	target = "_self";
}
var request_url = "";
if ( social_url.indexOf("/pin/create/link/?url=") !== -1 ) {
	request_url = social_url + encodeURIComponent( window.location.href ) + "&media=" + 'https://i0.wp.com/basheerawanazeera.com/wp-content/uploads/2019/06/79a91-waterdroplet.jpg?fit=820%2C452&#038;ssl=1';
} else {
	request_url = social_url + encodeURIComponent( window.location.href );
}
window.open( request_url, target );
}
window.addEventListener( 'DOMContentLoaded', function() {
	UAGBInlineNotice.init( {"c_id":null,"cookies":false,"close_cookie_days":1,"noticeDismiss":"","icon":"rectangle-xmark"}, '.uagb-block-' );
});
window.addEventListener( 'DOMContentLoaded', function() {
	UAGBInlineNotice.init( {"c_id":null,"cookies":false,"close_cookie_days":1,"noticeDismiss":"","icon":"rectangle-xmark"}, '.uagb-block-' );
});
 });