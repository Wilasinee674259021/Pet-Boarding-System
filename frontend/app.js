const API = "http://127.0.0.1:5000/api";

let customers = [];
let pets = [];
let bookings = [];

// ================= START =================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  loadAllData();
});

// ================= LOAD DATA =================

async function loadAllData() {
  try {
    const [customerRes, petRes, bookingRes] = await Promise.all([
      fetch(`${API}/customers`),
      fetch(`${API}/pets`),
      fetch(`${API}/bookings`),
    ]);

    customers = await customerRes.json();
    pets = await petRes.json();
    bookings = await bookingRes.json();

    updateDashboard();

    renderCustomers();
    renderPets();
    renderBookings();
  } catch (error) {
    console.error(error);

    alert(
      "ไม่สามารถเชื่อมต่อ Backend ได้\n\n" +
        "ตรวจสอบว่า Python Flask กำลังทำงานอยู่ที่ port 5000",
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
      if (
        item.getAttribute("onclick") &&
        item.getAttribute("onclick").includes(`'${pageId}'`)
      ) {
        item.classList.add("active");
      }
    });
  }

  const titles = {
    dashboard: ["Dashboard", "ภาพรวมระบบรับฝากเลี้ยงสัตว์"],

    customers: ["ลูกค้า", "จัดการข้อมูลเจ้าของสัตว์เลี้ยง"],

    pets: ["สัตว์เลี้ยง", "จัดการข้อมูลสัตว์เลี้ยง"],

    bookings: ["การจอง", "จัดการรายการรับฝากเลี้ยง"],
  };

  if (titles[pageId]) {
    document.getElementById("pageTitle").textContent = titles[pageId][0];

    document.getElementById("pageDescription").textContent = titles[pageId][1];
  }
}

// ================= DASHBOARD =================

function updateDashboard() {
  document.getElementById("customerCount").textContent = customers.length;

  document.getElementById("petCount").textContent = pets.length;

  document.getElementById("bookingCount").textContent = bookings.length;

  const revenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.price || 0),
    0,
  );

  document.getElementById("revenue").textContent = formatMoney(revenue);

  const recent = bookings.slice(-5).reverse();

  const container = document.getElementById("recentBookings");

  if (recent.length === 0) {
    container.innerHTML = `
            <div>📅</div>
            <p>ยังไม่มีข้อมูลการจอง</p>
        `;

    return;
  }

  container.innerHTML = recent
    .map(
      (booking) => `

        <div class="system-row">

            <span>
                🐾 ${escapeHTML(booking.petName || "-")}
            </span>

            <strong>
                ${formatMoney(booking.price)}
            </strong>

        </div>

    `,
    )
    .join("");
}

// ================= CUSTOMERS =================

function renderCustomers() {
  const table = document.getElementById("customerTable");

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

            <td>
                <strong>${escapeHTML(customer.name)}</strong>
            </td>

            <td>
                ${escapeHTML(customer.phone)}
            </td>

            <td>

                <button
                    class="action-button"
                    onclick="editCustomer(${customer.customerId})">
                    แก้ไข
                </button>

                <button
                    class="action-button delete-button"
                    onclick="deleteCustomer(${customer.customerId})">
                    ลบ
                </button>

            </td>

        </tr>

    `,
    )
    .join("");
}

// ================= PETS =================

function renderPets() {
  const table = document.getElementById("petTable");

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
      const owner = customers.find(
        (customer) => customer.customerId === pet.customerId,
      );

      return `

            <tr>

                <td>#${pet.petId}</td>

                <td>
                    <strong>${escapeHTML(pet.name)}</strong>
                </td>

                <td>${escapeHTML(pet.type)}</td>

                <td>${escapeHTML(pet.breed || "-")}</td>

                <td>${pet.age || 0} ปี</td>

                <td>${escapeHTML(owner?.name || "-")}</td>

                <td>

                    <button
                        class="action-button"
                        onclick="editPet(${pet.petId})">
                        แก้ไข
                    </button>

                    <button
                        class="action-button delete-button"
                        onclick="deletePet(${pet.petId})">
                        ลบ
                    </button>

                </td>

            </tr>

        `;
    })
    .join("");
}

// ================= BOOKINGS =================

function renderBookings() {
  const table = document.getElementById("bookingTable");

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

            <td>
                <strong>${escapeHTML(booking.petName)}</strong>
            </td>

            <td>
                ${escapeHTML(booking.customerName)}
            </td>

            <td>${booking.checkInDate}</td>

            <td>${booking.checkOutDate}</td>

            <td>${escapeHTML(booking.serviceType)}</td>

            <td>
                <strong>${formatMoney(booking.price)}</strong>
            </td>

            <td>
                ${statusBadge(booking.status)}
            </td>

            <td>

                <button
                    class="action-button"
                    onclick="changeBookingStatus(${booking.bookingId})">
                    สถานะ
                </button>

                <button
                    class="action-button delete-button"
                    onclick="deleteBooking(${booking.bookingId})">
                    ลบ
                </button>

            </td>

        </tr>

    `,
    )
    .join("");
}

