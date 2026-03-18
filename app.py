from flask import Flask, render_template, request, jsonify 
from database import db, init_db
from models import *
import uuid
from datetime import datetime
from flask_cors import CORS
import os

app = Flask(__name__)

# Enable CORS for local testing if running frontend separately
CORS(app)

basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'mahad.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)

from flask_migrate import Migrate
migrate = Migrate(app, db)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_all_data():
    students = [{'id': s.id, 'name': s.name, 'email': s.email, 'course': s.course, 'date': s.date,
                'class_id': s.class_id,
                 'total': s.total, 'paid': s.paid, 'balance': s.balance, 'status': s.status, 'statusCode': s.statusCode} 
                for s in Student.query.all()]
    
    recent_students = [{'name': rs.name, 'course': rs.course, 'date': rs.date, 'status': rs.status, 'statusCode': rs.statusCode}
                       for rs in RecentStudent.query.all()]
    
    roles = [{'name': r.name, 'email': r.email, 'password': r.password, 'date': r.date, 
              'role': r.role, 'roleCode': r.roleCode, 'statusCode': r.statusCode}
             for r in User.query.all()]
    
    instructors = [{'id': i.id, 'name': i.name, 'spec': i.spec, 'phone': i.phone, 'courses': i.courses, 'rating': i.rating, 'img': i.img}
                   for i in Instructor.query.all()]
    
    courses = [{'id': c.id, 'title': c.title, 'subject': c.subject, 'instructor': c.instructor, 'duration': c.duration, 'students': c.students, 'img': c.img, 'capacity': c.capacity} for c in Course.query.all()]
    subjects = [{'id': s.id, 'name': s.name, 'desc': s.desc} for s in Subject.query.all()]
    
    accounting = [{'id': a.id, 'receipt': a.receipt, 'student': a.student, 'amount': a.amount, 'date': a.date, 'method': a.method, 'notes': getattr(a, 'notes', ''), 'status': a.status, 'statusCode': a.statusCode}
                  for a in Accounting.query.all()]
    
    notifications = [{'id': n.id, 'title': n.title, 'target': n.target, 'message': n.message, 'date': n.date}
                     for n in Notification.query.all()]
    
    setting_row = Setting.query.first()
    settings = {}
    if setting_row:
        settings = {
            'instituteName': setting_row.instituteName,
            'phone': setting_row.phone,
            'currency': setting_row.currency,
            'logo': setting_row.logo,
            'maxStudentsPerCourse': setting_row.maxStudentsPerCourse
        }

    # Load attendance from db.json if exists
    attendance = []
    try:
        import json
        if os.path.exists('db.json'):
            with open('db.json', 'r', encoding='utf-8') as f:
                local_db = json.load(f)
                attendance = local_db.get('attendance', [])
    except Exception as e:
        pass
    
    return jsonify({
        'students': students,
        'recentStudents': recent_students,
        'roles': roles,
        'instructors': instructors,
        'courses': courses,
        'subjects': subjects,
        'accounting': accounting,
        'notifications': notifications,
        'settings': settings,
        'attendance': attendance
    })

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    s_data = data.get('student', {})
    r_data = data.get('recent', {})
    
    new_student = Student(
        id=f"Std-{int(datetime.now().timestamp()*1000)}",
        name=s_data.get('name'),
        email=s_data.get('email'),
        course=s_data.get('course'),
        date=s_data.get('date'),
        total=s_data.get('total'),
        paid=s_data.get('paid'),
        balance=s_data.get('balance'),
        class_id=s_data.get('class_id'),
        status=s_data.get('status'),
        statusCode=s_data.get('statusCode')
    )
    db.session.add(new_student)
    
    new_recent = RecentStudent(
        name=r_data.get('name'),
        course=r_data.get('course'),
        date=r_data.get('date'),
        status=r_data.get('status'),
        statusCode=r_data.get('statusCode')
    )
    db.session.add(new_recent)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/students/<student_id>', methods=['PUT', 'DELETE'])
def update_delete_student(student_id):
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Not found'}), 404
        
    if request.method == 'PUT':
        data = request.json.get('student', {})
        student.name = data.get('name', student.name)
        student.email = data.get('email', student.email)
        student.course = data.get('course', student.course)
        student.total = data.get('total', student.total)
        student.paid = data.get('paid', student.paid)
        student.balance = data.get('balance', student.balance)
        student.status = data.get('status', student.status)
        student.statusCode = data.get('statusCode', student.statusCode)
        student.class_id = data.get('class_id', student.class_id)
        db.session.commit()
        return jsonify({'success': True})
        
    elif request.method == 'DELETE':
        db.session.delete(student)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/roles', methods=['POST'])
def add_role():
    data = request.json
    new_user = User(
        name=data.get('name'),
        email=data.get('email'),
        password=data.get('password'),
        date=data.get('date'),
        role=data.get('role'),
        roleCode=data.get('roleCode'),
        statusCode=data.get('statusCode')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'success': True, 'roles': get_all_data().json['roles']})

