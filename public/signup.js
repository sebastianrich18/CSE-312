//Function to check the passwords
function CheckPass() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if(document.getElementById("password").value.length < 6) {
        document.getElementById("message").style.color = "Red";
        document.getElementById("message").innerHTML = "Password must be more than 6 characters"
        return false;
    } else {
        if (document.getElementById("password").value == document.getElementById("confirm_password").value) {
            document.getElementById("message").style.color = "Green";
            document.getElementById("message").innerHTML = "Passwords match";
            addToDatabase(username, password)
            return true;
        } else {
            document.getElementById("message").style.color = "Red";
            document.getElementById("message").innerHTML = "Passwords do not match";
            return false
        }
    }
}

function addToDatabase(username, password){
    console.log("Username: " + username + " Password: " + password)
}