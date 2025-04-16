let map, userMarker, driverMarker;

function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    map = new google.maps.Map(mapElement, {
        center: { lat: 0, lng: 0 },
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

                const user = auth.currentUser;
                if (user) {
                    db.ref("users/" + user.uid).once("value", snapshot => {
                        const userData = snapshot.val();
                        if (userData && userData.role === "rider") {
                            db.ref("riders/" + user.uid + "/location").set(userLocation);
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

function trackDriverLocation(driverId) {
    db.ref("drivers/" + driverId + "/location").on("value", driverSnapshot => {
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

// ✅ Make initMap globally accessible
// Ensure initMap is defined before Maps loads
window.initMap = function () {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
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

                const user = auth.currentUser;
                if (user) {
                    db.ref("users/" + user.uid).once("value", snapshot => {
                        const userData = snapshot.val();
                        if (userData && userData.role === "rider") {
                            db.ref("riders/" + user.uid + "/location").set(userLocation);
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
};
