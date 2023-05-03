//Function to check the passwords
function CheckPass() {
    if(document.getElementById("password").value.length < 6) {
        document.getElementById("message").style.color = "Red";
        document.getElementById("message").innerHTML = "Password must be more than 6 characters"
        return false;
    } else {
        if (document.getElementById("password").value == document.getElementById("confirm_password").value) {
            document.getElementById("message").style.color = "Green";
            document.getElementById("message").innerHTML = "Passwords match";
            return true;
        } else {
            document.getElementById("message").style.color = "Red";
            document.getElementById("message").innerHTML = "Passwords do not match";
            return false
        }
    }
}