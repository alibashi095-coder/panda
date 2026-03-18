from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        
        from models import User, Setting, Course, Instructor, Subject, Student, RecentStudent
        
        if not User.query.first():
            print("Seeding database with initial data...")
            admin = User(name='مدير النظام', email='admin@panda.com', password='admin', role='مدير النظام', roleCode='admin', statusCode='active')
            teacher = User(name='معلم تجريبي', email='teacher@panda.com', password='admin', role='معلم', roleCode='teacher', statusCode='active')
            parent = User(name='ولي أمر تجريبي', email='parent@panda.com', password='admin', role='ولي أمر', roleCode='parent', statusCode='active')
            accountant = User(name='محاسب تجريبي', email='accountant@panda.com', password='admin', role='محاسب', roleCode='accountant', statusCode='active')
            
            db.session.add_all([admin, teacher, parent, accountant])

            setting = Setting(instituteName='مركز الباندا', phone='0780309849', currency='IQD', maxStudentsPerCourse=30)
            db.session.add(setting)

            sub1 = Subject(id='Sub-1', name='برمجة', desc='مواد البرمجة وتطوير الويب')
            sub2 = Subject(id='Sub-2', name='تصميم', desc='مواد التصميم الجرافيكي')
            db.session.add_all([sub1, sub2])

            inst1 = Instructor(id='Inst-1', name='أحمد علي', spec='برمجة', phone='07701234567')
            inst2 = Instructor(id='Inst-2', name='سارة محمد', spec='تصميم', phone='07807654321')
            db.session.add_all([inst1, inst2])

            course1 = Course(id='Crs-1', title='دورة بايثون', subject='برمجة', instructor='أحمد علي', duration='8 أسابيع', students='15', capacity=30)
            course2 = Course(id='Crs-2', title='دورة فوتوشوب', subject='تصميم', instructor='سارة محمد', duration='4 أسابيع', students='22', capacity=30)
            db.session.add_all([course1, course2])

            student1 = Student(id='ST-001', name='علي حسن', email='ali@test.com', course='دورة بايثون', date='15 مايو 2024', total='250000 دينار', paid='250000 دينار', balance='0 دينار', status='مستمر', statusCode='active')
            db.session.add(student1)
            
            recent1 = RecentStudent(name='علي حسن', course='دورة بايثون', date='15 مايو 2024', status='مستمر', statusCode='active')
            db.session.add(recent1)

            db.session.commit()
            print("Database seeded.")
