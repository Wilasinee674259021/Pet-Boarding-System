const API = "https://pet-boarding-system.onrender.com/api";

let customers = [];
let pets = [];
let bookings = [];

let selectedCustomerId = null;
let selectedPetId = null;

// ================= START =================

document.addEventListener("DOMContentLoaded", () => {
  const currentDate = document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target.id === "modalOverlay") {
        closeModal();
      }
    });
  }

  loadAllData();
});

// ================= API HELPER =================

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${response.status})`
    );
  }

  return result;
}

// ================= LOAD DATA =================

async function loadAllData() {
  try {
    const [customerData, petData, bookingData] = await Promise.all([
      fetchJSON(`${API}/customers`),
      fetchJSON(`${API}/pets`),
      fetchJSON(`${API}/bookings`),
    ]);

    customers = Array.isArray(customerData) ? customerData : [];
    pets = Array.isArray(petData) ? petData : [];
    bookings = Array.isArray(bookingData) ? bookingData : [];

    updateDashboard();
    renderCustomers();
    renderPets();
    renderBookings();
  } catch (error) {
    console.error("Load data error:", error);
    alert(
      "ไม่สามารถเชื่อมต่อ Backend ได้\n\n" +
        "กรุณาตรวจสอบว่า Backend บน Render กำลังทำงานอยู่\n\n" +
        "รายละเอียด: " +
        error.message
    );
  }
}

// ================= PAGE =================

function showPage(pageId, button = null) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active-page");
  });

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add("active-page");
  }

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  } else {
    document.querySelectorAll(".menu-item").forEach((item) => {
      const onclick = item.getAttribute("onclick");
      if (onclick && onclick.includes(`'${pageId}'`)) {
        item.classList.add("active");
      }
    });
  }

  const titles = {
    dashboard: ["Dashboard", "ภาพรวมระบบรับฝากเลี้ยงสัตว์"],
    customers: ["ลูกค้า", "จัดการข้อมูลเจ้าของสัตว์เลี้ยง"],
    pets: ["สัตว์เลี้ยง", "จัดการข้อมูลสัตว์เลี้ยง"],
    boarding: ["รับฝากสัตว์เลี้ยง", "ค้นหาลูกค้าเดิม เลือกสัตว์เลี้ยง แล้วทำรายการฝากได้ในขั้นตอนเดียว"],
    bookings: ["การจอง", "จัดการรายการรับฝากเลี้ยง"],
  };

  if (titles[pageId]) {
    const pageTitle = document.getElementById("pageTitle");
    const pageDescription = document.getElementById("pageDescription");

    if (pageTitle) pageTitle.textContent = titles[pageId][0];
    if (pageDescription) pageDescription.textContent = titles[pageId][1];
  }
}

// ================= DASHBOARD =================

function updateDashboard() {
  const customerCount = document.getElementById("customerCount");
  const petCount = document.getElementById("petCount");
  const bookingCount = document.getElementById("bookingCount");
  const revenueElement = document.getElementById("revenue");
  const filterSelect = document.getElementById("timeRangeFilter");

  const filterValue = filterSelect ? filterSelect.value : "month";
  const now = new Date();

  // 1. กรองการจองตามช่วงเวลา (คำนวณจาก checkInDate)
  const filteredBookings = bookings.filter((booking) => {
    if (!booking.checkInDate || filterValue === "all") return true;

    const bDate = new Date(booking.checkInDate);
    if (isNaN(bDate.getTime())) return true;

    if (filterValue === "today") {
      return (
        bDate.getDate() === now.getDate() &&
        bDate.getMonth() === now.getMonth() &&
        bDate.getFullYear() === now.getFullYear()
      );
    } else if (filterValue === "month") {
      return (
        bDate.getMonth() === now.getMonth() &&
        bDate.getFullYear() === now.getFullYear()
      );
    } else if (filterValue === "year") {
      return bDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // 2. กรองลูกค้าใหม่ตามช่วงเวลา (หากมี createdAt ถ้าไม่มีจะแสดงตามการกรอง)
  const filteredCustomers = customers.filter((customer) => {
    if (!customer.createdAt || filterValue === "all") return true;

    const cDate = new Date(customer.createdAt);
    if (isNaN(cDate.getTime())) return true;

    if (filterValue === "today") {
      return (
        cDate.getDate() === now.getDate() &&
        cDate.getMonth() === now.getMonth() &&
        cDate.getFullYear() === now.getFullYear()
      );
    } else if (filterValue === "month") {
      return (
        cDate.getMonth() === now.getMonth() &&
        cDate.getFullYear() === now.getFullYear()
      );
    } else if (filterValue === "year") {
      return cDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // อัปเดตตัวเลขในหน้าการ์ด
  if (customerCount) customerCount.textContent = filteredCustomers.length;
  if (petCount) petCount.textContent = pets.length;
  if (bookingCount) bookingCount.textContent = filteredBookings.length;

  // คำนวณรายได้ตามช่วงเวลาที่กรอง
  const revenue = filteredBookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  if (revenueElement) revenueElement.textContent = formatMoney(revenue);

  // แสดงรายการการจองล่าสุดตามช่วงเวลาที่กรอง
  const recent = filteredBookings.slice(-5).reverse();
  const container = document.getElementById("recentBookings");

  if (!container) return;

  if (recent.length === 0) {
    container.innerHTML = `
      <div>📅</div>
      <p>ยังไม่มีข้อมูลการจองในช่วงเวลานี้</p>
    `;
    return;
  }

  container.innerHTML = recent
    .map(
      (booking) => `
        <div class="system-row">
          <span>🐾 ${escapeHTML(booking.petName || "-")} (${escapeHTML(booking.checkInDate || "-")})</span>
          <strong>${formatMoney(booking.price)}</strong>
        </div>
      `
    )
    .join("");
}

// ================= CUSTOMERS =================

function renderCustomers() {
  const table = document.getElementById("customerTable");
  if (!table) return;

  if (customers.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:#999;padding:35px">
          ยังไม่มีข้อมูลลูกค้า
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = customers
    .map(
      (customer) => `
        <tr>
          <td>#${customer.customerId}</td>
          <td><strong>${escapeHTML(customer.name)}</strong></td>
          <td>${escapeHTML(customer.phone)}</td>
          <td>
            <button class="action-button" onclick="editCustomer(${customer.customerId})">แก้ไข</button>
            <button class="action-button delete-button" onclick="deleteCustomer(${customer.customerId})">ลบ</button>
          </td>
        </tr>
      `
    )
    .join("");
}

// ================= PETS =================

function renderPets() {
  const table = document.getElementById("petTable");
  if (!table) return;

  if (pets.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;color:#999;padding:35px">
          ยังไม่มีข้อมูลสัตว์เลี้ยง
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = pets
    .map((pet) => {
      const owner = customers.find((c) => c.customerId === pet.customerId);
      return `
        <tr>
          <td>#${pet.petId}</td>
          <td><strong>${escapeHTML(pet.name)}</strong></td>
          <td>${escapeHTML(pet.type)}</td>
          <td>${escapeHTML(pet.breed || "-")}</td>
          <td>${Number(pet.age || 0)} ปี</td>
          <td>${escapeHTML(owner?.name || "-")}</td>
          <td>
            <button class="action-button" onclick="editPet(${pet.petId})">แก้ไข</button>
            <button class="action-button delete-button" onclick="deletePet(${pet.petId})">ลบ</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ================= BOOKINGS =================

