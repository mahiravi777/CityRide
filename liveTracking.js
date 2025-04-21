let map, myMarker, otherMarker, directionsService, directionsRenderer, locationWatcher;
const urlParams = new URLSearchParams(window.location.search);
const otherUID = urlParams.get("with");

auth.onAuthStateChanged(user => {
    if (user && otherUID) {
        checkSharingValidity(user.uid, otherUID);
    }
});

// Check if the request is still valid
function checkSharingValidity(myUID, otherUID) {
    db.ref("locationRequests")
        .orderByChild("status")
        .equalTo("accepted")
        .once("value", snapshot => {
            let valid = false;

            snapshot.forEach(child => {
                const req = child.val();

                const isParticipant = (req.requestedBy === myUID && req.recipientUID === otherUID) ||
                                      (req.requestedBy === otherUID && req.recipientUID === myUID);

                if (isParticipant) {
                    const acceptedAt = req.acceptedAt;
                    const duration = parseInt(req.duration); // in minutes
                    const expiresAt = acceptedAt + duration * 60 * 1000;
                    const now = Date.now();

                    if (now <= expiresAt) {
                        valid = true;
                        const timeLeft = expiresAt - now;
                        initMap(myUID, otherUID, timeLeft);
                    }
                }
            });

            if (!valid) {
                alert("Location sharing session has expired.");
                window.location.href = "locationShare.html";
            }
        });
}

// Initialize map and location tracking
function initMap(myUID, otherUID, timeLeft) {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    directionsRenderer.setMap(map);

    let myLocation = null;
    let otherLocation = null;

    // Watch user's location
    locationWatcher = navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        myLocation = { lat: latitude, lng: longitude };

        db.ref("locations/" + myUID).set({
            lat: latitude,
            lng: longitude,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            sharingWith: otherUID
        });

        if (!myMarker) {
            myMarker = new google.maps.Marker({
                position: myLocation,
                map,
                title: "You",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
        } else {
            myMarker.setPosition(myLocation);
        }

        if (myLocation && otherLocation) {
            showDirections(myLocation, otherLocation);
        }
    });

    // Listen to other user's location
    db.ref("locations/" + otherUID).on("value", snapshot => {
        const data = snapshot.val();
        if (data && data.lat && data.lng) {
            otherLocation = {
                lat: data.lat,
                lng: data.lng
            };

            if (!otherMarker) {
                otherMarker = new google.maps.Marker({
                    position: otherLocation,
                    map,
                    title: "Friend",
                    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                });
            } else {
                otherMarker.setPosition(otherLocation);
            }

            if (myLocation && otherLocation) {
                showDirections(myLocation, otherLocation);
            }
        }
    });

    // Auto-stop after duration
    setTimeout(() => {
        db.ref("locations/" + myUID).remove();
        navigator.geolocation.clearWatch(locationWatcher);
        alert("Location sharing time has ended.");
        window.location.href = "locationShare.html";
    }, timeLeft);
}

function showDirections(start, end) {
    directionsService.route({
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(response);
        } else {
            console.error("Directions request failed due to " + status);
        }
    });
}