// ================= CUSTOMER MODAL =================

function openCustomerModal(customer = null) {
  const editing = customer !== null;

  document.getElementById("modalTitle").textContent = editing
    ? "แก้ไขข้อมูลลูกค้า"
    : "เพิ่มลูกค้า";

  document.getElementById("modalSubtitle").textContent = editing
    ? "แก้ไขข้อมูลเจ้าของสัตว์เลี้ยง"
    : "กรอกข้อมูลลูกค้าใหม่";

  document.getElementById("modalBody").innerHTML = `

        <form class="form" onsubmit="saveCustomer(event, ${editing ? customer.customerId : "null"})">

            <div class="form-group">

                <label>ชื่อลูกค้า</label>

                <input
                    type="text"
                    id="customerName"
                    value="${editing ? escapeAttribute(customer.name) : ""}"
                    placeholder="เช่น สมชาย ใจดี"
                    required
                >

            </div>


            <div class="form-group">

                <label>เบอร์โทรศัพท์</label>

                <input
                    type="tel"
                    id="customerPhone"
                    value="${editing ? escapeAttribute(customer.phone) : ""}"
                    placeholder="08xxxxxxxx"
                    required
                >

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="cancel-button"
                    onclick="closeModal()">
                    ยกเลิก
                </button>

                <button
                    type="submit"
                    class="primary-button">
                    ${editing ? "บันทึกการแก้ไข" : "เพิ่มลูกค้า"}
                </button>

            </div>

        </form>

    `;

  openModal();
}

function editCustomer(id) {
  const customer = customers.find((item) => item.customerId === id);

  if (customer) {
    openCustomerModal(customer);
  }
}

