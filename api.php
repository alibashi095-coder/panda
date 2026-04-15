<?php
require_once 'db_config.php';

// الحصول على المسار المطلوب والطريقة
$endpoint = isset($_GET['endpoint']) ? trim($_GET['endpoint'], '/') : '';
$method = $_SERVER['REQUEST_METHOD'];

// قراءة بيانات JSON المرسلة إذا كانت موجودة
$jsonBody = file_get_contents('php://input');
$body = json_decode($jsonBody, true) ?: [];

// دالة لمعالجة الطلبات غير المعرفة
function notFound() {
    sendResponse(false, null, 'النقطة البرمجية غير موجودة', 404);
}

// معالج الأخطاء العالمي
set_exception_handler(function($e) {
    sendResponse(false, null, 'خطأ داخلي في النظام: ' . $e->getMessage(), 500);
});

if ($endpoint === 'login' && $method === 'POST') {
    $email = trim($body['email'] ?? $body['identifier'] ?? '');
    $password = trim($body['password'] ?? '');

    if (empty($email) || empty($password)) {
        sendResponse(false, null, 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM user_roles WHERE email = ? OR code = ?");
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $appUser = [
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'roleCode' => $user['role_code'],
            'statusCode' => $user['status_code'],
            'date' => $user['date'],
            'img' => $user['img'] ?? ''
        ];
        sendResponse(true, ['user' => $appUser]);
    } else {
        sendResponse(false, null, 'بيانات الدخول غير صحيحة', 401);
    }
}

// =========================================================
//  GET /data — جلب كافة البيانات للوحة التحكم
// =========================================================
if ($endpoint === 'data' && $method === 'GET') {
    try {
        $settings = $pdo->query("SELECT * FROM settings LIMIT 1")->fetch() ?: [];
        $students = $pdo->query("SELECT * FROM students ORDER BY created_at DESC")->fetchAll();
        $recentStudents = $pdo->query("SELECT * FROM recent_students ORDER BY created_at DESC LIMIT 15")->fetchAll();
        $user_roles = $pdo->query("SELECT * FROM user_roles ORDER BY created_at DESC")->fetchAll();
        $instructors = $pdo->query("SELECT * FROM instructors ORDER BY created_at DESC")->fetchAll();
        $courses = $pdo->query("SELECT * FROM courses ORDER BY created_at DESC")->fetchAll();
        $subjects = $pdo->query("SELECT * FROM subjects ORDER BY created_at DESC")->fetchAll();
        $accounting = $pdo->query("SELECT * FROM accounting ORDER BY created_at DESC")->fetchAll();
        $notifications = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC")->fetchAll();
        $attendance = $pdo->query("SELECT * FROM attendance")->fetchAll();
        $schedule = $pdo->query("SELECT * FROM schedule ORDER BY day_of_week, start_time")->fetchAll();
        $grades = $pdo->query("SELECT * FROM grades ORDER BY created_at DESC")->fetchAll();
        $library = $pdo->query("SELECT * FROM library ORDER BY created_at DESC")->fetchAll();

        // التهيئة المطلوبة للواجهة
        foreach ($students as &$s) {
            if (!empty($s['extra_data'])) {
                $extra = json_decode($s['extra_data'], true);
                if (is_array($extra)) {
                    $s = array_merge($s, $extra);
                }
            }
            $s['statusCode'] = $s['status_code'];
            unset($s['status_code']);
            unset($s['extra_data']);
        }

        foreach ($recentStudents as &$r) {
            $r['statusCode'] = $r['status_code'];
            unset($r['status_code']);
        }

        foreach ($user_roles as &$u) {
            $u['roleCode'] = $u['role_code'];
            $u['statusCode'] = $u['status_code'];
            $u['code'] = $u['code'] ?? '';
            $u['password'] = $u['plain_password'] ?? '';
            $u['img'] = $u['img'] ?? '';
            unset($u['role_code'], $u['status_code'], $u['password_hash'], $u['plain_password']);
        }

        foreach ($accounting as &$a) {
            $a['statusCode'] = $a['status_code'];
            unset($a['status_code']);
        }
        
        foreach ($notifications as &$n) {
            $n['target'] = $n['target_role'];
            $n['date'] = date('Y-m-d h:i A', strtotime($n['created_at']));
        }

        $appSettings = [
            'instituteName' => $settings['institute_name'] ?? 'مركز الباندا',
            'phone' => $settings['phone'] ?? '',
            'email' => $settings['email'] ?? '',
            'currency' => $settings['currency'] ?? 'IQD',
            'logo' => $settings['logo'] ?? '',
            'maxStudentsPerCourse' => $settings['max_students_per_course'] ?? 30
        ];

        foreach ($subjects as &$sub) {
            $sub['desc'] = $sub['description'];
        }

        foreach ($attendance as &$att) {
            $att['records'] = json_decode($att['records'] ?? '[]', true);
        }

        sendResponse(true, [
            'students' => $students,
            'recentStudents' => $recentStudents,
            'roles' => $user_roles,
            'instructors' => $instructors,
            'courses' => $courses,
            'subjects' => $subjects,
            'accounting' => $accounting,
            'notifications' => $notifications,
            'settings' => $appSettings,
            'attendance' => $attendance,
            'schedule' => $schedule,
            'grades' => $grades,
            'library' => $library
        ]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage(), 500);
    }
}

// =========================================================
//  الطلاب (Students)
// =========================================================
if ($endpoint === 'students' && $method === 'POST') {
    $student = $body['student'] ?? [];
    $recent = $body['recent'] ?? null;
    
    $id = $student['id'] ?? 'Std-' . time();
    $name = $student['name'] ?? '';
    $email = $student['email'] ?? '';
    $course = $student['course'] ?? '';
    $date = $student['date'] ?? '';
    $class_id = !empty($student['class_id']) ? $student['class_id'] : null;
    $total = $student['total'] ?? '0 دينار';
    $paid = $student['paid'] ?? '0 دينار';
    $balance = $student['balance'] ?? '0 دينار';
    $status = $student['status'] ?? 'مستمر';
    $status_code = $student['statusCode'] ?? $student['status_code'] ?? 'active';
    
    // استخراج الحقول الإضافية (مثل serial_xxx)
    $extra_data = [];
    foreach ($student as $k => $v) {
        if (strpos($k, 'serial_') === 0 || $k === 'phone') {
            $extra_data[$k] = $v;
        }
    }
    $extra_json = json_encode($extra_data, JSON_UNESCAPED_UNICODE);

    try {
        $stmt = $pdo->prepare("INSERT INTO students (id, name, email, course, date, class_id, total, paid, balance, status, status_code, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $name, $email, $course, $date, $class_id, $total, $paid, $balance, $status, $status_code, $extra_json]);

        if ($recent) {
            $stmtR = $pdo->prepare("INSERT INTO recent_students (id, name, course, date, status, status_code) VALUES (UUID(), ?, ?, ?, ?, ?)");
            $stmtR->execute([$recent['name'], $recent['course'], $recent['date'], $recent['status'], $recent['statusCode'] ?? 'active']);
        }
        sendResponse(true);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage(), 500);
    }
}

// مسار: students/:id
if (preg_match('/^students\/(.+)$/', $endpoint, $matches)) {
    $id = $matches[1];
    
    if ($method === 'PUT') {
        $student = $body['student'] ?? $body;
        $name = $student['name'] ?? '';
        $email = $student['email'] ?? '';
        $course = $student['course'] ?? '';
        $date = $student['date'] ?? '';
        $class_id = !empty($student['class_id']) ? $student['class_id'] : null;
        $total = $student['total'] ?? '0 دينار';
        $paid = $student['paid'] ?? '0 دينار';
        $balance = $student['balance'] ?? '0 دينار';
        $status = $student['status'] ?? 'مستمر';
        $status_code = $student['statusCode'] ?? $student['status_code'] ?? 'active';

        $extra_data = [];
        foreach ($student as $k => $v) {
            if (strpos($k, 'serial_') === 0 || $k === 'phone') $extra_data[$k] = $v;
        }
        $extra_json = json_encode($extra_data, JSON_UNESCAPED_UNICODE);

        try {
            $stmt = $pdo->prepare("UPDATE students SET name=?, email=?, course=?, date=?, class_id=?, total=?, paid=?, balance=?, status=?, status_code=?, extra_data=? WHERE id=?");
            $stmt->execute([$name, $email, $course, $date, $class_id, $total, $paid, $balance, $status, $status_code, $extra_json, $id]);
            sendResponse(true);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM students WHERE id=?");
        $stmt->execute([$id]);
        sendResponse(true);
    }
}


// =========================================================
//  المستخدمين والأدوار (Roles)
// =========================================================
if ($endpoint === 'roles' && $method === 'POST') {
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    $code = $body['code'] ?? '';
    $name = $body['name'] ?? '';
    $role = $body['role'] ?? 'ولي أمر';
    $roleCode = $body['roleCode'] ?? 'parent';
    $statusCode = $body['statusCode'] ?? 'active';
    $date = $body['date'] ?? date('d M Y');

    // فحص الإيميل
    $stmt = $pdo->prepare("SELECT email FROM user_roles WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) sendResponse(false, null, 'هذا البريد الإلكتروني مستخدم مسبقاً', 409);

    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO user_roles (id, name, email, password_hash, role, role_code, status_code, date, code, plain_password) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $hash, $role, $roleCode, $statusCode, $date, $code, $password]);

        // جلب الكل كرد
        $roles = $pdo->query("SELECT * FROM user_roles")->fetchAll();
        foreach ($roles as &$u) {
            $u['roleCode'] = $u['role_code'];
            $u['statusCode'] = $u['status_code'];
            $u['code'] = $u['code'] ?? '';
            $u['password'] = $u['plain_password'] ?? '';
            $u['img'] = $u['img'] ?? '';
            unset($u['role_code'], $u['status_code'], $u['password_hash'], $u['plain_password']);
        }
        sendResponse(true, ['roles' => $roles]);
    } catch (Exception $e) {
        sendResponse(false, null, $e->getMessage(), 500);
    }
}

