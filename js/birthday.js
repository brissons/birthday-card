var mobile = isMobile();

//checks if mobile user
//https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
function isMobile() {
	var isMobile = false;

	if ("maxTouchPoints" in navigator) { 
		isMobile = navigator.maxTouchPoints > 0;
	} 
	else if ("msMaxTouchPoints" in navigator) {
		isMobile = navigator.msMaxTouchPoints > 0; 
	} 
	else {
		var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
		if (mQ && mQ.media === "(pointer:coarse)") {
			isMobile = !!mQ.matches;
		} 
		else if ('orientation' in window) {
			isMobile = true; // deprecated, but good fallback
		} 
		else {
			// Only as a last resort, fall back to user agent sniffing
			var UA = navigator.userAgent;
			isMobile = (
				/\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
				/\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
			);
		}
	}
	return isMobile;
}

//creating scene
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x87ceeb);
			
//creating camera
var aspect = window.innerWidth / window.innerHeight;
const mobileFrustum = 30;
const desktopFrustum = 15;
var d = mobile ? mobileFrustum : desktopFrustum;
camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 1000 );
camera.position.set( 20, 15, 20 );
camera.lookAt( scene.position ); // set origin

//creating lights
var light = new THREE.AmbientLight( 0xffffff ); // white light
var lightTwo = new THREE.AmbientLight( 0x777777 ); // soft white light
scene.add( light );
scene.add( lightTwo );

