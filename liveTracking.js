let map, myMarker, otherMarker;

// Get the UID of the other user from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const otherUID = urlParams.get("with");

auth.onAuthStateChanged(user => {
    if (user && otherUID) {
        initMap(user.uid, otherUID);
    } else {
        alert("User not authenticated or missing user to track.");
    }
});

function initMap(myUID, otherUID) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    // Watch your own location
    navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;
        const myLocation = { lat: latitude, lng: longitude };

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

        map.setCenter(myLocation);
    }, err => {
        alert("Please enable location access.");
        console.error(err);
    }, { enableHighAccuracy: true });

    // Listen to other user location
    db.ref("sharedLocations/" + otherUID).on("value", snapshot => {
        const data = snapshot.val();
        if (data) {
            const otherLocation = { lat: data.latitude, lng: data.longitude };

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
        }
    });
}