@app.route('/api/roles/<email>', methods=['PUT', 'DELETE'])
def update_delete_role(email):
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Not found'}), 404
        
    if request.method == 'PUT':
        data = request.json
        user.name = data.get('name', user.name)
        user.password = data.get('password', user.password)
        user.roleCode = data.get('roleCode', user.roleCode)
        user.role = data.get('role', user.role)
        user.statusCode = data.get('statusCode', user.statusCode)
        db.session.commit()
        return jsonify({'success': True, 'roles': get_all_data().json['roles']})
        
    elif request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'roles': get_all_data().json['roles']})

@app.route('/api/update/instructors', methods=['POST'])
def update_instructors():
    data = request.json
    # Frontend might send single object or an array. We'll handle both.
    if isinstance(data, list):
        Instructor.query.delete() # Replace all
        for item in data:
            new_inst = Instructor(
                id=item.get('id', f"Inst-{int(datetime.now().timestamp()*1000)}"),
                name=item.get('name'),
                spec=item.get('spec'),
                phone=item.get('phone', ''),
                courses=item.get('courses', 0),
                rating=item.get('rating', 5.0),
                img=item.get('img')
            )
            db.session.add(new_inst)
    else:
        new_inst = Instructor(
            id=data.get('id', f"Inst-{int(datetime.now().timestamp()*1000)}"),
            name=data.get('name'),
            spec=data.get('spec'),
            phone=data.get('phone', ''),
            courses=data.get('courses', 0),
            rating=data.get('rating', 5.0),
            img=data.get('img')
        )
        db.session.add(new_inst)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/instructors/<instructor_id>', methods=['PUT', 'DELETE'])
def update_delete_instructor(instructor_id):
    instructor = Instructor.query.get(instructor_id)
    if not instructor:
        return jsonify({'error': 'Not found'}), 404
        
    if request.method == 'PUT':
        data = request.json
        instructor.name = data.get('name', instructor.name)
        instructor.spec = data.get('spec', instructor.spec)
        instructor.phone = data.get('phone', instructor.phone)
        db.session.commit()
        return jsonify({'success': True})
        
    elif request.method == 'DELETE':
        db.session.delete(instructor)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/update/courses', methods=['POST'])
def update_courses():
    data = request.json
    if isinstance(data, list):
        Course.query.delete()
        for item in data:
            new_course = Course(
                id=item.get('id', f"Crs-{int(datetime.now().timestamp()*1000)}"),
                title=item.get('title'),
                subject=item.get('subject'),
                instructor=item.get('instructor'),
                duration=item.get('duration'),
                students=str(item.get('students', '0')),
                img=item.get('img'),
                capacity=int(item.get('capacity', 30))
            )
            db.session.add(new_course)
    else:
        new_course = Course(
            id=data.get('id', f"Crs-{int(datetime.now().timestamp()*1000)}"),
            title=data.get('title'),
            subject=data.get('subject'),
            instructor=data.get('instructor'),
            duration=data.get('duration'),
            students=str(data.get('students', '0')),
            img=data.get('img'),
            capacity=int(data.get('capacity', 30))
        )
        db.session.add(new_course)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/courses/<course_id>', methods=['PUT', 'DELETE'])
def update_delete_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Not found'}), 404
        
    if request.method == 'PUT':
        data = request.json
        course.title = data.get('title', course.title)
        course.subject = data.get('subject', course.subject)
        course.instructor = data.get('instructor', course.instructor)
        course.duration = data.get('duration', course.duration)
        course.students = str(data.get('students', course.students))
        if 'img' in data and data['img']:
            course.img = data['img']
        course.capacity = int(data.get('capacity', course.capacity))
        db.session.commit()
        return jsonify({'success': True})
        
    elif request.method == 'DELETE':
        db.session.delete(course)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/update/subjects', methods=['POST'])
def update_subjects():
    data = request.json
    if isinstance(data, list):
        Subject.query.delete()
        for item in data:
            new_sub = Subject(
                id=item.get('id', f"Sub-{int(datetime.now().timestamp()*1000)}"),
                name=item.get('name'),
                desc=item.get('desc')
            )
            db.session.add(new_sub)
    else:
        new_sub = Subject(
            id=data.get('id', f"Sub-{int(datetime.now().timestamp()*1000)}"),
            name=data.get('name'),
            desc=data.get('desc')
        )
        db.session.add(new_sub)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/subjects/<subject_id>', methods=['PUT', 'DELETE'])