//adding webgl renderer to body
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//scaling camera and renderer on page resize
window.addEventListener( 'resize', function () {
	var aspect = window.innerWidth / window.innerHeight;
	camera.left = -d * aspect;
	camera.right = d * aspect;
	camera.top = d;
	camera.bottom = -d;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false );

//setting up volume and adding volume controls
var volume = true;
var myAudio = document.getElementById("nature-sounds");
var toggle = document.getElementById('volume-toggle');
myAudio.loop = true; 
myAudio.pause();

toggle.addEventListener('click', function fav(e) {
	volume=!volume;
	toggle.classList.toggle( 'fa-volume-mute' );
	toggle.classList.toggle( 'fa-volume-up' );
	if (!volume) {
		myAudio.pause()
	} 
	else {
		myAudio.play();
}});

//Removing right click menu
window.addEventListener('contextmenu', function (e) {  
  e.preventDefault(); 
}, false);

//Adding mouse controls
//https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android
if(mobile) {
	document.addEventListener('touchstart', handleTouchStart, false);
	document.addEventListener('touchend', end, false);
	document.addEventListener('touchmove', handleTouchMove, false);
}
else {
	document.addEventListener('mousedown', handleMouseStart, false);
	document.addEventListener('mouseup', end, false);
	document.addEventListener('mousemove', handleMouseMove, false);			
}

//rotation effect
var xDown = null;   
var rotation = 0;  
var xDiff=0;
var xDiff2=0;
var mouseHeld = false;
var rightClick = false;

//zoom effect
const target = new THREE.Vector2();
const mouse = new THREE.Vector2();

function getTouches(evt) {
  return evt.touches ||             // browser API
         evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
    xDown = getTouches(evt)[0].clientX;    
};                                                

function handleTouchMove(evt) {
	var xUp = evt.touches[0].clientX;          
	xDiff2 = xDiff;
	xDiff = (xUp - xDown);
	rotation += (xDiff2-xDiff);
}

function handleMouseStart(evt) {
	rightClick = event.which == 3;                              
    xDown = evt.clientX; 
	mouseHeld = true;
};                                                

function handleMouseMove(evt) {
	if(mouseHeld && !rightClick) {
		var xUp = evt.clientX;          
		xDiff2 = xDiff;
		xDiff = (xUp - xDown);
		rotation += (xDiff2-xDiff);
	}
	else if(rightClick) {
		const windowHalf = new THREE.Vector2( window.innerWidth / 2, window.innerHeight / 2 );
		mouse.x = ( event.clientX - windowHalf.x );
		mouse.y = ( event.clientY - windowHalf.y);
	}
}

function end(evt) {
    xDiff=0;                     
	mouseHeld = false;	
	rightClick = false;
};  
	
//Removing loading screen when model is loaded
const loadingManager = new THREE.LoadingManager( () => {
	const loadingScreen = document.getElementById( 'loading-screen' );
	const loader = document.getElementById( 'loader' );
	loadingScreen.classList.add( 'fade-out' );
	loader.classList.add( 'fade-out' );
	if(!mobile) {
		const instructions = document.getElementById( 'control-instructions' );
		instructions.classList.add( 'fade-in' );
	}
	myAudio.play();
	loadingScreen.addEventListener( 'transitionend', function (e) {
		event.target.remove();
	});
});

//removing instructions when user clicks
const instructions = document.getElementById( 'control-instructions' );
window.addEventListener("mousedown", function removeInstructions(e) {
	instructions.classList.remove( 'fade-in' );
	instructions.classList.add( 'fade-out' );
	window.removeEventListener('mousedown', removeInstructions);
}, false);
				
//loading model
var model;
var loader = new THREE.FBXLoader(loadingManager);

loader.load( './models/scene.fbx', function ( object ) {
	model = object;
	model.scale.set(0.05,0.05,0.05);
	model.position.y=-4;
	model.rotation.y=0.2;
	scene.add( model );
});

//adding object detection
renderer.domElement.addEventListener("click", objectDetection, true);
renderer.domElement.addEventListener("touch", objectDetection, true);

function objectDetection(event) {
	var mouseVector = new THREE.Vector2(
		event.clientX / window.innerWidth * 2 - 1,
		-event.clientY / window.innerHeight * 2 + 1
	);
		
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( mouseVector, camera );  
	var intersects = raycaster.intersectObjects(scene.children,true); //array
				
	if(typeof intersects[0] != 'undefined' && intersects[0].object.name=="cassette" && !rightClick) {
		activateSecretMessage();
	}
}

//plays secret message when the user clicks on radio
function activateSecretMessage() {
	var message = document.getElementById("secret-message");
	if(!message.paused) {
		message.pause();
		message.currentTime = 0;
	}
	else {	
		message.play();
	}
}

//rendering and animating the scene
const maxScale = 0.085;
const minScale=0.05;
var lookAt = new THREE.Vector3(0,0,0);


function animate() {
	requestAnimationFrame( animate );

				
	if(mouseHeld && rightClick) {
		target.x = ( 1 + mouse.x ) * 0.01;
		target.y = ( 1 - mouse.y ) * 0.01;

					if( Math.abs(lookAt.x - target.x) > 1) {
						if(lookAt.x < target.x) {
							lookAt.x +=0.08;
							lookAt.z -=0.08;
						}
						if(lookAt.x > target.x) {
							lookAt.x -=0.08;
							lookAt.z +=0.08;
						}
					}
					
					if( Math.abs(lookAt.y - target.y) > 1) {
						if(lookAt.y < target.y) {
							lookAt.y +=0.08;
						}
						if(lookAt.y > target.y) {
							lookAt.y -=0.08;
						}
					}

					camera.lookAt( lookAt);

					if(model.scale.x < maxScale) {
						model.scale.x+=0.001;
						model.scale.y+=0.001;
						model.scale.z+=0.001;
					}
				}
				else {
					var value = Math.abs(lookAt.x);
					
					if(lookAt.x > 0) {
						lookAt.x -=0.2;
						lookAt.z +=0.2;
					}
					if(lookAt.x < 0) {
						lookAt.x +=0.2;
						lookAt.z -=0.2;
					}
										
					if(lookAt.y > 0) {
						lookAt.y -=0.2;
					}
					if(lookAt.y < 0) {
						lookAt.y +=0.2;
					}
			
					camera.lookAt( lookAt);
				
					if(model.scale.x > minScale) {
						model.scale.x-=0.001;
						model.scale.y-=0.001;
						model.scale.z-=0.001;
					}
				}

	model.rotation.y = -0.001*rotation;
	renderer.render( scene, camera );
}
			
animate();
			

			
			//Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
			//mouse click by Khuzema from the Noun Project
			//Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
		//https://sketchfab.com/3d-models/low-poly-candle-65e06721ea424d31be6c0684ebfeaa5b#download
		//https://acornbringer.itch.io/assets-simplistic-low-poly-nature/download/eyJleHBpcmVzIjoxNTkzMjMxODYyLCJpZCI6NDEyMTQwfQ%3d%3d%2epXv3%2bEdJTMaAZh2keyypQK09b6E%3d
		//<a target="_blank" href="https://icons8.com/icons/set/filled-like">Love icon</a> icon by <a target="_blank" href="https://icons8.com">Icons8</a>
		
		
	//Icons made by <a href="https://www.flaticon.com/authors/freepik" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
	
	/*

if(!mobile) {
	//adding keyboard listener
	var keys = [];
	document.addEventListener("keydown", function (e) {
		keys[e.keyCode] = true;
	});
	document.addEventListener("keyup", function (e) {
		keys[e.keyCode] = false;
	});
	
	//setting up keyboard instructions
	document.addEventListener('keydown', function pressKeys(e) {
		if(e.keyCode == 39 || e.keyCode == 37 || e.keyCode == 68 || e.keyCode == 65) {
			document.getElementById("keyboard-instructions").classList.add( 'fade-out-instructions' );
			document.removeEventListener("keydown", pressKeys);
		}
	});
}*/



//else {

//const instructions = document.getElementById("keyboard-instructions");
//if(!mobile) {
//	instructions.classList.add('fade-in');
//}