db.ref("rideRequests").on("child_added", snapshot => {
    const ride = snapshot.val();
    if (ride.status === "pending") {
        const acceptRide = confirm("New ride request! Accept?");
        if (acceptRide) {
            const driverID = auth.currentUser.uid;

            db.ref("rideRequests/" + snapshot.key).update({ 
                status: "accepted", 
                driverId: driverID 
            }).then(() => {
                alert("Ride accepted! Navigating to rider...");
                window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${ride.pickupLocation.lat},${ride.pickupLocation.lng}`;
            });
        }
    }
});
