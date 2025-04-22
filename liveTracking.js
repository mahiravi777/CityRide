import { db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { auth } from './firebase-config.js';

let map, myMarker, otherMarker, directionsService, directionsRenderer;
let myUID, otherUID;
let myLocation, otherLocation;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: { lat: 0, lng: 0 },
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            myUID = user.uid;
            const urlParams = new URLSearchParams(window.location.search);
            otherUID = urlParams.get("uid");

            if (!otherUID) {
                alert("Invalid link. No UID found.");
                window.location.href = "locationShare.html";
                return;
            }

            startSharing();
            trackOtherUser();
        } else {
            window.location.href = "index.html";
        }
    });

    // Auto stop after 30 minutes
    setTimeout(() => {
        alert("Location sharing session expired.");
        db.ref("sharedLocations/" + myUID).remove();
        window.location.href = "locationShare.html";
    }, 30 * 60 * 1000);
}

function startSharing() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            myLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            if (!myMarker) {
                myMarker = new google.maps.Marker({
                    position: myLocation,
                    map,
                    label: "You",
                });
            } else {
                myMarker.setPosition(myLocation);
            }

            db.ref("sharedLocations/" + myUID).set(myLocation);

            if (otherLocation) {
                map.setCenter(myLocation);
                showDirections(myLocation, otherLocation);
            }

        }, (error) => {
            console.error("Error getting location:", error);
        });
    } else {
        alert("Geolocation not supported.");
    }
}

function trackOtherUser() {
    db.ref("sharedLocations/" + otherUID).on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            otherLocation = data;

            if (!otherMarker) {
                otherMarker = new google.maps.Marker({
                    position: otherLocation,
                    map,
                    label: "Friend",
                    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                });
            } else {
                otherMarker.setPosition(otherLocation);
            }

            if (myLocation) {
                showDirections(myLocation, otherLocation);
            }
        }
    });
}

function showDirections(start, end) {
    directionsService.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.TWO_WHEELER || google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);

            const leg = response.routes[0].legs[0];
            document.getElementById("info").innerHTML = `
                <strong>ETA:</strong> ${leg.duration.text} <br>
                <strong>Distance:</strong> ${leg.distance.text}
            `;
        } else {
            console.error("Directions request failed:", status);
        }
    });
}

window.initMap = initMap;

window.startNavigation = () => {
    if (myLocation && otherLocation) {
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${otherLocation.lat},${otherLocation.lng}&travelmode=driving`);
    }
};

window.recenterMap = () => {
    if (myLocation) {
        map.setCenter(myLocation);
    }
};
