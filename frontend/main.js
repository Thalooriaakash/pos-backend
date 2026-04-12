const API = "http://localhost:5000";

// ✅ AUTH CHECK
const token = localStorage.getItem("token");

if (!token && !window.location.pathname.includes("login.html")) {
    window.location.href = "login.html";
}

// ✅ LOAD NAVBAR
function loadNavbar() {
    const nav = document.getElementById("navbar");
    if (nav) {
        fetch("navbar.html")
        .then(res => res.text())
        .then(data => {
            nav.innerHTML = data;
        });
    }
}

// ✅ LOGOUT
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// AUTO LOAD NAVBAR
window.onload = () => {
    loadNavbar();
};