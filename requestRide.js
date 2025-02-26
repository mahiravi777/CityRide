document.getElementById("requestRide").addEventListener("click", function () {
    if (!auth.currentUser) {
        alert("Please log in first!");
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const rideRequest = {
            riderID: auth.currentUser.uid,
            pickupLocation: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            destination: { 
                lat: 12.9279, // Example destination latitude
                lng: 77.6271  // Example destination longitude
            },
            status: "pending"
        };

        db.ref("rideRequests/" + auth.currentUser.uid).set(rideRequest)
            .then(() => alert("Ride request sent! Waiting for a driver..."))
            .catch(error => alert(error.message));
    }, error => {
        alert("Location access denied!");
    });
});
