let map, userMarker;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 }, // Default center
        zoom: 15
    });

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            position => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: "Your Location"
                    });
                } else {
                    userMarker.setPosition(userLocation);
                }

                map.setCenter(userLocation);

                // Update location in Firebase
                const user = auth.currentUser;
                if (user) {
                    db.ref("users/" + user.uid + "/location").set(userLocation);
                }
            },
            error => {
                console.error("Error getting location: ", error);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Load the map when the page loads
window.onload = initMap;