function renderBookings() {
  const table = document.getElementById("bookingTable");
  if (!table) return;

  if (bookings.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;color:#999;padding:35px">
          ยังไม่มีข้อมูลการจอง
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = bookings
    .map(
      (booking) => `
        <tr>
          <td>#${booking.bookingId}</td>
          <td><strong>${escapeHTML(booking.petName || "-")}</strong></td>
          <td>${escapeHTML(booking.customerName || "-")}</td>
          <td>${escapeHTML(booking.checkInDate || "-")}</td>
          <td>${escapeHTML(booking.checkOutDate || "-")}</td>
          <td>${escapeHTML(booking.serviceType || "-")}</td>
          <td><strong>${formatMoney(booking.price)}</strong></td>
          <td>${statusBadge(booking.status)}</td>
          <td>
            <button class="action-button" onclick="changeBookingStatus(${booking.bookingId})">สถานะ</button>
            <button class="action-button delete-button" onclick="deleteBooking(${booking.bookingId})">ลบ</button>
          </td>
        </tr>
      `
    )
    .join("");
}

// ================= CUSTOMER MODAL =================

function openCustomerModal(customer = null) {
  const editing = customer !== null;

  document.getElementById("modalTitle").textContent = editing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้า";
  document.getElementById("modalSubtitle").textContent = editing ? "แก้ไขข้อมูลเจ้าของสัตว์เลี้ยง" : "กรอกข้อมูลลูกค้าใหม่";

  document.getElementById("modalBody").innerHTML = `
    <form class="form" onsubmit="saveCustomer(event, ${editing ? customer.customerId : "null"})">
      <div class="form-group">
        <label>ชื่อลูกค้า</label>
        <input type="text" id="customerName" value="${editing ? escapeAttribute(customer.name) : ""}" placeholder="เช่น สมชาย ใจดี" required>
      </div>

      <div class="form-group">
        <label>เบอร์โทรศัพท์</label>
        <input type="tel" id="customerPhone" value="${editing ? escapeAttribute(customer.phone) : ""}" placeholder="08xxxxxxxx" required>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-button" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="primary-button">${editing ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}</button>
      </div>
    </form>
  `;

  openModal();
}

function editCustomer(id) {
  const customer = customers.find((item) => Number(item.customerId) === Number(id));
  if (customer) openCustomerModal(customer);
}

async function saveCustomer(event, id) {
  event.preventDefault();

  const data = {
    name: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("customerPhone").value.trim(),
  };

  if (!data.name || !data.phone) {
    alert("กรุณากรอกข้อมูลลูกค้าให้ครบ");
    return;
  }

  try {
    const url = id ? `${API}/customers/${encodeURIComponent(id)}` : `${API}/customers`;
    const method = id ? "PUT" : "POST";

    await fetchJSON(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    closeModal();
    await loadAllData();
    alert(id ? "แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว" : "เพิ่มลูกค้าเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Save customer error:", error);
    alert(error.message);
  }
}

async function deleteCustomer(id) {
  if (!confirm("ต้องการลบลูกค้าคนนี้ใช่หรือไม่?")) return;

  try {
    await fetchJSON(`${API}/customers/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAllData();
    alert("ลบข้อมูลลูกค้าเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Delete customer error:", error);
    alert(error.message);
  }
}

// ================= PET MODAL =================

function openPetModal(pet = null) {
  if (customers.length === 0) {
    alert("กรุณาเพิ่มลูกค้าก่อนเพิ่มสัตว์เลี้ยง");
    showPage("customers");
    return;
  }

  const editing = pet !== null;

  document.getElementById("modalTitle").textContent = editing ? "แก้ไขสัตว์เลี้ยง" : "เพิ่มสัตว์เลี้ยง";
  document.getElementById("modalSubtitle").textContent = "กรอกข้อมูลสัตว์เลี้ยง";

  const customerOptions = customers
    .map(
      (c) => `
        <option value="${c.customerId}" ${editing && c.customerId === pet.customerId ? "selected" : ""}>
          ${escapeHTML(c.name)}
        </option>
      `
    )
    .join("");

  document.getElementById("modalBody").innerHTML = `
    <form class="form" onsubmit="savePet(event, ${editing ? pet.petId : "null"})">
      <div class="form-group">
        <label>เจ้าของ</label>
        <select id="petCustomer" required>
          <option value="">เลือกเจ้าของ</option>
          ${customerOptions}
        </select>
      </div>

      <div class="form-group">
        <label>ชื่อสัตว์เลี้ยง</label>
        <input type="text" id="petName" value="${editing ? escapeAttribute(pet.name) : ""}" placeholder="เช่น มะลิ" required>
      </div>

      <div class="form-group">
        <label>ประเภท</label>
        <select id="petType" required>
          <option value="">เลือกประเภท</option>
          <option value="Dog" ${editing && pet.type === "Dog" ? "selected" : ""}>🐶 สุนัข</option>
          <option value="Cat" ${editing && pet.type === "Cat" ? "selected" : ""}>🐱 แมว</option>
          <option value="Rabbit" ${editing && pet.type === "Rabbit" ? "selected" : ""}>🐰 กระต่าย</option>
          <option value="Other" ${editing && pet.type === "Other" ? "selected" : ""}>🐾 อื่น ๆ</option>
        </select>
      </div>

      <div class="form-group">
        <label>สายพันธุ์</label>
        <input type="text" id="petBreed" value="${editing ? escapeAttribute(pet.breed || "") : ""}" placeholder="เช่น Golden Retriever">
      </div>

      <div class="form-group">
        <label>อายุ</label>
        <input type="number" id="petAge" min="0" value="${editing ? Number(pet.age || 0) : ""}" placeholder="อายุเป็นปี">
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-button" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="primary-button">${editing ? "บันทึกการแก้ไข" : "เพิ่มสัตว์เลี้ยง"}</button>
      </div>
    </form>
  `;

  openModal();
}

function editPet(id) {
  const pet = pets.find((item) => Number(item.petId) === Number(id));
  if (pet) openPetModal(pet);
}

async function savePet(event, id) {
  event.preventDefault();

  const customerId = Number(document.getElementById("petCustomer").value);
  const name = document.getElementById("petName").value.trim();
  const type = document.getElementById("petType").value;
  const breed = document.getElementById("petBreed").value.trim();
  const age = Number(document.getElementById("petAge").value || 0);

  if (!customerId || !name || !type) {
    alert("กรุณากรอกข้อมูลสัตว์เลี้ยงให้ครบ");
    return;
  }

  if (age < 0) {
    alert("อายุต้องไม่ติดลบ");
    return;
  }

  const data = { customerId, name, type, breed, age };

  try {
    const url = id ? `${API}/pets/${encodeURIComponent(id)}` : `${API}/pets`;
    const method = id ? "PUT" : "POST";

    await fetchJSON(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    closeModal();
    await loadAllData();
    alert(id ? "แก้ไขสัตว์เลี้ยงเรียบร้อยแล้ว" : "เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Save pet error:", error);
    alert(error.message);
  }
}

async function deletePet(id) {
  if (!confirm("ต้องการลบสัตว์เลี้ยงตัวนี้ใช่หรือไม่?")) return;

  try {
    await fetchJSON(`${API}/pets/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAllData();
    alert("ลบข้อมูลสัตว์เลี้ยงเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Delete pet error:", error);
    alert(error.message);
  }
}

// ================= BOOKING =================

function openBookingModal() {
  if (pets.length === 0) {
    alert("กรุณาเพิ่มสัตว์เลี้ยงก่อนสร้างการจอง");
    showPage("pets");
    return;
  }

  document.getElementById("modalTitle").textContent = "สร้างการจอง";
  document.getElementById("modalSubtitle").textContent = "สร้างรายการรับฝากเลี้ยง";

  const petOptions = pets
    .map((pet) => {
      const owner = customers.find((c) => c.customerId === pet.customerId);
      return `
        <option value="${pet.petId}">
          ${escapeHTML(pet.name)} — ${escapeHTML(owner?.name || "-")}
        </option>
      `;
    })
    .join("");

  document.getElementById("modalBody").innerHTML = `
    <form class="form" onsubmit="saveBooking(event)">
      <div class="form-group">
        <label>สัตว์เลี้ยง</label>
        <select id="bookingPet" required>
          <option value="">เลือกสัตว์เลี้ยง</option>
          ${petOptions}
        </select>
      </div>

      <div class="form-group">
        <label>วันที่เช็กอิน</label>
        <input type="date" id="checkIn" required>
      </div>

      <div class="form-group">
        <label>วันที่เช็กเอาต์</label>
        <input type="date" id="checkOut" required>
      </div>

      <div class="form-group">
        <label>ประเภทบริการ</label>
        <select id="serviceType" required>
          <option value="ฝากเลี้ยงมาตรฐาน">🏠 ฝากเลี้ยงมาตรฐาน</option>
          <option value="ฝากเลี้ยงพิเศษ">⭐ ฝากเลี้ยงพิเศษ</option>
          <option value="ฝากเลี้ยง VIP">👑 ฝากเลี้ยง VIP</option>
        </select>
      </div>

      <div class="form-group">
        <label>ราคาต่อวัน</label>
        <input type="number" id="pricePerDay" value="300" min="0" required>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-button" onclick="closeModal()">ยกเลิก</button>
        <button type="submit" class="primary-button">สร้างการจอง</button>
      </div>
    </form>
  `;

  openModal();
}

async function saveBooking(event) {
  event.preventDefault();

  const petId = Number(document.getElementById("bookingPet").value);
  const checkInDate = document.getElementById("checkIn").value;
  const checkOutDate = document.getElementById("checkOut").value;
  const serviceType = document.getElementById("serviceType").value;
  const pricePerDay = Number(document.getElementById("pricePerDay").value);

  if (!petId || !checkInDate || !checkOutDate) {
    alert("กรุณากรอกข้อมูลการจองให้ครบ");
    return;
  }

  if (checkOutDate <= checkInDate) {
    alert("วันที่เช็กเอาต์ต้องมากกว่าวันที่เช็กอิน");
    return;
  }

  if (pricePerDay < 0) {
    alert("ราคาต่อวันต้องไม่ติดลบ");
    return;
  }

  const data = { petId, checkInDate, checkOutDate, serviceType, pricePerDay };

  try {
    await fetchJSON(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    closeModal();
    await loadAllData();
    alert("สร้างการจองเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Save booking error:", error);
    alert(error.message);
  }
}

async function changeBookingStatus(id) {
  const status = prompt("กรอกสถานะ:\n\nConfirmed\nPending\nCompleted\nCancelled");
  if (!status) return;

  const validStatuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
  const normalizedStatus = validStatuses.find(
    (item) => item.toLowerCase() === status.trim().toLowerCase()
  );

  if (!normalizedStatus) {
    alert("สถานะไม่ถูกต้อง\n\nกรุณาใช้:\nConfirmed\nPending\nCompleted\nCancelled");
    return;
  }

  try {
    await fetchJSON(`${API}/bookings/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: normalizedStatus }),
    });

    await loadAllData();
    alert("เปลี่ยนสถานะเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Change booking status error:", error);
    alert(error.message);
  }
}

async function deleteBooking(id) {
  if (!confirm("ต้องการลบการจองนี้ใช่หรือไม่?")) return;

  try {
    await fetchJSON(`${API}/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadAllData();
    alert("ลบการจองเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Delete booking error:", error);
    alert(error.message);
  }
}

// ================= QUICK BOARDING (รับฝากสัตว์เลี้ยง) =================

function filterQuickCustomers() {
  const query = document.getElementById("quickCustomerSearch").value.trim().toLowerCase();
  const resultsContainer = document.getElementById("quickCustomerResults");

  if (!query) {
    resultsContainer.innerHTML = "";
    return;
  }

  const matches = customers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.phone && c.phone.includes(query))
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="customer-empty">
        <div>🔍</div>
        <strong>ไม่พบข้อมูลลูกค้าที่ตรงกัน</strong>
        <span>สามารถกด "+ ลูกค้าใหม่" เพื่อเพิ่มข้อมูลได้</span>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = matches
    .map(
      (c) => `
      <div class="customer-result-card ${selectedCustomerId === c.customerId ? 'selected' : ''}" onclick="selectQuickCustomer(${c.customerId})">
        <div class="customer-result-avatar">👤</div>
        <div class="customer-result-info">
          <strong>${escapeHTML(c.name)}</strong>
          <span>📞 ${escapeHTML(c.phone || '-')}</span>
        </div>
        <div class="customer-result-arrow">➔</div>
      </div>
    `
    )
    .join("");
}

function clearQuickCustomerSearch() {
  const searchInput = document.getElementById("quickCustomerSearch");
  const resultsContainer = document.getElementById("quickCustomerResults");
  if (searchInput) searchInput.value = "";
  if (resultsContainer) resultsContainer.innerHTML = "";
}

function selectQuickCustomer(customerId) {
  const customer = customers.find((c) => Number(c.customerId) === Number(customerId));
  if (!customer) return;

  selectedCustomerId = customer.customerId;

  const newCustBox = document.getElementById("quickNewCustomerBox");
  if (newCustBox) newCustBox.classList.remove("show");

  const selectedBox = document.getElementById("selectedCustomerBox");
  if (selectedBox) {
    selectedBox.classList.remove("empty-selected");
    selectedBox.innerHTML = `
      <div class="selected-avatar">👤</div>
      <div class="selected-content">
        <span>ลูกค้าที่เลือก</span>
        <strong>${escapeHTML(customer.name)}</strong>
        <small>📞 ${escapeHTML(customer.phone || '-')}</small>
      </div>
      <button type="button" class="change-selection" onclick="clearQuickCustomer()">เปลี่ยน</button>
    `;
  }

  const summaryPerson = document.getElementById("quickSummaryPerson");
  if (summaryPerson) {
    summaryPerson.innerHTML = `
      <div class="summary-avatar">👤</div>
      <div>
        <small>ลูกค้า</small>
        <strong>${escapeHTML(customer.name)}</strong>
      </div>
    `;
  }

  loadCustomerPetsOptions(customer.customerId);
  clearQuickCustomerSearch();
}

function clearQuickCustomer() {
  selectedCustomerId = null;
  selectedPetId = null;

  const selectedBox = document.getElementById("selectedCustomerBox");
  if (selectedBox) {
    selectedBox.classList.add("empty-selected");
    selectedBox.innerHTML = `
      <div class="selected-avatar">👤</div>
      <div class="selected-content">
        <span>ลูกค้าที่เลือก</span>
        <strong>ยังไม่ได้เลือกลูกค้า</strong>
        <small>เลือกจากรายการด้านบน</small>
      </div>
      <button type="button" class="change-selection" onclick="clearQuickCustomer()">เปลี่ยน</button>
    `;
  }

  const summaryPerson = document.getElementById("quickSummaryPerson");
  if (summaryPerson) {
    summaryPerson.innerHTML = `
      <div class="summary-avatar">👤</div>
      <div>
        <small>ลูกค้า</small>
        <strong>ยังไม่ได้เลือก</strong>
      </div>
    `;
  }

  resetQuickPetDisplay();
}

function toggleQuickNewCustomer() {
  const box = document.getElementById("quickNewCustomerBox");
  if (box) {
    box.classList.toggle("show");
    if (box.classList.contains("show")) {
      clearQuickCustomer();
    }
  }
}

function loadCustomerPetsOptions(customerId) {
  const select = document.getElementById("quickPetSelect");
  if (!select) return;

  const customerPets = pets.filter((p) => Number(p.customerId) === Number(customerId));

  select.innerHTML = '<option value="">เลือกสัตว์เลี้ยงของลูกค้า...</option>';

  if (customerPets.length === 0) {
    select.innerHTML += '<option value="" disabled>-- ไม่มีสัตว์เลี้ยงในระบบ --</option>';
  } else {
    customerPets.forEach((p) => {
      select.innerHTML += `<option value="${p.petId}">${escapeHTML(p.name)} (${escapeHTML(p.type)})</option>`;
    });
  }

  resetQuickPetDisplay();
}

function selectQuickPet() {
  const select = document.getElementById("quickPetSelect");
  if (!select) return;

  const petId = Number(select.value);
  if (!petId) {
    resetQuickPetDisplay();
    return;
  }

  const pet = pets.find((p) => Number(p.petId) === Number(petId));
  if (!pet) return;

  selectedPetId = pet.petId;

  document.getElementById("quickPetNameDisplay").textContent = pet.name;
  document.getElementById("quickPetTypeDisplay").textContent = pet.type || "-";
  document.getElementById("quickPetBreedDisplay").textContent = pet.breed || "-";

  const summaryPet = document.getElementById("quickSummaryPet");
  if (summaryPet) {
    summaryPet.innerHTML = `
      <div class="summary-avatar pet">🐾</div>
      <div>
        <small>สัตว์เลี้ยง</small>
        <strong>${escapeHTML(pet.name)}</strong>
      </div>
    `;
  }
}

function resetQuickPetDisplay() {
  selectedPetId = null;
  const select = document.getElementById("quickPetSelect");
  if (select) select.value = "";

  const nameDisp = document.getElementById("quickPetNameDisplay");
  const typeDisp = document.getElementById("quickPetTypeDisplay");
  const breedDisp = document.getElementById("quickPetBreedDisplay");

  if (nameDisp) nameDisp.textContent = "ยังไม่ได้เลือก";
  if (typeDisp) typeDisp.textContent = "-";
  if (breedDisp) breedDisp.textContent = "-";

  const summaryPet = document.getElementById("quickSummaryPet");
  if (summaryPet) {
    summaryPet.innerHTML = `
      <div class="summary-avatar pet">🐶</div>
      <div>
        <small>สัตว์เลี้ยง</small>
        <strong>ยังไม่ได้เลือก</strong>
      </div>
    `;
  }
}

function toggleQuickNewPet() {
  const box = document.getElementById("quickNewPetBox");
  if (box) box.classList.toggle("show");
}

function choosePetType(type) {
  const select = document.getElementById("quickNewPetType");
  if (select) {
    select.value = type;
    updateQuickNewPetPreview();
  }
}

function updateQuickNewPetPreview() {
  const petName = document.getElementById("quickNewPetName")?.value || "สัตว์เลี้ยงใหม่";
  const summaryPet = document.getElementById("quickSummaryPet");
  
  const newPetBox = document.getElementById("quickNewPetBox");
  if (summaryPet && newPetBox && newPetBox.classList.contains("show")) {
    summaryPet.innerHTML = `
      <div class="summary-avatar pet">🐾</div>
      <div>
        <small>สัตว์เลี้ยง (ใหม่)</small>
        <strong>${escapeHTML(petName)}</strong>
      </div>
    `;
  }
}

function updateQuickPrice() {
  const checkIn = document.getElementById("quickCheckIn").value;
  const checkOut = document.getElementById("quickCheckOut").value;
  const serviceSelect = document.getElementById("quickServiceType");
  const priceInput = document.getElementById("quickPricePerDay");

  const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
  if (selectedOption && selectedOption.dataset.price) {
    priceInput.value = selectedOption.dataset.price;
  }

  const pricePerDay = Number(priceInput.value || 0);

  if (checkIn && checkOut) {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const timeDiff = d2.getTime() - d1.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff > 0) {
      const totalPrice = daysDiff * pricePerDay;

      document.getElementById("quickSummaryDates").textContent = `${checkIn} ถึง ${checkOut}`;
      document.getElementById("quickSummaryDays").textContent = `${daysDiff} วัน`;
      document.getElementById("quickSummaryService").textContent = selectedOption ? selectedOption.value : "-";
      document.getElementById("quickSummaryTotal").textContent = formatMoney(totalPrice);
      return;
    }
  }

  document.getElementById("quickSummaryDates").textContent = "-";
  document.getElementById("quickSummaryDays").textContent = "0 วัน";
  document.getElementById("quickSummaryService").textContent = selectedOption ? selectedOption.value : "-";
  document.getElementById("quickSummaryTotal").textContent = "฿0";
}

async function saveQuickBoarding(event) {
  event.preventDefault();

  try {
    let finalCustomerId = selectedCustomerId;
    let finalPetId = selectedPetId;

    const newCustBox = document.getElementById("quickNewCustomerBox");
    if ((newCustBox && newCustBox.classList.contains("show")) || !finalCustomerId) {
      const nameInput = document.getElementById("quickNewCustomerName");
      const phoneInput = document.getElementById("quickNewCustomerPhone");
      const name = nameInput ? nameInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";

      if (name && phone) {
        const createdCustomer = await fetchJSON(`${API}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone }),
        });
        finalCustomerId = createdCustomer.customerId || createdCustomer.id;
      }
    }

    if (!finalCustomerId) {
      alert("กรุณาเลือกลูกค้าเดิม หรือระบุข้อมูลลูกค้าใหม่ให้ครบถ้วน");
      return;
    }

    const newPetBox = document.getElementById("quickNewPetBox");
    if ((newPetBox && newPetBox.classList.contains("show")) || !finalPetId) {
      const nameInput = document.getElementById("quickNewPetName");
      const typeInput = document.getElementById("quickNewPetType");
      const breedInput = document.getElementById("quickNewPetBreed");
      const ageInput = document.getElementById("quickNewPetAge");

      const name = nameInput ? nameInput.value.trim() : "";
      const type = typeInput ? typeInput.value : "";
      const breed = breedInput ? breedInput.value.trim() : "";
      const age = ageInput ? Number(ageInput.value || 0) : 0;

      if (name && type) {
        const createdPet = await fetchJSON(`${API}/pets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: finalCustomerId,
            name,
            type,
            breed,
            age,
          }),
        });
        finalPetId = createdPet.petId || createdPet.id;
      }
    }

    if (!finalPetId) {
      alert("กรุณาเลือกสัตว์เลี้ยง หรือระบุข้อมูลสัตว์เลี้ยงใหม่ให้ครบถ้วน");
      return;
    }

    const checkInDate = document.getElementById("quickCheckIn").value;
    const checkOutDate = document.getElementById("quickCheckOut").value;
    const serviceType = document.getElementById("quickServiceType").value;
    const pricePerDay = Number(document.getElementById("quickPricePerDay").value || 0);

    if (!checkInDate || !checkOutDate) {
      alert("กรุณาระบุวันเช็กอินและวันเช็กเอาต์");
      return;
    }

    if (checkOutDate <= checkInDate) {
      alert("วันที่เช็กเอาต์ต้องมากกว่าวันที่เช็กอิน");
      return;
    }

    await fetchJSON(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId: finalPetId,
        checkInDate,
        checkOutDate,
        serviceType,
        pricePerDay,
      }),
    });

    alert("ทำรายการรับฝากเลี้ยงเรียบร้อยแล้ว!");
    resetQuickBoarding();
    await loadAllData();
    showPage("bookings");
  } catch (error) {
    console.error("Quick boarding error:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  }
}

function resetQuickBoarding() {
  const form = document.getElementById("quickBoardingForm");
  if (form) form.reset();

  clearQuickCustomer();
  clearQuickCustomerSearch();

  const newCustBox = document.getElementById("quickNewCustomerBox");
  const newPetBox = document.getElementById("quickNewPetBox");

  if (newCustBox) newCustBox.classList.remove("show");
  if (newPetBox) newPetBox.classList.remove("show");

  updateQuickPrice();
}

// ================= MODAL =================

function openModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.add("show");
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("show");
}

// ================= HELPERS =================

function formatMoney(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
}

function statusBadge(status) {
  const normalized = String(status || "").trim().toLowerCase();
  let className = "pending";

  if (normalized === "confirmed") className = "confirmed";
  if (normalized === "completed") className = "completed";
  if (normalized === "cancelled") className = "cancelled";

  return `
    <span class="badge ${className}">
      ${escapeHTML(status || "Pending")}
    </span>
  `;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}