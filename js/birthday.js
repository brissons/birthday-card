//creating scene
var scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

//adding webgl renderer to body
var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//creating camera
const mobileFrustum = 30;
const desktopFrustum = 15;
const smallScreenWidth = 992;
var aspect = window.innerWidth / window.innerHeight;
var isSmallScreen = window.innerWidth < smallScreenWidth;
var d = isSmallScreen && (window.innerWidth < window.innerHeight /*checking for landscape mode*/ ) ? mobileFrustum : desktopFrustum;
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(20, 15, 20);
camera.lookAt(scene.position); // set origin

//scaling camera and renderer on page resize
window.addEventListener('resize', function() {
    isSmallScreen = (window.innerWidth < smallScreenWidth) != isSmallScreen ? !isSmallScreen : isSmallScreen;
    d = isSmallScreen && (window.innerWidth < window.innerHeight /*checking for landscape mode*/ ) ? mobileFrustum : desktopFrustum;
    aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

//creating lights
var light = new THREE.AmbientLight(0xffffff); // white light
var lightTwo = new THREE.AmbientLight(0x777777); // soft white light
scene.add(light);
scene.add(lightTwo);

//setting up volume and adding volume controls
var volume = false;
var backgroundAudio = document.getElementById("nature-sounds");
backgroundAudio.loop = true;
backgroundAudio.pause();
var secretMessages = [
    document.getElementById("secret-message"),
    document.getElementById("secret-message-two"),
    document.getElementById("secret-message-three")
];
var toggle = document.getElementById('volume-toggle');

toggle.addEventListener('click', function toggleSound() {
    volume = !volume;
    toggle.classList.toggle('fa-volume-mute');
    toggle.classList.toggle('fa-volume-up');

    if (!volume) {
        secretMessages.forEach(element => element.pause());
        secretMessages.forEach(element => element.currentTime = 0);
        backgroundAudio.pause();
        backgroundAudio.volume = 1;
    } else {
        backgroundAudio.play();
    }
});

//Adding controls
//https://stackoverflow.com/questions/2264072/detect-a-finger-swipe-through-javascript-on-the-iphone-and-android
//rotation effect
var xDown = null;
var rotation = 0;
var xDiff = 0;
var xDiff2 = 0;
var mouseHeld = false;
var rightClick = false;

document.addEventListener('touchstart', function(e) {
    xDown = (e.touches || e.originalEvent.touches)[0].clientX;
}, false);

document.addEventListener('touchstart', function(e) {
    timeout = setTimeout(function() {
       timeout = null;
        // trigged after 1s long click
        console.log('long click handler');
    }, 3000);
}, false);

document.addEventListener('touchend', function() {
    xDiff = 0;
    mouseHeld = false;
    rightClick = false;
}, false);

document.addEventListener('touchmove', function(e) {
    let xUp = e.touches[0].clientX;
    xDiff2 = xDiff;
    xDiff = (xUp - xDown);
    rotation += (xDiff2 - xDiff);
}, false);

document.addEventListener('mousedown', function(e) {
    rightClick = event.which == 3;
    xDown = e.clientX;
    mouseHeld = true;
}, false);

document.addEventListener('mouseup', function() {
    xDiff = 0;
    mouseHeld = false;
    rightClick = false;
}, false);

document.addEventListener('mousemove', function(e) {
    if (mouseHeld && !rightClick) {
        xDiff2 = xDiff;
        xDiff = (e.clientX - xDown);
        rotation += (xDiff2 - xDiff);
    } else if (rightClick) {
        const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
        mouse.x = (event.clientX - windowHalf.x);
        mouse.y = (event.clientY - windowHalf.y);
    }
}, false);

//Removing right click menu
window.addEventListener('contextmenu', function(e) {
    e.preventDefault();
}, false);

//checks if device has touch screen
//https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
var hasTouchScreen = false;

if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
} else if ("msMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
} else {
    var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
        hasTouchScreen = !!mQ.matches;
    } else if ('orientation' in window) {
        hasTouchScreen = true; // deprecated, but good fallback
    } else {
        // Only as a last resort, fall back to user agent sniffing
        var UA = navigator.userAgent;
        hasTouchScreen = (
            /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
            /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
        );
    }
}

