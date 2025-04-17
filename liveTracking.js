let map, myMarker, otherMarker, directionsService, directionsRenderer;

const urlParams = new URLSearchParams(window.location.search);
const otherUID = urlParams.get("with");

auth.onAuthStateChanged(user => {
    if (user && otherUID) {
        initMap(user.uid, otherUID);
    }
});

function initMap(myUID, otherUID) {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    directionsRenderer.setMap(map);

    let myLocation = null;
    let otherLocation = null;

    // Track your own location
    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        myLocation = { lat: latitude, lng: longitude };

        db.ref("sharedLocations/" + myUID).set({
            latitude,
            longitude,
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

    // Listen for other user's location
    db.ref("sharedLocations/" + otherUID).on("value", snapshot => {
        const data = snapshot.val();
        if (data) {
            otherLocation = {
                lat: data.latitude,
                lng: data.longitude
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
