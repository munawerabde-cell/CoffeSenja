// 1. DATA AWAL (DATABASE LOKAL)
const defaultMenu = [
    { id: 1, name: "Espresso", category: "Kopi", price: 18000, stock: 25 },
    { id: 2, name: "Caffe Latte", category: "Kopi", price: 25000, stock: 20 },
    { id: 3, name: "Kopi Susu Gula Aren", category: "Kopi", price: 22000, stock: 30 },
    { id: 4, name: "V60 Manual Brew", category: "Kopi", price: 28000, stock: 15 },
    { id: 5, name: "Matcha Latte", category: "Non-Kopi", price: 26000, stock: 18 },
    { id: 6, name: "Red Velvet", category: "Non-Kopi", price: 24000, stock: 15 },
    { id: 7, name: "Croissant Butter", category: "Snack", price: 20000, stock: 12 },
    { id: 8, name: "French Fries", category: "Snack", price: 18000, stock: 20 }
];

// Ambil data dari localStorage jika ada, jika belum pakai defaultMenu
let menus = JSON.parse(localStorage.getItem("kopiSenja_menus")) || defaultMenu;
let transactions = JSON.parse(localStorage.getItem("kopiSenja_tx")) || [];
let cart = [];

// Simpan ke localStorage
function saveData() {
    localStorage.setItem("kopiSenja_menus", JSON.stringify(menus));
    localStorage.setItem("kopiSenja_tx", JSON.stringify(transactions));
}

// FORMAT RUPIAH
function formatRupiah(angka) {
    return "Rp " + angka.toLocaleString("id-ID");
}

// 2. SISTEM LOGIN & LOGOUT
document.getElementById("login-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("login-error");

    if (user === "kasir" && pass === "1234") {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("app-screen").classList.remove("hidden");
        errorMsg.textContent = "";
        initApp();
    } else {
        errorMsg.textContent = "Username atau password salah! (Gunakan: kasir / 1234)";
    }
});

