let map, driverMarker, directionsService, directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 15
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            position => {
                const driverLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (!driverMarker) {
                    driverMarker = new google.maps.Marker({
                        position: driverLocation,
                        map: map,
                        title: "Your Location",
                        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    });
                } else {
                    driverMarker.setPosition(driverLocation);
                }

                map.setCenter(driverLocation);

                // Update driver location in Firebase
                const user = auth.currentUser;
                if (user) {
                    db.ref("drivers/" + user.uid + "/location").set(driverLocation);
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

    // Listen for ride requests
    auth.onAuthStateChanged(user => {
        if (user) {
            db.ref("rideRequests").on("child_added", snapshot => {
                const ride = snapshot.val();
                if (ride.status === "pending") {
                    const acceptRide = confirm("New ride request! Accept?");
                    if (acceptRide) {
                        db.ref("rideRequests/" + snapshot.key).update({ 
                            status: "accepted", 
                            driverId: user.uid 
                        });
                        startNavigationToRider(snapshot.key, ride);
                    }
                }
            });
        }
    });
}

// **Function to navigate the driver to the rider**
function startNavigationToRider(riderId, ride) {
    const driver = auth.currentUser;
    if (!driver) return;

    db.ref("drivers/" + driver.uid + "/location").once("value", snapshot => {
        const driverLocation = snapshot.val();
        if (!driverLocation) return;

        calculateRoute(driverLocation, ride.pickupLocation, () => {
            alert("Navigation started to rider!");
        });
    });
}

// **Function to navigate from rider to destination**
function startNavigationToDestination(riderId, destination) {
    db.ref("drivers/" + auth.currentUser.uid + "/location").once("value", snapshot => {
        const driverLocation = snapshot.val();
        if (!driverLocation) return;

        calculateRoute(driverLocation, destination, () => {
            alert("Navigating to destination...");
        });
    });
}

// **Function to calculate and display route**
function calculateRoute(start, end, callback) {
    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function (result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            callback();
        } else {
            alert("Error finding route: " + status);
        }
    });
}

// Load the map when the page loads
window.onload = initMap;
