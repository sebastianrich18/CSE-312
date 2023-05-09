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

//According to cookie, increment the winner 
function incrementWinCount(cookie) {

}