function logout() {
    document.getElementById("app-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// 3. NAVIGASI TAB
function switchTab(tabName) {
    // Sembunyikan semua tab
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    // Tampilkan tab yang dipilih
    document.getElementById("tab-" + tabName).classList.remove("hidden");
    event.target.classList.add("active");

    if (tabName === "kasir") renderMenu();
    if (tabName === "menu") renderManageMenu();
    if (tabName === "laporan") renderReport();
}

// 4. KATALOG MENU & PENCARIAN (TAB KASIR)
function renderMenu() {
    const keyword = document.getElementById("search-input").value.toLowerCase();
    const category = document.getElementById("category-filter").value;
    const grid = document.getElementById("menu-grid");
    grid.innerHTML = "";

    const filtered = menus.filter(item => {
        const matchName = item.name.toLowerCase().includes(keyword);
        const matchCat = category === "Semua" || item.category === category;
        return matchName && matchCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = "<p>Menu tidak ditemukan.</p>";
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "menu-card";
        card.innerHTML = `
            <div>
                <span class="menu-badge">${item.category}</span>
                <h4>${item.name}</h4>
                <p class="menu-price">${formatRupiah(item.price)}</p>
                <p class="menu-stock">Stok: ${item.stock}</p>
            </div>
            <button class="btn-add-cart" onclick="addToCart(${item.id})" ${item.stock === 0 ? "disabled" : ""}>
                ${item.stock === 0 ? "Stok Habis" : "+ Tambah"}
            </button>
        `;
        grid.appendChild(card);
    });
}

// 5. KERANJANG & KALKULASI OTOMATIS (DISKON + PPN)
function addToCart(menuId) {
    const menu = menus.find(m => m.id === menuId);
    if (!menu || menu.stock <= 0) return;

    const existing = cart.find(c => c.id === menuId);
    if (existing) {
        if (existing.qty < menu.stock) {
            existing.qty++;
        } else {
            alert("Jumlah pesanan melebihi stok yang tersedia!");
            return;
        }
    } else {
        cart.push({ id: menu.id, name: menu.name, price: menu.price, qty: 1 });
    }
    renderCart();
}

function updateQty(menuId, delta) {
    const itemIndex = cart.findIndex(c => c.id === menuId);
    if (itemIndex === -1) return;

    const menu = menus.find(m => m.id === menuId);
    const newQty = cart[itemIndex].qty + delta;

    if (newQty <= 0) {
        cart.splice(itemIndex, 1);
    } else if (newQty <= menu.stock) {
        cart[itemIndex].qty = newQty;
    } else {
        alert("Stok maksimal tercapai!");
    }
    renderCart();
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    // Aturan bisnis: Diskon 10% jika subtotal >= Rp 100.000
    const discount = subtotal >= 100000 ? subtotal * 0.10 : 0;
    const afterDiscount = subtotal - discount;
    // PPN 10%
    const tax = afterDiscount * 0.10;
    const total = afterDiscount + tax;

    return { subtotal, discount, tax, total };
}

function renderCart() {
    const container = document.getElementById("cart-items");
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Belum ada pesanan dipilih.</p>';
    } else {
        cart.forEach(item => {
            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <span>${formatRupiah(item.price)} x ${item.qty}</span>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    const { subtotal, discount, tax, total } = calculateTotals();
    document.getElementById("subtotal-text").textContent = formatRupiah(subtotal);
    document.getElementById("discount-text").textContent = "- " + formatRupiah(discount);
    document.getElementById("tax-text").textContent = formatRupiah(tax);
    document.getElementById("total-text").textContent = formatRupiah(total);
}

// 6. PROSES CHECKOUT & CETAK STRUK
function processCheckout() {
    if (cart.length === 0) {
        alert("Keranjang masih kosong! Pilih menu terlebih dahulu.");
        return;
    }

    const customerName = document.getElementById("customer-name").value.trim() || "Pelanggan Umum";
    const { subtotal, discount, tax, total } = calculateTotals();
    const txId = "TRX-" + Date.now().toString().slice(-6);
    const timeNow = new Date().toLocaleString("id-ID");

    // Kurangi stok menu
    cart.forEach(cartItem => {
        const menu = menus.find(m => m.id === cartItem.id);
        if (menu) menu.stock -= cartItem.qty;
    });

    // Simpan transaksi ke riwayat
    const newTx = {
        id: txId,
        time: timeNow,
        customer: customerName,
        items: [...cart],
        subtotal,
        discount,
        tax,
        total
    };
    transactions.unshift(newTx);
    saveData();

    // Tampilkan Struk di Modal
    showReceipt(newTx);

    // Reset keranjang & perbarui tampilan
    cart = [];
    document.getElementById("customer-name").value = "Pelanggan Umum";
    renderCart();
    renderMenu();
}

function showReceipt(tx) {
    const details = document.getElementById("receipt-details");
    let itemsHtml = tx.items.map(i => `<div>${i.name} (${i.qty}x) - ${formatRupiah(i.price * i.qty)}</div>`).join("");

    details.innerHTML = `
        <div><strong>No. Struk:</strong> ${tx.id}</div>
        <div><strong>Waktu:</strong> ${tx.time}</div>
        <div><strong>Pelanggan:</strong> ${tx.customer}</div>
        <hr>
        ${itemsHtml}
        <hr>
        <div>Subtotal: ${formatRupiah(tx.subtotal)}</div>
        <div>Diskon: -${formatRupiah(tx.discount)}</div>
        <div>PPN (10%): ${formatRupiah(tx.tax)}</div>
        <div><strong>TOTAL: ${formatRupiah(tx.total)}</strong></div>
    `;
    document.getElementById("receipt-modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("receipt-modal").classList.add("hidden");
}

// 7. KELOLA MENU (TAMBAH & HAPUS MENU)
document.getElementById("add-menu-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("new-menu-name").value.trim();
    const category = document.getElementById("new-menu-category").value;
    const price = parseInt(document.getElementById("new-menu-price").value);
    const stock = parseInt(document.getElementById("new-menu-stock").value);

    const newMenu = {
        id: Date.now(),
        name,
        category,
        price,
        stock
    };

    menus.push(newMenu);
    saveData();
    this.reset();
    renderManageMenu();
    alert("Menu baru berhasil ditambahkan!");
});

function deleteMenu(id) {
    if (confirm("Yakin ingin menghapus menu ini?")) {
        menus = menus.filter(m => m.id !== id);
        saveData();
        renderManageMenu();
    }
}

function renderManageMenu() {
    const tbody = document.getElementById("manage-menu-tbody");
    tbody.innerHTML = "";

    menus.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${m.name}</td>
            <td>${m.category}</td>
            <td>${formatRupiah(m.price)}</td>
            <td>${m.stock}</td>
            <td><button class="btn-danger" onclick="deleteMenu(${m.id})">Hapus</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// 8. LAPORAN PENJUALAN
function renderReport() {
    const tbody = document.getElementById("report-tbody");
    tbody.innerHTML = "";

    let totalIncome = 0;

    transactions.forEach(tx => {
        totalIncome += tx.total;
        const itemSummary = tx.items.map(i => `${i.name} (${i.qty})`).join(", ");
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${tx.id}</strong></td>
            <td>${tx.time}</td>
            <td>${tx.customer}</td>
            <td>${itemSummary}</td>
            <td><strong>${formatRupiah(tx.total)}</strong></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("stat-total-tx").textContent = transactions.length;
    document.getElementById("stat-total-income").textContent = formatRupiah(totalIncome);
}

function clearTransactions() {
    if (confirm("Hapus semua riwayat transaksi?")) {
        transactions = [];
        saveData();
        renderReport();
    }
}

// INISIALISASI SAAT PERTAMA LOGIN
function initApp() {
    renderMenu();
    renderCart();
}