// مسار: roles/:email
if (preg_match('/^roles\/(.+)$/', $endpoint, $matches)) {
    $targetEmail = urldecode($matches[1]);
    
    if ($method === 'PUT') {
        $name = $body['name'] ?? null;
        $role = $body['role'] ?? null;
        $role_code = $body['roleCode'] ?? null;
        $status_code = $body['statusCode'] ?? null;
        $code = $body['code'] ?? null;
        $password_hash = !empty($body['password']) ? password_hash($body['password'], PASSWORD_DEFAULT) : null;
        $plain_password = !empty($body['password']) ? $body['password'] : null;
        $img = $body['img'] ?? null;

        $updates = [];
        $params = [];
        if ($name !== null) { $updates[] = "name=?"; $params[] = $name; }
        if ($role !== null) { $updates[] = "role=?"; $params[] = $role; }
        if ($role_code !== null) { $updates[] = "role_code=?"; $params[] = $role_code; }
        if ($status_code !== null) { $updates[] = "status_code=?"; $params[] = $status_code; }
        if ($code !== null) { $updates[] = "code=?"; $params[] = $code; }
        if ($password_hash !== null) { $updates[] = "password_hash=?"; $params[] = $password_hash; }
        if ($plain_password !== null) { $updates[] = "plain_password=?"; $params[] = $plain_password; }
        if ($img !== null) { $updates[] = "img=?"; $params[] = $img; }

        if (!empty($updates)) {
            $params[] = $targetEmail;
            $stmt = $pdo->prepare("UPDATE user_roles SET " . implode(', ', $updates) . " WHERE email=?");
            $stmt->execute($params);
        }
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM user_roles WHERE email=?");
        $stmt->execute([$targetEmail]);
    }
    
    $roles = $pdo->query("SELECT * FROM user_roles")->fetchAll();
    foreach ($roles as &$u) {
        $u['roleCode'] = $u['role_code'];
        $u['statusCode'] = $u['status_code'];
        $u['code'] = $u['code'] ?? '';
        $u['password'] = $u['plain_password'] ?? '';
        $u['img'] = $u['img'] ?? '';
        unset($u['role_code'], $u['status_code'], $u['password_hash'], $u['plain_password']);
    }
    sendResponse(true, ['roles' => $roles]);
}


