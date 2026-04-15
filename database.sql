-- ================================================================
--  قاعدة بيانات مركز الباندا — MySQL Schema
--  تم تحديث هذا الملف لدعم خوادم MySQL الصارمة (Strict Mode) واللغة العربية
-- ================================================================

-- 1. جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    institute_name VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    currency VARCHAR(10) DEFAULT 'IQD',
    logo TEXT,
    max_students_per_course INT DEFAULT 30,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (id, institute_name, phone, email, currency, max_students_per_course)
VALUES (UUID(), 'مركز الباندا', '0780309849', 'info@panda.com', 'IQD', 30);


-- 2. جدول المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO subjects (id, name, description) VALUES
  ('Sub-1', 'برمجة',  'مواد البرمجة وتطوير الويب'),
  ('Sub-2', 'تصميم',  'مواد التصميم الجرافيكي');


-- 3. جدول المدرسين
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    spec VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    courses INT DEFAULT 0,
    rating DECIMAL(3,1) DEFAULT 5.0,
    img TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO instructors (id, name, spec, phone, rating) VALUES
  ('Inst-1', 'أحمد علي',   'برمجة', '07701234567', 5.0),
  ('Inst-2', 'سارة محمد',  'تصميم', '07807654321', 5.0);


-- 4. جدول الدورات التدريبية والشعب
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT '',
    instructor VARCHAR(255) DEFAULT '',
    duration VARCHAR(100) DEFAULT '',
    students INT DEFAULT 0,
    capacity INT DEFAULT 30,
    img TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO courses (id, title, subject, instructor, duration, students, capacity) VALUES
  ('Crs-1', 'دورة بايثون',   'برمجة', 'أحمد علي',  '8 أسابيع', 1, 30),
  ('Crs-2', 'دورة فوتوشوب', 'تصميم', 'سارة محمد', '4 أسابيع', 0, 30);


-- 5. جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    course VARCHAR(255) DEFAULT '',
    date VARCHAR(100) DEFAULT '',
    class_id VARCHAR(50) NULL,
    total VARCHAR(50) DEFAULT '0',
    paid VARCHAR(50) DEFAULT '0',
    balance VARCHAR(50) DEFAULT '0',
    status VARCHAR(50) DEFAULT NULL,
    status_code VARCHAR(50) DEFAULT 'active',
    extra_data JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES courses(id) ON DELETE SET NULL
);

INSERT IGNORE INTO students (id, name, email, course, date, total, paid, balance, status, status_code)
VALUES ('ST-001', 'علي حسن', 'ali@test.com', 'دورة بايثون', '15 مايو 2024',
        '250000 دينار', '250000 دينار', '0 دينار', 'مستمر', 'active');


-- 6. جدول الطلاب الأخيرين
CREATE TABLE IF NOT EXISTS recent_students (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course VARCHAR(255) DEFAULT '',
    date VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT '',
    status_code VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO recent_students (id, name, course, date, status, status_code)
VALUES (UUID(), 'علي حسن', 'دورة بايثون', '15 مايو 2024', 'مستمر', 'active');


-- 7. جدول الحسابات المالية
CREATE TABLE IF NOT EXISTS accounting (
    id VARCHAR(50) PRIMARY KEY,
    receipt VARCHAR(100) DEFAULT '',
    student VARCHAR(255) DEFAULT '',
    amount VARCHAR(50) DEFAULT '',
    date VARCHAR(100) DEFAULT '',
    method VARCHAR(50) DEFAULT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT NULL,
    status_code VARCHAR(50) DEFAULT 'active',
    type VARCHAR(50) DEFAULT 'income',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 8. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    target_role VARCHAR(50) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 9. جدول الحضور والغياب
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(50),
    date VARCHAR(50) NOT NULL,
    records JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (class_id, date)
);


-- 10. جدول صلاحيات المستخدمين
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plain_password VARCHAR(255) DEFAULT NULL,
    code VARCHAR(255) DEFAULT NULL,
    role VARCHAR(100) DEFAULT NULL,
    role_code VARCHAR(50) DEFAULT 'parent',
    status_code VARCHAR(50) DEFAULT 'active',
    date VARCHAR(100) DEFAULT '',
    img TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- كلمات المرور الافتراضية هي: 123123 (مشفرة بواسطة password_hash)
INSERT IGNORE INTO user_roles (id, name, email, password_hash, role, role_code, status_code) VALUES
  (UUID(), 'مدير النظام',     'admin@panda.com',      '$2y$10$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq', 'مدير النظام', 'admin',      'active'),
  (UUID(), 'معلم تجريبي',     'teacher@panda.com',    '$2y$10$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq', 'معلم',        'teacher',    'active'),
  (UUID(), 'ولي أمر تجريبي',  'parent@panda.com',     '$2y$10$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq', 'ولي أمر',     'parent',     'active'),
  (UUID(), 'محاسب تجريبي',    'accountant@panda.com', '$2y$10$wK1VqO3Z1H6xG4J5.e0/U.tqz3pM5yq31j0pG.8E0kO3qQcM2L6tq', 'محاسب',       'accountant', 'active');

-- 11. جدول الجدول الأسبوعي
CREATE TABLE IF NOT EXISTS schedule (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) DEFAULT NULL,
    class_id VARCHAR(50) DEFAULT NULL,
    instructor_name VARCHAR(255) DEFAULT NULL,
    day_of_week VARCHAR(50) NOT NULL,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50) NOT NULL,
    room VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول الدرجات والامتحانات
CREATE TABLE IF NOT EXISTS grades (
    id VARCHAR(50) PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    exam_name VARCHAR(255) DEFAULT 'تقييم',
    grade_value VARCHAR(50) NOT NULL,
    week1 VARCHAR(50) DEFAULT '',
    week2 VARCHAR(50) DEFAULT '',
    week3 VARCHAR(50) DEFAULT '',
    week4 VARCHAR(50) DEFAULT '',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 13. جدول المكتبة
CREATE TABLE IF NOT EXISTS library (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) DEFAULT '',
    category VARCHAR(100) DEFAULT '',
    status VARCHAR(50) DEFAULT 'متاح',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
