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
        })
        .catch(err => console.log("Navbar error:", err));
    }
}

// ✅ SAFE SOCKET (only where needed)
if (typeof io !== "undefined") {
    const socket = io("http://localhost:5000");

    socket.on("newOrder", (data) => {
        const ordersEl = document.getElementById("orders");

        if (ordersEl) {
            const li = document.createElement("li");
            li.innerText = "Order ID: " + data.orderId;
            ordersEl.appendChild(li);
        }
    });
}

// ✅ SAFE SALES (only dashboard page)
function loadSales() {
    const ordersEl = document.getElementById("totalOrders");
    if (!ordersEl) return;

    fetch("http://localhost:5000/orders/sales", {
        headers: { Authorization: "Bearer " + token }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("totalOrders").innerText = data.totalOrders || 0;
        document.getElementById("totalRevenue").innerText = data.totalRevenue || 0;
        document.getElementById("todayOrders").innerText = data.todayOrders || 0;
        document.getElementById("todayRevenue").innerText = data.todayRevenue || 0;
    });
}

// ✅ RUN AFTER PAGE LOAD
window.addEventListener("load", () => {
    loadNavbar();
    loadSales();
});

// ✅ PRODUCTS PAGE LOGIC
const recipeSelect = document.getElementById("recipe");
const ingredientsList = document.getElementById("ingredients-list");

if (recipeSelect) { // only run if on products.html
    // Load ingredients when recipe selected
    recipeSelect.addEventListener("change", () => {
        fetch("http://localhost:5000/ingredients", {
            headers: { Authorization: "Bearer " + token }
        })
        .then(res => res.json())
        .then(data => {
            ingredientsList.innerHTML = "";
            data.forEach(i => {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = i.id;
                checkbox.id = `ingredient-${i.id}`;

                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                label.innerText = `${i.name} (${i.stock})`;

                const div = document.createElement("div");
                div.appendChild(checkbox);
                div.appendChild(label);

                ingredientsList.appendChild(div);
            });
        });
    });
}

// Add Product
function addProduct() {
    if (!document.getElementById("name")) return; // safety check

    const selectedIngredients = Array.from(ingredientsList.querySelectorAll("input[type=checkbox]:checked"))
        .map(i => i.value);

    if (selectedIngredients.length === 0) {
        alert("Select at least one ingredient!");
        return;
    }

    const formData = new FormData();
    formData.append("name", name.value);
    formData.append("price", price.value);
    formData.append("recipe", recipe.value);
    formData.append("ingredients", JSON.stringify(selectedIngredients));

    if (image.files[0]) formData.append("image", image.files[0]);

    fetch("http://localhost:5000/products", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: formData
    }).then(() => {
        name.value = "";
        price.value = "";
        recipe.value = "";
        ingredientsList.innerHTML = "";
        image.value = "";
        alert("Product added!");
    });
}