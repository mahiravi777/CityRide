// Initialize Firebase Auth and Database
const auth = firebase.auth();
const db = firebase.database();

// Function to send a location sharing request
document.getElementById("requestShare").addEventListener("click", function () {
    const recipientEmail = document.getElementById("recipientEmail").value;
    const duration = document.getElementById("duration").value;
    const user = auth.currentUser;

    if (user && recipientEmail && duration) {
        const requestRef = db.ref("locationRequests").push();

        requestRef.set({
            requestedBy: user.uid,
            requestedByEmail: user.email,
            recipientEmail: recipientEmail,
            duration: duration,
            status: "pending"
        }).then(() => {
            alert("Location sharing request sent!");
        }).catch(error => {
            alert("Error: " + error.message);
        });
    }
});

// Listen for incoming location sharing requests
auth.onAuthStateChanged(user => {
    if (user) {
        db.ref("locationRequests").orderByChild("recipientEmail").equalTo(user.email)
            .on("value", snapshot => {
                document.getElementById("requestsList").innerHTML = "";
                snapshot.forEach(request => {
                    if (request.val().status === "pending") {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            ${request.val().requestedByEmail} wants your location for ${request.val().duration} minutes
                            <button onclick="acceptRequest('${request.key}', '${request.val().requestedBy}')">Accept</button>
                        `;
                        document.getElementById("requestsList").appendChild(li);
                    }
                });
            });
    }
});

// Accept a location sharing request
function acceptRequest(requestKey, requesterUID) {
    const user = auth.currentUser;
    if (!user) return;

    // Update the request status to accepted
    db.ref("locationRequests/" + requestKey).update({
        status: "accepted"
    }).then(() => {
        alert("Request accepted! Now sharing your live location.");

        // Start sharing location
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;

            db.ref("sharedLocations/" + user.uid).set({
                latitude,
                longitude,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                sharingWith: requesterUID
            });
        }, error => {
            console.error(error);
            alert("Unable to access location. Please allow location access.");
        }, {
            enableHighAccuracy: true,
            maximumAge: 0
        });

        // Also start listening to the requester's location
        listenToUserLocation(requesterUID);
    });
}

// Listen to another user's live location
function listenToUserLocation(userId) {
    db.ref("sharedLocations/" + userId).on("value", snapshot => {
        const locationData = snapshot.val();
        if (locationData) {
            const { latitude, longitude } = locationData;
            showMap(latitude, longitude);
        }
    });
}

// Show location on map
let map;
let marker;

function showMap(latitude, longitude) {
    if (!map) {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: latitude, lng: longitude },
            zoom: 15
        });
        marker = new google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map
        });
    } else {
        map.setCenter({ lat: latitude, lng: longitude });
        marker.setPosition({ lat: latitude, lng: longitude });
    }
}

// When the page loads and user is authenticated, share your own location if you are already sharing
auth.onAuthStateChanged(user => {
    if (user) {
        // Share location if user already accepted a request
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;
            db.ref("sharedLocations/" + user.uid).set({
                latitude,
                longitude,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        }, error => {
            console.error(error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0
        });
    }
});