// =========================================================
//  التحديثات المجمّعة والمفردة للمدرسين، الدورات، المواد .. الخ
// =========================================================

// دالة مساعدة لعمل Upsert في MySQL (INSERT ... ON DUPLICATE KEY UPDATE)
function buildUpsertQuery($table, $dataRow) {
    if (empty($dataRow)) return ['', []];
    $keys = array_keys($dataRow);
    $placeholders = array_fill(0, count($keys), '?');
    $updates = array_map(function($key) { return "`$key` = VALUES(`$key`)"; }, $keys);

    $sql = "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $placeholders) . ") ON DUPLICATE KEY UPDATE " . implode(", ", $updates);
    return [$sql, array_values($dataRow)];
}

// /update/instructors
if ($endpoint === 'update/instructors' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $i => $inst) {
        if (empty($inst['id'])) $inst['id'] = 'Inst-' . time() . $i;
        $row = [
            'id' => $inst['id'], 'name' => $inst['name'] ?? '', 'spec' => $inst['spec'] ?? '',
            'phone' => $inst['phone'] ?? '', 'courses' => $inst['courses'] ?? 0,
            'rating' => $inst['rating'] ?? 5.0, 'img' => $inst['img'] ?? ''
        ];
        [$sql, $params] = buildUpsertQuery('instructors', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// PUT|DELETE /instructors/:id
if (preg_match('/^instructors\/(.+)$/', $endpoint, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $stmt = $pdo->prepare("UPDATE instructors SET name=:name, spec=:spec, phone=:phone, rating=:rating, img=:img, courses=:courses WHERE id=:id");
        $stmt->execute([
            ':name' => $body['name'] ?? '', ':spec' => $body['spec']??'', ':phone' => $body['phone']??'',
            ':rating' => $body['rating']??5.0, ':img' => $body['img']??'', ':courses' => $body['courses']??0, ':id' => $id
        ]);
        sendResponse(true);
    } elseif ($method === 'DELETE') {
        $pdo->prepare("DELETE FROM instructors WHERE id=?")->execute([$id]);
        sendResponse(true);
    }
}

// /update/courses
if ($endpoint === 'update/courses' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $c => $crs) {
        if (empty($crs['id'])) $crs['id'] = 'Crs-' . time() . $c;
        $row = [
            'id' => $crs['id'], 'title' => $crs['title'] ?? '', 'subject' => $crs['subject'] ?? '',
            'instructor' => $crs['instructor'] ?? '', 'duration' => $crs['duration'] ?? '',
            'students' => $crs['students'] ?? 0, 'capacity' => $crs['capacity'] ?? 30, 'img' => $crs['img'] ?? ''
        ];
        [$sql, $params] = buildUpsertQuery('courses', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// PUT|DELETE /courses/:id
if (preg_match('/^courses\/(.+)$/', $endpoint, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $stmt = $pdo->prepare("UPDATE courses SET title=:title, subject=:subject, instructor=:instructor, duration=:duration, students=:students, capacity=:capacity, img=:img WHERE id=:id");
        $stmt->execute([
            ':title' => $body['title'] ?? '', ':subject' => $body['subject']??'', ':instructor' => $body['instructor']??'',
            ':duration' => $body['duration']??'', ':students' => $body['students']??0, ':capacity' => $body['capacity']??30, ':img' => $body['img']??'', ':id' => $id
        ]);
        sendResponse(true);
    } elseif ($method === 'DELETE') {
        $pdo->prepare("DELETE FROM courses WHERE id=?")->execute([$id]);
        sendResponse(true);
    }
}

// /update/subjects
if ($endpoint === 'update/subjects' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $s => $sub) {
        if (empty($sub['id'])) $sub['id'] = 'Sub-' . time() . $s;
        $row = [
            'id' => $sub['id'], 'name' => $sub['name'] ?? '', 'description' => $sub['desc'] ?? $sub['description'] ?? ''
        ];
        [$sql, $params] = buildUpsertQuery('subjects', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// PUT|DELETE /subjects/:id
if (preg_match('/^subjects\/(.+)$/', $endpoint, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $stmt = $pdo->prepare("UPDATE subjects SET name=?, description=? WHERE id=?");
        $stmt->execute([$body['name'] ?? '', $body['desc'] ?? '', $id]);
        sendResponse(true);
    } elseif ($method === 'DELETE') {
        $subj = $pdo->prepare("SELECT name FROM subjects WHERE id=?");
        $subj->execute([$id]);
        $row = $subj->fetch();
        if ($row) {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE subject=?");
            $chk->execute([$row['name']]);
            if ($chk->fetchColumn() > 0) {
                sendResponse(false, null, 'لا يمكن الحذف لوجود دورات مرتبطة.', 409);
            }
        }
        $pdo->prepare("DELETE FROM subjects WHERE id=?")->execute([$id]);
        sendResponse(true);
    }
}

// /update/accounting
if ($endpoint === 'update/accounting' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $a => $acc) {
        if (empty($acc['id'])) $acc['id'] = 'ACC-' . time() . '-' . $a;
        $row = [
            'id' => $acc['id'], 'receipt' => $acc['receipt'] ?? '', 'student' => $acc['student'] ?? '',
            'amount' => $acc['amount'] ?? '', 'date' => $acc['date'] ?? '', 'method' => $acc['method'] ?? 'نقدي',
            'notes' => $acc['notes'] ?? '', 'status' => $acc['status'] ?? 'مدفوع', 'status_code' => $acc['statusCode'] ?? $acc['status_code'] ?? 'active',
            'type' => $acc['type'] ?? 'income'
        ];
        [$sql, $params] = buildUpsertQuery('accounting', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// PUT|DELETE /accounting/:id
if (preg_match('/^accounting\/(.+)$/', $endpoint, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $row = [
            'id' => $id, 'receipt' => $body['receipt'] ?? '', 'student' => $body['student'] ?? '',
            'amount' => $body['amount'] ?? '', 'date' => $body['date'] ?? '', 'method' => $body['method'] ?? 'نقدي',
            'notes' => $body['notes'] ?? '', 'status' => $body['status'] ?? 'مدفوع', 'status_code' => $body['statusCode'] ?? 'active',
            'type' => $body['type'] ?? 'income'
        ];
        $sql = "UPDATE accounting SET receipt=:receipt, student=:student, amount=:amount, date=:date, method=:method, notes=:notes, status=:status, status_code=:status_code, type=:type WHERE id=:id";
        $pdo->prepare($sql)->execute($row);
        sendResponse(true);
    } elseif ($method === 'DELETE') {
        $pdo->prepare("DELETE FROM accounting WHERE id=?")->execute([$id]);
        sendResponse(true);
    }
}

// /update/notifications
if ($endpoint === 'update/notifications' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $n => $not) {
        if (empty($not['id'])) $not['id'] = 'NOTIF-' . time() . $n;
        $row = [
            'id' => $not['id'], 'title' => $not['title'] ?? '', 'message' => $not['message'] ?? '',
            'type' => $not['type'] ?? 'info', 'target_role' => $not['target'] ?? $not['target_role'] ?? 'all'
        ];
        [$sql, $params] = buildUpsertQuery('notifications', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// DELETE /notifications/:id
if (preg_match('/^notifications\/(.+)$/', $endpoint, $matches) && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM notifications WHERE id=?")->execute([$matches[1]]);
    sendResponse(true);
}

// /update/settings
if ($endpoint === 'update/settings' && $method === 'POST') {
    $institute_name = $body['instituteName'] ?? 'مركز الباندا';
    $phone = $body['phone'] ?? '';
    $email = $body['email'] ?? '';
    $currency = $body['currency'] ?? 'IQD';
    $logo = $body['logo'] ?? '';
    $max_students = $body['maxStudentsPerCourse'] ?? 30;

    $exist = $pdo->query("SELECT id FROM settings LIMIT 1")->fetch();
    if ($exist) {
        $stmt = $pdo->prepare("UPDATE settings SET institute_name=?, phone=?, email=?, currency=?, logo=?, max_students_per_course=? WHERE id=?");
        $stmt->execute([$institute_name, $phone, $email, $currency, $logo, $max_students, $exist['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO settings (id, institute_name, phone, email, currency, logo, max_students_per_course) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$institute_name, $phone, $email, $currency, $logo, $max_students]);
    }
    sendResponse(true);
}

// /attendance
if ($endpoint === 'attendance' && $method === 'POST') {
    $class_id = $body['class_id'] ?? '';
    $date = $body['date'] ?? '';
    $recordsJson = json_encode($body['records'] ?? [], JSON_UNESCAPED_UNICODE);

    $exist = $pdo->prepare("SELECT id FROM attendance WHERE class_id=? AND date=?");
    $exist->execute([$class_id, $date]);
    $fetch = $exist->fetch();
    if ($fetch) {
        $pdo->prepare("UPDATE attendance SET records=? WHERE id=?")->execute([$recordsJson, $fetch['id']]);
    } else {
        $pdo->prepare("INSERT INTO attendance (id, class_id, date, records) VALUES (UUID(), ?, ?, ?)")->execute([$class_id, $date, $recordsJson]);
    }
    sendResponse(true);
}

// /update/schedule
if ($endpoint === 'update/schedule' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $s => $sch) {
        if (empty($sch['id'])) $sch['id'] = 'Sch-' . time() . $s;
        $row = [
            'id' => $sch['id'], 'course_id' => $sch['course_id'] ?? '', 'class_id' => $sch['class_id'] ?? '',
            'instructor_name' => $sch['instructor_name'] ?? '', 'day_of_week' => $sch['day_of_week'] ?? '',
            'start_time' => $sch['start_time'] ?? '', 'end_time' => $sch['end_time'] ?? '', 'room' => $sch['room'] ?? ''
        ];
        [$sql, $params] = buildUpsertQuery('schedule', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// DELETE /schedule/:id
if (preg_match('/^schedule\/(.+)$/', $endpoint, $matches) && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM schedule WHERE id=?")->execute([$matches[1]]);
    sendResponse(true);
}

// /update/grades
if ($endpoint === 'update/grades' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $g => $grade) {
        if (empty($grade['id'])) $grade['id'] = 'GRD-' . time() . rand(100,999) . $g;
        $row = [
            'id' => $grade['id'], 'class_id' => $grade['class_id'] ?? '', 'student_id' => $grade['student_id'] ?? '',
            'exam_name' => $grade['exam_name'] ?? 'تقييم', 'grade_value' => $grade['grade_value'] ?? '100',
            'week1' => $grade['week1'] ?? '', 'week2' => $grade['week2'] ?? '',
            'week3' => $grade['week3'] ?? '', 'week4' => $grade['week4'] ?? '',
            'notes' => $grade['notes'] ?? ''
        ];
        [$sql, $params] = buildUpsertQuery('grades', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}
// DELETE /grades/:id
if (preg_match('/^grades\/(.+)$/', $endpoint, $matches) && $method === 'DELETE') {
    $pdo->prepare("DELETE FROM grades WHERE id=?")->execute([$matches[1]]);
    sendResponse(true);
}

// /update/library
if ($endpoint === 'update/library' && $method === 'POST') {
    $list = isset($body[0]) && is_array($body) ? $body : [$body];
    foreach ($list as $b => $book) {
        if (empty($book['id'])) $book['id'] = 'LIB-' . time() . rand(100,999) . $b;
        $row = [
            'id' => $book['id'], 'title' => $book['title'] ?? '', 'author' => $book['author'] ?? '',
            'category' => $book['category'] ?? '', 'status' => $book['status'] ?? 'متاح'
        ];
        [$sql, $params] = buildUpsertQuery('library', $row);
        $pdo->prepare($sql)->execute($params);
    }
    sendResponse(true);
}

// =========================================================
//  استيراد قاعدة البيانات (Import Backup)
// =========================================================
if ($endpoint === 'import' && $method === 'POST') {
    try {
        $pdo->beginTransaction();
        
        // تعطيل قيود المفاتيح الأجنبية مؤقتاً لتفريغ الجداول
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $pdo->exec("TRUNCATE TABLE library");
        $pdo->exec("TRUNCATE TABLE grades");
        $pdo->exec("TRUNCATE TABLE schedule");
        $pdo->exec("TRUNCATE TABLE attendance");
        $pdo->exec("TRUNCATE TABLE notifications");
        $pdo->exec("TRUNCATE TABLE accounting");
        $pdo->exec("TRUNCATE TABLE recent_students");
        $pdo->exec("TRUNCATE TABLE students");
        $pdo->exec("TRUNCATE TABLE courses");
        $pdo->exec("TRUNCATE TABLE instructors");
        $pdo->exec("TRUNCATE TABLE subjects");
        $pdo->exec("TRUNCATE TABLE user_roles");
        $pdo->exec("TRUNCATE TABLE settings");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        if (!empty($body['settings'])) {
            $s = $body['settings'];
            $stmt = $pdo->prepare("INSERT INTO settings (id, institute_name, phone, email, currency, logo, max_students_per_course) VALUES (UUID(), ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$s['instituteName']??'', $s['phone']??'', $s['email']??'', $s['currency']??'', $s['logo']??'', $s['maxStudentsPerCourse']??30]);
        }
        
        if (!empty($body['roles'])) {
            $stmt = $pdo->prepare("INSERT INTO user_roles (id, name, email, password_hash, plain_password, code, role, role_code, status_code, date, img) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['roles'] as $r) {
                $hash = password_hash($r['password'] ?? '123123', PASSWORD_DEFAULT);
                $stmt->execute([$r['name']??'', $r['email']??'', $hash, $r['password']??'123123', $r['code']??'', $r['role']??'', $r['roleCode']??'', $r['statusCode']??'active', $r['date']??'', $r['img']??'']);
            }
        }

        if (!empty($body['subjects'])) {
            $stmt = $pdo->prepare("INSERT INTO subjects (id, name, description) VALUES (?, ?, ?)");
            foreach ($body['subjects'] as $s) {
                $stmt->execute([$s['id'], $s['name']??'', $s['desc']??$s['description']??'']);
            }
        }

        if (!empty($body['instructors'])) {
            $stmt = $pdo->prepare("INSERT INTO instructors (id, name, spec, phone, courses, rating, img) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['instructors'] as $i) {
                $stmt->execute([$i['id'], $i['name']??'', $i['spec']??'', $i['phone']??'', $i['courses']??0, $i['rating']??5.0, $i['img']??'']);
            }
        }

        if (!empty($body['courses'])) {
            $stmt = $pdo->prepare("INSERT INTO courses (id, title, subject, instructor, duration, students, capacity, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['courses'] as $c) {
                $stmt->execute([$c['id'], $c['title']??'', $c['subject']??'', $c['instructor']??'', $c['duration']??'', $c['students']??0, $c['capacity']??30, $c['img']??'']);
            }
        }

        if (!empty($body['students'])) {
            $stmt = $pdo->prepare("INSERT INTO students (id, name, email, course, date, class_id, total, paid, balance, status, status_code, extra_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['students'] as $s) {
                $extra_data = [];
                foreach ($s as $k => $v) {
                    if (strpos($k, 'serial_') === 0 || $k === 'phone') $extra_data[$k] = $v;
                }
                $extra_json = json_encode($extra_data, JSON_UNESCAPED_UNICODE);
                $stmt->execute([$s['id'], $s['name']??'', $s['email']??'', $s['course']??'', $s['date']??'', $s['class_id']??null, $s['total']??'', $s['paid']??'', $s['balance']??'', $s['status']??'', $s['statusCode']??'active', $extra_json]);
            }
        }

        if (!empty($body['recentStudents'])) {
            $stmt = $pdo->prepare("INSERT INTO recent_students (id, name, course, date, status, status_code) VALUES (UUID(), ?, ?, ?, ?, ?)");
            foreach ($body['recentStudents'] as $r) {
                $stmt->execute([$r['name']??'', $r['course']??'', $r['date']??'', $r['status']??'', $r['statusCode']??'active']);
            }
        }

        if (!empty($body['accounting'])) {
            $stmt = $pdo->prepare("INSERT INTO accounting (id, receipt, student, amount, date, method, notes, status, status_code, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['accounting'] as $a) {
                $stmt->execute([$a['id'], $a['receipt']??'', $a['student']??'', $a['amount']??'', $a['date']??'', $a['method']??'', $a['notes']??'', $a['status']??'', $a['statusCode']??'active', $a['type']??'income']);
            }
        }

        if (!empty($body['notifications'])) {
            $stmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, target_role) VALUES (?, ?, ?, ?, ?)");
            foreach ($body['notifications'] as $n) {
                $stmt->execute([$n['id'], $n['title']??'', $n['message']??'', $n['type']??'info', $n['target']??'all']);
            }
        }

        if (!empty($body['attendance'])) {
            $stmt = $pdo->prepare("INSERT INTO attendance (id, class_id, date, records) VALUES (UUID(), ?, ?, ?)");
            foreach ($body['attendance'] as $a) {
                $records = is_array($a['records']) ? json_encode($a['records'], JSON_UNESCAPED_UNICODE) : $a['records'];
                $stmt->execute([$a['class_id']??null, $a['date']??'', $records]);
            }
        }

        if (!empty($body['schedule'])) {
            $stmt = $pdo->prepare("INSERT INTO schedule (id, course_id, class_id, instructor_name, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['schedule'] as $s) {
                $stmt->execute([$s['id'], $s['course_id']??'', $s['class_id']??'', $s['instructor_name']??'', $s['day_of_week']??'', $s['start_time']??'', $s['end_time']??'', $s['room']??'']);
            }
        }

        if (!empty($body['grades'])) {
            $stmt = $pdo->prepare("INSERT INTO grades (id, class_id, student_id, exam_name, grade_value, week1, week2, week3, week4, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['grades'] as $g) {
                $stmt->execute([$g['id'], $g['class_id']??'', $g['student_id']??'', $g['exam_name']??'تقييم', $g['grade_value']??'100', $g['week1']??'', $g['week2']??'', $g['week3']??'', $g['week4']??'', $g['notes']??'']);
            }
        }

        if (!empty($body['library'])) {
            $stmt = $pdo->prepare("INSERT INTO library (id, title, author, category, status) VALUES (?, ?, ?, ?, ?)");
            foreach ($body['library'] as $l) {
                $stmt->execute([$l['id'], $l['title']??'', $l['author']??'', $l['category']??'', $l['status']??'متاح']);
            }
        }

        $pdo->commit();
        sendResponse(true, null, 'تم استيراد البيانات بنجاح');
    } catch (Exception $e) {
        $pdo->rollBack();
        sendResponse(false, null, 'خطأ أثناء الاستيراد: ' . $e->getMessage(), 500);
    }
}

// السقوط (Fallback)
notFound();
?>
