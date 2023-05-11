// Load the Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize the app with your service account key JSON file
const serviceAccount = require('../public/privatekey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tictactoe-c2eec-default-rtdb.firebaseio.com"
})


function createCookie() {
    // Generate a random string of 32 characters for the cookie salt
    const cookieSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
    // Generate a random string of 32 characters for the cookie value
    const cookieValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
    // Hash the cookie value using SHA256 algorithm
    const hashedCookieValue = window.CryptoJS.SHA256(cookieSalt + cookieValue).toString();
  
    // Set the authentication cookie with the concatenated string of salt and hashed value
    document.cookie = `auth=${cookieSalt}:${hashedCookieValue}; secure;`;
  
    return { hashedString: hashedCookieValue, salt: cookieSalt };
  }

function hashPassword(password, salt) {
    // Concatenate the password and salt
    const saltedPassword = password + salt;

    // Hash the salted password using SHA256 algorithm
    const hashedPassword = window.CryptoJS.SHA256(saltedPassword).toString();

    return { hashedPassword, salt };
}

function signUpSubmitted() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const database = firebase.database();
    const usersRef = database.ref('users');

    // Check if the username already exists
    const handler = usersRef.child(username).on('value', (snapshot) => {
        usersRef.child(username).off('value', handler); // Detach the listener immediately
        const user = snapshot.val();
        if (user) {
        // Username already exists, show an error message to the user
        alert("Username already exists, please choose a different username.");
        window.location.href = "signup.html";
        } else {
        // Username is available, add it to the database
        const { hashedString: cookie, salt: cookieSalt } = createCookie();
        theSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { hashedPassword, salt: passwordSalt } = hashPassword(password, theSalt);

        const newUserRef = usersRef.child(username);
        newUserRef.set({
            cookie,
            cookieSalt,
            username,
            password: hashedPassword,
            passwordSalt,
        })
        .then(() => {
            // Redirect the user to the index.html page
            window.location.href = "index.html";
            alert("Account created successfully!")
        })
        .catch((error) => {
            console.error("Error adding user data to database: ", error);
        });
        }
    });
}



function addToLeaderboard(username, winCount) {
    const database = firebase.database();
    const leaderboardRef = database.ref('leaderboard');

    leaderboardRef.child(username).set({
        username,
        winCount,
    })
    .then(() => {
        // Redirect the user to the index.html page
        window.location.href = "index.html";
        alert("Account created successfully!")
    })
    .catch((error) => {
        console.error("Error adding user data to database: ", error);
    });
}

//Find the user associated with the cookie and increment their wins
function incrementWinCount(cookie){
    const player = findPlayer(cookie);
    if (player != null){
        //Increment the win count
    }
    else {
        //Add win to leaderboard with count 1
        addToLeaderboard(player, 1);
    }

}


function findPlayer(cookie){
    const authCookie = getCookie("auth");
    if (authCookie) {
        console.log("Cookie found: ", authCookie)
        const usersRef = firebase.database().ref("users");
        console.log("usersRef: ", usersRef)
        usersRef.once("value")
        .then((snapshot) => {
            const users = snapshot.val();
            for (const username in users) {
                const { cookie, cookieSalt } = users[username];
                const expectedAuthCookie = `${cookieSalt}:${cookie}`;
                if (authCookie === expectedAuthCookie) {
                    // Display logged in message and hide sign up button
                    return username;

                }
            }
            return null;
        })
        .catch((error) => {
            console.error("Error retrieving user data: ", error);
        });
    }

}


// Function to get the value of a cookie by its name
function getCookie(name) {
    const cookieString = decodeURIComponent(document.cookie);
    const cookieArray = cookieString.split("; ");
    for (let i = 0; i < cookieArray.length; i++) {
        const cookie = cookieArray[i].split("=");
        if (cookie[0] === name) {
            return cookie[1];
        }
    }
    return null;
}

function signUp(username, password) {
    console.log("Signup clicked backend.js")

}