//Removing loading screen when model is loaded
const instructions = document.getElementById('control-instructions');
const loadingManager = new THREE.LoadingManager(() => {
    const loadingScreen = document.getElementById('loading-screen');
    const loader = document.getElementById('loader');
    loadingScreen.classList.add('fade-out');
    loader.classList.add('fade-out');

    if (!(hasTouchScreen && isSmallScreen)) {
        instructions.classList.add('fade-in');
    }

    loadingScreen.addEventListener('transitionend', function(e) {
        event.target.remove();
    });
	
	animate();
});

//removing control instructions when user clicks (only if not mobile)
window.addEventListener("mousedown", function removeInstructions(e) {
    if (!(hasTouchScreen && isSmallScreen)) {
        instructions.classList.remove('fade-in');
        instructions.classList.add('fade-out');
    }
    window.removeEventListener('mousedown', removeInstructions);
}, false);


//loading model
var model;
var loader = new THREE.FBXLoader(loadingManager);

loader.load('./models/scene.fbx', function(object) {
    model = object;
    model.scale.set(0.05, 0.05, 0.05);
    model.position.y = -4;
    scene.add(model);
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
    raycaster.setFromCamera(mouseVector, camera);
    var intersects = raycaster.intersectObjects(scene.children, true); //array

    if (typeof intersects[0] != 'undefined' && intersects[0].object.name.includes("cassette") && !rightClick) {
        activateSecretMessage(intersects[0].object.name);
    }
}

//plays secret message when the user clicks on radio
function activateSecretMessage(name) {
    var message;

    switch (name) {
        case "cassetteOne":
            message = secretMessages[0];
            break;
        case "cassetteTwo":
            message = secretMessages[1];
            break;
        case "cassetteThree":
            message = secretMessages[2];
            break;
    }

    if (typeof message != 'undefined' && volume) {
        if (!message.paused) {
            message.pause();
            message.currentTime = 0;
            backgroundAudio.volume = 1;
        } else {
            backgroundAudio.volume = 0.35;
            secretMessages.forEach(element => element.pause());
            secretMessages.forEach(element => element.currentTime = 0);
            message.play();
        }
    }
}

//resets backgrund volume when secret message finishes
secretMessages.forEach(element => element.addEventListener("ended", function() {
    backgroundAudio.volume = 1;
}));

//rendering and animating the scene
const maxScale = 0.085;
const minScale = 0.05;
const target = new THREE.Vector2();
const mouse = new THREE.Vector2();
var lookAt = new THREE.Vector3(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);

    //zoom effect
    if (mouseHeld && rightClick) {
        target.x = (1 + mouse.x) * 0.01;
        target.y = (1 - mouse.y) * 0.01;

        if (Math.abs(lookAt.x - target.x) > 1) {
            if (lookAt.x < target.x) {
                lookAt.x += 0.08;
                lookAt.z -= 0.08;
            }
            if (lookAt.x > target.x) {
                lookAt.x -= 0.08;
                lookAt.z += 0.08;
            }
        }

        if (Math.abs(lookAt.y - target.y) > 1) {
            if (lookAt.y < target.y) {
                lookAt.y += 0.08;
            }
            if (lookAt.y > target.y) {
                lookAt.y -= 0.08;
            }
        }

        camera.lookAt(lookAt);

        if (model.scale.x < maxScale) {
            model.scale.x += 0.001;
            model.scale.y += 0.001;
            model.scale.z += 0.001;
        }
    } else {
        var value = Math.abs(lookAt.x);

        if (lookAt.x > 0) {
            lookAt.x -= 0.2;
            lookAt.z += 0.2;
        }
        if (lookAt.x < 0) {
            lookAt.x += 0.2;
            lookAt.z -= 0.2;
        }
        if (lookAt.y > 0) {
            lookAt.y -= 0.2;
        }
        if (lookAt.y < 0) {
            lookAt.y += 0.2;
        }

        camera.lookAt(lookAt);

        if (model.scale.x > minScale) {
            model.scale.x -= 0.001;
            model.scale.y -= 0.001;
            model.scale.z -= 0.001;
        }
    }

    model.rotation.y = -0.001 * rotation;
    renderer.render(scene, camera);
}

animate();