async function saveCustomer(event, id) {
  event.preventDefault();

  const data = {
    name: document.getElementById("customerName").value,

    phone: document.getElementById("customerPhone").value,
  };

  try {
    const url = id ? `${API}/customers/${id}` : `${API}/customers`;

    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถบันทึกข้อมูลได้");
    }

    closeModal();

    await loadAllData();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteCustomer(id) {
  if (!confirm("ต้องการลบลูกค้าคนนี้ใช่หรือไม่?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/customers/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถลบข้อมูลได้");
    }

    await loadAllData();
  } catch (error) {
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

  document.getElementById("modalTitle").textContent = editing
    ? "แก้ไขสัตว์เลี้ยง"
    : "เพิ่มสัตว์เลี้ยง";

  document.getElementById("modalSubtitle").textContent =
    "กรอกข้อมูลสัตว์เลี้ยง";

  const customerOptions = customers
    .map(
      (customer) => `

        <option
            value="${customer.customerId}"
            ${editing && customer.customerId === pet.customerId ? "selected" : ""}>
            ${escapeHTML(customer.name)}
        </option>

    `,
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

                <input
                    type="text"
                    id="petName"
                    value="${editing ? escapeAttribute(pet.name) : ""}"
                    placeholder="เช่น มะลิ"
                    required
                >

            </div>


            <div class="form-group">

                <label>ประเภท</label>

                <select id="petType" required>

                    <option value="">เลือกประเภท</option>

                    <option value="Dog" ${editing && pet.type === "Dog" ? "selected" : ""}>
                        🐶 สุนัข
                    </option>

                    <option value="Cat" ${editing && pet.type === "Cat" ? "selected" : ""}>
                        🐱 แมว
                    </option>

                    <option value="Rabbit" ${editing && pet.type === "Rabbit" ? "selected" : ""}>
                        🐰 กระต่าย
                    </option>

                    <option value="Other" ${editing && pet.type === "Other" ? "selected" : ""}>
                        🐾 อื่น ๆ
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>สายพันธุ์</label>

                <input
                    type="text"
                    id="petBreed"
                    value="${editing ? escapeAttribute(pet.breed || "") : ""}"
                    placeholder="เช่น Golden Retriever"
                >

            </div>


            <div class="form-group">

                <label>อายุ</label>

                <input
                    type="number"
                    id="petAge"
                    min="0"
                    value="${editing ? pet.age || 0 : ""}"
                    placeholder="อายุเป็นปี"
                >

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="cancel-button"
                    onclick="closeModal()">
                    ยกเลิก
                </button>

                <button
                    type="submit"
                    class="primary-button">
                    ${editing ? "บันทึกการแก้ไข" : "เพิ่มสัตว์เลี้ยง"}
                </button>

            </div>

        </form>

    `;

  openModal();
}

function editPet(id) {
  const pet = pets.find((item) => item.petId === id);

  if (pet) {
    openPetModal(pet);
  }
}

async function savePet(event, id) {
  event.preventDefault();

  const data = {
    customerId: Number(document.getElementById("petCustomer").value),

    name: document.getElementById("petName").value,

    type: document.getElementById("petType").value,

    breed: document.getElementById("petBreed").value,

    age: Number(document.getElementById("petAge").value || 0),
  };

  try {
    const url = id ? `${API}/pets/${id}` : `${API}/pets`;

    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถบันทึกข้อมูลได้");
    }

    closeModal();

    await loadAllData();
  } catch (error) {
    alert(error.message);
  }
}

async function deletePet(id) {
  if (!confirm("ต้องการลบสัตว์เลี้ยงตัวนี้ใช่หรือไม่?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/pets/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถลบข้อมูลได้");
    }

    await loadAllData();
  } catch (error) {
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

  document.getElementById("modalSubtitle").textContent =
    "สร้างรายการรับฝากเลี้ยง";

  const petOptions = pets
    .map((pet) => {
      const owner = customers.find(
        (customer) => customer.customerId === pet.customerId,
      );

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

                    <option value="">
                        เลือกสัตว์เลี้ยง
                    </option>

                    ${petOptions}

                </select>

            </div>


            <div class="form-group">

                <label>วันที่เช็กอิน</label>

                <input
                    type="date"
                    id="checkIn"
                    required
                >

            </div>


            <div class="form-group">

                <label>วันที่เช็กเอาต์</label>

                <input
                    type="date"
                    id="checkOut"
                    required
                >

            </div>


            <div class="form-group">

                <label>ประเภทบริการ</label>

                <select id="serviceType">

                    <option value="Standard Boarding">
                        Standard Boarding
                    </option>

                    <option value="Premium Boarding">
                        Premium Boarding
                    </option>

                    <option value="Day Care">
                        Day Care
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>ราคาต่อวัน</label>

                <input
                    type="number"
                    id="pricePerDay"
                    value="300"
                    min="0"
                    required
                >

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="cancel-button"
                    onclick="closeModal()">
                    ยกเลิก
                </button>

                <button
                    type="submit"
                    class="primary-button">
                    สร้างการจอง
                </button>

            </div>

        </form>

    `;

  openModal();
}

async function saveBooking(event) {
  event.preventDefault();

  const data = {
    petId: Number(document.getElementById("bookingPet").value),

    checkInDate: document.getElementById("checkIn").value,

    checkOutDate: document.getElementById("checkOut").value,

    serviceType: document.getElementById("serviceType").value,

    pricePerDay: Number(document.getElementById("pricePerDay").value),
  };

  try {
    const response = await fetch(`${API}/bookings`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "ไม่สามารถสร้างการจองได้");
    }

    closeModal();

    await loadAllData();
  } catch (error) {
    alert(error.message);
  }
}

// ================= BOOKING STATUS =================

async function changeBookingStatus(id) {
  const status = prompt(
    "กรอกสถานะ:\n\n" +
      "Confirmed\n" +
      "Pending\n" +
      "Completed\n" +
      "Cancelled",
  );

  if (!status) {
    return;
  }

  try {
    const response = await fetch(`${API}/bookings/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        status: status,
      }),
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถเปลี่ยนสถานะได้");
    }

    await loadAllData();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteBooking(id) {
  if (!confirm("ต้องการลบการจองนี้ใช่หรือไม่?")) {
    return;
  }

  try {
    const response = await fetch(`${API}/bookings/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("ไม่สามารถลบการจองได้");
    }

    await loadAllData();
  } catch (error) {
    alert(error.message);
  }
}

// ================= MODAL =================

function openModal() {
  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}

document.getElementById("modalOverlay").addEventListener("click", (event) => {
  if (event.target.id === "modalOverlay") {
    closeModal();
  }
});

// ================= HELPERS =================

function formatMoney(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
}

function statusBadge(status) {
  const normalized = String(status || "").toLowerCase();

  let className = "pending";

  if (normalized === "confirmed") {
    className = "confirmed";
  }

  if (normalized === "completed") {
    className = "completed";
  }

  if (normalized === "cancelled") {
    className = "cancelled";
  }

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