def update_delete_subject(subject_id):
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({'error': 'Subject not found'}), 404

    if request.method == 'PUT':
        data = request.json
        new_name = data.get('name', subject.name)
        new_desc = data.get('desc', subject.desc)

        # If the subject name is changing, we must update all dependencies
        if new_name != subject.name:
            old_name = subject.name
            Course.query.filter_by(subject=old_name).update({'subject': new_name})
            Instructor.query.filter_by(spec=old_name).update({'spec': new_name})

        subject.name = new_name
        subject.desc = new_desc
        db.session.commit()
        return jsonify({'success': True, 'message': 'تم تعديل المادة بنجاح'})

    elif request.method == 'DELETE':
        # Check for dependencies before deleting
        courses_using_subject = Course.query.filter_by(subject=subject.name).count()
        if courses_using_subject > 0:
            return jsonify({"message": f"لا يمكن حذف المادة لوجود {courses_using_subject} دورة مرتبطة بها. يرجى تحديث هذه الدورات أولاً."}), 409

        db.session.delete(subject)
        db.session.commit()
        return jsonify({'success': True, 'message': 'تم حذف المادة بنجاح'})

@app.route('/api/update/accounting', methods=['POST'])
def update_accounting():
    data = request.json
    if isinstance(data, list):
        Accounting.query.delete()
        for i, item in enumerate(data):
            new_acc = Accounting(
                id=f"Acc-{int(datetime.now().timestamp()*1000)}-{i}",
                receipt=item.get('receipt'),
                student=item.get('student'),
                amount=item.get('amount'),
                date=item.get('date'),
                method=item.get('method'),
                status=item.get('status'),
                statusCode=item.get('statusCode')
            )
            if hasattr(new_acc, 'notes'):
                new_acc.notes = item.get('notes', '')
            db.session.add(new_acc)
    else:
        new_acc = Accounting(
            id=f"Acc-{int(datetime.now().timestamp()*1000)}",
            receipt=data.get('receipt'),
            student=data.get('student'),
            amount=data.get('amount'),
            date=data.get('date'),
            method=data.get('method'),
            status=data.get('status'),
            statusCode=data.get('statusCode')
        )
        if hasattr(new_acc, 'notes'):
            new_acc.notes = data.get('notes', '')
        db.session.add(new_acc)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/accounting/<accounting_id>', methods=['PUT', 'DELETE'])
def update_delete_accounting(accounting_id):
    acc = Accounting.query.get(accounting_id)
    if not acc:
        return jsonify({'error': 'Not found'}), 404

    if request.method == 'PUT':
        data = request.json
        acc.receipt = data.get('receipt', acc.receipt)
        acc.student = data.get('student', acc.student)
        acc.amount = data.get('amount', acc.amount)
        acc.date = data.get('date', acc.date)
        acc.method = data.get('method', acc.method)
        if hasattr(acc, 'notes'):
            acc.notes = data.get('notes', acc.notes)
        acc.status = data.get('status', acc.status)
        acc.statusCode = data.get('statusCode', acc.statusCode)
        db.session.commit()
        return jsonify({'success': True})
        
    elif request.method == 'DELETE':
        db.session.delete(acc)
        db.session.commit()
        return jsonify({'success': True})

@app.route('/api/update/notifications', methods=['POST'])
def update_notifications():
    data = request.json
    if isinstance(data, list):
        Notification.query.delete()
        for item in data:
            new_n = Notification(
                id=item.get('id', f"N-{int(datetime.now().timestamp()*1000)}"),
                title=item.get('title'),
                target=item.get('target'),
                message=item.get('message'),
                date=item.get('date')
            )
            db.session.add(new_n)
    else:
        new_n = Notification(
            id=data.get('id', f"N-{int(datetime.now().timestamp()*1000)}"),
            title=data.get('title'),
            target=data.get('target'),
            message=data.get('message'),
            date=data.get('date')
        )
        db.session.add(new_n)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/update/settings', methods=['POST'])
def update_settings():
    data = request.json
    setting = Setting.query.first()
    if not setting:
        setting = Setting()
        db.session.add(setting)
    
    setting.instituteName = data.get('instituteName', setting.instituteName)
    setting.phone = data.get('phone', setting.phone)
    setting.currency = data.get('currency', setting.currency)
    setting.logo = data.get('logo', setting.logo)
    setting.maxStudentsPerCourse = int(data.get('maxStudentsPerCourse', setting.maxStudentsPerCourse))
    
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/attendance', methods=['POST'])
def save_attendance():
    data = request.json
    attendance_file = 'db.json'
    
    try:
        import json
        local_db = {}
        if os.path.exists(attendance_file):
            with open(attendance_file, 'r', encoding='utf-8') as f:
                local_db = json.load(f)
        
        if 'attendance' not in local_db:
            local_db['attendance'] = []
            
        # التحقق إذا كان هناك سجل سابق لنفس الشعبة والتاريخ وتحديثه بدلاً من تكراره
        existing_idx = next((i for i, a in enumerate(local_db['attendance']) 
                           if a['class_id'] == data['class_id'] and a['date'] == data['date']), -1)
        
        if existing_idx >= 0:
            local_db['attendance'][existing_idx] = data
        else:
            local_db['attendance'].append(data)
            
        with open(attendance_file, 'w', encoding='utf-8') as f:
            json.dump(local_db, f, ensure_ascii=False, indent=4)
            
        return jsonify({'success': True})
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=3000)
