let map, userMarker, driverMarker;

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
                        title: "Your Location",
                        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    });
                } else {
                    userMarker.setPosition(userLocation);
                }

                map.setCenter(userLocation);

                // Update location in Firebase
                const user = auth.currentUser;
                if (user) {
                    db.ref("users/" + user.uid).once("value", snapshot => {
                        const userData = snapshot.val();
                        if (userData && userData.role === "driver") {
                            // Update driver location
                            db.ref("drivers/" + user.uid).set(userLocation);
                        } else {
                            // Update rider location
                            db.ref("users/" + user.uid + "/location").set(userLocation);
                        }
                    });
                }
            },
            error => {
                console.error("Error getting location: ", error);
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }

    // **Live tracking of driver location for riders**
    auth.onAuthStateChanged(user => {
        if (user) {
            db.ref("rideRequests/" + user.uid).on("value", snapshot => {
                const ride = snapshot.val();
                if (ride && ride.status === "accepted" && ride.driverId) {
                    trackDriverLocation(ride.driverId);
                }
            });
        }
    });
}

// **Function to track driver location live**
function trackDriverLocation(driverId) {
    db.ref("drivers/" + driverId).on("value", driverSnapshot => {
        const driverLocation = driverSnapshot.val();
        if (driverLocation) {
            if (!driverMarker) {
                driverMarker = new google.maps.Marker({
                    position: driverLocation,
                    map: map,
                    title: "Driver's Location",
                    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                });
            } else {
                driverMarker.setPosition(driverLocation);
            }
        }
    });
}

// Load the map when the page loads
window.onload = initMap;
