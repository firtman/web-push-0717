self.addEventListener("push", function(event) {  
    console.log("Received a push message", event);    
    if (event.data) {
        // Payload data available, we notify directly
        event.waitUntil(showNotification(event.data.json().text));
    } else {
        // Payload not available, we need to download the message somehow (fetch?)        
        // if not, we must show a generic notification
        event.waitUntil(showNotification("We have something new for you"));
    }
});


function showNotification(text) {
    self.registration.showNotification("My WebApp", {  
        body: "Data: " + text,  
    });       
}