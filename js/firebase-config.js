// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRx0liDc9VmsYXidXlHF_fldxiGlxr1A0",
    authDomain: "steller-sprangs.firebaseapp.com",
    databaseURL: "https://steller-sprangs-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "steller-sprangs",
    storageBucket: "steller-sprangs.firebasestorage.app",
    messagingSenderId: "18615248460",
    appId: "1:18615248460:web:41a9938bf59bf7946cf6e9",
    measurementId: "G-XWMQ0YY0CG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Test Firebase connection
const dbRef = firebase.database().ref();
dbRef.child("test").once("value")
    .then((snapshot) => {
        console.log("Firebase connection successful");
    })
    .catch((error) => {
        console.error("Firebase connection error:", error);
    });

// Form submission handler
function submitForm(event) {
    event.preventDefault();
    console.log("Form submission started");
    
    // Get form values
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        business: document.getElementById('business').value,
        location: document.getElementById('location').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };
    
    console.log("Form data:", formData);

    try {
        // Get a reference to the database
        const db = firebase.database();
        console.log("Database reference obtained");
        
        const contactsRef = db.ref('contact_us');
        console.log("Contacts reference obtained");

        // Push the form data to Firebase
        contactsRef.push(formData)
            .then(() => {
                console.log("Data successfully pushed to Firebase");
                // Show success message
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('errorMessage').style.display = 'none';
                document.getElementById('contactForm').reset();
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    document.getElementById('successMessage').style.display = 'none';
                }, 5000);
            })
            .catch((error) => {
                console.error("Firebase push error:", error);
                // Show error message
                document.getElementById('errorMessage').style.display = 'block';
                document.getElementById('successMessage').style.display = 'none';
                console.error('Error submitting form:', error);
            });
    } catch (error) {
        console.error("General error in form submission:", error);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// Add form event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', submitForm);
    }
});
