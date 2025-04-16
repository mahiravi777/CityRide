locationShare.js

const auth = firebase.auth();
const db = firebase.database();

let map, myMarker, otherMarker;

// Parse UID from URL
const urlParams = new URLSearchParams(window.location.search);
const otherUID = urlParams.get("with");

auth.onAuthStateChanged(user => {
    if (user && otherUID) {
        initMap(user.uid, otherUID);
    }
});

function initMap(myUID, otherUID) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    // Track your own location
    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        const myLocation = { lat: latitude, lng: longitude };

        // Save to Firebase
        db.ref("sharedLocations/" + myUID).set({
            latitude,
            longitude,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            sharingWith: otherUID
        });

        // Update or place your marker
        if (!myMarker) {
            myMarker = new google.maps.Marker({
                position: myLocation,
                map,
                title: "Your Location",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });
        } else {
            myMarker.setPosition(myLocation);
        }

        map.setCenter(myLocation);

    }, error => {
        console.error("Location error:", error);
        alert("Could not access your location");
    }, {
        enableHighAccuracy: true
    });

    // Listen to other user's location
    db.ref("sharedLocations/" + otherUID).on("value", snapshot => {
        const data = snapshot.val();
        if (data) {
            const otherLocation = { lat: data.latitude, lng: data.longitude };

            if (!otherMarker) {
                otherMarker = new google.maps.Marker({
                    position: otherLocation,
                    map,
                    title: "Friend's Location",
                    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                });
            } else {
                otherMarker.setPosition(otherLocation);
            }
        }
    });
}
