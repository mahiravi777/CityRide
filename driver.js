db.ref("rideRequests").on("child_added", snapshot => {
    const ride = snapshot.val();
    if (ride.status === "pending") {
        const acceptRide = confirm("New ride request! Accept?");
        if (acceptRide) {
            db.ref("rideRequests/" + snapshot.key).update({ 
                status: "accepted", 
                driverId: auth.currentUser.uid 
            });
            alert("Ride accepted!");
        }
    }
});
