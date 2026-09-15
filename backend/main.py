from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ==================================================
# Database Configuration
# ==================================================

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///pet_boarding.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ==================================================
# Class 1: Customer
# ==================================================

class Customer(db.Model):

    __tablename__ = "customers"

    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)

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
            "phone": self.phone
        }


# ==================================================
# Class 2: Pet
# ==================================================

class Pet(db.Model):

    __tablename__ = "pets"

    pet_id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("customers.customer_id"),
        nullable=False
    )

    name = db.Column(db.String(100), nullable=False)
    pet_type = db.Column(db.String(50), nullable=False)
    breed = db.Column(db.String(100))
    age = db.Column(db.Integer)

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
            "name": self.name,
            "type": self.pet_type,
            "breed": self.breed,
            "age": self.age
        }


# ==================================================
# Class 3: Booking
# ==================================================

class Booking(db.Model):

    __tablename__ = "bookings"

    booking_id = db.Column(db.Integer, primary_key=True)

    pet_id = db.Column(
        db.Integer,
        db.ForeignKey("pets.pet_id"),
        nullable=False
    )

    check_in_date = db.Column(db.String(20), nullable=False)
    check_out_date = db.Column(db.String(20), nullable=False)

    service_type = db.Column(
        db.String(100),
        nullable=False
    )

    price = db.Column(
        db.Float,
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Pending"
    )

    def calculate_price(self):

        return self.price

    def update_status(self, status):

        self.status = status

    def get_info(self):

        return {
            "bookingId": self.booking_id,
            "petId": self.pet_id,
            "petName": self.pet.name,
            "customerName": self.pet.customer.name,
            "checkInDate": self.check_in_date,
            "checkOutDate": self.check_out_date,
            "serviceType": self.service_type,
            "price": self.calculate_price(),
            "status": self.status
        }


# ==================================================
# Create Database
# ==================================================

with app.app_context():
    db.create_all()


# ==================================================
# HOME
# ==================================================

@app.route("/")
def home():

    return jsonify({
        "message": "Pet Boarding System API",
        "status": "running"
    })


# ==================================================
# CUSTOMER API
# ==================================================

@app.route("/api/customers", methods=["GET"])
def get_customers():

    customers = Customer.query.all()

    return jsonify([
        customer.get_info()
        for customer in customers
    ])


@app.route("/api/customers", methods=["POST"])
def create_customer():

    data = request.json

    customer = Customer(
        name=data["name"],
        phone=data["phone"]
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify(customer.get_info()), 201


@app.route("/api/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):

    customer = Customer.query.get_or_404(customer_id)

    data = request.json

    customer.name = data.get(
        "name",
        customer.name
    )

    customer.phone = data.get(
        "phone",
        customer.phone
    )

    db.session.commit()

    return jsonify(customer.get_info())


@app.route("/api/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):

    customer = Customer.query.get_or_404(customer_id)

    db.session.delete(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer deleted successfully"
    })


# ==================================================
# PET API
# ==================================================

@app.route("/api/pets", methods=["GET"])
def get_pets():

    pets = Pet.query.all()

    return jsonify([
        pet.get_info()
        for pet in pets
    ])


@app.route("/api/pets", methods=["POST"])
def create_pet():

    data = request.json

    pet = Pet(
        customer_id=data["customerId"],
        name=data["name"],
        pet_type=data["type"],
        breed=data.get("breed", ""),
        age=data.get("age", 0)
    )

    db.session.add(pet)
    db.session.commit()

    return jsonify(pet.get_info()), 201


@app.route("/api/pets/<int:pet_id>", methods=["PUT"])
def update_pet(pet_id):

    pet = Pet.query.get_or_404(pet_id)

    data = request.json

    pet.name = data.get(
        "name",
        pet.name
    )

    pet.pet_type = data.get(
        "type",
        pet.pet_type
    )

    pet.breed = data.get(
        "breed",
        pet.breed
    )

    pet.age = data.get(
        "age",
        pet.age
    )

    db.session.commit()

    return jsonify(pet.get_info())


@app.route("/api/pets/<int:pet_id>", methods=["DELETE"])
def delete_pet(pet_id):

    pet = Pet.query.get_or_404(pet_id)

    db.session.delete(pet)
    db.session.commit()

    return jsonify({
        "message": "Pet deleted successfully"
    })


# ==================================================
# BOOKING API
# ==================================================

@app.route("/api/bookings", methods=["GET"])
def get_bookings():

    bookings = Booking.query.all()

    return jsonify([
        booking.get_info()
        for booking in bookings
    ])


@app.route("/api/bookings", methods=["POST"])
def create_booking():

    data = request.json

    check_in = datetime.strptime(
        data["checkInDate"],
        "%Y-%m-%d"
    )

    check_out = datetime.strptime(
        data["checkOutDate"],
        "%Y-%m-%d"
    )

    days = (check_out - check_in).days

    if days <= 0:
        return jsonify({
            "error": "Check-out date must be after check-in date"
        }), 400

    price_per_day = float(
        data.get("pricePerDay", 300)
    )

    total_price = days * price_per_day

    booking = Booking(
        pet_id=data["petId"],
        check_in_date=data["checkInDate"],
        check_out_date=data["checkOutDate"],
        service_type=data.get(
            "serviceType",
            "Standard Boarding"
        ),
        price=total_price,
        status="Confirmed"
    )

    db.session.add(booking)
    db.session.commit()

    return jsonify(booking.get_info()), 201


@app.route("/api/bookings/<int:booking_id>", methods=["PUT"])
def update_booking(booking_id):

    booking = Booking.query.get_or_404(
        booking_id
    )

    data = request.json

    if "status" in data:
        booking.update_status(
            data["status"]
        )

    db.session.commit()

    return jsonify(
        booking.get_info()
    )


@app.route("/api/bookings/<int:booking_id>", methods=["DELETE"])
def delete_booking(booking_id):

    booking = Booking.query.get_or_404(
        booking_id
    )

    db.session.delete(booking)
    db.session.commit()

    return jsonify({
        "message": "Booking deleted successfully"
    })


# ==================================================
# RUN SERVER
# ==================================================

if __name__ == "__main__":

    print("======================================")
    print("     PET BOARDING SYSTEM")
    print("======================================")
    print("Backend : Python + Flask")
    print("Database: SQLite")
    print("Server  : http://127.0.0.1:5000")
    print("======================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )