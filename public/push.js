// Check if Push Notifications are available on load
var pushAvailable = false;
if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    pushAvailable = "webpush";
    registerServiceWorker();
} else if ('safari' in window && 'pushNotification' in window.safari) {
    pushAvailable = "safari"  
} 

if (pushAvailable) {
    document.querySelector("#push").style.display = "block";
    document.querySelector("#btnSubscribe").addEventListener("click", subscribe);
} else {
    alert("Your browser doesn't support Push notifications");   
}

function registerServiceWorker() {
    navigator.serviceWorker.register('sw.js')
        .then(function(registration) {
        // Check the current Notification permission.  
        if (Notification.permission === 'denied') {  
            alert("You don't want push notifications.");  
            return;  
        }
        // Check if there is already a Push Subscription
        // We also update it, in case we want to update it on the server
        navigator.serviceWorker.ready.then(function(reg) { 
            registration.pushManager.getSubscription()
                .then(function(subscription) {  
                    if (!subscription) {  
                        console.log('Not yet subscribed to Push')
                    } else {                        
                        updatePushStatus(subscription);
                    }
                })  
                .catch(function(err) {  
                    console.log('Error during getSubscription()', err);  
                }); 
        });  

    });        
}

function subscribe() {
    if (pushAvailable=="safari") {
        alert("Safari Push Notifications are not available at this time");
    } else {
        var subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                'BH4LbIpTyzELIwvI6dcVMWMhnusNN0s9RUqrVXFdm9HqWM_Ev5ej09ZbtirTzxPGxpHcJkaUxFa3QYVusVyZdec'
            )
        }; 
        navigator.serviceWorker.ready.then(function(registration) {
            registration.pushManager.subscribe(subscribeOptions)
                .then(updatePushStatus)
                .catch(function(e) {
                    if (Notification.permission === 'denied') {
                        alert("You don't want push notifications. :(");  
                    } else {
                        console.log('Unable to subscribe to push.', e);
                    }
                });
        });
    }
}
        
function updatePushStatus(subscription) {
    if (subscription) {
        var endpoint = subscription.endpoint;
        var key = '';
        var auth = '';
        if ('getKey' in subscription) {
            // Key to encode payload data later
            key = arrayBufferToBase64(subscription.getKey('p256dh'));
            auth = arrayBufferToBase64(subscription.getKey('auth'));
        } else {
            // It's a very old browser, it doesn't support payload
            // Are we managing this situation?
        }
        console.log(subscription);
        fetch("/push/subscribe", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                endpoint: endpoint,
                keys: {
                    auth: auth,
                    p256dh: key
                }
            })
        }).then(function() {
            console.log("The user was saved on the server");
        }).catch(function() {
            console.log("The user wasn't saved on the server");
            // TODO: Implement Background Sync Save?
        });
    } else {
        console.log("Subscription data is null");
    }
}



/*** DATA CONVERSION UTILITIES ***/

function arrayBufferToBase64(buffer) {
    var binary = "";
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i=0; i<len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

 // Snippet from https://www.npmjs.com/package/web-push
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}