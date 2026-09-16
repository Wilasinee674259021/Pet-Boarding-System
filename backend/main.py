from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func
import os


# ==========================================================
# APP
# ==========================================================

app = Flask(__name__)

CORS(app)


# ==========================================================
# DATABASE CONFIGURATION
# ==========================================================

# ถ้า Render มี DATABASE_URL
# จะใช้ PostgreSQL
#
# ถ้าไม่มี DATABASE_URL
# จะใช้ SQLite สำหรับรันในเครื่อง

database_url = os.environ.get("DATABASE_URL")

if database_url:
    # Render บางกรณีอาจส่งมาเป็น postgres://
    # SQLAlchemy รุ่นใหม่ต้องการ postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql://",
            1
        )

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url

else:
    # SQLite สำหรับเครื่อง Local
    base_dir = os.path.abspath(
        os.path.dirname(__file__)
    )

    instance_dir = os.path.join(
        base_dir,
        "instance"
    )

    os.makedirs(
        instance_dir,
        exist_ok=True
    )

    database_path = os.path.join(
        instance_dir,
        "pet_boarding.db"
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///" + database_path
    )


app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ==========================================================
# CUSTOMER
# ==========================================================

class Customer(db.Model):

    __tablename__ = "customers"

    customer_id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=False
    )

    email = db.Column(
        db.String(120)
    )

    address = db.Column(
        db.String(255)
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    pets = db.relationship(
        "Pet",
        backref="customer",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def get_info(self):

        return {
            "customerId": self.customer_id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "createdAt": (
                self.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if self.created_at
                else None
            )
        }


# ==========================================================
# PET
# ==========================================================

class Pet(db.Model):

    __tablename__ = "pets"

    pet_id = db.Column(
        db.Integer,
        primary_key=True
    )

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.customer_id"),
        nullable=False
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    pet_type = db.Column(
        db.String(50),
        nullable=False
    )

    breed = db.Column(
        db.String(100)
    )

    age = db.Column(
        db.Integer
    )

    gender = db.Column(
        db.String(20)
    )

    weight = db.Column(
        db.Float
    )

    notes = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    bookings = db.relationship(
        "Booking",
        backref="pet",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def get_info(self):

        return {
            "petId": self.pet_id,
            "customerId": self.customer_id,
            "customerName": (
                self.customer.name
                if self.customer
                else None
            ),
            "name": self.name,
            "type": self.pet_type,
            "breed": self.breed,
            "age": self.age,
            "gender": self.gender,
            "weight": self.weight,
            "notes": self.notes,
            "createdAt": (
                self.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if self.created_at
                else None
            )
        }


# ==========================================================
# BOOKING
# ==========================================================

class Booking(db.Model):

    __tablename__ = "bookings"

    booking_id = db.Column(
        db.Integer,
        primary_key=True
    )

    pet_id = db.Column(
        db.Integer,
        db.ForeignKey("pets.pet_id"),
        nullable=False
    )

    check_in_date = db.Column(
        db.String(20),
        nullable=False
    )

    check_out_date = db.Column(
        db.String(20),
        nullable=False
    )

    service_type = db.Column(
        db.String(100),
        nullable=False
    )

    price_per_day = db.Column(
        db.Float,
        nullable=False,
        default=300
    )

    price = db.Column(
        db.Float,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Confirmed"
    )

    notes = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    payments = db.relationship(
        "Payment",
        backref="booking",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def get_info(self):

        return {
            "bookingId": self.booking_id,
            "petId": self.pet_id,
            "petName": (
                self.pet.name
                if self.pet
                else None
            ),
            "customerId": (
                self.pet.customer_id
                if self.pet
                else None
            ),
            "customerName": (
                self.pet.customer.name
                if self.pet and self.pet.customer
                else None
            ),
            "checkInDate": self.check_in_date,
            "checkOutDate": self.check_out_date,
            "serviceType": self.service_type,
            "pricePerDay": self.price_per_day,
            "price": self.price,
            "status": self.status,
            "notes": self.notes,
            "createdAt": (
                self.created_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if self.created_at
                else None
            )
        }


# ==========================================================
# PAYMENT
# ==========================================================

class Payment(db.Model):

    __tablename__ = "payments"

    payment_id = db.Column(
        db.Integer,
        primary_key=True
    )

    booking_id = db.Column(
        db.Integer,
        db.ForeignKey("bookings.booking_id"),
        nullable=False
    )

    amount = db.Column(
        db.Float,
        nullable=False
    )

    payment_method = db.Column(
        db.String(30),
        nullable=False
    )

    payment_status = db.Column(
        db.String(30),
        nullable=False,
        default="Paid"
    )

    paid_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    note = db.Column(
        db.Text
    )

    def get_info(self):

        return {
            "paymentId": self.payment_id,
            "bookingId": self.booking_id,
            "amount": self.amount,
            "paymentMethod": self.payment_method,
            "paymentStatus": self.payment_status,
            "paidAt": (
                self.paid_at.strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
                if self.paid_at
                else None
            ),
            "note": self.note
        }


# ==========================================================
# CREATE DATABASE TABLES
# ==========================================================

with app.app_context():
    db.create_all()


# ==========================================================
# HOME
# ==========================================================

@app.route("/")
def home():

    database_type = (
        "PostgreSQL"
        if database_url
        else "SQLite"
    )

    return jsonify({
        "message": "Pet Boarding System API",
        "status": "running",
        "database": database_type
    })


# ==========================================================
# CUSTOMER API
# ==========================================================

@app.route("/api/customers", methods=["GET"])
def get_customers():

    customers = Customer.query.order_by(
        Customer.customer_id.desc()
    ).all()

    return jsonify([
        customer.get_info()
        for customer in customers
    ])


@app.route(
    "/api/customers/<int:customer_id>",
    methods=["GET"]
)
def get_customer(customer_id):

    customer = Customer.query.get_or_404(
        customer_id
    )

    return jsonify(
        customer.get_info()
    )


@app.route("/api/customers", methods=["POST"])
def create_customer():

    data = request.get_json() or {}

    name = data.get("name")
    phone = data.get("phone")

    if not name or not phone:

        return jsonify({
            "error": "Name and phone are required"
        }), 400

    customer = Customer(
        name=name,
        phone=phone,
        email=data.get("email"),
        address=data.get("address")
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify(
        customer.get_info()
    ), 201


@app.route(
    "/api/customers/<int:customer_id>",
    methods=["PUT"]
)
def update_customer(customer_id):

    customer = Customer.query.get_or_404(
        customer_id
    )

    data = request.get_json() or {}

    if "name" in data:
        customer.name = data["name"]

    if "phone" in data:
        customer.phone = data["phone"]

    if "email" in data:
        customer.email = data["email"]

    if "address" in data:
        customer.address = data["address"]

    db.session.commit()

    return jsonify(
        customer.get_info()
    )


@app.route(
    "/api/customers/<int:customer_id>",
    methods=["DELETE"]
)
def delete_customer(customer_id):

    customer = Customer.query.get_or_404(
        customer_id
    )

    db.session.delete(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer deleted successfully"
    })


# ==========================================================
# PET API
# ==========================================================

@app.route("/api/pets", methods=["GET"])
def get_pets():

    pets = Pet.query.order_by(
        Pet.pet_id.desc()
    ).all()

    return jsonify([
        pet.get_info()
        for pet in pets
    ])


@app.route(
    "/api/pets/<int:pet_id>",
    methods=["GET"]
)
def get_pet(pet_id):

    pet = Pet.query.get_or_404(
        pet_id
    )

    return jsonify(
        pet.get_info()
    )


@app.route("/api/pets", methods=["POST"])
def create_pet():

    data = request.get_json() or {}

    customer_id = data.get("customerId")
    name = data.get("name")
    pet_type = data.get("type")

    if not customer_id:

        return jsonify({
            "error": "Customer is required"
        }), 400

    if not name:

        return jsonify({
            "error": "Pet name is required"
        }), 400

    if not pet_type:

        return jsonify({
            "error": "Pet type is required"
        }), 400

    customer = Customer.query.get(
        customer_id
    )

    if not customer:

        return jsonify({
            "error": "Customer not found"
        }), 404

    pet = Pet(
        customer_id=customer_id,
        name=name,
        pet_type=pet_type,
        breed=data.get("breed"),
        age=data.get("age"),
        gender=data.get("gender"),
        weight=data.get("weight"),
        notes=data.get("notes")
    )

    db.session.add(pet)
    db.session.commit()

    return jsonify(
        pet.get_info()
    ), 201


@app.route(
    "/api/pets/<int:pet_id>",
    methods=["PUT"]
)
def update_pet(pet_id):

    pet = Pet.query.get_or_404(
        pet_id
    )

    data = request.get_json() or {}

    if "customerId" in data:

        customer = Customer.query.get(
            data["customerId"]
        )

        if not customer:

            return jsonify({
                "error": "Customer not found"
            }), 404

        pet.customer_id = data["customerId"]

    if "name" in data:
        pet.name = data["name"]

    if "type" in data:
        pet.pet_type = data["type"]

    if "breed" in data:
        pet.breed = data["breed"]

    if "age" in data:
        pet.age = data["age"]

    if "gender" in data:
        pet.gender = data["gender"]

    if "weight" in data:
        pet.weight = data["weight"]

    if "notes" in data:
        pet.notes = data["notes"]

    db.session.commit()

    return jsonify(
        pet.get_info()
    )


@app.route(
    "/api/pets/<int:pet_id>",
    methods=["DELETE"]
)
def delete_pet(pet_id):

    pet = Pet.query.get_or_404(
        pet_id
    )

    db.session.delete(pet)
    db.session.commit()

    return jsonify({
        "message": "Pet deleted successfully"
    })


# ==========================================================
# BOOKING API
# ==========================================================

@app.route("/api/bookings", methods=["GET"])
def get_bookings():

    bookings = Booking.query.order_by(
        Booking.booking_id.desc()
    ).all()

    return jsonify([
        booking.get_info()
        for booking in bookings
    ])


@app.route(
    "/api/bookings/<int:booking_id>",
    methods=["GET"]
)
def get_booking(booking_id):

    booking = Booking.query.get_or_404(
        booking_id
    )

    return jsonify(
        booking.get_info()
    )


@app.route("/api/bookings", methods=["POST"])
def create_booking():

    data = request.get_json() or {}

    pet_id = data.get("petId")
    check_in = data.get("checkInDate")
    check_out = data.get("checkOutDate")

    if not pet_id:

        return jsonify({
            "error": "Pet is required"
        }), 400

    if not check_in or not check_out:

        return jsonify({
            "error": "Check-in and check-out dates are required"
        }), 400

    pet = Pet.query.get(
        pet_id
    )

    if not pet:

        return jsonify({
            "error": "Pet not found"
        }), 404

    try:

        check_in_date = datetime.strptime(
            check_in,
            "%Y-%m-%d"
        )

        check_out_date = datetime.strptime(
            check_out,
            "%Y-%m-%d"
        )

    except ValueError:

        return jsonify({
            "error": "Date format must be YYYY-MM-DD"
        }), 400

    days = (
        check_out_date - check_in_date
    ).days

    if days <= 0:

        return jsonify({
            "error": "Check-out date must be after check-in date"
        }), 400

    try:

        price_per_day = float(
            data.get(
                "pricePerDay",
                300
            )
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error": "Invalid price"
        }), 400

    if price_per_day < 0:

        return jsonify({
            "error": "Price cannot be negative"
        }), 400

    total_price = days * price_per_day

    booking = Booking(
        pet_id=pet_id,
        check_in_date=check_in,
        check_out_date=check_out,
        service_type=data.get(
            "serviceType",
            "Standard Boarding"
        ),
        price_per_day=price_per_day,
        price=total_price,
        status=data.get(
            "status",
            "Confirmed"
        ),
        notes=data.get("notes")
    )

    db.session.add(booking)
    db.session.commit()

    return jsonify(
        booking.get_info()
    ), 201


@app.route(
    "/api/bookings/<int:booking_id>",
    methods=["PUT"]
)
def update_booking(booking_id):

    booking = Booking.query.get_or_404(
        booking_id
    )

    data = request.get_json() or {}

    if "status" in data:

        allowed_status = [
            "Pending",
            "Confirmed",
            "Checked In",
            "Checked Out",
            "Cancelled"
        ]

        if data["status"] not in allowed_status:

            return jsonify({
                "error": "Invalid booking status"
            }), 400

        booking.status = data["status"]

    if "notes" in data:

        booking.notes = data["notes"]

    db.session.commit()

    return jsonify(
        booking.get_info()
    )


@app.route(
    "/api/bookings/<int:booking_id>",
    methods=["DELETE"]
)
def delete_booking(booking_id):

    booking = Booking.query.get_or_404(
        booking_id
    )

    db.session.delete(booking)
    db.session.commit()

    return jsonify({
        "message": "Booking deleted successfully"
    })


# ==========================================================
# PAYMENT API
# ==========================================================

@app.route("/api/payments", methods=["GET"])
def get_payments():

    payments = Payment.query.order_by(
        Payment.payment_id.desc()
    ).all()

    return jsonify([
        payment.get_info()
        for payment in payments
    ])


@app.route("/api/payments", methods=["POST"])
def create_payment():

    data = request.get_json() or {}

    booking_id = data.get("bookingId")
    amount = data.get("amount")

    payment_method = data.get(
        "paymentMethod",
        "Cash"
    )

    if not booking_id:

        return jsonify({
            "error": "Booking is required"
        }), 400

    if amount is None:

        return jsonify({
            "error": "Amount is required"
        }), 400

    booking = Booking.query.get(
        booking_id
    )

    if not booking:

        return jsonify({
            "error": "Booking not found"
        }), 404

    try:

        amount = float(amount)

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error": "Invalid payment amount"
        }), 400

    if amount <= 0:

        return jsonify({
            "error": "Payment amount must be greater than 0"
        }), 400

    payment = Payment(
        booking_id=booking_id,
        amount=amount,
        payment_method=payment_method,
        payment_status="Paid",
        note=data.get("note")
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify(
        payment.get_info()
    ), 201


# ==========================================================
# DASHBOARD API
# ==========================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    customer_count = Customer.query.count()

    pet_count = Pet.query.count()

    booking_count = Booking.query.count()

    active_booking_count = Booking.query.filter(
        Booking.status.in_([
            "Confirmed",
            "Checked In"
        ])
    ).count()

    total_revenue = db.session.query(
        func.coalesce(
            func.sum(Payment.amount),
            0
        )
    ).scalar()

    pending_booking_count = Booking.query.filter_by(
        status="Pending"
    ).count()

    return jsonify({

        "customers": customer_count,

        "pets": pet_count,

        "bookings": booking_count,

        "activeBookings": active_booking_count,

        "pendingBookings": pending_booking_count,

        "revenue": float(
            total_revenue or 0
        )

    })


# ==========================================================
# DATABASE TEST
# ==========================================================

@app.route("/api/test", methods=["GET"])
def test_api():

    database_type = (
        "PostgreSQL"
        if database_url
        else "SQLite"
    )

    return jsonify({
        "success": True,
        "message": (
            "Python Flask API and "
            + database_type
            + " Database are working"
        ),
        "database": database_type
    })


# ==========================================================
# ERROR HANDLER
# ==========================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "Resource not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):

    db.session.rollback()

    return jsonify({
        "error": "Internal server error",
        "details": str(error)
    }), 500


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print()
    print("==========================================")
    print("       PET BOARDING SYSTEM")
    print("==========================================")
    print("Backend  : Python + Flask")

    if database_url:
        print("Database : PostgreSQL")
    else:
        print("Database : SQLite")

    print(f"Port     : {port}")
    print("==========================================")
    print()

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )