from database import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    roleCode = db.Column(db.String(50), nullable=False)
    statusCode = db.Column(db.String(20), default='active')
    date = db.Column(db.String(20))

class Student(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    course = db.Column(db.String(200)) # e.g. "English, Programming"
    date = db.Column(db.String(50))
    class_id = db.Column(db.String(50), db.ForeignKey('course.id'))  # Foreign key to Course
    total = db.Column(db.String(50))
    paid = db.Column(db.String(50))
    balance = db.Column(db.String(50))
    status = db.Column(db.String(50))
    statusCode = db.Column(db.String(20))

class RecentStudent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    course = db.Column(db.String(200))
    date = db.Column(db.String(50))
    status = db.Column(db.String(50))
    statusCode = db.Column(db.String(20))

class Instructor(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    spec = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    courses = db.Column(db.Integer, default=0)
    rating = db.Column(db.Float, default=5.0)
    img = db.Column(db.Text, nullable=True) # Text length is better for Base64 Images
    
class Course(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100))
    instructor = db.Column(db.String(100))
    duration = db.Column(db.String(50))
    students = db.Column(db.String(50))
    img = db.Column(db.Text)
    capacity = db.Column(db.Integer, default=30)

class Subject(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    desc = db.Column(db.Text)

class Accounting(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    receipt = db.Column(db.String(50))
    student = db.Column(db.String(100))
    amount = db.Column(db.String(50))
    date = db.Column(db.String(50))
    method = db.Column(db.String(50))
    status = db.Column(db.String(50))
    statusCode = db.Column(db.String(20))

class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    instituteName = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    currency = db.Column(db.String(10))
    logo = db.Column(db.Text)
    maxStudentsPerCourse = db.Column(db.Integer, default=30)

class Notification(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(200))
    target = db.Column(db.String(50))
    message = db.Column(db.Text)
    date = db.Column(db.String(50))
