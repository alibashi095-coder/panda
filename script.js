// ============================================================
//  نظام إدارة مركز الباندا - النسخة النهائية
//  المطور: Antigravity
// ============================================================

// === Sidebar Toggle ===
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.querySelector("#toggle-btn");

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});

// === Mobile Sidebar Default & Overlay ===
const mobileToggleBtn = document.getElementById("mobile-toggle-btn");
if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("close");
    });
}
if (window.innerWidth <= 768) {
    sidebar.classList.add("close");
}
document.querySelector('.main-content').addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sidebar.classList.contains("close") && !e.target.closest('#mobile-toggle-btn')) {
        sidebar.classList.add("close");
    }
});

// إظهار القائمة الجانبية عند الضغط على "المزيد" من شريط التطبيق السفلي
const bottomMenuBtn = document.getElementById("bottom-menu-btn");
if (bottomMenuBtn) {
    bottomMenuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sidebar.classList.toggle("close");
    });
}

// === Mobile Swipe to Close Sidebar ===
let touchStartX = 0;
let touchEndX = 0;
const sidebarElement = document.getElementById('sidebar');
if (sidebarElement) {
    sidebarElement.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    sidebarElement.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (window.innerWidth <= 768) {
            if (touchEndX - touchStartX > 50) {
                if (!sidebar.classList.contains('close')) sidebar.classList.add('close');
            }
        }
    }, {passive: true});
}

// === Dark Mode Toggle ===
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    if (body.classList.contains("dark")) {
        themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.innerHTML = "<i class='bx bx-moon'></i>";
        localStorage.setItem("theme", "light");
    }
    // Redraw Chart on Theme Change
    if (enrollmentChart) {
        updateChartTheme();
    }
});

// Load saved theme
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    body.classList.add("dark");
    themeToggle.innerHTML = "<i class='bx bx-sun'></i>";
}

// === Navigation & Routing (SPA) ===
const navLinks = document.querySelectorAll(".nav-links a");
const pageViews = document.querySelectorAll(".page-view");

// === Register Service Worker for PWA ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('PWA ServiceWorker registered successfuly.');
        }).catch(err => {
            console.error('ServiceWorker registration failed: ', err);
        });
    });
}

// === PWA Install App Logic ===
let deferredPrompt;
const installContainer = document.getElementById('installAppContainer');
const installBtn = document.getElementById('installAppBtn');
const topbarInstallBtn = document.getElementById('topbarInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // منع المتصفح من إظهار شريط التثبيت التلقائي أسفل الشاشة
    e.preventDefault();
    // حفظ الحدث لاستدعائه عند نقر المستخدم على الزر
    deferredPrompt = e;
    // إظهار زر التثبيت الخاص بنا
    if (installContainer) installContainer.style.display = 'block';
    if (topbarInstallBtn) topbarInstallBtn.style.display = 'flex';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        // إظهار نافذة التثبيت الأصلية الخاصة بالمتصفح/الهاتف
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        // إخفاء الزر بعد الاختيار
        if (installContainer) installContainer.style.display = 'none';
            if (topbarInstallBtn) topbarInstallBtn.style.display = 'none';
    });
}

if (topbarInstallBtn) {
    topbarInstallBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (installContainer) installContainer.style.display = 'none';
        if (topbarInstallBtn) topbarInstallBtn.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    if (installContainer) installContainer.style.display = 'none';
    if (topbarInstallBtn) topbarInstallBtn.style.display = 'none';
});

// === Initialization & Login Logic ===
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
    // User Login Submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("loginEmail").value.trim();
            const passwordInput = document.getElementById("loginPassword").value.trim();

            loginToServer(emailInput, passwordInput);
        });
    }

    // Restore session (no need to download all users/passwords)
    const savedSession = sessionStorage.getItem("currentUser");
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        handleSuccessfulLogin(currentUser, false);
    }
});

async function loginToServer(identifier, password) {
    const errorMsg = document.getElementById("loginError");
    const submitBtn = document.querySelector("#loginForm button");
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : "دخول النظام <i class='bx bx-left-arrow-alt' style='margin-right: 8px; font-size: 20px;'></i>";
    
    try {
        if (submitBtn) {
            submitBtn.innerHTML = "<i class='bx bx-loader bx-spin'></i> جاري التحقق...";
            submitBtn.disabled = true;
        }

        const response = await fetch('api.php?endpoint=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: identifier, password: password })
        });
        
        const result = await response.json();

        if (!result.success || !result.data || !result.data.user) {
            throw new Error(result.message || "المستخدم غير موجود أو بيانات الدخول خاطئة.");
        }
        
        if (errorMsg) errorMsg.classList.remove("show");
        
        currentUser = result.data.user;
        
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        handleSuccessfulLogin(currentUser, true);
        if (submitBtn) { submitBtn.innerHTML = originalBtnHTML; submitBtn.disabled = false; }
    } catch (e) {
        console.error("Login error:", e);
        if (errorMsg) {
            errorMsg.textContent = "فشل تسجيل الدخول: " + e.message;
            errorMsg.classList.add("show");
            setTimeout(() => errorMsg.classList.remove("show"), 3000);
        }
        if (submitBtn) { submitBtn.innerHTML = originalBtnHTML; submitBtn.disabled = false; }
    }
}

function handleSuccessfulLogin(user, animate) {
    try {
        console.log("handleSuccessfulLogin triggered with:", user);

        // Hide Login Overlay
        const overlay = document.getElementById("login-overlay");
        console.log("Login overlay element:", overlay);
        if (overlay) {
            overlay.classList.remove("active");
            overlay.classList.add("hidden");
        }

        // Show App (Remove hidden class)
        document.body.classList.remove("app-hidden");
        console.log("Body classes after removing app-hidden:", document.body.className);

        // Update Profile UI
        const profileName = document.querySelector(".profile_name");
        const profileJob = document.querySelector(".job");
        const profileImg = document.getElementById("sidebar-profile-img");
        
        if (profileName) profileName.textContent = user.name;
        if (profileJob) profileJob.textContent = user.role;
        if (profileImg) profileImg.src = user.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4F46E5&color=fff`;

        const topbarUserInfo = document.getElementById("topbar-user-info");
        if (topbarUserInfo) topbarUserInfo.style.display = 'none';

        // Filter sidebar based on Role
        document.querySelectorAll('.nav-links > li').forEach(li => {
            li.style.display = 'none'; // Hide all first
        });

        let defaultRoute = 'dashboard';

        if (user.roleCode === 'admin') {
            const adminViews = ['dashboard', 'students', 'instructors', 'courses', 'class-management', 'subjects', 'accounting', 'notifications', 'settings', 'roles', 'certificates', 'schedule', 'library'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (adminViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'dashboard';
        }
        else if (user.roleCode === 'teacher') {
            const teacherViews = ['teacher-dashboard', 'teacher-students', 'teacher-attendance', 'teacher-grades', 'teacher-notifications', 'teacher-settings'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (teacherViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'teacher-dashboard';
        }
        else if (user.roleCode === 'parent') {
            const parentViews = ['parent-dashboard', 'parent-children', 'parent-fees', 'parent-settings'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (parentViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'parent-dashboard';
        }
        else if (user.roleCode === 'accountant') {
            const accountantViews = ['accountant-dashboard', 'accountant-fees', 'accountant-reports'];
            document.querySelectorAll('.nav-links > li').forEach(li => {
                const target = li.querySelector('a')?.getAttribute('data-target');
                if (accountantViews.includes(target)) li.style.display = 'block';
            });
            defaultRoute = 'accountant-dashboard';
        }

        console.log("Navigating to default route:", defaultRoute);
        
        // تخصيص شريط التطبيق السفلي بناءً على صلاحية المستخدم
        const bottomNav = document.getElementById("mobile-bottom-nav");
        if (bottomNav) {
            if (user.roleCode === 'admin') {
                bottomNav.innerHTML = `
                    <a href="#" class="nav-item active" data-target="dashboard"><i class='bx bx-grid-alt'></i><span>الرئيسية</span></a>
                    <a href="#" class="nav-item" data-target="students"><i class='bx bx-user'></i><span>الطلاب</span></a>
                    <a href="#" class="nav-item" data-target="accounting"><i class='bx bx-wallet'></i><span>المالية</span></a>
                    <a href="#" class="nav-item" id="bottom-menu-btn"><i class='bx bx-menu'></i><span>المزيد</span></a>`;
            } else if (user.roleCode === 'teacher') {
                bottomNav.innerHTML = `
                    <a href="#" class="nav-item active" data-target="teacher-dashboard"><i class='bx bx-grid-alt'></i><span>الرئيسية</span></a>
                    <a href="#" class="nav-item" data-target="teacher-students"><i class='bx bx-group'></i><span>طلابي</span></a>
                    <a href="#" class="nav-item" data-target="teacher-attendance"><i class='bx bx-calendar-check'></i><span>التحضير</span></a>
                    <a href="#" class="nav-item" id="bottom-menu-btn"><i class='bx bx-menu'></i><span>المزيد</span></a>`;
            } else if (user.roleCode === 'parent') {
                 bottomNav.innerHTML = `
                    <a href="#" class="nav-item active" data-target="parent-dashboard"><i class='bx bx-grid-alt'></i><span>الرئيسية</span></a>
                    <a href="#" class="nav-item" data-target="parent-children"><i class='bx bx-face'></i><span>أبنائي</span></a>
                    <a href="#" class="nav-item" data-target="parent-fees"><i class='bx bx-wallet'></i><span>الرسوم</span></a>
                    <a href="#" class="nav-item" id="bottom-menu-btn"><i class='bx bx-menu'></i><span>المزيد</span></a>`;
            } else if (user.roleCode === 'accountant') {
                bottomNav.innerHTML = `
                    <a href="#" class="nav-item active" data-target="accountant-dashboard"><i class='bx bx-grid-alt'></i><span>الرئيسية</span></a>
                    <a href="#" class="nav-item" data-target="accountant-fees"><i class='bx bx-wallet'></i><span>الرسوم</span></a>
                    <a href="#" class="nav-item" data-target="accountant-reports"><i class='bx bx-line-chart'></i><span>التقارير</span></a>
                    <a href="#" class="nav-item" id="bottom-menu-btn"><i class='bx bx-menu'></i><span>المزيد</span></a>`;
            }
            
            // إعادة ربط حدث زر "المزيد"
            document.getElementById("bottom-menu-btn")?.addEventListener("click", (e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(50); // اهتزاز خفيف
                sidebar.classList.toggle("close");
            });
            
            // برمجة التنقل عند الضغط على أيقونات الشريط السفلي
            document.querySelectorAll(".mobile-bottom-nav a[data-target]").forEach(link => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (navigator.vibrate) navigator.vibrate(50);
                    navigateTo(link.getAttribute("data-target"));
                });
            });
        }

        // Default route
        navigateTo(defaultRoute);
        
        // Load data after authentication
        loadDataFromDB();

        // تحديث الإشعارات فور تسجيل الدخول لتتناسب مع الصلاحية
        renderNotifications();
        renderTeacherViews();
        renderParentViews();
    } catch (err) {
        console.error("Error inside handleSuccessfulLogin:", err);
    }
}

// Logout Feature
document.querySelector(".profile-details .bx-log-out")?.addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    currentUser = null;
    document.body.classList.add("app-hidden");
    const overlay = document.getElementById("login-overlay");
    if (overlay) overlay.classList.add("active");
    document.getElementById("loginForm").reset();
    document.getElementById("loginError").classList.remove("show");
});

function navigateTo(targetId) {
    if (!targetId) return;

    // Update active class on nav links
    document.querySelectorAll(".nav-links a.active").forEach(l => l.classList.remove("active"));
    const activeLink = document.querySelector(`.nav-links a[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add("active");

    // تحديث اللون للأيقونة النشطة في شريط التطبيق السفلي
    document.querySelectorAll(".mobile-bottom-nav a.active").forEach(l => l.classList.remove("active"));
    const bottomActiveLink = document.querySelector(`.mobile-bottom-nav a[data-target="${targetId}"]`);
    if (bottomActiveLink) bottomActiveLink.classList.add("active");

    // Show target section, hide others
    pageViews.forEach(view => {
        if (view.id === targetId) {
            view.classList.add("active");
        } else {
            view.classList.remove("active");
        }
    });

    // Mobile Sidebar Close on Click
    if (window.innerWidth <= 768) {
        sidebar.classList.add("close");
    }
}

function navigateToHome() {
    if (!currentUser) return;
    let defaultRoute = 'dashboard';
    if (currentUser.roleCode === 'teacher') defaultRoute = 'teacher-dashboard';
    else if (currentUser.roleCode === 'parent') defaultRoute = 'parent-dashboard';
    else if (currentUser.roleCode === 'accountant') defaultRoute = 'accountant-dashboard';
    navigateTo(defaultRoute);
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("data-target");
        navigateTo(targetId);
    });
});


// === Form Auto Calculations ===
function calculateRemaining() {
    const total = parseFloat(document.getElementById('studentTotalAmount')?.value) || 0;
    const paid = parseFloat(document.getElementById('studentPaidAmount')?.value) || 0;
    const remainingInput = document.getElementById('studentRemainingAmount');

    if (remainingInput) {
        remainingInput.value = Math.max(0, total - paid);
    }
}

function calculateEditRemaining() {
    const total = parseFloat(document.getElementById('editStudentTotalAmount')?.value) || 0;
    const paid = parseFloat(document.getElementById('editStudentPaidAmount')?.value) || 0;
    const remainingInput = document.getElementById('editStudentRemainingAmount');

    if (remainingInput) {
        remainingInput.value = Math.max(0, total - paid);
    }
}

// === Display Trainees in Course (Add Student Modal) ===
function displayCourseTrainees() {
    const infoDiv = document.getElementById('course-trainees-info');
    if (!infoDiv) return;

    const selectedOptions = Array.from(document.getElementById('studentCourse').selectedOptions);
    if (selectedOptions.length === 0) {
        infoDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center;">الرجاء تحديد دورة لعرض المتدربين المسجلين فيها.</p>';
        return;
    }

    let infoHtml = '';
    const maxStudents = settingsData.maxStudentsPerCourse || 30;

    selectedOptions.forEach(option => {
        const courseTitle = option.value;
        const course = coursesData.find(c => c.title === courseTitle);
        if (!course) return;

        // Find students in this course by checking for the specific serial key
        const studentsInCourse = studentsData.filter(student => student.hasOwnProperty(`serial_${course.id}`));

        infoHtml += `<div style="margin-bottom: 15px; border-right: 3px solid var(--primary-color); padding-right: 10px;">`;
        infoHtml += `<strong>- دورة: ${course.title} (${studentsInCourse.length} / ${maxStudents} متدرب)</strong>`;

        if (studentsInCourse.length > 0) {
            infoHtml += `<ul style="list-style-type: none; padding-right: 5px; margin-top: 5px; max-height: 150px; overflow-y: auto; font-size: 13px;">`;
            // Sort students by their serial number in this course
            studentsInCourse.sort((a, b) => (a[`serial_${course.id}`] || 0) - (b[`serial_${course.id}`] || 0));
            
            studentsInCourse.forEach(student => {
                const serial = student[`serial_${course.id}`];
                infoHtml += `<li><span style="font-weight:600; color: var(--primary-color);">#${serial}</span>: ${student.name}</li>`;
            });
            infoHtml += `</ul>`;
        } else {
            infoHtml += `<p style="padding-right: 5px; margin-top: 5px; font-size: 13px;">لا يوجد متدربين مسجلين حالياً.</p>`;
        }
        infoHtml += `</div>`;
    });

    infoDiv.innerHTML = infoHtml;
}

// === Display Student Count in Class ===
function displayClassTraineesCount() {
    const classSelect = document.getElementById('studentClass');
    const infoDiv = document.getElementById('class-students-info');
    if (!classSelect || !infoDiv) return;

    const selectedClassId = classSelect.value;
    if (!selectedClassId) {
        infoDiv.innerHTML = '';
        return;
    }

    const selectedClass = coursesData.find(c => c.id === selectedClassId);
    if (selectedClass) {
        const maxStudents = selectedClass.capacity || settingsData.maxStudentsPerCourse || 30;
        const currentStudents = studentsData.filter(s => s.class_id === selectedClassId).length;
        const color = currentStudents >= maxStudents ? 'var(--danger-color)' : 'var(--primary-color)';
        infoDiv.innerHTML = `<div style="padding: 10px; background: var(--bg-hover); border-radius: 8px; border-right: 3px solid ${color}; font-size: 14px;"><strong>الطلاب المسجلين في الشعبة:</strong> ${currentStudents} / ${maxStudents} طالب</div>`;
    }
}

// === Filter Classes by Selected Course ===
function filterClassesForSelectedCourses() {
    const courseSelect = document.getElementById('studentCourse');
    const classSelect = document.getElementById('studentClass');
    if (!courseSelect || !classSelect) return;

    const selectedCourseTitles = Array.from(courseSelect.selectedOptions).map(opt => opt.value);
    
    if (selectedCourseTitles.length === 0) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        displayClassTraineesCount();
        return;
    }

    // جلب المواد الدراسية التابعة للدورات المحددة
    const selectedSubjects = selectedCourseTitles.map(title => {
        const course = coursesData.find(c => c.title === title);
        return course ? course.subject : null;
    }).filter(Boolean);

    // فلترة الشعب التي تشترك مع الدورة في نفس المادة الدراسية
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filteredClasses = classesList.filter(c => selectedSubjects.includes(c.subject));

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => {
            const maxStudents = parseInt(c.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === c.id).length;
            const isFull = currentStudents >= maxStudents;
            return `<option value="${c.id}" ${isFull ? 'disabled style="color: var(--danger-color);"' : ''}>${c.title} ${isFull ? '(ممتلئة)' : ''}</option>`;
        }).join('');
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة --</option>`;
    }
    displayClassTraineesCount();
}

// === Filter Classes by Selected Course in Edit Modal ===
function filterClassesForEditStudent() {
    const courseSelect = document.getElementById('editStudentCourse');
    const classSelect = document.getElementById('editStudentClass');
    if (!courseSelect || !classSelect) return;

    const selectedCourseTitles = Array.from(courseSelect.selectedOptions).map(opt => opt.value);
    
    if (selectedCourseTitles.length === 0) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        updateEditStudentSerial();
        return;
    }

    const selectedSubjects = selectedCourseTitles.map(title => {
        const course = coursesData.find(c => c.title === title);
        return course ? course.subject : null;
    }).filter(Boolean);

    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    const filteredClasses = classesList.filter(c => selectedSubjects.includes(c.subject));

    const currentClassId = classSelect.getAttribute('data-current-class');

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => {
            const maxStudents = parseInt(c.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === c.id).length;
            const isFull = currentStudents >= maxStudents && c.id !== currentClassId;
            return `<option value="${c.id}" ${isFull ? 'disabled style="color: var(--danger-color);"' : ''}>${c.title} ${isFull ? '(ممتلئة)' : ''}</option>`;
        }).join('');
        if (currentClassId && filteredClasses.find(c => c.id === currentClassId)) {
            classSelect.value = currentClassId;
        }
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة --</option>`;
    }
    updateEditStudentSerial();
}

function updateEditStudentSerial() {
    const classSelect = document.getElementById('editStudentClass');
    const serialInput = document.getElementById('editStudentSerial');
    const studentId = document.getElementById('editStudentId')?.value;
    if (!classSelect || !serialInput) return;

    const selectedClassId = classSelect.value;
    if (!selectedClassId) {
        serialInput.value = "-";
        return;
    }

    const classStudents = studentsData.filter(s => s.class_id === selectedClassId);
    const existingIndex = classStudents.findIndex(s => s.id === studentId);
    if (existingIndex !== -1) {
        serialInput.value = existingIndex + 1;
    } else {
        serialInput.value = `سيعين كـ ${classStudents.length + 1}`;
    }
}

// === Modal Logic ===
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        populateSelectMenus(modalId);
        modal.classList.add("active");

        if (modalId === 'student-modal') {
            const studentCourseSelect = document.getElementById('studentCourse');
            const infoDiv = document.getElementById('course-trainees-info');

            // Clear previous info and reset state on open
            if (infoDiv) {
                infoDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center;">الرجاء تحديد دورة لعرض المتدربين المسجلين فيها.</p>';
            }

            if (studentCourseSelect) {
                // To avoid attaching multiple listeners, we remove it first then add it
                studentCourseSelect.removeEventListener('change', displayCourseTrainees);
                studentCourseSelect.addEventListener('change', displayCourseTrainees);

                studentCourseSelect.removeEventListener('change', filterClassesForSelectedCourses);
                studentCourseSelect.addEventListener('change', filterClassesForSelectedCourses);
            }

            const studentClassSelect = document.getElementById('studentClass');
            if (studentClassSelect) {
                studentClassSelect.value = "";
                if (document.getElementById('class-students-info')) document.getElementById('class-students-info').innerHTML = '';
                studentClassSelect.removeEventListener('change', displayClassTraineesCount);
                studentClassSelect.addEventListener('change', displayClassTraineesCount);
            }
        }

        // Set default payment method for new accounting record
        if (modalId === 'add-accounting-modal') {
            const methodSelect = document.getElementById('accMethod');
            if (methodSelect) {
                methodSelect.value = 'نقدي';
            }
            
            // تصفير قائمة الطلبات عند فتح النافذة
            const accStudentSelect = document.getElementById('accStudentSelect');
            const accStudent = document.getElementById('accStudent');
            if (accStudentSelect) accStudentSelect.value = "";
            if (accStudent) { accStudent.style.display = "none"; accStudent.value = ""; }
        }
        
        if (modalId === 'add-role-modal') {
            if (typeof toggleRoleFields === 'function') toggleRoleFields();
        }
        if (modalId === 'edit-role-modal') {
            if (typeof toggleEditRoleFields === 'function') toggleEditRoleFields();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
    }
}

// === Relational Dropdown Logic ===
function populateSelectMenus(modalId) {
    // فصل الدورات التدريبية الأساسية عن الشعب لتخصيص كل قائمة منسدلة بما يناسبها
    const trainingCourses = coursesData.filter(c => c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));

    if (modalId === 'student-modal') {
        const courseSelect = document.getElementById('studentCourse');
        if (courseSelect) {
            courseSelect.innerHTML = trainingCourses.map(c => `<option value="${c.title}">${c.title} (${c.instructor})</option>`).join('');
        }
        const classSelect = document.getElementById('studentClass');
        if (classSelect) {
            classSelect.innerHTML = `<option value="">-- حدد الدورة أولاً --</option>`;
        }
    } else if (modalId === 'edit-student-modal') {
        const courseSelect = document.getElementById('editStudentCourse');
        if (courseSelect) {
            courseSelect.innerHTML = trainingCourses.map(c => `<option value="${c.title}">${c.title} (${c.instructor})</option>`).join('');
        }
        const classSelect = document.getElementById('editStudentClass');
        if (classSelect) {
            classSelect.innerHTML = `<option value="">-- حدد الدورة أولاً --</option>`;
        }
    } else if (modalId === 'add-role-modal') {
        const subjectSelect = document.getElementById('newRoleSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const classSelect = document.getElementById('newRoleClass');
        if (classSelect) {
            classSelect.innerHTML = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        const studentSelect = document.getElementById('newRoleStudent');
        if (studentSelect) {
            const limited = studentsData.slice(0, 100);
            studentSelect.innerHTML = limited.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('') + `<option disabled>... قم بالبحث لعرض المزيد</option>`;
        }
    } else if (modalId === 'edit-role-modal') {
        const subjectSelect = document.getElementById('editRoleSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const classSelect = document.getElementById('editRoleClass');
        if (classSelect) {
            classSelect.innerHTML = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')).map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        const studentSelect = document.getElementById('editRoleStudent');
        if (studentSelect) {
            const limited = studentsData.slice(0, 100);
            studentSelect.innerHTML = limited.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('') + `<option disabled>... قم بالبحث لعرض المزيد</option>`;
        }
    } else if (modalId === 'add-instructor-modal') {
        const subjectSelect = document.getElementById('instructorSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
         }
     } else if (modalId === 'add-course-modal') {
        const subjectSelect = document.getElementById('courseSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const instSelect = document.getElementById('courseInstructor');
        if (instSelect) {
            instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        }
    } else if (modalId === 'add-class-modal') {
        const subjectSelect = document.getElementById('classSubject');
        if (subjectSelect) {
            subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
        const instSelect = document.getElementById('classInstructor');
        if (instSelect) {
            instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        }
    } else if (modalId === 'add-schedule-modal') {
        const courseSelect = document.getElementById('scheduleCourse');
        if (courseSelect) {
            courseSelect.innerHTML = `<option value="">-- اختر الدورة --</option>` + trainingCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        const classSelect = document.getElementById('scheduleClass');
        if (classSelect) {
            classSelect.innerHTML = `<option value="">-- حدد الدورة أولاً --</option>`;
        }
        const instructorSelect = document.getElementById('scheduleInstructor');
        if (instructorSelect) {
            instructorSelect.innerHTML = `<option value="">-- اختر المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        }
    } else if (modalId === 'add-grade-modal') {
        const classSelect = document.getElementById('gradeModalClass');
        const studentSelect = document.getElementById('gradeModalStudent');
        if (classSelect) {
            let availableClasses = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
            if (currentUser && currentUser.roleCode === 'teacher') {
                availableClasses = availableClasses.filter(c => c.instructor === currentUser.name);
            }
            classSelect.innerHTML = '<option value="">-- اختر الشعبة --</option>' + availableClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        if (studentSelect) {
            studentSelect.innerHTML = '<option value="">-- حدد الشعبة أولاً --</option>';
        }
    }
}

function populateInstructorsForCourse() {
    const instSelect = document.getElementById('courseInstructor');
    if (instSelect) {
        const currentVal = instSelect.value;
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        if (currentVal) instSelect.value = currentVal;
    }
}

function populateInstructorsForEditCourse() {
    const instSelect = document.getElementById('editCourseInstructor');
    if (instSelect) {
        const currentVal = instSelect.value;
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        if (currentVal) instSelect.value = currentVal;
    }
}

function populateInstructorsForClass() {
    const instSelect = document.getElementById('classInstructor');
    if (instSelect) {
        const currentVal = instSelect.value;
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        if (currentVal) instSelect.value = currentVal;
    }
}

function populateInstructorsForEditClass() {
    const instSelect = document.getElementById('editClassInstructor');
    if (instSelect) {
        const currentVal = instSelect.value;
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        if (currentVal) instSelect.value = currentVal;
    }
}

function filterStudentsForGradeModal() {
    const classId = document.getElementById('gradeModalClass').value;
    const studentSelect = document.getElementById('gradeModalStudent');
    if (!studentSelect) return;
    
    if (!classId) {
        studentSelect.innerHTML = '<option value="">-- حدد الشعبة أولاً --</option>';
        return;
    }
    
    const classStudents = studentsData.filter(s => s.class_id === classId);
    if (classStudents.length > 0) {
        studentSelect.innerHTML = '<option value="">-- اختر الطالب --</option>' + classStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    } else {
        studentSelect.innerHTML = '<option value="">-- لا يوجد طلاب في هذه الشعبة --</option>';
    }
}

// Close modal on outside click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("active");
        }
    });
});

// 1. Chart.js (Enrollments)
let enrollmentChart;

function initChart() {
    const canvasElement = document.getElementById('enrollmentChart');
    if (!canvasElement) return;

    if (enrollmentChart) {
        enrollmentChart.destroy();
    }

    const textColor = body.classList.contains('dark') ? '#fff' : '#111827';
    const gridColor = body.classList.contains('dark') ? '#374151' : '#E5E7EB';
    const arabicMonthsShort = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    enrollmentChart = new Chart(canvasElement, {
        type: 'bar',
        data: {
            labels: arabicMonthsShort,
            datasets: [{
                label: 'إحصائيات التحاق الطلاب',
                data: [], // Will be populated dynamically
                backgroundColor: 'rgba(99, 102, 241, 0.7)', /* Modern Indigo */
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textColor, font: { family: 'Cairo' } }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!enrollmentChart) return;
    const textColor = body.classList.contains('dark') ? '#fff' : '#111827';
    const gridColor = body.classList.contains('dark') ? '#374151' : '#E5E7EB';

    enrollmentChart.options.scales.x.ticks.color = textColor;
    enrollmentChart.options.scales.y.ticks.color = textColor;
    enrollmentChart.options.scales.y.grid.color = gridColor;
    enrollmentChart.options.plugins.legend.labels.color = textColor;
    enrollmentChart.update();
}

function renderDashboardStats() {
    const totalStudentsEl = document.getElementById('total-students-stat');
    const totalInstructorsEl = document.getElementById('total-instructors-stat');
    const totalCoursesEl = document.getElementById('total-courses-stat');
    const monthlyRevenueEl = document.getElementById('monthly-revenue-stat');

    if (totalStudentsEl) totalStudentsEl.textContent = studentsData.length;
    if (totalInstructorsEl) totalInstructorsEl.textContent = instructorsData.length;
    if (totalCoursesEl) totalCoursesEl.textContent = coursesData.length;

    let monthlyRevenue = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const arabicMonths = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    studentsData.forEach(student => {
        const dateParts = student.date.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/]+/);
        if (dateParts.length === 3) {
            const month = arabicMonths[dateParts[1]];
            const year = parseInt(dateParts[2], 10);
            if (month === currentMonth && year === currentYear) {
                const paidAmount = parseFloat(student.paid.replace(/[^\d.-]/g, '')) || 0;
                monthlyRevenue += paidAmount;
            }
        }
    });

    if (monthlyRevenueEl) {
        const currency = settingsData.currency || 'دينار';
        monthlyRevenueEl.textContent = `${monthlyRevenue.toLocaleString()} ${currency}`;
    }

    updateEnrollmentChart();
}

function updateEnrollmentChart() {
    if (!enrollmentChart) return;

    const monthlyEnrollments = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    studentsData.forEach(student => {
        const dateParts = student.date.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/]+/);
        if (dateParts.length === 3 && parseInt(dateParts[2], 10) === currentYear) {
            const month = arabicMonthsMap[dateParts[1]];
            if (month !== undefined) monthlyEnrollments[month]++;
        }
    });

    enrollmentChart.data.datasets[0].data = monthlyEnrollments;
    enrollmentChart.update();
}

const API_BASE = "api.php?endpoint="; // توجيه مباشر إلى ملف PHP

// Global UI Data Arrays
let studentsData = [];
let rolesData = [];
let recentStudentsData = [];
let instructorsData = [];
let coursesData = [];
let subjectsData = [];
let accountingData = [];
let usersData = [];
let notificationsData = [];
let settingsData = {};
let attendanceData = [];
let scheduleData = [];
let gradesData = [];
let libraryData = [];
let lastSeenNotificationId = null;

// === Backend Data Communication ===

async function loadDataFromDB() {
    try {
        const response = await fetch('api.php?endpoint=data');
        const result = await response.json();

        if (result.success && result.data) {
            studentsData = result.data.students || [];
            instructorsData = result.data.instructors || [];
            coursesData = result.data.courses || [];
            subjectsData = result.data.subjects || [];
            accountingData = result.data.accounting || [];
            notificationsData = result.data.notifications || [];
            settingsData = result.data.settings || {};
            recentStudentsData = result.data.recentStudents || [];
            rolesData = result.data.roles || [];
            usersData = result.data.roles || [];
            attendanceData = result.data.attendance || [];
            scheduleData = result.data.schedule || [];
            gradesData = result.data.grades || [];
            libraryData = result.data.library || [];

            renderStudents();
            renderRoles();
            renderRecentStudents();
            renderInstructors();
            renderCourses();
            renderSubjects();
            renderAccounting();
            renderFinancialStudents();
            renderNotifications();
            renderSettings();
            renderClassManagement();
            renderDashboardStats();
            renderAccountingStats();
            updateSubscriptionCards();
            renderTeacherViews();
            renderParentViews();
            renderSchedule();
            renderLibrary();
        } else {
            console.error("Error loading data:", result.message);
        }

    } catch (e) {
        console.error("Error fetching data from API:", e);
    }
}

// === استخراج اسم ولي الأمر وتوليد البريد وكلمة المرور تلقائياً ===
const iraqiNamesDB = {
    "محمد": "mohammed", "علي": "ali", "حسين": "hussein", "حسن": "hassan",
    "عباس": "abbas", "احمد": "ahmed", "أحمد": "ahmed", "محمود": "mahmoud",
    "كاظم": "kadhim", "جاسم": "jassim", "صادق": "sadiq", "باقر": "baqir",
    "جواد": "jawad", "عبد": "abdul", "الله": "allah", "رضا": "ridha",
    "كرار": "karrar", "منتظر": "muntadher", "سجاد": "sajjad", "مصطفى": "mustafa",
    "زيد": "zaid", "ياسر": "yasser", "عمار": "ammar", "مهدي": "mahdi",
    "ابراهيم": "ibrahim", "إبراهيم": "ibrahim", "خليل": "khalil", "اسماعيل": "ismail",
    "عمر": "omar", "ابو": "abu", "بكر": "bakr", "عثمان": "othman",
    "عزيز": "aziz", "رحيم": "raheem", "كريم": "kareem", "يوسف": "youssef",
    "قاسم": "qasim", "طارق": "tariq", "رائد": "raed", "وليد": "waleed",
    "سعد": "saad", "سعيد": "saeed", "مجيد": "majeed", "حميد": "hameed",
    "حامد": "hamed", "خالد": "khalid", "بهاء": "bahaa", "علاء": "alaa"
};

function getEnglishName(arabicName) {
    if (!arabicName) return "parent";
    const parts = arabicName.trim().split(/\s+/);
    let firstPart = parts[0].replace(/[\u064B-\u065F\u0640]/g, ''); // إزالة الحركات
    if (iraqiNamesDB[firstPart]) return iraqiNamesDB[firstPart];
    const fallbackMap = { 'ا':'a','أ':'a','إ':'e','آ':'a','ب':'b','ت':'t','ث':'th','ج':'j','ح':'h','خ':'kh','د':'d','ذ':'dh','ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'dh','ط':'t','ظ':'dh','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a' };
    let eng = '';
    for (let char of firstPart) { eng += fallbackMap[char] || ''; }
    return eng || "parent";
}

const studentFullNameInput = document.getElementById('studentFullName');
const studentParentNameInput = document.getElementById('studentParentName');
const studentEmailPrefixInput = document.getElementById('studentEmailPrefix');
const studentParentPasswordInput = document.getElementById('studentParentPassword');

function generateParentCredentials(parentNameAr) {
    if (studentEmailPrefixInput) {
        let enName = getEnglishName(parentNameAr);
        // وضع الاسم المترجم في الإيميل (مع الاحتفاظ بالرقم العشوائي لعدم تغييره كل حرف)
        if (studentEmailPrefixInput.value.trim() === '' || studentEmailPrefixInput.value.includes('_')) {
             let currentNum = studentEmailPrefixInput.value.split('_')[1];
             let randNum = currentNum && currentNum.length === 3 ? currentNum : Math.floor(100 + Math.random() * 900);
             studentEmailPrefixInput.value = enName + '_' + randNum;
        }
    }
    if (studentParentPasswordInput && studentParentPasswordInput.value.trim() === '') {
        // تعيين كلمة المرور الافتراضية الثابتة
        studentParentPasswordInput.value = '123';
    }
}

if (studentFullNameInput && studentParentNameInput) {
    studentFullNameInput.addEventListener('input', function() {
        const parts = this.value.trim().split(/\s+/);
        if (parts.length > 1) {
                const pName = parts.slice(1).join(' ');
                studentParentNameInput.value = pName;
                generateParentCredentials(pName);
        } else {
            studentParentNameInput.value = '';
                if (studentEmailPrefixInput && studentEmailPrefixInput.value.includes('_')) studentEmailPrefixInput.value = '';
        }
    });

    studentParentNameInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
                generateParentCredentials(this.value);
        }
    });
}

// Add Student functionality
document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('studentFullName')?.value || '';
    const parentName = document.getElementById('studentParentName')?.value || '';
    const emailPrefix = document.getElementById('studentEmailPrefix')?.value || '';
    const email = emailPrefix ? emailPrefix + '@panda.com' : '';
    const parentPassword = document.getElementById('studentParentPassword')?.value || '';
    const phone = document.getElementById('studentPhone')?.value || '';


    // Capture multiple selected courses
    const courseSelect = document.getElementById('studentCourse');
    const selectedCourses = Array.from(courseSelect.selectedOptions).map(opt => opt.value).join('، ');

    // Financial Data
    const totalAmount = parseFloat(document.getElementById('studentTotalAmount')?.value) || 0;
    const paidAmount = parseFloat(document.getElementById('studentPaidAmount')?.value) || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    // Status Logic
    let statusText = "مستمر";
    let statusCode = "active";
    if (paidAmount < totalAmount) {
        statusText = "مطالب بالسداد";
        statusCode = "pending";
    }

    const date = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });

    const classSelect = document.getElementById('studentClass');
    const selectedClassId = classSelect ? classSelect.value : null;

    // التحقق من سعة الشعبة قبل الحفظ
    if (selectedClassId) {
        const cls = coursesData.find(c => c.id === selectedClassId);
        if (cls) {
            const maxStudents = parseInt(cls.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const currentStudents = studentsData.filter(s => s.class_id === selectedClassId).length;
            if (currentStudents >= maxStudents) {
                alert("عذراً، الشعبة المحددة ممتلئة بالكامل. يرجى اختيار شعبة أخرى.");
                return; // إيقاف عملية الحفظ
            }
        }
    }

    const newStudent = {
        name: fullName,
        email: email,
        phone: phone,
        course: '', // سيتم ملؤه لاحقاً مع الأرقام التسلسلية
        date: date,
        total: `${totalAmount} دينار`,
        paid: `${paidAmount} دينار`,
        balance: `${remainingAmount} دينار`,
        class_id: selectedClassId,
        status: statusText,
        statusCode: statusCode
    };


    const newRecent = {
        name: fullName,
        course: selectedCourses,
        date: date,
        status: statusText,
        statusCode: statusCode
    };

    // Function to find course by title
    function findCourseByTitle(title) {
        return coursesData.find(c => c.title === title);
    }

    // Function to generate a new course ID
   function generateCourseId() {
        return 'Crs-' + Date.now();
    }

    let coursesWithSerials = [];
    let coursesToUpdate = [];

    // Update course student count and handle new course creation if needed
    selectedCourses.split('، ').forEach(selectedCourseTitle => {
        const course = findCourseByTitle(selectedCourseTitle.trim());
        if (course) {
            const currentStudentCount = parseInt(course.students, 10) || 0;
            let serialInCourse;

            if (currentStudentCount < 30) {
                serialInCourse = currentStudentCount + 1;
                course.students = serialInCourse; // تحديث عدد الطلاب في الدورة
                coursesToUpdate.push(course);
                newStudent[`serial_${course.id}`] = serialInCourse; // تخزين الرقم التسلسلي الخام
                coursesWithSerials.push(`${course.title} (ر.ت: ${serialInCourse})`); // إضافة النص المنسق للعرض
            } else {
                // Create a new course if the limit is reached
                serialInCourse = 1; // هو أول طالب في الدورة الجديدة
                const newCourse = {
                    id: generateCourseId(),
                    title: `${course.title} - نسخة جديدة`, // Naming convention for new courses
                    subject: course.subject,
                    instructor: course.instructor,
                    duration: course.duration,
                    students: serialInCourse, // البدء بطالب واحد
                    img: course.img // You might want to handle image duplication differently
                };

                coursesData.push(newCourse);
                coursesToUpdate.push(newCourse);
                newStudent[`serial_${newCourse.id}`] = serialInCourse; // تخزين الرقم التسلسلي للدورة الجديدة
                coursesWithSerials.push(`${newCourse.title} (ر.ت: ${serialInCourse})`); // إضافة النص المنسق للعرض
            }
        } else {
            // في حال لم يتم العثور على الدورة، أضف العنوان فقط
            coursesWithSerials.push(selectedCourseTitle.trim());
        }
    });

    newStudent.course = coursesWithSerials.join('، ');

    try {
        if (coursesToUpdate.length > 0) {
            // تحديث بيانات الدورات (عدد الطلاب أو الدورات الجديدة)
            const cRes = await fetch('api.php?endpoint=update/courses', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(coursesToUpdate)
            });
            const cResult = await cRes.json();
            if (!cResult.success) throw new Error(cResult.message);
        }

        // إضافة الطالب في جدول الطلاب وجدول النشاطات الأخيرة
        const sRes = await fetch('api.php?endpoint=students', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student: newStudent, recent: newRecent })
        });
        const sResult = await sRes.json();

        if (sResult.success) {
            // إنشاء حساب ولي الأمر تلقائياً
            if (parentPassword && email) {
                const newRole = {
                    name: "ولي أمر: " + (parentName || fullName),
                    email: email,
                    code: parentPassword,
                    password: parentPassword
                };
                try {
                    await fetch('api.php?endpoint=roles', { 
                        method: 'POST', headers: {'Content-Type': 'application/json'}, 
                        body: JSON.stringify({...newRole, roleCode: 'parent', statusCode: 'active'}) 
                    });
                } catch (e) { console.error("Error creating parent role:", e); }
            }

            await loadDataFromDB();
            alert('تم إضافة الطالب بنجاح!');

            // إرسال رسالة واتساب
            if (phone) {
                let formattedPhone = phone.replace(/\D/g, ''); // إزالة المسافات والرموز
                if (formattedPhone.startsWith('0')) {
                    formattedPhone = '964' + formattedPhone.substring(1); // استخدام المفتاح الدولي (للعراق كمثال)
                }
                const waMsg = encodeURIComponent(`أهلاً بك ${fullName} في مركز الباندا التعليمي.\n\nتم تسجيلك بنجاح في: ${selectedCourses}\n\nبيانات حساب ولي الأمر لمتابعة الطالب:\nالبريد الإلكتروني: ${email}\nكلمة المرور: ${parentPassword}`);
                window.open(`https://wa.me/${formattedPhone}?text=${waMsg}`, '_blank');
            }
            
            closeModal('student-modal');
            document.getElementById('addStudentForm').reset();
        } else {
            throw new Error(sResult.message);
        }
    } catch (err) {
        console.error("Error saving student:", err);
        alert("تعذر حفظ البيانات: " + err.message);
    }
});

// Edit Student Logic

function editStudent(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) return;

    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentFullName').value = student.name;
    const emailPrefix = student.email ? student.email.split('@')[0] : '';
    document.getElementById('editStudentEmailPrefix').value = emailPrefix;
    document.getElementById('editStudentPhone').value = student.phone || '';

    // فتح النافذة أولاً لضمان تعبئة القوائم المنسدلة
    openModal('edit-student-modal');

    const courseSelect = document.getElementById('editStudentCourse');
    const coursesArray = student.course.split('،').map(c => c.replace(/\s*\(ر\.ت:\s*\d+\)/, '').trim());
    Array.from(courseSelect.options).forEach(opt => {
        opt.selected = coursesArray.includes(opt.value);
    });

    // ربط الشعبة بالطالب
    const classSelect = document.getElementById('editStudentClass');
    if (classSelect) {
        classSelect.setAttribute('data-current-class', student.class_id || '');
        
        courseSelect.removeEventListener('change', filterClassesForEditStudent);
        courseSelect.addEventListener('change', filterClassesForEditStudent);
        classSelect.removeEventListener('change', updateEditStudentSerial);
        classSelect.addEventListener('change', updateEditStudentSerial);

        filterClassesForEditStudent();
    }

    const totalNum = parseFloat(student.total ? student.total.replace(/[^\d.-]/g, '') : 0) || 0;
    const paidNum = parseFloat(student.paid ? student.paid.replace(/[^\d.-]/g, '') : 0) || 0;

    document.getElementById('editStudentTotalAmount').value = totalNum;
    document.getElementById('editStudentPaidAmount').value = paidNum;
    calculateEditRemaining();
}

document.getElementById('editStudentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editStudentId').value;
    const fullName = document.getElementById('editStudentFullName').value;
    const emailPrefix = document.getElementById('editStudentEmailPrefix').value;
    const email = emailPrefix ? emailPrefix + '@panda.com' : '';
    const phone = document.getElementById('editStudentPhone').value;

    const courseSelect = document.getElementById('editStudentCourse');
    const selectedCourseTitles = Array.from(courseSelect.selectedOptions).map(opt => opt.value);
    
    const originalStudent = studentsData.find(s => s.id === id);
    let coursesWithSerials = [];
    selectedCourseTitles.forEach(title => {
        const course = coursesData.find(c => c.title === title);
        let serialText = course && originalStudent[`serial_${course.id}`] ? `${title} (ر.ت: ${originalStudent[`serial_${course.id}`]})` : title;
        coursesWithSerials.push(serialText);
    });
    const finalCourseString = coursesWithSerials.join('، ');

    const classSelect = document.getElementById('editStudentClass');
    const selectedClassId = classSelect ? classSelect.value : null;


    // التحقق من سعة الشعبة في حال تم نقل الطالب لشعبة جديدة
    if (selectedClassId && (selectedClassId !== originalStudent.class_id)) {
        const cls = coursesData.find(c => c.id === selectedClassId);
        if (cls) {
            if (originalStudent.class_id) {
                const oldCls = coursesData.find(c => c.id === originalStudent.class_id);
                if (oldCls) {
                    oldCls.students = Math.max(0, (parseInt(oldCls.students, 10) || 0) - 1).toString();
                }
            }
        }
    }

    const totalAmount = parseFloat(document.getElementById('editStudentTotalAmount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('editStudentPaidAmount').value) || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let statusText = "مستمر";
    let statusCode = "active";
    if (paidAmount < totalAmount) {
        statusText = "مطالب بالسداد";
        statusCode = "pending";
    }

    const updates = {
        name: fullName,
        email: email,
        phone: phone,
        course: finalCourseString,
        class_id: selectedClassId,
        total: `${totalAmount} دينار`,
        paid: `${paidAmount} دينار`,
        balance: `${remainingAmount} دينار`,
        status: statusText,
        statusCode: statusCode
    };

    try {
        const response = await fetch(`api.php?endpoint=students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const result = await response.json();

        if (result.success) {
            await loadDataFromDB();
            alert('تم تعديل بيانات الطالب بنجاح!');
            closeModal('edit-student-modal');
        } else {
            throw new Error(result.message || "حدث خطأ غير معروف في الخادم");
        }
    } catch (e) {
        console.error("Error updating student:", e);
        alert("خطأ في حفظ التعديلات: " + e.message);
    }
});

async function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) {
        try {
            const response = await fetch(`api.php?endpoint=students/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                await loadDataFromDB();
            } else {
                throw new Error(result.message || "حدث خطأ غير معروف في الخادم");
            }
        } catch (e) {
            console.error("Error deleting student:", e);
            alert("خطأ في الحذف: " + e.message);
        }
    }
}

// Roles Forms
document.getElementById('addRoleForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    addRole();
});

// === Role Rendering & Management ===
function renderRoles(data = rolesData) {
    const tbody = document.getElementById("roles-table-body");
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">لا توجد بيانات مطابقة للبحث</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((r, index) => `
        <tr>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${r.name}</h4>
                    </div>
                </div>
            </td>
            <td>${r.email}</td>
            <td style="font-family: monospace; font-weight: bold; color: var(--primary-color);">${r.code || '-'}</td>
            <td style="font-family: monospace; color: var(--danger-color);">${r.password || '-'}</td>
            <td>${r.date}</td>
            <td><span class="status-badge status-${r.statusCode}">${r.role}</span></td>
            <td>
                <select class="form-select" style="padding: 6px 10px; width: 140px;" onchange="updateRoleType('${r.email}', this.value)">
                    <option ${r.roleCode === 'admin' ? 'selected' : ''} value="admin">مدير النظام</option>
                    <option ${r.roleCode === 'teacher' ? 'selected' : ''} value="teacher">المدرس</option>
                    <option ${r.roleCode === 'parent' ? 'selected' : ''} value="parent">ولي الأمر</option>
                </select>
            </td>
            <td>
                <button class="btn-icon" title="تعديل" onclick="editRole('${r.email}')"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" style="color: var(--danger-color);" title="حذف" onclick="deleteRole('${r.email}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `).join('');
}

function filterRoles() {
    const searchTerm = document.getElementById('roles-search')?.value.toLowerCase() || '';
    const filterTerm = document.getElementById('roles-filter')?.value || 'all';

    const filteredData = rolesData.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm) || r.email.toLowerCase().includes(searchTerm);
        const matchesFilter = filterTerm === 'all' || r.roleCode === filterTerm;
        return matchesSearch && matchesFilter;
    });

    renderRoles(filteredData);
}

function filterClassesForRole() {
    const subjectSelect = document.getElementById('newRoleSubject');
    const classSelect = document.getElementById('newRoleClass');
    
    if (!classSelect) return;
    
    const subject = subjectSelect ? subjectSelect.value : '';
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    
    if (subject && subject !== '') {
        const filtered = classesList.filter(c => c.subject === subject);
        if (filtered.length > 0) {
            classSelect.innerHTML = filtered.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        } else {
            classSelect.innerHTML = `<option value="" disabled>-- لا توجد شعب متاحة لهذه المادة --</option>`;
        }
    } else {
        classSelect.innerHTML = `<option value="" disabled>-- الرجاء تحديد المادة أولاً --</option>`;
    }
}

function filterClassesForEditRole() {
    const subjectSelect = document.getElementById('editRoleSubject');
    const classSelect = document.getElementById('editRoleClass');
    
    if (!classSelect) return;
    
    const subject = subjectSelect ? subjectSelect.value : '';
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    
    if (subject && subject !== '') {
        const filtered = classesList.filter(c => c.subject === subject);
        if (filtered.length > 0) {
            classSelect.innerHTML = filtered.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        } else {
            classSelect.innerHTML = `<option value="" disabled>-- لا توجد شعب متاحة لهذه المادة --</option>`;
        }
    } else {
        classSelect.innerHTML = `<option value="" disabled>-- الرجاء تحديد المادة أولاً --</option>`;
    }
}

function toggleRoleFields() {
    const type = document.getElementById('newRoleType')?.value;
    const subjectGroup = document.getElementById('roleSubjectGroup');
    const classGroup = document.getElementById('roleClassGroup');
    const studentGroup = document.getElementById('roleStudentGroup');
    const subjectSelect = document.getElementById('newRoleSubject');
    const classSelect = document.getElementById('newRoleClass');
    const studentSelect = document.getElementById('newRoleStudent');

    if (!subjectGroup || !studentGroup) return;

    if (type === 'teacher') {
        subjectGroup.style.display = 'block';
        if (classGroup) classGroup.style.display = 'block';
        studentGroup.style.display = 'none';
        
        if (subjectSelect) subjectSelect.required = true;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
        
        filterClassesForRole();
    } else if (type === 'parent') {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'block';
        
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    } else {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'none';
        
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    }
}

function filterParentStudents(nameId, selectId) {
    const nameVal = document.getElementById(nameId)?.value.trim().toLowerCase() || '';
    const studentSelect = document.getElementById(selectId);
    if (!studentSelect) return;
    
    // الاحتفاظ بالخيارات المحددة مسبقاً حتى لا تضيع أثناء الفلترة
    const selectedIds = Array.from(studentSelect.selectedOptions).map(opt => opt.value);
    
    if (nameVal === '') {
        studentSelect.innerHTML = studentsData.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('');
    } else {
        let sortedStudents = [...studentsData];
        const nameParts = nameVal.split(' ').filter(p => p.length > 1);
        
        // ترتيب الطلاب وإعطاء الأولوية للأسماء المطابقة
        sortedStudents.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            let aScore = 0; let bScore = 0;
            
            if (aName.includes(nameVal)) aScore += 10;
            if (bName.includes(nameVal)) bScore += 10;
            
            nameParts.forEach(part => {
                if (aName.includes(part)) aScore += 1;
                if (bName.includes(part)) bScore += 1;
            });
            
            return bScore - aScore;
        });
        
        const limited = sortedStudents.slice(0, 100);
        studentSelect.innerHTML = limited.map(s => `<option value="${s.id}">${s.name} - ${s.course}</option>`).join('') + (sortedStudents.length > 100 ? `<option disabled>... و ${sortedStudents.length - 100} آخرين</option>` : '');
    }
    
    Array.from(studentSelect.options).forEach(opt => {
        if (selectedIds.includes(opt.value)) opt.selected = true;
    });
}

document.getElementById('roles-search')?.addEventListener('input', filterRoles);
document.getElementById('roles-filter')?.addEventListener('change', filterRoles);

async function addRole() {
    const name = document.getElementById('newRoleName').value;
    const emailPrefixEl = document.getElementById('newRoleEmailPrefix');
    const emailEl = document.getElementById('newRoleEmail');
    let email = '';
    if (emailPrefixEl) {
        email = emailPrefixEl.value + '@panda.com';
    } else if (emailEl) {
        email = emailEl.value;
    }
    const code = document.getElementById('newRoleCode').value;
    const password = document.getElementById('newRolePassword').value;
    const type = document.getElementById('newRoleType').value;

    let roleName = type === 'admin' ? 'مدير النظام' : type === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    const newRole = {
        id: crypto.randomUUID(),
        name: name,
        email: email,
        code: code,
        password_hash: password, // مؤقتاً
        plain_password: password,
        date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }),
        role: roleName,
        role_code: type,
        status_code: statusCode
    };

    try {
        const roleRes = await fetch('api.php?endpoint=roles', { 
            method: 'POST', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({...newRole, roleCode: type, statusCode: statusCode}) 
        });
        const roleData = await roleRes.json();
        if (!roleData.success) throw new Error(roleData.message);

        // إنشاء مدرس آلياً إذا كانت الصلاحية "معلم"
        if (type === 'teacher') {
            const spec = document.getElementById('newRoleSubject').value;
            const newInstructor = { id: 'Inst-' + Date.now(), name: name, spec: spec, phone: '', img: '' };
            await fetch('api.php?endpoint=update/instructors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify([newInstructor]) });
            
            // ربط المدرس بالشعب
            const classSelect = document.getElementById('newRoleClass');
            if (classSelect) {
                const selectedClassIds = Array.from(classSelect.selectedOptions).map(opt => opt.value);
                for (let classId of selectedClassIds) {
                    await fetch(`api.php?endpoint=courses/${classId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ instructor: name }) });
                }
            }
        }

        // ربط حساب ولي الأمر بالطلاب
        if (type === 'parent') {
            const studentOptions = document.getElementById('newRoleStudent').selectedOptions;
            const studentIds = Array.from(studentOptions).map(opt => opt.value);
            for (let studentId of studentIds) {
                await fetch(`api.php?endpoint=students/${studentId}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: email }) });
            }
        }

        await loadDataFromDB();
        closeModal('add-role-modal');
        document.getElementById('addRoleForm').reset();
        if (typeof toggleRoleFields === 'function') toggleRoleFields();
        alert('تم إضافة المستخدم بنجاح!');
    } catch (e) {
        console.error("Error adding role:", e);
        alert("تعذر الحفظ: " + e.message);
    }
}

async function deleteRole(email) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم وصلاحياته؟')) {
        try {
            const res = await fetch(`api.php?endpoint=roles/${encodeURIComponent(email)}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting role:", e);
            alert("فشل الحذف.");
        }
    }
}

async function updateRoleType(email, newType) {
    let roleName = newType === 'admin' ? 'مدير النظام' : newType === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    try {
        const res = await fetch(`api.php?endpoint=roles/${encodeURIComponent(email)}`, { 
            method: 'PUT', headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ roleCode: newType, role: roleName, statusCode: statusCode }) 
        });
        const result = await res.json();
        if (result.success) {
            await loadDataFromDB();
            alert('تم تحديث الصلاحية بنجاح!');
        } else {
            throw new Error(result.message);
        }
    } catch (e) {
        console.error("Error updating role type:", e);
        alert("تعذر حفظ التحديث.");
    }
}

function toggleEditRoleFields() {
    const type = document.getElementById('editRoleType')?.value;
    const subjectGroup = document.getElementById('editRoleSubjectGroup');
    const classGroup = document.getElementById('editRoleClassGroup');
    const studentGroup = document.getElementById('editRoleStudentGroup');
    const subjectSelect = document.getElementById('editRoleSubject');
    const classSelect = document.getElementById('editRoleClass');
    const studentSelect = document.getElementById('editRoleStudent');

    if (!subjectGroup || !studentGroup) return;

    if (type === 'teacher') {
        subjectGroup.style.display = 'block';
        if (classGroup) classGroup.style.display = 'block';
        studentGroup.style.display = 'none';
        
        if (subjectSelect) subjectSelect.required = true;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
        
        filterClassesForEditRole();
    } else if (type === 'parent') {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'block';
        
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    } else {
        subjectGroup.style.display = 'none';
        if (classGroup) classGroup.style.display = 'none';
        studentGroup.style.display = 'none';
        
        if (subjectSelect) subjectSelect.required = false;
        if (classSelect) classSelect.required = false;
        if (studentSelect) studentSelect.required = false;
    }
}

function editRole(email) {
    const role = rolesData.find(r => r.email === email);
    if (!role) return;

    openModal('edit-role-modal');

    document.getElementById('editRoleOriginalEmail').value = role.email;
    document.getElementById('editRoleName').value = role.name;
    document.getElementById('editRoleEmailPrefix').value = role.email.split('@')[0];
    const codeEl = document.getElementById('editRoleCode');
    if (codeEl) codeEl.value = role.code || '';
    const pw = document.getElementById('editRolePassword');
    if (pw) pw.value = '';
    document.getElementById('editRoleType').value = role.roleCode;

    toggleEditRoleFields();

    if (role.roleCode === 'teacher') {
        let spec = '';
        const inst = instructorsData.find(i => i.name === role.name);
        if (inst && inst.spec) {
            spec = inst.spec;
        } else {
            const assignedClass = coursesData.find(c => c.instructor === role.name && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
            if (assignedClass) spec = assignedClass.subject;
        }
        
        if (document.getElementById('editRoleSubject') && spec) {
            document.getElementById('editRoleSubject').value = spec;
        }
        
        filterClassesForEditRole();
        
        const assignedClasses = coursesData.filter(c => c.instructor === role.name && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
        const classSelect = document.getElementById('editRoleClass');
        if (classSelect) {
            const assignedIds = assignedClasses.map(c => c.id);
            Array.from(classSelect.options).forEach(opt => {
                opt.selected = assignedIds.includes(opt.value);
            });
        }
    } else if (role.roleCode === 'parent') {
        const parentStudents = studentsData.filter(s => s.email === role.email).map(s => s.id);
        const studentSelect = document.getElementById('editRoleStudent');
        if (studentSelect) {
            Array.from(studentSelect.options).forEach(opt => {
                opt.selected = parentStudents.includes(opt.value);
            });
        }
    }
}

document.getElementById('editRoleForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalEmail = document.getElementById('editRoleOriginalEmail').value;
    const name = document.getElementById('editRoleName').value;
    const code = document.getElementById('editRoleCode').value;
    const password = document.getElementById('editRolePassword').value;
    const type = document.getElementById('editRoleType').value;

    let roleName = type === 'admin' ? 'مدير النظام' : type === 'teacher' ? 'المدرس' : 'ولي الأمر';
    let statusCode = 'active';

    const updates = {
        name: name,
        code: code,
        role: roleName,
        role_code: type,
        status_code: statusCode
    };
    
    if (password) {
        updates.password_hash = password;
        updates.plain_password = password;
    }

    try {
        const res = await fetch(`api.php?endpoint=roles/${encodeURIComponent(originalEmail)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        if (type === 'teacher') {
            const spec = document.getElementById('editRoleSubject').value;
            const originalRole = rolesData.find(r => r.email === originalEmail);
            const oldName = originalRole ? originalRole.name : name;
            const inst = instructorsData.find(i => i.name === oldName);
            if (inst) {
                await fetch(`api.php?endpoint=instructors/${inst.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name: name, spec: spec }) });
            } else {
                const newInstructor = { id: 'Inst-' + Date.now(), name: name, spec: spec, phone: '', img: '' };
                await fetch('api.php?endpoint=update/instructors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify([newInstructor]) });
            }
            
            // تحديث ارتباط الشعب
            const classSelect = document.getElementById('editRoleClass');
            if (classSelect) {
                const selectedClassIds = Array.from(classSelect.selectedOptions).map(opt => opt.value);
                
                // إزالة المدرس من الشعب السابقة
                const previousClasses = coursesData.filter(c => c.instructor === oldName && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
                for (let c of previousClasses) {
                    if (!selectedClassIds.includes(c.id)) {
                        await fetch(`api.php?endpoint=courses/${c.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ instructor: 'غير محدد' }) });
                    }
                }

                // إضافة المدرس للشعب المحددة
                for (let classId of selectedClassIds) {
                    await fetch(`api.php?endpoint=courses/${classId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ instructor: name }) });
                }
            }
        }

        if (type === 'parent') {
            const studentOptions = document.getElementById('editRoleStudent').selectedOptions;
            const selectedStudentIds = Array.from(studentOptions).map(opt => opt.value);
            
            const previousStudents = studentsData.filter(s => s.email === originalEmail);
            for (let s of previousStudents) {
                if (!selectedStudentIds.includes(s.id)) {
                    await fetch(`api.php?endpoint=students/${s.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: '' }) });
                }
            }

            for (let studentId of selectedStudentIds) {
                await fetch(`api.php?endpoint=students/${studentId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: originalEmail }) });
            }
        }

        await loadDataFromDB();
        closeModal('edit-role-modal');
        alert('تم تعديل المستخدم بنجاح!');
    } catch (e) {
        console.error("Error editing role:", e);
        alert("تعذر الحفظ.");
    }
});


// === Render Other UI Elements ===
function renderRecentStudents() {
    const tbody = document.getElementById("recent-students-tbody");
    if (!tbody) return;
    tbody.innerHTML = recentStudentsData.map(s => `
        <tr>
            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${s.name}</h4>
                    </div>
                </div>
            </td>
            <td>${s.course}</td>
            <td>${s.date}</td>
            <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
        </tr>
    `).join('');
}

let currentStudentsPage = 1;
const studentsPerPage = 50;
let filteredStudentsData = [];

function filterMainStudents() {
    const searchInput = document.getElementById('students-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    if (searchTerm.trim() === '') {
        filteredStudentsData = [];
    } else {
        filteredStudentsData = studentsData.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            (s.id && s.id.toLowerCase().includes(searchTerm)) ||
            (s.course && s.course.toLowerCase().includes(searchTerm))
        );
    }
    renderStudents(1);
}

function renderStudents(page = 1) {
    const tbody = document.getElementById("students-table-body");
    if (!tbody) return;

    let searchContainer = document.getElementById("students-search-container");
    if (!searchContainer) {
        const tableContainer = tbody.closest('.table-responsive');
        if (tableContainer && tableContainer.parentNode) {
            searchContainer = document.createElement("div");
            searchContainer.id = "students-search-container";
            searchContainer.style = "margin-bottom: 15px; display: flex; gap: 10px;";
            searchContainer.innerHTML = `
                <input type="text" id="students-search-input" class="form-input" placeholder="بحث عن طالب (بالاسم، الدورة، رقم التسجيل)..." style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                <button class="btn" onclick="filterMainStudents()" style="padding: 10px 20px;">بحث</button>
            `;
            tableContainer.parentNode.insertBefore(searchContainer, tableContainer);
            document.getElementById('students-search-input').addEventListener('input', () => filterMainStudents());
        }
    }

    const dataToRender = filteredStudentsData.length > 0 || (document.getElementById('students-search-input') && document.getElementById('students-search-input').value.trim() !== '') 
        ? filteredStudentsData 
        : studentsData;

    const totalPages = Math.ceil(dataToRender.length / studentsPerPage) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentStudentsPage = page;

    const startIdx = (page - 1) * studentsPerPage;
    const endIdx = startIdx + studentsPerPage;
    const paginatedData = dataToRender.slice(startIdx, endIdx);

    if (paginatedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">لا توجد بيانات للعرض</td></tr>';
    } else {
        tbody.innerHTML = paginatedData.map((s) => {
        let className = "غير محدد";
        let studentSerial = "-";

        // استخراج اسم الشعبة وحساب رقم التسلسل الخاص بالطالب
        if (s.class_id) {
            const cls = coursesData.find(c => c.id === s.class_id);
            if (cls) {
                className = cls.title;
                // حساب رقم الطالب بناءً على تاريخ وأولوية تسجيله في الشعبة المحددة
                const classStudents = studentsData.filter(student => student.class_id === s.class_id);
                const serialIndex = classStudents.findIndex(student => student.id === s.id);
                if (serialIndex !== -1) studentSerial = serialIndex + 1;
            }
        } else {
            // كحل بديل لاستخراج التسلسل من اسم الدورة مباشرة إن لم تكن هناك شعبة مرتبطة
            const match = s.course.match(/\(ر\.ت:\s*(\d+)\)/);
            if (match) {
                studentSerial = match[1];
            }
        }

        return `

        <tr>
            <td><strong>${s.id}</strong></td>

            <td>
                <div class="user-cell">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                    <div class="user-info">
                        <h4>${s.name}</h4>
                        <p>${s.email}</p>
                    </div>
                </div>
            </td>

            <td>${s.course}</td>
            <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${className}</span></td>
            <td><strong>${studentSerial}</strong></td>
            <td>${s.date}</td>
            <td dir="ltr" style="text-align: right; color: ${s.balance === '0 دينار' ? 'inherit' : 'var(--danger-color)'}; font-weight: bold;">
                المتبقي: ${s.balance || "0 دينار"}
            </td>
            <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
            <td>
                <button class="btn-icon" title="طباعة الوصل" onclick="printReceipt('${s.id}')" style="color: var(--primary-color);"><i class='bx bx-printer'></i></button>
                <button class="btn-icon" title="تعديل" onclick="editStudent('${s.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteStudent('${s.id}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
        `;
        }).join('');
    }

    let paginationContainer = document.getElementById("students-pagination");
    if (!paginationContainer) {
        const tableContainer = tbody.closest('.table-responsive');
        if (tableContainer && tableContainer.parentNode) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "students-pagination";
            paginationContainer.style = "display: flex; justify-content: center; gap: 10px; margin-top: 15px; align-items: center;";
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        }
    }
    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <button class="btn" onclick="renderStudents(${currentStudentsPage - 1})" ${currentStudentsPage === 1 ? 'disabled' : ''}>السابق</button>
            <span style="font-weight: bold; margin: 0 10px;">صفحة ${currentStudentsPage} من ${totalPages} (إجمالي ${dataToRender.length} طالب)</span>
            <button class="btn" onclick="renderStudents(${currentStudentsPage + 1})" ${currentStudentsPage === totalPages ? 'disabled' : ''}>التالي</button>
        `;
    }
}

// === Print Receipt Logic ===
function printReceipt(id) {
    const student = studentsData.find(s => s.id === id);
    if (!student) {
        alert("لم يتم العثور على بيانات الطالب!");
        return;
    }

    // Populate Print Container with Student Data
    document.getElementById('print-student-id').textContent = student.id;
    document.getElementById('print-student-name').textContent = student.name;
    document.getElementById('print-student-course').textContent = student.course;

    // حساب وعرض اسم الشعبة ورقم الطالب في الوصل
    let className = "غير محدد";
    let studentSerial = "-";
    if (student.class_id) {
        const cls = coursesData.find(c => c.id === student.class_id);
        if (cls) {
            className = cls.title;
            const classStudents = studentsData.filter(s => s.class_id === student.class_id);
            const serialIndex = classStudents.findIndex(s => s.id === student.id);
            if (serialIndex !== -1) studentSerial = serialIndex + 1;
        }
    } else {
        const match = student.course.match(/\(ر\.ت:\s*(\d+)\)/);
        if (match) {
            studentSerial = match[1];
        }
    }
    if (document.getElementById('print-student-class')) document.getElementById('print-student-class').textContent = className;
    if (document.getElementById('print-student-serial')) document.getElementById('print-student-serial').textContent = studentSerial;

    const today = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    document.getElementById('print-date').textContent = today;

    // Financial Data
    document.getElementById('print-total-amount').textContent = student.total || '0 دينار';
    document.getElementById('print-paid-amount').textContent = student.paid || '0 دينار';

    // If balance includes a minus, or is plain $0, we ensure it shows properly
    const remainingText = student.balance || '0 دينار';
    document.getElementById('print-remaining-amount').textContent = remainingText;

    // Trigger Print Command
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('printing-receipt');
    }, 500);
}

function renderInstructors() {
    const grid = document.getElementById("instructors-grid");
    const specFilterEl = document.getElementById("instructor-spec-filter");
    const searchEl = document.getElementById("instructor-search");
    
    if (!grid) return;

    // تحديث قائمة التخصصات في الفلتر
    if (specFilterEl && specFilterEl.options.length <= 1) {
        specFilterEl.innerHTML = '<option value="all">جميع التخصصات</option>' + subjectsData.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    }

    const specFilter = specFilterEl ? specFilterEl.value : 'all';
    const searchTerm = (searchEl ? searchEl.value : '').toLowerCase();

    // تطبيق الفلاتر
    const filteredInstructors = instructorsData.filter(i => {
        const matchSpec = specFilter === 'all' || i.spec === specFilter;
        const matchSearch = !searchTerm || i.name.toLowerCase().includes(searchTerm) || (i.phone && i.phone.includes(searchTerm));
        return matchSpec && matchSearch;
    });

    if (filteredInstructors.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">لا توجد بيانات مطابقة للبحث.</div>';
        return;
    }

    grid.innerHTML = filteredInstructors.map(i => {
        // حساب الشعب والدورات المخصصة لهذا المدرس
        const assignedClasses = coursesData.filter(c => c.instructor === i.name && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'))).length;
        const assignedCourses = coursesData.filter(c => c.instructor === i.name && c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة')).length;
        
        return `
        <div class="card person-card">
            <div class="person-img-wrapper">
                <img src="${i.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(i.name)}&background=random&size=150`}" alt="${i.name}">
            </div>
            <h3>${i.name}</h3>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 10px;">${i.spec || 'غير محدد'}</p>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; justify-content: center;">
                <span class="badge" style="background: rgba(79, 70, 229, 0.1); color: var(--primary-color); border: 1px solid rgba(79, 70, 229, 0.2); font-size: 12px;">${assignedCourses} دورات</span>
                <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--secondary-color); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 12px;">${assignedClasses} شعب مخصصة</span>
            </div>

            <div style="background: var(--bg-color); padding: 8px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                <i class='bx bx-phone' style="color: var(--primary-color);"></i>
                <span dir="ltr" style="font-weight: 600;">${i.phone || 'غير متوفر'}</span>
            </div>
            <div style="margin-top: auto; display: flex; justify-content: center; gap: 10px; width: 100%;">
                <button class="btn btn-icon" title="تعديل" onclick="editInstructor('${i.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteInstructor('${i.id}')"><i class='bx bx-trash'></i></button>
            </div>
        </div>
    `}).join('');
}

function filterClassesForEditInstructor() {
    const subject = document.getElementById('editInstructorSubject')?.value;
    const classSelect = document.getElementById('editInstructorClass');
    const classGroup = document.getElementById('editInstructorClassGroup');
    if (!classSelect) return;
    
    const classesList = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
    
    if (subject) {
        const filtered = classesList.filter(c => c.subject === subject);
        if (filtered.length > 0) {
            classSelect.innerHTML = filtered.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        } else {
            classSelect.innerHTML = `<option value="" disabled>-- لا توجد شعب متاحة لهذه المادة --</option>`;
        }
    } else {
        classSelect.innerHTML = `<option value="" disabled>-- حدد المادة أولاً --</option>`;
    }
    if (classGroup) classGroup.style.display = 'block';
}

function editInstructor(id) {
    const instructor = instructorsData.find(i => i.id === id);
    if (!instructor) return;

    const idInput = document.getElementById('editInstructorId');
    const nameInput = document.getElementById('editInstructorName');
    const subjectInput = document.getElementById('editInstructorSubject');
    const phoneInput = document.getElementById('editInstructorPhone');

    if (idInput) idInput.value = instructor.id;
    if (nameInput) nameInput.value = instructor.name;
    if (phoneInput) phoneInput.value = instructor.phone || '';

    // تعبئة قائمة المواد وتحديد المادة الحالية للمدرس
    if (subjectInput) {
        subjectInput.innerHTML = `<option value="">-- حدد المادة --</option>` + 
            subjectsData.map(s => `<option value="${s.name}" ${s.name === instructor.spec ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    filterClassesForEditInstructor();
    const assignedClasses = coursesData.filter(c => c.instructor === instructor.name && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
    const classSelect = document.getElementById('editInstructorClass');
    if (classSelect) {
        const assignedIds = assignedClasses.map(c => c.id);
        Array.from(classSelect.options).forEach(opt => {
            opt.selected = assignedIds.includes(opt.value);
        });
    }

    openModal('edit-instructor-modal');
}

document.getElementById('editInstructorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editInstructorId').value;
    const name = document.getElementById('editInstructorName').value;
    const spec = document.getElementById('editInstructorSubject').value;
    const phone = document.getElementById('editInstructorPhone').value;

    const updates = { name, spec, phone };
    
    const originalInstructor = instructorsData.find(i => i.id === id);
    const oldName = originalInstructor ? originalInstructor.name : name;

    try {
        const res = await fetch(`api.php?endpoint=instructors/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
        const result = await res.json();
        
        if (result.success) {
            // تحديث ارتباط الشعب
            const classSelect = document.getElementById('editInstructorClass');
            if (classSelect) {
                const selectedClassIds = Array.from(classSelect.selectedOptions).map(opt => opt.value);
                
                // إزالة المدرس من الشعب السابقة
                const previousClasses = coursesData.filter(c => c.instructor === oldName && (c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة')));
                for (let c of previousClasses) {
                    if (!selectedClassIds.includes(c.id)) {
                        await fetch(`api.php?endpoint=courses/${c.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ instructor: 'غير محدد' }) });
                    }
                }

                // إضافة المدرس للشعب المحددة
                for (let classId of selectedClassIds) {
                    await fetch(`api.php?endpoint=courses/${classId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ instructor: name }) });
                }
            }

            await loadDataFromDB();
            closeModal('edit-instructor-modal');
            alert('تم تعديل بيانات المدرس بنجاح!');
        } else {
            throw new Error(result.message);
        }
    } catch (e) {
        console.error("Error editing instructor:", e);
        alert("خطأ في الحفظ.");
    }
});

async function deleteInstructor(id) {
    if (confirm('هل أنت متأكد من حذف هذا المدرس نهائياً؟')) {
        try {
            const res = await fetch(`api.php?endpoint=instructors/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting instructor:", e);
            alert('خطأ في الحذف.');
        }
    }
}

function renderCourses() {
    const grid = document.getElementById("courses-grid");
    if (!grid) return;
    
    // عرض الدورات التدريبية الأساسية فقط في صفحة "الدورات التدريبية" لاستبعاد الشعب
    const trainingCourses = coursesData.filter(c => c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
    grid.innerHTML = trainingCourses.map(c => `
        <div class="card course-card">
            <div class="course-img-wrapper">
                <img src="${c.img || 'https://placehold.co/300x200'}" alt="${c.title}" class="course-img">
                <span class="course-subject-badge">${c.subject}</span>
            </div>
            <div class="card-body">
                <h3 class="course-title">${c.title}</h3>
                <div class="course-meta">
                    <span><i class='bx bx-user'></i> ${c.instructor}</span>
                    <span><i class='bx bx-time'></i> ${c.duration}</span>
                </div>
                <div class="course-footer d-flex justify-between align-center mt-4">
                    <div class="students-count">
                        <i class='bx bx-group'></i> <span>${c.students} متدرب</span>
                    </div>
                    <div class="course-actions" style="display: flex; gap: 5px;">
                        <button class="btn btn-icon" title="تعديل" onclick="editCourse('${c.id}')"><i class='bx bx-edit'></i></button>
                        <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteCourse('${c.id}')"><i class='bx bx-trash'></i></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// === Class Management Page ===
function renderClassManagement() {
    const container = document.getElementById("class-management-content");
    if (!container) return;

    // 1. Group courses by base name
    const courseGroups = {};
    // This regex will find the base name of a course, stripping " - نسخة جديدة" or " - مجموعة جديدة"
    const baseNameRegex = /^(.*?)(?:\s*-\s*(?:نسخة جديدة|مجموعة جديدة))?$/;

    coursesData.forEach(course => {
        const match = course.title.match(baseNameRegex);
        const baseName = match ? match[1].trim() : course.title.trim();
        
        if (!courseGroups[baseName]) {
            courseGroups[baseName] = [];
        }
        courseGroups[baseName].push(course);
    });

    // 2. Generate HTML from the groups
    let html = '';
    if (Object.keys(courseGroups).length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">لا توجد دورات لعرضها.</p>';
        return;
    }

    for (const groupName in courseGroups) {
        const classes = courseGroups[groupName];
        const totalStudentsInGroup = classes.reduce((sum, c) => sum + studentsData.filter(s => s.class_id === c.id).length, 0);

        html += `
            <div class="card class-group-card">
                <div class="card-header">
                    <h3>${groupName}</h3>
                    <div class="class-group-meta">
                        <span><i class='bx bx-sitemap'></i> ${classes.length} شعبة</span>
                        <span><i class='bx bx-group'></i> ${totalStudentsInGroup} متدرب</span>
                    </div>
                </div>
                <div class="card-body">
                    <ul class="class-list">
        `;

        classes.sort((a, b) => a.id.localeCompare(b.id));

        classes.forEach(cls => {
            const maxStudents = parseInt(cls.capacity, 10) || parseInt(settingsData.maxStudentsPerCourse, 10) || 30;
            const studentCount = studentsData.filter(s => s.class_id === cls.id).length;
            const isFull = studentCount >= maxStudents;
            const progress = Math.min(100, (studentCount / maxStudents) * 100);
            html += `
                <li class="class-item">
                    <div class="class-info">
                        <span class="class-title">${cls.title}</span>
                        <span class="class-instructor"><i class='bx bx-user'></i> ${cls.instructor}</span>
                    </div>
                    <div class="class-stats" style="display: flex; align-items: center; gap: 10px;">
                        <div>
                            <span class="class-students ${isFull ? 'full' : ''}">
                                <i class='bx bx-group'></i> ${studentCount} / ${maxStudents}
                            </span>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progress}%;"></div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn btn-icon" title="طباعة تقرير الشعبة" onclick="printClassReport('${cls.id}')" style="color: var(--primary-color); padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-printer'></i></button>
                            <button class="btn btn-icon" title="إضافة موعد للجدول" onclick="openScheduleModalForClass('${cls.id}')" style="color: #10b981; padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-calendar-plus'></i></button>
                            <button class="btn btn-icon" title="تعديل الشعبة" onclick="editClass('${cls.id}')" style="color: #f59e0b; padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-edit'></i></button>
                            <button class="btn btn-icon" title="حذف الشعبة" onclick="deleteClass('${cls.id}')" style="color: var(--danger-color); padding: 5px; border: 1px solid var(--border-color);"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                </li>
            `;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function openScheduleModalForClass(classId) {
    const cls = coursesData.find(c => c.id === classId);
    if (!cls) return;
    
    openModal('add-schedule-modal');
    setTimeout(() => {
        const parentCourse = coursesData.find(c => c.subject === cls.subject && c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
        if (parentCourse) {
            const courseSelect = document.getElementById('scheduleCourse');
            if (courseSelect) {
                courseSelect.value = parentCourse.id;
                filterClassesForSchedule();
                setTimeout(() => {
                    const classSelect = document.getElementById('scheduleClass');
                    if (classSelect) { classSelect.value = cls.id; autoFillInstructorForSchedule(); }
                }, 50);
            }
        }
    }, 50);
}

// === Print Class Report Logic ===
function printClassReport(classId) {
    const course = coursesData.find(c => c.id === classId);
    if (!course) {
        alert("لم يتم العثور على بيانات الشعبة!");
        return;
    }

    // Find students in this course
    let studentsInCourse = studentsData.filter(s => s.hasOwnProperty(`serial_${course.id}`));
    
    // Fallback for older data without serial keys
    if (studentsInCourse.length === 0) {
         studentsInCourse = studentsData.filter(s => s.course && s.course.includes(course.title));
    }
    
    // Sort students by their serial number if available
    studentsInCourse.sort((a, b) => (a[`serial_${course.id}`] || 0) - (b[`serial_${course.id}`] || 0));

    let reportHtml = `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px; max-width: 800px; margin: auto;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h2>${settingsData.instituteName || 'المركز التعليمي'}</h2>
                <h3>تقرير شعبة: ${course.title}</h3>
                <p><strong>المدرس:</strong> ${course.instructor} | <strong>عدد الطلاب:</strong> ${studentsInCourse.length} / ${settingsData.maxStudentsPerCourse || 30}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="border: 1px solid #ddd; padding: 8px; width: 50px; text-align: center;">ر.ت</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">اسم الطالب</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الرصيد المتبقي</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentsInCourse.length > 0 ? studentsInCourse.map((student, index) => `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${student[`serial_${course.id}`] || index + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${student.name}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: ${student.balance === '0 دينار' ? 'inherit' : 'red'};">${student.balance || '0 دينار'}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${student.status}</td>
                        </tr>
                    `).join('') : `<tr><td colspan="4" style="text-align: center; border: 1px solid #ddd; padding: 8px;">لا يوجد طلاب مسجلين في هذه الشعبة حالياً.</td></tr>`}
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: left; font-size: 12px; color: #666;">
                تاريخ الطباعة: ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())}
            </div>
        </div>
    `;

    // Create a hidden iframe for clean printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>طباعة تقرير الشعبة</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Public+Sans:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Public Sans', 'Tajawal', sans-serif; }
                h1, h2, h3 { font-family: 'Cairo', sans-serif; }
                @media print { @page { margin: 1cm; } }
            </style>
        </head>
        <body>${reportHtml}</body>
        </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    // Timeout to allow the Cairo font to load before opening print dialog
    setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
}

// === Edit and Delete Class Logic ===
function editClass(id) {
    const cls = coursesData.find(c => c.id === id);
    if (!cls) return;

    document.getElementById('editClassId').value = cls.id;
    document.getElementById('editClassName').value = cls.title;
    document.getElementById('editClassCapacity').value = cls.capacity || settingsData.maxStudentsPerCourse || 30;

    const subjectSelect = document.getElementById('editClassSubject');
    if (subjectSelect) {
        subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` +
            subjectsData.map(s => `<option value="${s.name}" ${s.name === cls.subject ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    const instSelect = document.getElementById('editClassInstructor');
    if (instSelect) {
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` +
            instructorsData.map(i => `<option value="${i.name}" ${i.name === cls.instructor ? 'selected' : ''}>${i.name}</option>`).join('') +
            `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
    }

    openModal('edit-class-modal');
}

async function deleteClass(id) {
    if (confirm('هل أنت متأكد من حذف هذه الشعبة نهائياً؟ ستيم إزالتها من سجلات النظام.')) {
        try {
            const res = await fetch(`api.php?endpoint=courses/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                if (typeof renderClassManagement === 'function') renderClassManagement();
                if (typeof renderCourses === 'function') renderCourses();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting class:", e);
            alert('خطأ في الحذف.');
        }
    }
}

function editCourse(id) {
    const course = coursesData.find(c => c.id === id);
    if (!course) return;

    document.getElementById('editCourseId').value = course.id;
    document.getElementById('editCourseTitle').value = course.title;
    document.getElementById('editCourseDuration').value = course.duration;
    const subjectSelect = document.getElementById('editCourseSubject');
    if (subjectSelect) {
        subjectSelect.innerHTML = `<option value="">-- حدد المادة --</option>` +
            subjectsData.map(s => `<option value="${s.name}" ${s.name === course.subject ? 'selected' : ''}>${s.name}</option>`).join('');
    }

    const instSelect = document.getElementById('editCourseInstructor');
    if (instSelect) {
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` +
            instructorsData.map(i => `<option value="${i.name}" ${i.name === course.instructor ? 'selected' : ''}>${i.name}</option>`).join('') +
            `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
    }

    openModal('edit-course-modal');
}

function filterInstructorsForEditCourse() {
    const instSelect = document.getElementById('editCourseInstructor');
    if (instSelect) {
        const currentVal = instSelect.value;
        instSelect.innerHTML = `<option value="">-- حدد المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('') + `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        if (currentVal) instSelect.value = currentVal;
    }
}

document.getElementById('editCourseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editCourseId').value;
    const title = document.getElementById('editCourseTitle').value;
    const subject = document.getElementById('editCourseSubject').value;
    const instructor = document.getElementById('editCourseInstructor').value;
    const duration = document.getElementById('editCourseDuration').value;
    const fileInput = document.getElementById('editCourseImg');

    let imgBase64 = "";
    const saveEditedCourse = async () => {
        const updates = { title, subject, instructor, duration };
        if (imgBase64) updates.img = imgBase64;
        
        try {
            const res = await fetch(`api.php?endpoint=courses/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
            const result = await res.json();
            if (result.success) {
                const index = coursesData.findIndex(c => c.id === id);
                if (index !== -1) { coursesData[index] = { ...coursesData[index], ...updates }; renderCourses(); }
                closeModal('edit-course-modal');
                alert('تم تعديل الدورة بنجاح!');
            } else { throw new Error(result.message); }
        } catch (e) { 
            console.error("Error editing course:", e);
            alert("خطأ في الحفظ."); 
        }
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function (event) { imgBase64 = event.target.result; await saveEditedCourse(); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { await saveEditedCourse(); }
});

async function deleteCourse(id) {
    if (confirm('هل أنت متأكد من حذف هذه الدورة نهائياً؟')) {
        try {
            const res = await fetch(`api.php?endpoint=courses/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                renderCourses();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting course:", e);
            alert('خطأ في الحذف.');
        }
    }
}

function renderSubjects() {
    const grid = document.getElementById("subjects-grid");
    if (!grid) return;
    grid.innerHTML = subjectsData.map(s => `
        <div class="card" style="padding: 20px; text-align: center;">
            <div style="background: var(--bg-hover); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <i class='bx bx-book-open' style="font-size: 30px; color: var(--primary-color);"></i>
            </div>
            <h3 style="margin-bottom: 10px;">${s.name}</h3>
            <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 15px;">${s.desc}</p>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
                <button class="btn btn-icon" title="تعديل" onclick="editSubject('${s.id}')"><i class='bx bx-edit'></i></button>
                <button class="btn btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteSubject('${s.id}')"><i class='bx bx-trash'></i></button>
            </div>
        </div>
    `).join('');
}

function editSubject(id) {
    const subject = subjectsData.find(s => s.id === id);
    if (!subject) return;

    // إنشاء نافذة التعديل تلقائياً في حال لم يتم إضافتها في ملف HTML مسبقاً
    let modal = document.getElementById('edit-subject-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-subject-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(255, 255, 255, 0.69); border: 1px solid var(--border-color);">
                <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #8b5cf6); color: white; padding: 25px; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                        <i class='bx bx-edit-alt' style="font-size: 1.8rem; background: rgba(255, 255, 255, 0.88); padding: 8px; border-radius: 10px;"></i> 
                        تعديل المادة الدراسية
                    </h2>
                    <button type="button" class="btn-icon" onclick="closeModal('edit-subject-modal')" style="color: white; background: rgba(255, 255, 255, 0.53); border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(5px);">
                        <i class='bx bx-x' style="font-size: 24px;"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    
                    <!-- الكارت المميز للتنبيه -->
                    <div style="background: var(--bg-hover); border-right: 4px solid var(--primary-color); padding: 15px 20px; border-radius: 10px; margin-bottom: 25px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <div style="background: rgb(78, 70, 229); color: var(--primary-color); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class='bx bx-info-circle' style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: var(--text-main); font-size: 15px;">تحديث بيانات المادة</h4>
                            <p style="margin: 0; color: var(--text-muted); font-size: 13px;">تأكد من صحة البيانات، أي تغيير في اسم المادة سينعكس تلقائياً على كافة الدورات والشعب المرتبطة بها.</p>
                        </div>
                    </div>

                    <form id="editSubjectForm">
                        <input type="hidden" id="editSubjectId">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">
                                <i class='bx bx-book-bookmark' style="color: var(--primary-color); margin-left: 5px;"></i> اسم المادة
                            </label>
                            <input type="text" id="editSubjectName" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 14px; background: var(--bg-color); color: var(--text-main); transition: all 0.3s; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                        </div>
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">
                                <i class='bx bx-align-left' style="color: var(--primary-color); margin-left: 5px;"></i> وصف المادة
                            </label>
                            <textarea id="editSubjectDesc" class="form-input" rows="4" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 14px; background: var(--bg-color); color: var(--text-main); transition: all 0.3s; resize: vertical; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);"></textarea>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 25px;">
                            <button type="button" class="btn" onclick="closeModal('edit-subject-modal')" style="background: var(--bg-hover); color: var(--text-main); padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; transition: all 0.3s;">إلغاء</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, var(--primary-color), #8b5cf6); color: #fff; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); transition: all 0.3s;"><i class='bx bx-save' style="font-size: 18px;"></i> حفظ التعديلات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
    }

    const idInput = document.getElementById('editSubjectId');
    const nameInput = document.getElementById('editSubjectName');
    const descInput = document.getElementById('editSubjectDesc');

    if (idInput) idInput.value = subject.id;
    if (nameInput) nameInput.value = subject.name;
    if (descInput) descInput.value = subject.desc;

    openModal('edit-subject-modal');
}

// استخدام Event Delegation لضمان استجابة زر الحفظ دائماً
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'editSubjectForm') {
        e.preventDefault();
        const id = document.getElementById('editSubjectId').value;
        const name = document.getElementById('editSubjectName').value;
        const desc = document.getElementById('editSubjectDesc').value;

        const updates = { name, desc };
        try {
            const res = await fetch(`api.php?endpoint=subjects/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB(); 
                closeModal('edit-subject-modal');
                alert('تم تعديل المادة الدراسية بنجاح!');
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("Error editing subject:", err);
            alert("خطأ في الحفظ.");
        }
    }

    // حدث تعديل السجل المالي (Event Delegation)
    if (e.target && e.target.id === 'editAccountingForm') {
        e.preventDefault();
        const id = document.getElementById('editAccId').value;
        const receipt = document.getElementById('editAccReceipt').value;
        const student = document.getElementById('editAccStudent').value;
        const amount = document.getElementById('editAccAmount').value;
        const method = document.getElementById('editAccMethod').value;
        const statusCode = document.getElementById('editAccStatus').value;
        const notes = document.getElementById('editAccNotes').value;
        const status = statusCode === 'active' ? 'مدفوع' : (statusCode === 'pending' ? 'مدفوع جزئي' : 'ملغى');

        const updates = { receipt, student, amount, method, statusCode, status, notes };
        try {
            const res = await fetch(`api.php?endpoint=accounting/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB(); 
                closeModal('edit-accounting-modal');
                alert('تم تعديل السجل المالي بنجاح!');
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("Error editing accounting:", err);
            alert("خطأ في الحفظ.");
        }
    }
});

async function deleteSubject(id) {
    if (confirm('هل أنت متأكد من حذف هذه المادة الدراسية نهائياً؟')) {
        try {
            const res = await fetch(`api.php?endpoint=subjects/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                renderSubjects();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting subject:", e);
            alert('خطأ في الحذف.');
        }
    }
}

let currentAccStudentsPage = 1;
const accStudentsPerPage = 50;

function renderFinancialStudents(page = 1) {
    const tbody = document.getElementById("accounting-students-table-body");
    if (!tbody) return;

    // عرض الأحدث أولاً
    const sortedStudents = [...studentsData].reverse();
    const totalPages = Math.ceil(sortedStudents.length / accStudentsPerPage) || 1;
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentAccStudentsPage = page;

    const startIdx = (page - 1) * accStudentsPerPage;
    const endIdx = startIdx + accStudentsPerPage;
    const paginatedData = sortedStudents.slice(startIdx, endIdx);

    tbody.innerHTML = paginatedData.map(s => {
        let className = "غير محدد";
        if (s.class_id) {
            const cls = coursesData.find(c => c.id === s.class_id);
            if (cls) className = cls.title;
        }

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                        <div class="user-info">
                            <h4>${s.name}</h4>
                        </div>
                    </div>
                </td>
                <td>${s.course} <br><small style="color: var(--text-muted);">${className}</small></td>
                <td>${s.date}</td>
                <td>${s.total || '0 دينار'}</td>
                <td style="color: var(--primary-color); font-weight: bold;">${s.paid || '0 دينار'}</td>
                <td style="color: ${s.balance === '0 دينار' || !s.balance ? 'inherit' : 'var(--danger-color)'}; font-weight: bold;">${s.balance || '0 دينار'}</td>
                <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
                <td>
                    <button class="btn-icon" title="تعديل" onclick="editStudent('${s.id}')" style="color: #f59e0b;"><i class='bx bx-edit'></i></button>
                    <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteStudent('${s.id}')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    }).join('');

    let paginationContainer = document.getElementById("acc-students-pagination");
    if (!paginationContainer) {
        const tableContainer = tbody.closest('.table-responsive');
        if (tableContainer && tableContainer.parentNode) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "acc-students-pagination";
            paginationContainer.style = "display: flex; justify-content: center; gap: 10px; margin-top: 15px; align-items: center;";
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        }
    }
    if (paginationContainer) {
        paginationContainer.innerHTML = `
            <button class="btn" onclick="renderFinancialStudents(${currentAccStudentsPage - 1})" ${currentAccStudentsPage === 1 ? 'disabled' : ''}>السابق</button>
            <span style="font-weight: bold; margin: 0 10px;">صفحة ${currentAccStudentsPage} من ${totalPages}</span>
            <button class="btn" onclick="renderFinancialStudents(${currentAccStudentsPage + 1})" ${currentAccStudentsPage === totalPages ? 'disabled' : ''}>التالي</button>
        `;
    }
}

function renderAccounting() {
    const tbody = document.getElementById("accounting-table-body");
    if (!tbody) return;
    const sortedAccounting = [...accountingData].sort((a, b) => b.id.localeCompare(a.id));

    tbody.innerHTML = sortedAccounting.map(a => `
        <tr>
            <td><strong>${a.receipt}</strong></td>
            <td>${a.student}</td>
            <td dir="ltr" style="text-align: right; font-weight: bold;">${a.amount}</td>
            <td>${a.date}</td>
            <td>${a.method}</td>
            <td>${a.notes || '-'}</td>
            <td><span class="status-badge status-${a.statusCode}">${a.status}</span></td>
            <td>
                <button class="btn-icon" title="تعديل" onclick="editAccounting('${a.id}')" style="color: #f59e0b;"><i class='bx bx-edit'></i></button>
                <button class="btn-icon" title="حذف" style="color: var(--danger-color);" onclick="deleteAccounting('${a.id}')"><i class='bx bx-trash'></i></button>
            </td>
        </tr>
    `).join('');
}

function editAccounting(id) {
    const acc = accountingData.find(a => a.id === id);
    if (!acc) return;

    // إنشاء نافذة التعديل تلقائياً بتصميم حديث
    let modal = document.getElementById('edit-accounting-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'edit-accounting-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.2); border: 1px solid var(--border-color);">
                <div class="modal-header" style="background: linear-gradient(135deg, var(--primary-color), #10b981); color: white; padding: 25px; border-bottom: none; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; font-weight: 700;">
                        <i class='bx bx-wallet' style="font-size: 1.8rem; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 10px;"></i>
                        تعديل السجل المالي
                    </h2>
                    <button type="button" class="btn-icon" onclick="closeModal('edit-accounting-modal')" style="color: white; background: rgba(255,255,255,0.2); border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.3s;">
                        <i class='bx bx-x' style="font-size: 24px;"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 30px;">
                    <form id="editAccountingForm">
                        <input type="hidden" id="editAccId">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">رقم الوصل</label>
                            <input type="text" id="editAccReceipt" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">الطلب</label>
                            <select id="editAccStudentSelect" class="form-select" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);" onchange="const inp = document.getElementById('editAccStudent'); if(this.value === 'اخرى') { inp.style.display = 'block'; inp.value = ''; inp.focus(); } else { inp.style.display = 'none'; inp.value = this.value; }">
                                <option value="اشتراك الانترنت">اشتراك الانترنت</option>
                                <option value="اشتراك المولد">اشتراك المولد</option>
                                <option value="اخرى">اخرى (طالب أو غيره)</option>
                            </select>
                            <input type="text" id="editAccStudent" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); display: none; margin-top: 10px;">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">المبلغ</label>
                                <input type="text" id="editAccAmount" class="form-input" required style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">طريقة الدفع</label>
                            <input type="text" id="editAccMethod" class="form-input" value="نقدي" readonly style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color); background-color: var(--bg-body); cursor: not-allowed;">
                            </div>
                        </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">الحالة</label>
                            <select id="editAccStatus" class="form-select" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);">
                                <option value="active">مدفوع</option>
                                <option value="pending">مدفوع جزئي</option>
                            </select>
                        </div>
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-main);">ملاحظات</label>
                        <input type="text" id="editAccNotes" class="form-input" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border-color);" placeholder="ملاحظات إضافية...">
                    </div>
                        <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-color); padding-top: 25px;">
                            <button type="button" class="btn" onclick="closeModal('edit-accounting-modal')" style="background: var(--bg-hover); color: var(--text-main); padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600;">إلغاء</button>
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, var(--primary-color), #10b981); color: #fff; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class='bx bx-save'></i> حفظ التعديلات</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
    }

    document.getElementById('editAccId').value = acc.id;
    document.getElementById('editAccReceipt').value = acc.receipt;
    document.getElementById('editAccAmount').value = acc.amount;
    document.getElementById('editAccMethod').value = acc.method;
    document.getElementById('editAccStatus').value = acc.statusCode;
    document.getElementById('editAccNotes').value = acc.notes || '';

    // تحديد الطلب المحفوظ مسبقاً في القائمة المنسدلة
    const editStudentSelect = document.getElementById('editAccStudentSelect');
    const editStudentInput = document.getElementById('editAccStudent');
    if (['اشتراك الانترنت', 'اشتراك المولد'].includes(acc.student)) {
        editStudentSelect.value = acc.student;
        editStudentInput.style.display = 'none';
    } else {
        editStudentSelect.value = 'اخرى';
        editStudentInput.style.display = 'block';
    }
    editStudentInput.value = acc.student;

    openModal('edit-accounting-modal');
}

async function deleteAccounting(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل المالي نهائياً؟')) {
        try {
            const res = await fetch(`api.php?endpoint=accounting/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting accounting:", e);
            alert('خطأ في الحذف.');
        }
    }
}

function renderAccountingStats() {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalLate = 0;

    let weeklyRev = 0, weeklyExp = 0;
    let monthlyRev = 0, monthlyExp = 0;
    
    const now = Date.now();
    const weekLimit = 7 * 24 * 60 * 60 * 1000;
    const monthLimit = 30 * 24 * 60 * 60 * 1000;

    // دالة مساعدة لاستخراج الطابع الزمني للتحقق من الفترة
    const parseDateToTimestamp = (dateStr, idStr) => {
        let ts = 0;
        const parts = (idStr || "").split('-');
        if (parts.length > 1) {
            const parsedTs = parseInt(parts[1], 10);
            if (!isNaN(parsedTs) && parsedTs > 1577836800000) ts = parsedTs;
        }
        if (!ts && dateStr) {
            const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'يوليوز': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };
            const cleanStr = dateStr.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
            const dateParts = cleanStr.split(/[\s/.-]+/);
            if (dateParts.length >= 3) {
                let day = parseInt(dateParts[0], 10);
                let monthStr = dateParts[1];
                let year = parseInt(dateParts[2], 10);
                if (day > 1000) { year = day; day = parseInt(dateParts[2], 10); }
                
                let month = arabicMonthsMap[monthStr];
                if (month === undefined) {
                    const mNum = parseInt(monthStr, 10);
                    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) { month = mNum - 1; }
                }
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    ts = new Date(year, month, day).getTime();
                }
            }
        }
        return ts;
    };

    // حساب المبالغ من سجلات الطلاب
    studentsData.forEach(s => {
        const total = parseFloat(s.total ? s.total.replace(/[^\d.-]/g, '') : 0) || 0;
        const paid = parseFloat(s.paid ? s.paid.replace(/[^\d.-]/g, '') : 0) || 0;
        const balance = parseFloat(s.balance ? s.balance.replace(/[^\d.-]/g, '') : 0) || 0;

        totalExpected += total;
        totalCollected += paid;
        totalLate += balance;
        
        // حسابات دورية للطلاب (إيرادات فقط)
        const recordTs = parseDateToTimestamp(s.date, s.id);
        if (recordTs > 0) {
            const diff = now - recordTs;
            if (diff <= weekLimit) weeklyRev += paid;
            if (diff <= monthLimit) monthlyRev += paid;
        }
    });

    // حساب المبالغ من سجلات المالية العامة (إيرادات ومصروفات)
    accountingData.forEach(a => {
        const recordTs = parseDateToTimestamp(a.date, a.id);
        let amount = parseFloat((a.amount || "").toString().replace(/[^\d.-]/g, '')) || 0;
        
        // تمييز الصرفيات (مبلغ سالب، أو كلمة مصروف في البيان/الملاحظات)
        const isExpense = (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
        amount = Math.abs(amount); // توحيد القيمة للجمع

        if (recordTs > 0) {
            const diff = now - recordTs;
            if (diff <= weekLimit) { if (isExpense) weeklyExp += amount; else weeklyRev += amount; }
            if (diff <= monthLimit) { if (isExpense) monthlyExp += amount; else monthlyRev += amount; }
        }
    });

    const currency = settingsData.currency || 'دينار';
    const formatMoney = (val) => `${val.toLocaleString()} ${currency}`;

    // تحديث واجهة قسم المالية
    const elExpected = document.getElementById('acc-total-expected');
    const elLate = document.getElementById('acc-total-late');
    const elCollected = document.getElementById('acc-total-collected');
    const elTotalIncome = document.getElementById('acc-total-income');
    const elTotalPending = document.getElementById('acc-total-pending');
    
    // عناصر الكروت التراكمية في لوحة التحكم
    const elDashExpected = document.getElementById('dash-total-expected');
    const elDashLate = document.getElementById('dash-total-late');
    const elDashCollected = document.getElementById('dash-total-collected');

    // عناصر الكروت الدورية الجديدة
    const elWeeklyRev = document.getElementById('acc-weekly-rev');
    const elWeeklyExp = document.getElementById('acc-weekly-exp');
    const elMonthlyRev = document.getElementById('acc-monthly-rev');
    const elMonthlyExp = document.getElementById('acc-monthly-exp');

    if (elWeeklyRev) elWeeklyRev.textContent = formatMoney(weeklyRev);
    if (elWeeklyExp) elWeeklyExp.textContent = formatMoney(weeklyExp);
    if (elMonthlyRev) elMonthlyRev.textContent = formatMoney(monthlyRev);
    if (elMonthlyExp) elMonthlyExp.textContent = formatMoney(monthlyExp);

    if (elExpected) elExpected.textContent = formatMoney(totalExpected);
    if (elDashExpected) elDashExpected.textContent = formatMoney(totalExpected);

    if (elLate) elLate.textContent = formatMoney(totalLate);
    if (elDashLate) elDashLate.textContent = formatMoney(totalLate);

    if (elCollected) elCollected.textContent = formatMoney(totalCollected);
    if (elDashCollected) elDashCollected.textContent = formatMoney(totalCollected);

    if (elTotalIncome) elTotalIncome.textContent = formatMoney(totalCollected);
    if (elTotalPending) elTotalPending.textContent = formatMoney(totalLate);
}

// === Print Financial Reports Logic ===
function printFinancialReport(type) {
    const now = Date.now();
    let title = "";
    let timeLimit = 0;

    if (type === 'weekly') {
        title = "التقرير المالي الأسبوعي";
        timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 أيام
    } else if (type === 'monthly') {
        title = "التقرير المالي الشهري";
        timeLimit = 30 * 24 * 60 * 60 * 1000; // 30 يوماً
    }

    const arabicMonthsMap = { 
        'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 
        'يوليو': 6, 'يوليوز': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 
    };

    // دالة موحدة للتحقق من تاريخ السجل (سواء طالب أو حركة مالية)
    const isWithinTimeLimit = (dateStr, idStr) => {
        let recordTimestamp = 0;
        
        const parts = (idStr || "").split('-');
        if (parts.length > 1) {
            const ts = parseInt(parts[1], 10);
            if (!isNaN(ts) && ts > 1577836800000) recordTimestamp = ts;
        }
        
        if (!recordTimestamp && dateStr) {
            const cleanStr = dateStr.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
            const dateParts = cleanStr.split(/[\s/.-]+/);
            
            if (dateParts.length >= 3) {
                let day = parseInt(dateParts[0], 10);
                let monthStr = dateParts[1];
                let year = parseInt(dateParts[2], 10);
                
                if (day > 1000) { year = day; day = parseInt(dateParts[2], 10); }
                
                let month = arabicMonthsMap[monthStr];
                if (month === undefined) {
                    const mNum = parseInt(monthStr, 10);
                    if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) { month = mNum - 1; }
                }
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    recordTimestamp = new Date(year, month, day).getTime();
                }
            }
        }
        
        if (recordTimestamp > 0) return (now - recordTimestamp) <= timeLimit;
        return false;
    };

    // فلترة كلا الجدولين (المالية والطلاب)
    const filteredAcc = accountingData.filter(a => isWithinTimeLimit(a.date, a.id)).sort((a, b) => b.id.localeCompare(a.id));
    const filteredStudents = studentsData.filter(s => isWithinTimeLimit(s.date, s.id)).sort((a, b) => b.id.localeCompare(a.id));

    let accTotal = 0;
    filteredAcc.forEach(a => {
        const isExp = a.type === 'expense' || (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
        const amountNum = parseFloat((a.amount || "").toString().replace(/[^\d.-]/g, '')) || 0;
        accTotal += isExp ? -Math.abs(amountNum) : Math.abs(amountNum);
    });

    let stuPaidTotal = 0;
    filteredStudents.forEach(s => {
        stuPaidTotal += parseFloat((s.paid || "").toString().replace(/[^\d.-]/g, '')) || 0;
    });

    const grandTotal = accTotal + stuPaidTotal;
    const currency = settingsData.currency || 'دينار';
    let reportHtml = `
        <div class="report-container">
            <div class="header">
                <div class="header-logo-container">
                    ${settingsData.logo ? `<img src="${settingsData.logo}" class="header-logo" alt="Logo">` : `<div style="font-size:24px; font-weight:800; color:#1e3a8a;">${settingsData.instituteName || 'المركز التعليمي'}</div>`}
                </div>
                <div class="header-title">
                    <h1>${title}</h1>
                    <p>تاريخ الإصدار: ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())}</p>
                </div>
            </div>

            <div class="summary-cards">
                <div class="card primary">
                    <h3>إجمالي الإيرادات (المحصلة)</h3>
                    <p>${grandTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
                <div class="card">
                    <h3>إيرادات الحركات العامة</h3>
                    <p>${accTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
                <div class="card">
                    <h3>إيرادات رسوم الطلاب</h3>
                    <p>${stuPaidTotal.toLocaleString()} <small>${currency}</small></p>
                </div>
            </div>

            <h2 class="section-title">■ سجل الحركات المالية (العامة)</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">الوصل</th>
                        <th>البيان / الطلب</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 15%;">المبلغ</th>
                        <th style="width: 12%; text-align: center;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAcc.length > 0 ? filteredAcc.map(a => {
                        const isExp = a.type === 'expense' || (a.amount || "").toString().includes('-') || (a.student || "").includes('مصروف') || (a.notes || "").includes('مصروف');
                        const displayAmt = isExp && !a.amount.toString().includes('-') ? '-' + a.amount : a.amount;
                        return `
                        <tr>
                            <td style="font-weight: 700;">${a.receipt || '-'}</td>
                            <td>${a.student}</td>
                            <td>${a.date}</td>
                            <td class="${isExp ? 'text-rose' : 'text-emerald'}">${displayAmt}</td>
                            <td style="text-align: center;">${a.status}</td>
                        </tr>
                        `;
                    }).join('') : `<tr><td colspan="5" style="text-align: center; padding: 20px;">لا توجد حركات مالية عامة في هذه الفترة.</td></tr>`}
                </tbody>
            </table>

            <h2 class="section-title">■ سجل الرسوم الدراسية (الطلاب)</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">رقم التسجيل</th>
                        <th>اسم الطالب</th>
                        <th>الدورة</th>
                        <th style="width: 15%;">التاريخ</th>
                        <th style="width: 15%;">المدفوع</th>
                        <th style="width: 15%;">المتبقي</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.length > 0 ? filteredStudents.map(s => {
                        const isDebt = s.balance && s.balance !== '0 دينار' && s.balance !== '0';
                        return `
                        <tr>
                            <td style="font-weight: 700;">${(s.id || "").substring(0, 10)}</td>
                            <td style="font-weight: 600;">${s.name}</td>
                            <td>${s.course}</td>
                            <td>${s.date}</td>
                            <td class="text-emerald">${s.paid}</td>
                            <td class="${isDebt ? 'text-rose' : ''}">${s.balance || '0'}</td>
                        </tr>
                        `;
                    }).join('') : `<tr><td colspan="6" style="text-align: center; padding: 20px;">لا توجد تسجيلات طلاب في هذه الفترة.</td></tr>`}
                </tbody>
            </table>
            <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">نهاية التقرير المالي • تم إنشاء هذا التقرير آلياً من نظام إدارة المركز</div>
        </div>
    `;

    const printStyles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');
            body { font-family: 'Public Sans', 'Tajawal', sans-serif; direction: rtl; color: #1f2937; background: #fff; margin: 0; padding: 0; }
            h1, h2, h3, .section-title { font-family: 'Cairo', sans-serif; }
            .report-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .header-logo { max-height: 70px; object-fit: contain; }
            .header-title { text-align: left; }
            .header-title h1 { margin: 0; color: #1e3a8a; font-size: 26px; font-weight: 800; }
            .header-title p { margin: 5px 0 0; color: #6b7280; font-size: 13px; }
            .summary-cards { display: flex; gap: 15px; margin-bottom: 30px; }
            .card { flex: 1; background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card.primary { background: linear-gradient(135deg, #4f46e5, #3b82f6) !important; color: white !important; border: none; }
            .card.primary h3, .card.primary p, .card.primary small { color: white !important; }
            .card h3 { margin: 0 0 10px; font-size: 15px; color: #4b5563; font-weight: 600; }
            .card p { margin: 0; font-size: 22px; font-weight: 800; color: #111827; }
            .section-title { font-size: 18px; color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; margin-top: 30px; font-weight: 700; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; font-size: 13px; }
            thead { background-color: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { padding: 12px; text-align: right; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
            tbody tr:last-child td { border-bottom: none; }
            tbody tr:nth-child(even) { background-color: #f9fafb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .text-emerald { color: #10b981; font-weight: 700; direction: ltr; display: inline-block; }
            .text-rose { color: #e11d48; font-weight: 700; direction: ltr; display: inline-block; }
            @media print {
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .report-container { width: 100%; max-width: none; padding: 0; }
                .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
            }
        </style>
    `;

    // إنشاء نافذة طباعة مخفية
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.top = '-9999px'; iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>${title}</title>${printStyles}</head><body>${reportHtml}</body></html>`);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); document.body.removeChild(iframe); }, 500);
}

// === Subscriptions Logic ===
function updateSubscriptionCards() {
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const arabicMonthsMap = { 'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5, 'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11 };

    function calculateNextMonth(dateString) {
        if (!dateString) return "-";
        const dateParts = dateString.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).split(/[\s/.-]+/);
        
        if (dateParts.length >= 3) {
            let day = dateParts[0];
            let monthStr = dateParts[1];
            let year = parseInt(dateParts[2], 10);
            let monthIndex = arabicMonthsMap[monthStr];
            
            if (monthIndex !== undefined && !isNaN(year)) {
                monthIndex++; 
                if (monthIndex > 11) { monthIndex = 0; year++; }
                return `${day} ${arabicMonths[monthIndex]} ${year}`;
            }
        }
        return "بعد شهر"; // مسار بديل إذا اختلف التنسيق
    }

    // تحديث كارت الإنترنت
    const netSubs = accountingData.filter(a => a.student === 'اشتراك الانترنت');
    if (netSubs.length > 0) {
        netSubs.sort((a, b) => a.id.localeCompare(b.id)); // جلب الأحدث
        const lastRec = netSubs[netSubs.length - 1];
        
        const elDate = document.getElementById('net-sub-date');
        const elDue = document.getElementById('net-sub-due');
        const elAmount = document.getElementById('net-sub-amount');
        
        if (elDate) elDate.textContent = lastRec.date;
        if (elAmount) elAmount.textContent = isNaN(lastRec.amount) ? lastRec.amount : `${lastRec.amount} دينار`;
        if (elDue) elDue.textContent = calculateNextMonth(lastRec.date);
    }

    // تحديث كارت المولد
    const genSubs = accountingData.filter(a => a.student === 'اشتراك المولد');
    if (genSubs.length > 0) {
        genSubs.sort((a, b) => a.id.localeCompare(b.id)); // جلب الأحدث
        const lastRec = genSubs[genSubs.length - 1];
        
        const elDate = document.getElementById('gen-sub-date');
        const elDue = document.getElementById('gen-sub-due');
        const elAmount = document.getElementById('gen-sub-amount');
        
        if (elDate) elDate.textContent = lastRec.date;
        if (elAmount) elAmount.textContent = isNaN(lastRec.amount) ? lastRec.amount : `${lastRec.amount} دينار`;
        if (elDue) elDue.textContent = calculateNextMonth(lastRec.date);
    }
}

function openSubscriptionModal(type) {
    openModal('add-accounting-modal');
    // تعبئة البيانات تلقائياً بعد فتح النافذة
    setTimeout(() => {
        const select = document.getElementById('accStudentSelect');
        const input = document.getElementById('accStudent');
        if (select) { select.value = type; if (input) { input.style.display = 'none'; input.value = type; } }
        
        const dateInput = document.getElementById('accDate');
        if (dateInput) { dateInput.value = new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()); }
    }, 50);
}

// === Notifications Logic ===
function renderNotifications() {
    const notifDropdown = document.getElementById('notif-dropdown');
    const notifBadge = document.getElementById('notif-badge');
    const notifList = document.getElementById('notif-list');
    const parentNotifList = document.getElementById('parent-notifications-list');
    const teacherNotifList = document.getElementById('teacher-notifications-list');
    const adminNotifList = document.getElementById('admin-notifications-list');

    let userNotifs = [...notificationsData];

    // فلترة الإشعارات بناءً على صلاحية المستخدم
    if (currentUser) {
        if (currentUser.roleCode === 'teacher') {
            // استخراج الشعب التي يدرسها هذا المعلم فقط
            const teacherClasses = coursesData.filter(c => c.instructor === currentUser.name).map(c => 'شعبة: ' + c.title);
            userNotifs = userNotifs.filter(n => 
                n.target === 'الجميع' || 
                n.target === 'المدرسين' || 
                teacherClasses.includes(n.target)
            );
        } else if (currentUser.roleCode === 'parent') {
            const parentStudents = studentsData.filter(s => s.email === currentUser.email);
            const childrenNames = parentStudents.map(s => 'طالب: ' + s.name);
            const childrenClasses = parentStudents.map(s => {
                const cls = coursesData.find(c => c.id === s.class_id);
                return cls ? 'شعبة: ' + cls.title : null;
            }).filter(Boolean);

            userNotifs = userNotifs.filter(n => 
                n.target === 'الجميع' || n.target === 'الطلاب' || n.target === 'أولياء الأمور' ||
                childrenClasses.includes(n.target) || childrenNames.includes(n.target)
            );
        }
    }

    if (notifBadge) notifBadge.textContent = userNotifs.length;

    const noNotifsHtml = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">لا توجد إشعارات جديدة</div>';
    const noDropdownHtml = '<div class="dropdown-item text-center">لا توجد إشعارات جديدة</div>';

    if (userNotifs.length === 0) {
        if (notifList) notifList.innerHTML = noDropdownHtml;
        if (parentNotifList) parentNotifList.innerHTML = noNotifsHtml;
        if (teacherNotifList) teacherNotifList.innerHTML = noNotifsHtml;
        if (adminNotifList) adminNotifList.innerHTML = noNotifsHtml;
        return;
    }

    // الإشعارات تأتي مرتبة من قاعدة البيانات (الأحدث أولاً)، لذا لا حاجة لعكسها
    const sortedNotifs = userNotifs;

    // Play sound alert for new notifications
    if (sortedNotifs.length > 0) {
        const latestNotif = sortedNotifs[0];
        if (lastSeenNotificationId !== null && lastSeenNotificationId !== latestNotif.id) {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log("Audio play blocked by browser:", e));
            } catch (e) { }
        }
        lastSeenNotificationId = latestNotif.id;
    }

    // Render for dropdown
    if (notifList) {
        notifList.innerHTML = '';
        sortedNotifs.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.innerHTML = `
            <div class="notif-title">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px">${notif.target}</span></div>
            <div class="notif-msg">${notif.message}</div>
            <span class="notif-meta">${notif.date}</span>
        `;
            notifList.appendChild(item);
        });
    }

    // Render for parent dashboard
    if (parentNotifList) {
        parentNotifList.innerHTML = '';
        // Only show up to 5 recent notifications on the dashboard for cleaner UI
        sortedNotifs.slice(0, 5).forEach((notif, index) => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.cursor = 'default'; // explicitly default
            
            const isNewest = index === 0;
            if (isNewest) {
                item.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                item.style.borderLeft = '4px solid var(--primary-color)';
            }

            item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px;float:left;">${notif.target}</span> ${isNewest ? '<span class="badge" style="background:var(--danger-color);font-size:10px;padding:2px 6px;float:left;margin-left:5px;">جديد</span>' : ''}</div>
            <div style="font-size: 14px; color: var(--text-muted); line-height: 1.4;">${notif.message}</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;"><i class='bx bx-time-five'></i> ${notif.date}</div>
        `;
            parentNotifList.appendChild(item);
        });
        if (parentNotifList.lastChild) {
            parentNotifList.lastChild.style.borderBottom = 'none';
        }
    }
    
    // Render for teacher dashboard
    if (teacherNotifList) {
        teacherNotifList.innerHTML = '';
        sortedNotifs.slice(0, 5).forEach(notif => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.cursor = 'default';
            item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px;float:left;">${notif.target}</span></div>
            <div style="font-size: 14px; color: var(--text-muted); line-height: 1.4;">${notif.message}</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;"><i class='bx bx-time-five'></i> ${notif.date}</div>
        `;
            teacherNotifList.appendChild(item);
        });
        if (teacherNotifList.lastChild) {
            teacherNotifList.lastChild.style.borderBottom = 'none';
        }
    }

    // Render for admin dashboard
    if (adminNotifList) {
        adminNotifList.innerHTML = '';
        sortedNotifs.slice(0, 5).forEach(notif => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid var(--border-color)';
            item.style.cursor = 'default';
            item.innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${notif.title} <span class="badge" style="background:var(--primary-color);font-size:10px;padding:2px 6px;float:left;">${notif.target}</span></div>
            <div style="font-size: 14px; color: var(--text-muted); line-height: 1.4;">${notif.message}</div>
            <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;"><i class='bx bx-time-five'></i> ${notif.date}</div>
        `;
            adminNotifList.appendChild(item);
        });
        if (adminNotifList.lastChild) {
            adminNotifList.lastChild.style.borderBottom = 'none';
        }
    }
}

// === Teacher Views Logic ===
function renderTeacherViews() {
    if (!currentUser || currentUser.roleCode !== 'teacher') return;

    // Show Teacher Topbar Info
    const topbarUserInfo = document.getElementById("topbar-user-info");
    if (topbarUserInfo) {
        const inst = instructorsData.find(i => i.name === currentUser.name);
        const subjectName = inst ? inst.spec : '';
        topbarUserInfo.style.display = 'block';
        if (subjectName) {
            topbarUserInfo.innerHTML = `المدرس: <span style="color: var(--text-color);">${currentUser.name}</span> &nbsp;|&nbsp; المادة: <span style="color: var(--text-color);">${subjectName}</span>`;
        } else {
            topbarUserInfo.innerHTML = `المدرس: <span style="color: var(--text-color);">${currentUser.name}</span>`;
        }
    }

    // استخراج الشعب والصفوف الخاصة بالمعلم
    const teacherClasses = coursesData.filter(c => c.instructor === currentUser.name);
    const teacherClassIds = teacherClasses.map(c => c.id);

    // استخراج الطلاب المسجلين في هذه الشعب حصراً
    const teacherStudents = studentsData.filter(s => teacherClassIds.includes(s.class_id));

    // تحديث الكروت الإحصائية العلوية
    const totalStudentsEl = document.getElementById('teacher-total-students');
    const totalClassesEl = document.getElementById('teacher-total-classes');
    if (totalStudentsEl) totalStudentsEl.textContent = teacherStudents.length;
    if (totalClassesEl) totalClassesEl.textContent = teacherClasses.length;

    // تحديث قائمة الشعب في اللوحة الرئيسية
    const classesListEl = document.getElementById('teacher-classes-list');
    if (classesListEl) {
        if (teacherClasses.length === 0) {
            classesListEl.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-muted);">لا توجد شعب تابعة لك حالياً</li>';
        } else {
            classesListEl.innerHTML = teacherClasses.map(c => {
                const studentCount = studentsData.filter(s => s.class_id === c.id).length;
                return `
                    <li style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 600; color: var(--text-main);">${c.title} <br><small style="color: var(--text-muted); font-weight: normal; font-size: 12px;">${c.subject}</small></div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <span class="badge" style="background: var(--bg-hover); color: var(--primary-color); border: 1px solid var(--primary-color); font-size: 13px;"><i class='bx bx-group'></i> ${studentCount} طالب</span>
                            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 13px; border-radius: 8px; display: flex; align-items: center; gap: 5px;" onclick="goToAttendancePage('${c.id}')"><i class='bx bx-calendar-check'></i> تحضير</button>
                        </div>
                    </li>
                `;
            }).join('');
            if (classesListEl.lastElementChild) classesListEl.lastElementChild.style.borderBottom = 'none';
        }
    }

    // تحديث القائمة المنسدلة في صفحة التحضير
    const attClassSelect = document.getElementById('attendance-page-class-select');
    if (attClassSelect) {
        const currentVal = attClassSelect.value;
        attClassSelect.innerHTML = '<option value="">-- اختر الشعبة --</option>' + teacherClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        if (currentVal && teacherClassIds.includes(currentVal)) {
            attClassSelect.value = currentVal;
        }
    }

    // تحديث القائمة المنسدلة في صفحة الدرجات
    const gradesClassSelect = document.getElementById('grades-class-select');
    if (gradesClassSelect) {
        const currentVal = gradesClassSelect.value;
        gradesClassSelect.innerHTML = '<option value="">-- اختر الشعبة --</option>' + teacherClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        if (currentVal && teacherClassIds.includes(currentVal)) {
            gradesClassSelect.value = currentVal;
        }
    }

    // تحديث القائمة المنسدلة في صفحة إرسال الإشعارات للمعلم
    const teacherNotifClass = document.getElementById('teacherNotifClass');
    if (teacherNotifClass) {
        teacherNotifClass.innerHTML = '<option value="">-- حدد الشعبة --</option>' + teacherClasses.map(c => `<option value="${c.title}">${c.title}</option>`).join('');
    }

    // تحديث جدول الطلاب وقائمة الفلترة
    const tbody = document.getElementById('teacher-students-table-body');
    const filterSelect = document.getElementById('teacher-class-filter');
    
    if (filterSelect) {
        const currentFilter = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">جميع الشعب</option>' + teacherClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        if (teacherClassIds.includes(currentFilter) || currentFilter === 'all') {
            filterSelect.value = currentFilter;
        }
    }

    const renderStudentsTable = () => {
        if (!tbody) return;
        const searchTerm = (document.getElementById('teacher-student-search')?.value || '').toLowerCase();
        const selectedClassId = document.getElementById('teacher-class-filter')?.value || 'all';

        const filteredStudents = teacherStudents.filter(s => {
            const matchName = s.name.toLowerCase().includes(searchTerm);
            const matchClass = selectedClassId === 'all' || s.class_id === selectedClassId;
            return matchName && matchClass;
        });

        if (filteredStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">لا يوجد طلاب مطابقين</td></tr>';
            return;
        }

        tbody.innerHTML = filteredStudents.map(s => {
            const cls = teacherClasses.find(c => c.id === s.class_id);
            const className = cls ? cls.title : 'غير محدد';
            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random" alt="Avatar">
                            <div class="user-info">
                                <h4>${s.name}</h4>
                                <p>${s.email}</p>
                            </div>
                        </div>
                    </td>
                    <td>${s.course}</td>
                    <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${className}</span></td>
                    <td><span class="status-badge status-${s.statusCode}">${s.status}</span></td>
                    <td>${s.date}</td>
                    <td>
                        <button class="btn-icon" title="عرض التفاصيل" onclick="alert('سيتم تفعيل عرض تفاصيل الطالب قريباً')" style="color: var(--primary-color);"><i class='bx bx-show'></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    renderStudentsTable();

    // ربط مستمعي الأحداث للبحث والفلترة
    const searchInput = document.getElementById('teacher-student-search');
    if (filterSelect && !filterSelect.dataset.listener) {
        filterSelect.addEventListener('change', renderStudentsTable);
        filterSelect.dataset.listener = "true";
    }
    if (searchInput && !searchInput.dataset.listener) {
        searchInput.addEventListener('input', renderStudentsTable);
        searchInput.dataset.listener = "true";
    }

    // === Render Teacher Schedule ===
    const teacherScheduleTbody = document.getElementById('teacher-schedule-tbody');
    if (teacherScheduleTbody) {
        const tSchedule = scheduleData.filter(s => s.instructor_name === currentUser.name);
        tSchedule.sort((a, b) => {
            if (daysOrder[a.day_of_week] !== daysOrder[b.day_of_week]) {
                return daysOrder[a.day_of_week] - daysOrder[b.day_of_week];
            }
            return a.start_time.localeCompare(b.start_time);
        });

        if (tSchedule.length === 0) {
            teacherScheduleTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted);">لا يوجد جدول متاح حالياً</td></tr>';
        } else {
            teacherScheduleTbody.innerHTML = tSchedule.map(s => {
                const cls = coursesData.find(c => c.id === s.class_id);
                const formatTime = (time) => {
                    if (!time) return ''; let [h, m] = time.split(':'); h = parseInt(h);
                    const ampm = h >= 12 ? 'م' : 'ص'; h = h % 12 || 12; return `${h}:${m} ${ampm}`;
                };
                const badgeStyle = getBadgeStyleForId(s.class_id);
                return `
                    <tr>
                        <td style="font-weight: bold; color: var(--primary-color);">${s.day_of_week}</td>
                        <td dir="ltr" style="text-align: right; font-weight: 500;">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
                        <td><span class="badge" style="${badgeStyle}">${cls ? cls.title : '-'}</span></td>
                        <td>${s.room || '-'}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}

// === Parent Views Logic ===
function renderParentViews() {
    if (!currentUser || currentUser.roleCode !== 'parent') return;

    // جلب أبناء ولي الأمر (نقوم بمطابقة بريد الطالب مع بريد ولي الأمر كطريقة ربط افتراضية)
    const children = studentsData.filter(s => s.email === currentUser.email);

    const countEl = document.getElementById('parent-children-count');
    if (countEl) countEl.textContent = children.length;

    const container = document.getElementById('parent-children-list');
    if (!container) return;

    if (children.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class='bx bx-face' style="font-size: 48px; color: var(--primary-color); margin-bottom: 15px;"></i>
                    <h3>سجل الأبناء الأكاديمي</h3>
                    <p>لم يتم العثور على أبناء مسجلين مرتبطين ببريدك الإلكتروني (${currentUser.email}).</p>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = children.map(child => {
        // استخراج سجل الحضور الخاص بهذا الطالب من السجلات العامة
        const childAttendance = attendanceData.flatMap(att => {
            const record = att.records.find(r => r.student_id === child.id);
            return record ? { date: att.date, status: record.status, notes: record.notes } : [];
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // الأحدث أولاً

        const presentCount = childAttendance.filter(a => a.status === 'present').length;
        const absentCount = childAttendance.filter(a => a.status === 'absent').length;
        const excusedCount = childAttendance.filter(a => a.status === 'excused').length;
        const childGrades = gradesData.filter(g => g.student_id === child.id);

        return `
        <div class="card mb-4" style="border-right: 4px solid var(--primary-color); box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
            <div class="card-header d-flex justify-between align-center" style="background: rgba(79, 70, 229, 0.03); border-bottom: 1px solid var(--border-color);">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; color: var(--primary-color);">
                    <i class='bx bx-user-circle' style="font-size: 24px;"></i> ${child.name}
                </h3>
                <span class="badge" style="background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border-color);">${child.course}</span>
            </div>
            <div class="card-body">
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px; gap: 15px;">
                    <div style="background: #ecfdf5; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #a7f3d0;">
                        <div style="color: #059669; font-weight: 900; font-size: 24px;">${presentCount}</div>
                        <div style="font-size: 13px; color: #065f46; font-weight: 600;">مرات الحضور</div>
                    </div>
                    <div style="background: #fef2f2; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #fecaca;">
                        <div style="color: #dc2626; font-weight: 900; font-size: 24px;">${absentCount}</div>
                        <div style="font-size: 13px; color: #991b1b; font-weight: 600;">مرات الغياب</div>
                    </div>
                    <div style="background: #fffbeb; padding: 15px; border-radius: 12px; text-align: center; border: 1px solid #fde68a;">
                        <div style="color: #d97706; font-weight: 900; font-size: 24px;">${excusedCount}</div>
                        <div style="font-size: 13px; color: #92400e; font-weight: 600;">الإجازات</div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 15px; font-size: 15px; border-bottom: 2px solid var(--bg-hover); padding-bottom: 8px;">سجل التحضير التفصيلي</h4>
                ${childAttendance.length > 0 ? `
                <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
                    <table class="data-table" style="font-size: 13px; margin: 0;">
                        <thead style="position: sticky; top: 0; background: var(--bg-hover);">
                            <tr>
                                <th>التاريخ</th>
                                <th>الحالة</th>
                                <th>ملاحظات المدرس</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${childAttendance.map(att => {
                                let statusBadge = '';
                                if (att.status === 'present') statusBadge = '<span class="badge" style="background:#d1fae5; color:#065f46; padding: 4px 10px;">حاضر</span>';
                                else if (att.status === 'absent') statusBadge = '<span class="badge" style="background:#fee2e2; color:#991b1b; padding: 4px 10px;">غائب</span>';
                                else if (att.status === 'excused') statusBadge = '<span class="badge" style="background:#fef3c7; color:#92400e; padding: 4px 10px;">مجاز</span>';
                                return `
                                <tr>
                                    <td style="font-weight: 600;">${att.date}</td>
                                    <td>${statusBadge}</td>
                                    <td style="color: var(--text-muted);">${att.notes || '-'}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `<p style="text-align: center; color: var(--text-muted); font-size: 14px; padding: 20px; background: var(--bg-hover); border-radius: 8px;">لا توجد سجلات حضور وغياب حالياً.</p>`}
                
                <!-- سجل الامتحانات ومستوى الطالب -->
                <h4 style="margin-top: 30px; margin-bottom: 15px; font-size: 15px; border-bottom: 2px solid var(--bg-hover); padding-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--text-main);">
                    <i class='bx bx-medal' style="font-size: 20px; color: #f59e0b;"></i>
                    سجل الدرجات
                </h4>
                <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                    <table class="data-table" style="font-size: 13px; margin: 0; border-radius: 0;">
                        <thead style="background: var(--bg-hover);">
                            <tr>
                                <th>الدورة / الشعبة</th>
                                <th style="text-align: center;">الامتحان الأول</th>
                                <th style="text-align: center;">الامتحان الثاني</th>
                                <th style="text-align: center;">الامتحان الثالث</th>
                                <th style="text-align: center;">الامتحان الرابع</th>
                                <th style="text-align: center;">المجموع</th>
                                <th>الملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${childGrades.length > 0 ? childGrades.map(g => {
                                const cls = coursesData.find(c => c.id === g.class_id);
                                const className = cls ? cls.title : 'غير محدد';
                                const w1 = parseFloat(g.week1) || 0;
                                const w2 = parseFloat(g.week2) || 0;
                                const w3 = parseFloat(g.week3) || 0;
                                const w4 = parseFloat(g.week4) || 0;
                                const total = w1 + w2 + w3 + w4;
                                const hasGrades = g.week1 !== '' || g.week2 !== '' || g.week3 !== '' || g.week4 !== '';
                                
                                return `<tr>
                                    <td style="font-weight: 600;">${className}</td>
                                    <td style="text-align: center;">${g.week1 !== '' ? g.week1 : '-'}</td>
                                    <td style="text-align: center;">${g.week2 !== '' ? g.week2 : '-'}</td>
                                    <td style="text-align: center;">${g.week3 !== '' ? g.week3 : '-'}</td>
                                    <td style="text-align: center;">${g.week4 !== '' ? g.week4 : '-'}</td>
                                    <td style="text-align: center; font-weight: bold; color: var(--primary-color);">${hasGrades ? total : '-'}</td>
                                    <td>${g.notes || '-'}</td>
                                </tr>`;
                            }).join('') : `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد درجات مسجلة حالياً لهذا الطالب.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // === Render Parent Schedule ===
    const parentScheduleTbody = document.getElementById('parent-schedule-tbody');
    if (parentScheduleTbody) {
        let pSchedule = [];
        children.forEach(child => {
            if (child.class_id) {
                const childSch = scheduleData.filter(s => s.class_id === child.class_id).map(s => ({...s, studentName: child.name}));
                pSchedule = pSchedule.concat(childSch);
            }
        });

        pSchedule.sort((a, b) => {
            if (daysOrder[a.day_of_week] !== daysOrder[b.day_of_week]) {
                return daysOrder[a.day_of_week] - daysOrder[b.day_of_week];
            }
            return a.start_time.localeCompare(b.start_time);
        });

        if (pSchedule.length === 0) {
            parentScheduleTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">لا توجد جداول متاحة حالياً</td></tr>';
        } else {
            parentScheduleTbody.innerHTML = pSchedule.map(s => {
                const cls = coursesData.find(c => c.id === s.class_id);
                const formatTime = (time) => {
                    if (!time) return ''; let [h, m] = time.split(':'); h = parseInt(h);
                    const ampm = h >= 12 ? 'م' : 'ص'; h = h % 12 || 12; return `${h}:${m} ${ampm}`;
                };
                const badgeStyle = getBadgeStyleForId(s.class_id);
                return `
                    <tr>
                        <td style="font-weight: 600;"><i class='bx bx-user' style="color: var(--text-muted);"></i> ${s.studentName}</td>
                        <td style="font-weight: bold; color: var(--primary-color);">${s.day_of_week}</td>
                        <td dir="ltr" style="text-align: right; font-weight: 500;">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
                        <td><span class="badge" style="${badgeStyle}">${cls ? cls.title : '-'}</span></td>
                        <td>${s.room || '-'}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    // === Render Parent Fees ===
    const feesContainer = document.getElementById('parent-fees-content');
    if (feesContainer) {
        if (children.length === 0) {
            feesContainer.innerHTML = `
                <div class="card">
                    <div class="card-body" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i class='bx bx-wallet' style="font-size: 48px; color: var(--primary-color); margin-bottom: 15px;"></i>
                        <h3>لا توجد بيانات مالية أو رسوم مسجلة للعرض</h3>
                    </div>
                </div>`;
        } else {
            let totalRemaining = 0;
            let feesHtml = `
            <div class="card mb-4" style="border-top: 4px solid var(--primary-color); overflow: hidden;">
                <div class="card-header" style="background: rgba(79, 70, 229, 0.05); padding: 20px;">
                    <h3 style="color: var(--primary-color); margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class='bx bx-wallet-alt' style="font-size: 24px;"></i>
                        ملخص الرسوم الدراسية
                    </h3>
                </div>
                <div class="card-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="data-table" style="margin: 0; border-radius: 0;">
                            <thead>
                                <tr style="background: var(--bg-hover);">
                                    <th>اسم الطالب</th>
                                    <th>الدورة</th>
                                    <th>المبلغ الكلي</th>
                                    <th>المدفوع</th>
                                    <th>المتبقي (الديون)</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            children.forEach(child => {
                const r = parseFloat(child.balance ? child.balance.replace(/[^\d.-]/g, '') : 0) || 0;
                totalRemaining += r;
                const isDebt = r > 0;
                
                feesHtml += `
                    <tr>
                        <td style="font-weight: 600;">${child.name}</td>
                        <td>${child.course}</td>
                        <td>${child.total || '0'}</td>
                        <td style="color: var(--primary-color); font-weight: bold;">${child.paid || '0'}</td>
                        <td style="color: ${isDebt ? 'var(--danger-color)' : 'inherit'}; font-weight: bold;">${child.balance || '0'}</td>
                        <td><span class="status-badge status-${child.statusCode}">${child.status}</span></td>
                    </tr>
                `;
            });

            feesHtml += `</tbody></table></div></div></div>`;

            // Payment History (Accounting Data)
            const childrenNames = children.map(c => c.name);
            const parentReceipts = accountingData.filter(a => childrenNames.some(name => a.student.includes(name)));

            if (parentReceipts.length > 0) {
                feesHtml += `
                <div class="card" style="border-top: 4px solid #10b981; overflow: hidden;">
                    <div class="card-header" style="background: rgba(16, 185, 129, 0.05); padding: 20px;">
                        <h3 style="color: #10b981; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class='bx bx-receipt' style="font-size: 24px;"></i>
                            سجل الإيصالات والدفعات المؤكدة
                        </h3>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="table-responsive">
                            <table class="data-table" style="margin: 0; border-radius: 0;">
                                <thead><tr style="background: var(--bg-hover);"><th>رقم الإيصال</th><th>البيان</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                                <tbody>
                                    ${parentReceipts.sort((a, b) => b.id.localeCompare(a.id)).map(acc => `
                                        <tr><td style="font-weight: bold;">${acc.receipt || '-'}</td><td>${acc.student}</td><td>${acc.date}</td><td dir="ltr" style="text-align: right; color: #10b981; font-weight: bold;">${acc.amount}</td><td><span class="status-badge status-${acc.statusCode}">${acc.status}</span></td></tr>
                                    `).join('')}
                                </tbody></table></div></div></div>`;
            }

            feesContainer.innerHTML = feesHtml;

            const parentFeesStatEl = document.getElementById('parent-total-debt');
            if (parentFeesStatEl) {
                const currency = settingsData.currency || 'دينار';
                parentFeesStatEl.textContent = `${totalRemaining.toLocaleString()} ${currency}`;
            }
        }
    }
}

function goToAttendancePage(classId) {
    navigateTo('teacher-attendance');
    const select = document.getElementById('attendance-page-class-select');
    if (select) {
        select.value = classId;
        loadClassAttendance();
    }
}

function loadClassAttendance() {
    const classId = document.getElementById('attendance-page-class-select')?.value;
    let dateVal = document.getElementById('attendance-page-date')?.value;
    const tbody = document.getElementById('attendance-page-students-list');

    if (!tbody) return;

    if (!classId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">الرجاء تحديد شعبة وتاريخ</td></tr>';
        return;
    }

    if (!dateVal) {
        document.getElementById('attendance-page-date').valueAsDate = new Date();
        dateVal = document.getElementById('attendance-page-date').value;
    }

    const classStudents = studentsData.filter(s => s.class_id === classId);
    if (classStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">لا يوجد طلاب مسجلين في هذه الشعبة</td></tr>';
        return;
    }

    // التحقق من وجود سجل حضور مسبق لنفس التاريخ والشعبة
    const existingRecord = attendanceData.find(a => a.class_id === classId && a.date === dateVal);

    tbody.innerHTML = classStudents.map(s => {
        let status = 'present';
        let notes = '';

        if (existingRecord) {
            const studentRec = existingRecord.records.find(r => r.student_id === s.id);
            if (studentRec) {
                status = studentRec.status;
                notes = studentRec.notes || '';
            }
        }

        return `
            <tr data-student-id="${s.id}">
                <td style="font-weight: 600;">${s.name}</td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="present" ${status === 'present' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: var(--primary-color);">
                </td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="absent" ${status === 'absent' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: var(--danger-color);">
                </td>
                <td style="text-align: center;">
                    <input type="radio" name="page_att_${s.id}" value="excused" ${status === 'excused' ? 'checked' : ''} style="transform: scale(1.4); cursor: pointer; accent-color: #f59e0b;">
                </td>
                <td>
                    <input type="text" class="form-input page-input-notes" value="${notes}" placeholder="أضف ملاحظة..." style="padding: 6px 10px; font-size: 12px; width: 100%;">
                </td>
            </tr>
        `;
    }).join('');
}

async function savePageAttendance() {
    const classId = document.getElementById('attendance-page-class-select').value;
    const date = document.getElementById('attendance-page-date').value;
    
    if (!classId) { alert('يرجى تحديد الشعبة'); return; }
    if (!date) { alert('يرجى تحديد تاريخ التحضير'); return; }
    
    const rows = document.querySelectorAll('#attendance-page-students-list tr[data-student-id]');
    const attendanceRecords = [];
    const absentStudents = [];

    rows.forEach(row => {
        const studentId = row.getAttribute('data-student-id');
        const statusInput = row.querySelector(`input[name="page_att_${studentId}"]:checked`);
        const notesInput = row.querySelector('.page-input-notes');

        if (studentId && statusInput) {
            attendanceRecords.push({
                student_id: studentId,
                status: statusInput.value,
                notes: notesInput ? notesInput.value : ""
            });
            
            if (statusInput.value === 'absent') {
                const student = studentsData.find(s => s.id === studentId);
                if (student) absentStudents.push(student);
            }
        }
    });

    if (attendanceRecords.length === 0) {
        alert('لا يوجد طلاب لتسجيل حضورهم.');
        return;
    }

    const payload = {
        id: 'Att-' + Date.now(),
        class_id: classId,
        date: date,
        records: attendanceRecords
    };

    try {
        const res = await fetch('api.php?endpoint=attendance', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);

        // إرسال إشعارات غياب للطلاب المتغيبين
        const newNotifs = [];
        absentStudents.forEach((student, index) => {
            const message = `تم تسجيل غياب للطالب ${student.name} بتاريخ ${date}.`;
            // التحقق من وجود إشعار مماثل (اختياري)
            newNotifs.push({
                id: 'N-' + Date.now() + index,
                title: 'إشعار غياب',
                target: 'طالب: ' + student.name,
                message: message + ` يرجى متابعة الأمر.`,
                date: new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())
            });
        });
        
        if (newNotifs.length > 0) {
            await fetch('api.php?endpoint=update/notifications', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newNotifs) });
        }

        alert('تم حفظ سجل التحضير بنجاح!'); 
        await loadDataFromDB();
        loadClassAttendance();
    } catch (err) {
        console.error("Error saving attendance:", err);
        alert('تعذر الحفظ: ' + err.message);
    }
}

// === وظائف صفحة الدرجات ===
function loadClassGrades() {
    const classId = document.getElementById('grades-class-select')?.value;
    const tbody = document.getElementById('grades-students-list');

    if (!tbody) return;

    if (!classId) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">الرجاء تحديد شعبة أولاً</td></tr>';
        return;
    }

    const classStudents = studentsData.filter(s => s.class_id === classId);
    if (classStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">لا يوجد طلاب مسجلين في هذه الشعبة</td></tr>';
        return;
    }

    const cls = coursesData.find(c => c.id === classId);
    const className = cls ? cls.title : 'غير محدد';

    tbody.innerHTML = classStudents.map(s => {
        // Find existing grade for student in this class, or create defaults
        const eg = gradesData.find(g => g.student_id === s.id && g.class_id === classId) || { id: '', week1: '', week2: '', week3: '', week4: '', notes: '' };
        
        const w1 = parseFloat(eg.week1) || 0;
        const w2 = parseFloat(eg.week2) || 0;
        const w3 = parseFloat(eg.week3) || 0;
        const w4 = parseFloat(eg.week4) || 0;
        const total = w1 + w2 + w3 + w4;
        const hasGrades = eg.week1 !== '' || eg.week2 !== '' || eg.week3 !== '' || eg.week4 !== '';

        return `
            <tr data-student-id="${s.id}" data-grade-id="${eg.id}">
                <td style="font-weight: 600;">${s.name}</td>
                <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${className}</span></td>
                <td>${eg.week1 !== '' ? eg.week1 : '-'}</td>
                <td>${eg.week2 !== '' ? eg.week2 : '-'}</td>
                <td>${eg.week3 !== '' ? eg.week3 : '-'}</td>
                <td>${eg.week4 !== '' ? eg.week4 : '-'}</td>
                <td style="font-weight: bold; color: var(--primary-color);">${hasGrades ? total : '-'}</td>
                <td>
                    ${eg.notes || '-'}
                </td>
                <td>
                    <button class="btn-icon" style="color: var(--primary-color);" title="تعديل" onclick="editGrade('${s.id}', '${classId}')"><i class='bx bx-edit'></i></button>
                    ${eg.id ? `<button class="btn-icon" style="color: var(--danger-color);" title="حذف" onclick="deleteGrade('${eg.id}')"><i class='bx bx-trash'></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function editGrade(studentId, classId) {
    const eg = gradesData.find(g => g.student_id === studentId && g.class_id === classId) || { week1: '', week2: '', week3: '', week4: '', notes: '' };
    
    openModal('add-grade-modal');
    
    const classSelect = document.getElementById('gradeModalClass');
    if (classSelect) classSelect.value = classId;
    
    filterStudentsForGradeModal();
    
    const studentSelect = document.getElementById('gradeModalStudent');
    if (studentSelect) studentSelect.value = studentId;
    
    document.getElementById('gradeModalW1').value = eg.week1;
    document.getElementById('gradeModalW2').value = eg.week2;
    document.getElementById('gradeModalW3').value = eg.week3;
    document.getElementById('gradeModalW4').value = eg.week4;
    document.getElementById('gradeModalNotes').value = eg.notes || '';
}

async function deleteGrade(id) {
    if (confirm('هل أنت متأكد من حذف درجات هذا الطالب؟')) {
        try {
            const res = await fetch(`api.php?endpoint=grades/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                loadClassGrades();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting grade:", e);
            alert('خطأ في الحذف');
        }
    }
}

function filterClassesForSchedule() {
    const courseId = document.getElementById('scheduleCourse')?.value;
    const classSelect = document.getElementById('scheduleClass');
    if (!courseId || !classSelect) return;
    
    const course = coursesData.find(c => c.id === courseId);
    if (!course) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        document.getElementById('scheduleInstructor').value = '';
        return;
    }

    const classesList = coursesData;
    const filteredClasses = classesList.filter(c => c.subject === course.subject);

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة/المادة --</option>`;
    }

    const instructorSelect = document.getElementById('scheduleInstructor');
    if (instructorSelect) {
        let optionsHTML = `<option value="">-- اختر المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        
        // تحديد المدرس المرتبط بالدورة تلقائياً وضمان وجوده في القائمة
        if (course.instructor && course.instructor !== 'غير محدد') {
            // إذا لم يكن المدرس موجوداً في القائمة الحالية، قم بإضافته كخيار ليتمكن المتصفح من تحديده
            if (!instructorsData.some(i => i.name === course.instructor)) {
                optionsHTML += `<option value="${course.instructor}">${course.instructor}</option>`;
            }
        }
            
            // إضافة خيار الانتقال إلى صفحة المدرسين في نهاية القائمة
            optionsHTML += `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
            
            instructorSelect.innerHTML = optionsHTML;
            if (course.instructor && course.instructor !== 'غير محدد') {
                instructorSelect.value = course.instructor;
            } else {
                instructorSelect.value = '';
            }
    }
}

// دالة لتعبئة حقل المدرس تلقائياً عند اختيار شعبة
function autoFillInstructorForSchedule() {
    const classId = document.getElementById('scheduleClass')?.value;
    const courseId = document.getElementById('scheduleCourse')?.value;
    const instructorInput = document.getElementById('scheduleInstructor');
    if (!courseId || !instructorInput) {
        return;
    }

    const appendInstructor = (instName) => {
        if (!Array.from(instructorInput.options).some(opt => opt.value === instName)) {
            const newOpt = document.createElement('option');
            newOpt.value = instName;
            newOpt.textContent = instName;
            const lastOpt = instructorInput.lastElementChild;
            if (lastOpt && lastOpt.value === 'GOTO_INSTRUCTORS') {
                instructorInput.insertBefore(newOpt, lastOpt);
            } else {
                instructorInput.appendChild(newOpt);
            }
        }
        instructorInput.value = instName;
    };

    const cls = coursesData.find(c => c.id === classId);
    if (cls && cls.instructor && cls.instructor !== 'غير محدد') {
        appendInstructor(cls.instructor);
    } else {
        // إذا تم إلغاء تحديد الشعبة، نعود لمدرس الدورة الأساسي
        const crs = coursesData.find(c => c.id === courseId);
        if (crs && crs.instructor && crs.instructor !== 'غير محدد') {
            appendInstructor(crs.instructor);
        } else {
            instructorInput.value = '';
        }
    }
}


// === Badge Color Generator based on ID ===
const badgeColors = [
    { bg: '#fee2e2', text: '#be123c', border: '#fda4af' }, // Red/Rose
    { bg: '#d1fae5', text: '#047857', border: '#6ee7b7' }, // Emerald
    { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' }, // Indigo
    { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' }, // Amber
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // Pink
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // Light Blue
    { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // Purple
    { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }  // Orange
];

function getBadgeStyleForId(idString) {
    if (!idString) return `background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);`;
    let hash = 0;
    for (let i = 0; i < idString.length; i++) {
        hash = idString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % badgeColors.length;
    const theme = badgeColors[index];
    return `background: ${theme.bg}; color: ${theme.text}; border: 1px solid ${theme.border}; font-weight: 600;`;
}

const daysOrder = { 'السبت': 1, 'الأحد': 2, 'الإثنين': 3, 'الثلاثاء': 4, 'الأربعاء': 5, 'الخميس': 6, 'الجمعة': 7 };

function renderSchedule() {
    const tbody = document.getElementById('schedule-table-body');
    const classFilter = document.getElementById('schedule-class-filter');
    const instFilter = document.getElementById('schedule-instructor-filter');
    
    if (classFilter && classFilter.options.length <= 1) {
        const classes = coursesData.filter(c => c.duration === 'غير محدد' || c.title.includes(' - نسخة جديدة'));
        classFilter.innerHTML = '<option value="all">جميع الشعب</option>' + classes.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    }
    if (instFilter && instFilter.options.length <= 1) {
        instFilter.innerHTML = '<option value="all">جميع المدرسين</option>' + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
    }

    if (!tbody) return;

    const selClass = classFilter ? classFilter.value : 'all';
    const selInst = instFilter ? instFilter.value : 'all';
    const searchTerm = (document.getElementById('schedule-search')?.value || '').toLowerCase();

    let filtered = scheduleData.filter(s => {
        const matchClass = selClass === 'all' || s.class_id === selClass;
        const matchInst = selInst === 'all' || s.instructor_name === selInst;
        
        const crs = coursesData.find(c => c.id === s.course_id);
        const crsName = crs ? crs.title.toLowerCase() : '';
        const roomMatch = s.room ? s.room.toLowerCase() : '';
        
        const matchSearch = !searchTerm || 
            s.instructor_name.toLowerCase().includes(searchTerm) || 
            crsName.includes(searchTerm) || 
            roomMatch.includes(searchTerm) ||
            s.day_of_week.includes(searchTerm);
            
        return matchClass && matchInst && matchSearch;
    });

    filtered.sort((a, b) => {
        if (daysOrder[a.day_of_week] !== daysOrder[b.day_of_week]) {
            return daysOrder[a.day_of_week] - daysOrder[b.day_of_week];
        }
        return a.start_time.localeCompare(b.start_time);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">لا توجد مواعيد مضافة</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const crs = coursesData.find(c => c.id === s.course_id);
        const cls = coursesData.find(c => c.id === s.class_id);
        const crsName = crs ? crs.title : '-';
        const clsName = cls ? cls.title : '-';
        
        const formatTime = (time) => {
            if (!time) return '';
            let [h, m] = time.split(':');
            h = parseInt(h);
            const ampm = h >= 12 ? 'م' : 'ص';
            h = h % 12 || 12;
            return `${h}:${m} ${ampm}`;
        };
        
        const badgeStyle = getBadgeStyleForId(s.class_id);

        return `
            <tr>
                <td style="font-weight: bold; color: var(--primary-color);">${s.day_of_week}</td>
                <td dir="ltr" style="text-align: right; font-weight: 500;">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
                <td>${crsName}</td>
                    <td><span class="badge" style="${badgeStyle}">${clsName}</span></td>
                    <td><i class='bx bx-user' style="color: var(--text-muted);"></i> ${s.instructor_name}</td>
                <td>${s.room || '-'}</td>
                <td>
                    <button class="btn-icon" style="color: var(--primary-color);" title="تعديل" onclick="openEditScheduleModal('${s.id}')"><i class='bx bx-edit'></i></button>
                    <button class="btn-icon" style="color: var(--danger-color);" title="حذف" onclick="deleteSchedule('${s.id}')"><i class='bx bx-trash'></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteSchedule(id) {
    if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
        try {
            const res = await fetch(`api.php?endpoint=schedule/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                renderSchedule();
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Error deleting schedule:", e);
            alert('خطأ في الحذف');
        }
    }
}

function filterClassesForEditSchedule() {
    const courseId = document.getElementById('editScheduleCourse')?.value;
    const classSelect = document.getElementById('editScheduleClass');
    if (!courseId || !classSelect) return;
    
    const course = coursesData.find(c => c.id === courseId);
    if (!course) {
        classSelect.innerHTML = '<option value="">-- حدد الدورة أولاً --</option>';
        document.getElementById('editScheduleInstructor').value = '';
        return;
    }

    const classesList = coursesData;
    const filteredClasses = classesList.filter(c => c.subject === course.subject);

    if (filteredClasses.length > 0) {
        classSelect.innerHTML = `<option value="">-- حدد الشعبة --</option>` + filteredClasses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    } else {
        classSelect.innerHTML = `<option value="">-- لا توجد شعب متاحة لهذه الدورة/المادة --</option>`;
    }

    const instructorSelect = document.getElementById('editScheduleInstructor');
    if (instructorSelect) {
        let optionsHTML = `<option value="">-- اختر المدرس --</option>` + instructorsData.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
        if (course.instructor && course.instructor !== 'غير محدد') {
            if (!instructorsData.some(i => i.name === course.instructor)) {
                optionsHTML += `<option value="${course.instructor}">${course.instructor}</option>`;
            }
        }
        optionsHTML += `<option value="GOTO_INSTRUCTORS" style="font-weight:bold; color:var(--primary-color);">➕ إضافة / إدارة المدرسين</option>`;
        instructorSelect.innerHTML = optionsHTML;
        if (course.instructor && course.instructor !== 'غير محدد') {
            instructorSelect.value = course.instructor;
        } else {
            instructorSelect.value = '';
        }
    }
}

function autoFillInstructorForEditSchedule() {
    const classId = document.getElementById('editScheduleClass')?.value;
    const courseId = document.getElementById('editScheduleCourse')?.value;
    const instructorInput = document.getElementById('editScheduleInstructor');
    if (!courseId || !instructorInput) return;

    const appendInstructor = (instName) => {
        if (!Array.from(instructorInput.options).some(opt => opt.value === instName)) {
            const newOpt = document.createElement('option');
            newOpt.value = instName;
            newOpt.textContent = instName;
            const lastOpt = instructorInput.lastElementChild;
            if (lastOpt && lastOpt.value === 'GOTO_INSTRUCTORS') {
                instructorInput.insertBefore(newOpt, lastOpt);
            } else {
                instructorInput.appendChild(newOpt);
            }
        }
        instructorInput.value = instName;
    };

    const cls = coursesData.find(c => c.id === classId);
    if (cls && cls.instructor && cls.instructor !== 'غير محدد') {
        appendInstructor(cls.instructor);
    } else {
        const crs = coursesData.find(c => c.id === courseId);
        if (crs && crs.instructor && crs.instructor !== 'غير محدد') {
            appendInstructor(crs.instructor);
        } else {
            instructorInput.value = '';
        }
    }
}

function openEditScheduleModal(id) {
    const s = scheduleData.find(sch => sch.id === id);
    if (!s) return;
    
    document.getElementById('editScheduleId').value = s.id;
    
    // Populate Courses
    const courseSelect = document.getElementById('editScheduleCourse');
    const mainCourses = coursesData.filter(c => c.duration !== 'غير محدد' && !c.title.includes(' - نسخة جديدة'));
    courseSelect.innerHTML = '<option value="">-- اختر الدورة --</option>' + mainCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    courseSelect.value = s.course_id;
    
    // Populate Classes & Instructors based on Course
    filterClassesForEditSchedule();
    
    // Set Class
    document.getElementById('editScheduleClass').value = s.class_id;
    
    // Set Instructor
    const instructorSelect = document.getElementById('editScheduleInstructor');
    if (!Array.from(instructorSelect.options).some(opt => opt.value === s.instructor_name)) {
        const newOpt = document.createElement('option');
        newOpt.value = s.instructor_name;
        newOpt.textContent = s.instructor_name;
        const lastOpt = instructorSelect.lastElementChild;
        if (lastOpt && lastOpt.value === 'GOTO_INSTRUCTORS') {
            instructorSelect.insertBefore(newOpt, lastOpt);
        } else {
            instructorSelect.appendChild(newOpt);
        }
    }
    instructorSelect.value = s.instructor_name;

    document.getElementById('editScheduleDay').value = s.day_of_week;
    document.getElementById('editScheduleRoom').value = s.room || '';
    document.getElementById('editScheduleStartTime').value = s.start_time;
    document.getElementById('editScheduleEndTime').value = s.end_time;
    
    openModal('edit-schedule-modal');
}

function printSchedule() {
    const classFilter = document.getElementById('schedule-class-filter')?.options[document.getElementById('schedule-class-filter')?.selectedIndex]?.text || 'جميع الشعب';
    const instFilter = document.getElementById('schedule-instructor-filter')?.options[document.getElementById('schedule-instructor-filter')?.selectedIndex]?.text || 'جميع المدرسين';
    
    const selClass = document.getElementById('schedule-class-filter')?.value || 'all';
    const selInst = document.getElementById('schedule-instructor-filter')?.value || 'all';

    let filtered = scheduleData.filter(s => {
        const matchClass = selClass === 'all' || s.class_id === selClass;
        const matchInst = selInst === 'all' || s.instructor_name === selInst;
        return matchClass && matchInst;
    });

    filtered.sort((a, b) => {
        if (daysOrder[a.day_of_week] !== daysOrder[b.day_of_week]) {
            return daysOrder[a.day_of_week] - daysOrder[b.day_of_week];
        }
        return a.start_time.localeCompare(b.start_time);
    });

    let rowsHtml = '';
    if (filtered.length === 0) {
        rowsHtml = `<tr><td colspan="6" style="text-align: center; border: 1px solid #ddd; padding: 12px;">لا توجد مواعيد متاحة للطباعة</td></tr>`;
    } else {
        rowsHtml = filtered.map(s => {
            const crs = coursesData.find(c => c.id === s.course_id);
            const cls = coursesData.find(c => c.id === s.class_id);
            const formatTime = (t) => {
                if (!t) return ''; let [h, m] = t.split(':'); h = parseInt(h);
                const ampm = h >= 12 ? 'م' : 'ص'; h = h % 12 || 12; return `${h}:${m} ${ampm}`;
            };
            return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${s.day_of_week}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;" dir="ltr">${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${crs ? crs.title : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${cls ? cls.title : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${s.instructor_name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${s.room || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    let reportHtml = `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px; max-width: 900px; margin: auto;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h2>${settingsData.instituteName || 'المركز التعليمي'}</h2>
                <h3>الجدول الأسبوعي</h3>
                <p><strong>الشعبة:</strong> ${classFilter} | <strong>المدرس:</strong> ${instFilter}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 14px;">
                <thead style="background-color: #f3f4f6;">
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px;">اليوم</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الوقت</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الدورة</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">الشعبة</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">المدرس</th>
                        <th style="border: 1px solid #ddd; padding: 8px;">القاعة</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div style="margin-top: 30px; text-align: left; font-size: 12px; color: #666;">
                تاريخ الطباعة: ${new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date())}
            </div>
        </div>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute'; iframe.style.top = '-9999px'; iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>طباعة الجدول الأسبوعي</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Public+Sans:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"><style>body { font-family: 'Public Sans', 'Tajawal', sans-serif; } h1, h2, h3 { font-family: 'Cairo', sans-serif; } @media print { @page { margin: 1cm; } }</style></head><body>${reportHtml}</body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => { iframe.contentWindow.print(); document.body.removeChild(iframe); }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
    initChart();

    // Global listener for "GOTO_INSTRUCTORS" option in any select dropdown
    document.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT' && e.target.value === 'GOTO_INSTRUCTORS') {
            e.preventDefault();
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                closeModal(modal.id);
            }
            navigateTo('instructors');
            e.target.value = ''; // Reset select value
        }
    });

    // Toggle Dropdown
    const notifBtn = document.getElementById('notif-btn'); // تعريف المتغير هنا
    const notifDropdown = document.getElementById('notif-dropdown');
    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (notifDropdown) notifDropdown.classList.toggle('show');
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notifBtn && notifDropdown && !notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.classList.remove('show');
        }
    });

    // Handle Instructor Form Submission
    document.getElementById('add-instructor-modal')?.querySelector('form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('instructorName').value;
        const spec = document.getElementById('instructorSubject').value;
        const phone = document.getElementById('instructorPhone').value;
        const fileInput = document.getElementById('instructorImg');
        
        let imgBase64 = "";

        if (fileInput && fileInput.files && fileInput.files[0]) { // التحقق من وجود ملف قبل القراءة
            const reader = new FileReader();
            reader.onload = async function (event) {
                imgBase64 = event.target.result;
                await saveInstructor();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await saveInstructor();
        }

        async function saveInstructor() {
            const newInstructor = { id: 'Inst-' + Date.now(), name, spec, phone, img: imgBase64 };
            
            try {
                const res = await fetch('api.php?endpoint=update/instructors', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newInstructor]) });
                const result = await res.json();
                if (!result.success) throw new Error(result.message);

                await loadDataFromDB();
                closeModal('add-instructor-modal');
                document.getElementById('addInstructorForm').reset();
                alert('تم إضافة المدرس بنجاح!');
            } catch (err) {
                console.error("Error adding instructor:", err);
                alert("فشل إضافة المدرس.");
            }
        }
    });

    // Handle Course Form Submission
    document.getElementById('addCourseForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('courseTitle').value;
        const subject = document.getElementById('courseSubject').value;
        const instructor = document.getElementById('courseInstructor').value;
        const duration = document.getElementById('courseDuration').value;
        const fileInput = document.getElementById('courseImg');

        let imgBase64 = "https://placehold.co/300x200";
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function (e) {
                imgBase64 = e.target.result;
                await saveCourse();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await saveCourse();
        }

        async function saveCourse() {
            const newCourse = {
                id: 'Crs-' + Date.now(),
                title: title,
                subject: subject,
                instructor: instructor,
                duration: duration,
                students: "0",
                img: imgBase64
            };
            
            try {
                const res = await fetch('api.php?endpoint=update/courses', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newCourse]) });
                const result = await res.json();
                if (!result.success) throw new Error(result.message);

                await loadDataFromDB();
                closeModal('add-course-modal');
                document.getElementById('addCourseForm').reset();
                alert('تم إضافة الدورة بنجاح!');
            } catch (err) {
                console.error("Error adding course:", err);
                alert("فشل إضافة الدورة.");
            }
        }
    });

    // Handle Edit Class Form Submission
    document.getElementById('editClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editClassId').value;
        const title = document.getElementById('editClassName').value;
        const subject = document.getElementById('editClassSubject').value;
        const instructor = document.getElementById('editClassInstructor').value;
        const capacity = document.getElementById('editClassCapacity').value;

        const updates = { title, subject, capacity, instructor };

        try {
            const res = await fetch(`api.php?endpoint=courses/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
            const result = await res.json();
            if (result.success) {
                const index = coursesData.findIndex(c => c.id === id);
                if (index !== -1) { coursesData[index] = { ...coursesData[index], ...updates }; }
                if (typeof renderClassManagement === 'function') renderClassManagement();
                if (typeof renderCourses === 'function') renderCourses();
                closeModal('edit-class-modal');
                alert('تم تعديل الشعبة بنجاح!');
            } else { throw new Error(result.message); }
        } catch (e) { 
            console.error("Error editing class:", e);
            alert("خطأ في الحفظ."); 
        }
    });

    // Handle Edit Schedule Form Submission
    document.getElementById('editScheduleForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editScheduleId').value;
        const courseId = document.getElementById('editScheduleCourse').value;
        const classId = document.getElementById('editScheduleClass').value;
        const instName = document.getElementById('editScheduleInstructor').value;
        const room = document.getElementById('editScheduleRoom').value;
        const start = document.getElementById('editScheduleStartTime').value;
        const end = document.getElementById('editScheduleEndTime').value;
        const day = document.getElementById('editScheduleDay').value;

        const updates = { 
            course_id: courseId, 
            class_id: classId, 
            instructor_name: instName, 
            room: room, 
            start_time: start, 
            end_time: end, 
            day_of_week: day 
        };

        try {
            const res = await fetch(`api.php?endpoint=update/schedule`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([{id: id, ...updates}]) });
            const result = await res.json();
            if (result.success) {
                const index = scheduleData.findIndex(s => s.id === id);
                if (index !== -1) { scheduleData[index] = { ...scheduleData[index], ...updates }; }
                renderSchedule();
                closeModal('edit-schedule-modal');
                alert('تم تعديل الموعد بنجاح!');
            } else { throw new Error(result.message); }
        } catch (e) { 
            console.error("Error editing schedule:", e);
            alert("خطأ في الحفظ."); 
        }
    });

    // التعامل مع إضافة شعبة جديدة
    document.getElementById('addClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('className').value;
        const subject = document.getElementById('classSubject').value;
        const instructor = document.getElementById('classInstructor').value;
        const capacity = document.getElementById('classCapacity').value;

        const newClass = {
            id: 'Crs-' + Date.now(),
            title: title,
            subject: subject,
            instructor: instructor,
            duration: 'غير محدد',

            students: '0',
            capacity: capacity,
            img: "https://placehold.co/300x200"
        };

        coursesData.push(newClass);
        if (typeof renderClassManagement === 'function') renderClassManagement();
        if (typeof renderCourses === 'function') renderCourses();
        closeModal('add-class-modal');
        document.getElementById('addClassForm').reset();

        try {
            const res = await fetch('api.php?endpoint=update/courses', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newClass]) });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);
            
            alert('تم إضافة الشعبة بنجاح!');
        } catch (err) {
            console.error("Error adding class:", err);
            alert('فشل إضافة الشعبة.');
            await loadDataFromDB();
        }
    });

    document.getElementById('addStudentToClassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert("سيتم تفعيل خاصية ربط الطلاب بالشعب في التحديث القادم.");
        closeModal('add-student-to-class-modal');
    });

    // Handle Subject Form Submission
    document.getElementById('addSubjectForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('subjectName').value;
        const desc = document.getElementById('subjectDesc').value;

        const newSubject = {
            id: 'Sub-' + Date.now(),
            name,
            desc
        };

        // Optimistic UI update
        subjectsData.push(newSubject);
        renderSubjects();
        closeModal('add-subject-modal');
        e.target.reset();

        // Persist
        try {
            const res = await fetch('api.php?endpoint=update/subjects', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newSubject]) });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);
        } catch (err) {
            console.error("Error adding subject:", err);
        }
    });

    // Handle Form Submission
    document.getElementById('notificationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('notifTitle').value;
        let target = document.getElementById('notifTarget').value;
        const message = document.getElementById('notifMessage').value;
        
        const date = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

        const newNotif = { id: 'N-' + Date.now(), title, target, message, date };

        try {
            const res = await fetch('api.php?endpoint=update/notifications', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newNotif]) });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            await loadDataFromDB();
            e.target.reset();
            alert('تم إرسال الإشعار بنجاح!');
        } catch (error) {
            console.error("Error saving notification:", error);
            alert('حدث خطأ أثناء حفظ الإشعار. يرجى المحاولة مرة أخرى.');
        }
    });

    // Handle Teacher Notification Form Submission
    document.getElementById('teacherNotificationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('teacherNotifTitle').value;
        const classVal = document.getElementById('teacherNotifClass').value;
        const message = document.getElementById('teacherNotifMessage').value;
        
        const target = 'شعبة: ' + classVal;
        const date = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date());

        const newNotif = { id: 'N-' + Date.now(), title, target, message, date };

        try {
            const res = await fetch('api.php?endpoint=update/notifications', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newNotif]) });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            await loadDataFromDB();
            e.target.reset();
            alert('تم إرسال الإشعار بنجاح إلى طلاب الشعبة المحددة!');
        } catch (error) {
            console.error("Error saving notification:", error);
            alert('حدث خطأ أثناء حفظ الإشعار. يرجى المحاولة مرة أخرى.');
        }
    });
    
    // Handle Schedule Form
    document.getElementById('addScheduleForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('scheduleCourse').value;
        const classId = document.getElementById('scheduleClass').value;
        const instName = document.getElementById('scheduleInstructor').value;
        const day = document.getElementById('scheduleDay').value;
        const room = document.getElementById('scheduleRoom').value;
        const start = document.getElementById('scheduleStartTime').value;
        const end = document.getElementById('scheduleEndTime').value;
        
        if (start >= end) {
            alert('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
            return;
        }

        // التحقق من التضارب للمدرس
        const conflict = scheduleData.find(s => {
            if (s.instructor_name === instName && s.day_of_week === day && s.instructor_name !== 'غير محدد') {
                return (start < s.end_time) && (end > s.start_time);
            }
            return false;
        });

        if (conflict) {
            const cls = coursesData.find(c => c.id === conflict.class_id);
            alert(`يوجد تضارب! المدرس "${instName}" لديه محاضرة مسجلة في نفس الوقت.\n\nاليوم: ${day}\nالوقت: ${conflict.start_time} - ${conflict.end_time}\nالشعبة: ${cls ? cls.title : '-'}`);
            return;
        }

        const newSch = {
            id: 'Sch-' + Date.now(),
            course_id: courseId, 
            class_id: classId, 
            instructor_name: instName,
            day_of_week: day, 
            room: room, 
            start_time: start, 
            end_time: end
        };

        try {
            const res = await fetch('api.php?endpoint=update/schedule', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newSch]) });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                closeModal('add-schedule-modal');
                e.target.reset();
                alert('تم إضافة الموعد بنجاح!');
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("Error saving schedule:", err);
            alert('تعذر الحفظ');
        }
    });

    // Handle Add Grade Form Submission
    document.getElementById('addGradeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const classId = document.getElementById('gradeModalClass').value;
        const studentId = document.getElementById('gradeModalStudent').value;
        const examName = document.getElementById('gradeModalExamName').value;
        const gradeValue = document.getElementById('gradeModalValue').value;
        const w1 = document.getElementById('gradeModalW1').value;
        const w2 = document.getElementById('gradeModalW2').value;
        const w3 = document.getElementById('gradeModalW3').value;
        const w4 = document.getElementById('gradeModalW4').value;
        const notes = document.getElementById('gradeModalNotes').value;
        
        let gradeId = 'GRD-' + Date.now() + Math.floor(Math.random() * 1000);
        const existingGrade = gradesData.find(g => g.student_id === studentId && g.class_id === classId);
        if (existingGrade) gradeId = existingGrade.id;
        
        const newGrade = {
            id: gradeId,
            class_id: classId,
            student_id: studentId,
            exam_name: examName,
            grade_value: gradeValue,
            week1: w1,
            week2: w2,
            week3: w3,
            week4: w4,
            notes: notes
        };
        
        try {
            const res = await fetch('api.php?endpoint=update/grades', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newGrade]) });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                alert('تم حفظ درجة الطالب بنجاح!');
                closeModal('add-grade-modal');
                e.target.reset();
                loadClassGrades();
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("Error saving grade:", err);
            alert('تعذر الحفظ.');
        }
    });

    // === معالجة إضافة كتاب للمكتبة ===
    document.getElementById('addBookForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const category = document.getElementById('bookCategory').value;

        const newBook = {
            id: 'LIB-' + Date.now(),
            title: title,
            author: author,
            category: category,
            status: 'متاح'
        };

        try {
            const res = await fetch('api.php?endpoint=update/library', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newBook]) });
            const result = await res.json();
            if (result.success) {
                await loadDataFromDB();
                closeModal('add-book-modal');
                e.target.reset();
                alert('تم إضافة الكتاب بنجاح!');
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("Error adding book:", err);
            alert('حدث خطأ أثناء الحفظ.');
        }
    });

    // دالة موحدة لمعالجة إعدادات الحساب (المدرس وولي الأمر)
    async function handleRoleSettingsUpdate(formId, passwordId, imgId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const newPassword = document.getElementById(passwordId).value;
            const fileInput = document.getElementById(imgId);
            
            let imgBase64 = "";
            const submitUpdates = async () => {
                const updates = {};
                if (newPassword) {
                    updates.password_hash = newPassword;
                    updates.plain_password = newPassword;
                }
                if (imgBase64) updates.img = imgBase64;

                if (Object.keys(updates).length === 0) {
                    alert("لم تقم بإدخال أي تعديلات لحفظها.");
                    return;
                }

                try {
                    const res = await fetch(`api.php?endpoint=roles/${encodeURIComponent(currentUser.email)}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updates) });
                    const result = await res.json();
                    
                    if (result.success) {
                        alert('تم حفظ التغييرات بنجاح!');
                        form.reset();
                        
                        if (imgBase64) {
                            currentUser.img = imgBase64;
                            sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
                            const profileImg = document.getElementById("sidebar-profile-img");
                            if (profileImg) profileImg.src = imgBase64;
                            
                            // تزامن صورة المدرس مع جدول هيئة التدريس ليراها الإداريون
                            if (currentUser.role_code === 'teacher') {
                                const inst = instructorsData.find(i => i.name === currentUser.name);
                                if (inst) {
                                    await fetch(`api.php?endpoint=instructors/${inst.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ img: imgBase64 }) });
                                }
                            }
                        }
                    } else { throw new Error(result.message); }
                } catch (err) {
                    console.error("Error updating settings:", err);
                    alert('تعذر التحديث.');
                }
            };

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = async function (event) { imgBase64 = event.target.result; await submitUpdates(); };
                reader.readAsDataURL(fileInput.files[0]);
            } else { await submitUpdates(); }
        });
    }

    handleRoleSettingsUpdate('teacherSettingsForm', 'teacherNewPassword', 'teacherProfileImg');
    handleRoleSettingsUpdate('parentSettingsForm', 'parentNewPassword', 'parentProfileImg');

    loadDataFromDB(); // Call this to start loading data
});

// Settings Form Logic
function applyGlobalSettings() {
    if (!settingsData) return;

    // Apply Institute Name everywhere
    const name = settingsData.instituteName || "أكاديمية المعرفة";
    const sidebarText = document.getElementById("sidebar-logo-text");
    const receiptName = document.getElementById("receipt-institute-name");

    if (sidebarText) sidebarText.textContent = name;
    if (receiptName) receiptName.textContent = name;

    // Apply Logo everywhere
    const sidebarImg = document.getElementById("sidebar-logo-img");
    const sidebarIcon = document.getElementById("sidebar-logo-icon");
    const receiptImg = document.getElementById("receipt-logo-img");

    if (settingsData.logo) {
        if (sidebarImg) { sidebarImg.src = settingsData.logo; sidebarImg.style.display = 'block'; }
        if (sidebarIcon) { sidebarIcon.style.display = 'none'; }
        if (receiptImg) { receiptImg.src = settingsData.logo; receiptImg.style.display = 'block'; }
    } else {
        if (sidebarImg) { sidebarImg.style.display = 'none'; }
        if (sidebarIcon) { sidebarIcon.style.display = 'block'; }
        if (receiptImg) { receiptImg.style.display = 'none'; }
    }
}

function renderSettings() {
    applyGlobalSettings(); // Also run on view load

    if (!settingsData) return;
    const nameInput = document.getElementById("settingInstituteName");
    const phoneInput = document.getElementById("settingPhone");
    const emailInput = document.getElementById("settingEmail");
    const currencySelect = document.getElementById("settingCurrency");

    if (nameInput) nameInput.value = settingsData.instituteName || '';
    if (phoneInput) phoneInput.value = settingsData.phone || '';
    if (emailInput) emailInput.value = settingsData.email || '';
    if (currencySelect) currencySelect.value = settingsData.currency || 'IQD';
}

async function saveSettings(showLoading = false) {
    const instituteName = document.getElementById('settingInstituteName')?.value || 'أكاديمية المعرفة';
    const phone = document.getElementById('settingPhone')?.value || '';
    const email = document.getElementById('settingEmail')?.value || '';
    const currency = document.getElementById('settingCurrency')?.value || 'IQD';
    const logoFile = document.getElementById('settingLogo')?.files[0];

    const newSettings = {
        instituteName: instituteName,
        phone: phone,
        email: email,
        currency: currency,
        logo: settingsData ? settingsData.logo : null
    };

    let btn, originalText;
    if (showLoading) {
        btn = document.querySelector('#settingsForm button');
        if (btn) {
            originalText = btn.innerHTML;
            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> جاري الحفظ...";
        }
    }

    const finalizeSave = async () => {
        try {
            const res = await fetch('api.php?endpoint=update/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newSettings) });
            const result = await res.json();

            if (result.success) {
                settingsData = newSettings;
                applyGlobalSettings();
                if (showLoading && btn) btn.innerHTML = originalText;
                if (showLoading) alert("تم حفظ الإعدادات بنجاح!");
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error("Error saving settings:", err);
            if (showLoading && btn) btn.innerHTML = originalText;
            if (showLoading) alert("حدث خطأ أثناء الحفظ.");
        }
    };

    if (logoFile) {
        const reader = new FileReader();
        reader.onloadend = async function () {
            newSettings.logo = reader.result;
            await finalizeSave();
        }
        reader.readAsDataURL(logoFile);
    } else {
        await finalizeSave();
    }
}

// Auto-save when inputs change
const settingsInputs = document.querySelectorAll('#settingsForm .form-input, #settingsForm .form-select');
settingsInputs.forEach(input => {
    input.addEventListener('change', () => saveSettings(false));
});

// Keep submit listener just in case user clicks the button
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings(true);
});

// === عرض جدول المكتبة ===
function renderLibrary() {
    const tbody = document.getElementById("library-table-body");
    if (!tbody) return;
    if (libraryData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">لا توجد كتب مضافة في المكتبة</td></tr>';
        return;
    }
    tbody.innerHTML = libraryData.map(b => `
        <tr>
            <td style="font-weight: bold;">${b.title}</td>
            <td>${b.author || '-'}</td>
            <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${b.category || 'غير مصنف'}</span></td>
            <td><span class="status-badge status-active">${b.status}</span></td>
        </tr>
    `).join('');
}

// ==========================================
// General Data Persistence (Instructors, Courses, Accounting)
// ==========================================

// Add Accounting Record
document.getElementById('addAccountingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const receipt = document.getElementById('accReceipt').value;
    const student = document.getElementById('accStudent').value;
    const amount = document.getElementById('accAmount').value;
    const date = document.getElementById('accDate').value;
    const method = document.getElementById('accMethod').value;
    const statusVal = document.getElementById('accStatus').value;
    const notes = document.getElementById('accNotes').value;
    
    let statusText = statusVal === 'active' ? 'مدفوع' : (statusVal === 'pending' ? 'مدفوع جزئي' : 'ملغى');
    const newRecord = {
        id: 'Acc-' + Date.now(),
        receipt,
        student,
        amount,
        date,
        method,
        notes,
        status: statusText,
        statusCode: statusVal
    };

    try {
        const res = await fetch('api.php?endpoint=update/accounting', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify([newRecord]) });
        const result = await res.json();

        if (result.success) {
            await loadDataFromDB();
            closeModal('add-accounting-modal');
            document.getElementById('addAccountingForm').reset();
            alert('تم إضافة السجل المالي بنجاح!');
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        console.error("Error adding accounting:", err);
        alert('تعذر الحفظ.');
    }
});

// ==========================================
// Database Management (Export / Import)
// ==========================================
async function exportDatabase() {
    try {
        const data = {
            settings: settingsData,
            roles: rolesData,
            subjects: subjectsData,
            instructors: instructorsData,
            courses: coursesData,
            students: studentsData,
            recentStudents: recentStudentsData,
            accounting: accountingData,
            notifications: notificationsData,
            attendance: attendanceData,
            schedule: scheduleData,
            grades: gradesData,
            library: libraryData
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/\//g, '-');
        a.href = objectUrl;
        a.download = `panda_backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (e) {
        alert("تعذر التصدير: " + e.message);
    }
}

function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData) {
                if (confirm("تحذير: استعادة النسخة الاحتياطية ستقوم بمسح جميع البيانات الحالية واستبدالها بالبيانات الموجودة في الملف. هل أنت متأكد من الاستمرار؟")) {
                    const response = await fetch('api.php?endpoint=import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(importedData)
                    });
                    const result = await response.json();
                    
                    if(result.success) {
                        alert("تم استعادة قاعدة البيانات بنجاح! سيتم إعادة تحميل النظام لتطبيق التغييرات.");
                        window.location.reload();
                    } else {
                        throw new Error(result.message);
                    }
                }
            } else {
                alert("ملف قاعدة البيانات غير صالح.");
            }
        } catch (err) {
            alert("خطأ في قراءة أو استيراد الملف: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ==========================================
// Certificate Issuance Logic
// ==========================================
function populateCertificateForm() {
    const certStudent = document.getElementById('certStudent');
    const certCourse = document.getElementById('certCourse');

    if (certStudent) {
        let options = '<option value="">-- اختر الطالب --</option>';
        studentsData.slice(0, 200).forEach(s => {
            options += `<option value="${s.id}">${s.name}</option>`;
        });
        certStudent.innerHTML = options;
    }

    if (certCourse) {
        let options = '<option value="">-- اختر الدورة --</option>';
        const uniqueCourses = [...new Set(studentsData.map(s => s.course).filter(Boolean))];
        
        coursesData.forEach(c => {
            if (!uniqueCourses.includes(c.title)) uniqueCourses.push(c.title);
        });

        uniqueCourses.forEach(c => {
            options += `<option value="${c}">${c}</option>`;
        });
        certCourse.innerHTML = options;
    }
    
    // Set default date
    const certDate = document.getElementById('certDate');
    if (certDate && !certDate.value) {
        const today = new Date();
        certDate.value = today.toISOString().split('T')[0];
    }

    // Generate automatic serial if empty
    const certSerialInput = document.getElementById('certSerial');
    if (certSerialInput && !certSerialInput.value) {
        const currentYear = new Date().getFullYear();
        // Generate a pseudo-sequential 3-digit number for the serial (e.g., PND-2024-456)
        certSerialInput.value = `PND-${currentYear}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    }
    updateCertPreview();
}

function updateCertPreview() {
    const studentId = document.getElementById('certStudent')?.value;
    const course = document.getElementById('certCourse')?.value;
    const grade = document.getElementById('certGrade')?.value || 'ممتاز';
    const date = document.getElementById('certDate')?.value;
    const serial = document.getElementById('certSerial')?.value || 'PND-000';

    let studentName = "اسم الطالب";
    if (studentId) {
        const student = studentsData.find(s => s.id === studentId);
        if (student) studentName = student.name;
    }

    const nameEl = document.getElementById('cert-preview-name');
    const courseEl = document.getElementById('cert-preview-course');
    const gradeEl = document.getElementById('cert-preview-grade');
    const serialEl = document.getElementById('cert-preview-serial');
    const dateEl = document.getElementById('cert-preview-date');
    const instEl = document.getElementById('cert-preview-institute');
    const contactEl = document.getElementById('cert-preview-contact');

    if (nameEl) nameEl.textContent = studentName;
    if (courseEl) courseEl.textContent = course || "اسم الدورة التدريبية";
    if (gradeEl) gradeEl.textContent = grade;
    if (serialEl) serialEl.textContent = serial;
    
    if (dateEl && date) {
        dateEl.textContent = new Date(date).toLocaleDateString('ar-EG');
    }

    if (instEl) {
        instEl.textContent = settingsData.instituteName || "مركز الباندا";
    }
    if (contactEl) {
        const phone = settingsData.phone || "07700000000";
        const email = settingsData.email || "info@panda.com";
        contactEl.textContent = `هاتف: ${phone} | بريد: ${email}`;
    }
}

function printCertificate() {
    const studentId = document.getElementById('certStudent')?.value;
    const course = document.getElementById('certCourse')?.value;
    const grade = document.getElementById('certGrade')?.value || 'ممتاز';
    const date = document.getElementById('certDate')?.value;
    const serial = document.getElementById('certSerial')?.value || 'PND-000';

    if (!studentId || !course) {
        alert("يرجى اختيار الطالب والدورة قبل الطباعة.");
        return;
    }

    let studentName = "اسم الطالب";
    const student = studentsData.find(s => s.id === studentId);
    if (student) studentName = student.name;

    const instituteName = settingsData.instituteName || "المركز الباندا";
    const phone = settingsData.phone || "07801986408";
    const email = settingsData.email || "alpanda.smw@gmail.com";
    const logoSrc = settingsData.logo || "";
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الشهادة.");
        return;
    }

    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    const certContent = `
        <div class="certificate-wrapper">
            <div class="cert-outer-border">
                <div class="cert-inner-border">
                    <div class="corner corner-tl"></div>
                    <div class="corner corner-tr"></div>
                    <div class="corner corner-bl"></div>
                    <div class="corner corner-br"></div>

                    <div class="cert-header">
                        <div class="header-left">
                            ${logoSrc ? '<img src="' + logoSrc + '" class="cert-logo" alt="Logo">' : '<div class="logo-placeholder">شعار المركز</div>'}
                        </div>
                        <div class="header-center">
                            <h1 class="institute-name">${instituteName}</h1>
                            <h2 class="cert-title">شهادة إتمام دورة التدريبية</h2>
                            <div class="cert-subtitle">Certificate of Completion</div>
                        </div>
                        <div class="header-right">
                            <div class="cert-meta-top">
                                <div><strong>رقم الإصدار:</strong> <span dir="ltr">${serial}</span></div>
                                <div><strong>تاريخ الإصدار:</strong> ${date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="cert-body">
                        <p class="cert-text">يشهد المركز بأن المتدرب(ة) / This is to certify that</p>
                        <div class="cert-name">${studentName}</div>
                        <p class="cert-text">قد اجتاز(ت) بنجاح الدورة التدريبية / has successfully completed the training course</p>
                        <div class="cert-course">${course}</div>
                        <p class="cert-text" style="margin-top: 15px;">بتقدير عام / with grade: <strong class="cert-grade">${grade}</strong></p>
                    </div>

                    <div class="cert-footer">
                        <div class="footer-block">
                            <div class="contact-info">
                                هاتف: <span dir="ltr">${phone}</span><br>
                                بريد: <span dir="ltr">${email}</span>
                            </div>
                        </div>
                        <div class="footer-block stamp-block">
                            <div class="stamp-circle">
                                <div class="stamp-inner">ختم<br>المركز</div>
                            </div>
                        </div>
                        <div class="footer-block sig-block">
                            <div class="sig-line"></div>
                            <div class="sig-text">توقيع الإدارة<br>Authorized Signature</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة الشهادة</title>
            <base href="${baseUrl}">
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #1e3a8a;
                    --gold: #b8860b;
                    --gold-light: #d4af37;
                    --text: #1f2937;
                }
                * {
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                @page {
                    size: A4 landscape;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #fff;
                    font-family: 'Public Sans', 'Tajawal', sans-serif;
                }
                .certificate-wrapper {
                    width: 100vw;
                    height: 100vh;
                    padding: 40px;
                    box-sizing: border-box;
                    background: #fff;
                }
                .cert-outer-border {
                    border: 4px solid var(--primary);
                    padding: 6px;
                    height: 100%;
                    box-sizing: border-box;
                }
                .cert-inner-border {
                    border: 1px solid var(--gold-light);
                    height: 100%;
                    box-sizing: border-box;
                    position: relative;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(135deg, rgba(243,244,246,0.4) 0%, rgba(255,255,255,1) 50%, rgba(243,244,246,0.4) 100%);
                }
                
                /* Corners */
                .corner { position: absolute; width: 40px; height: 40px; border: 3px solid var(--gold); }
                .corner-tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
                .corner-tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
                .corner-bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
                .corner-br { bottom: 10px; right: 10px; border-left: none; border-top: none; }

                /* Header */
                .cert-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                .header-left, .header-right { width: 25%; }
                .header-center { width: 50%; text-align: center; }
                
                .cert-logo { max-height: 80px; max-width: 150px; object-fit: contain; }
                .logo-placeholder { width: 80px; height: 80px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #999; margin: 0 auto; }
                
                .institute-name { font-family: 'Amiri', serif; font-size: 26px; color: var(--gold); margin: 0 0 5px; }
                .cert-title {
                    margin: 0;
                    font-size: 28px;
                    color: var(--primary);
                    font-weight: 800;
                    font-family: 'Cairo', sans-serif;
                }
                .cert-subtitle {
                    font-size: 14px;
                    color: #6b7280;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-top: 5px;
                }
                
                .cert-meta-top { font-size: 13px; color: var(--text); line-height: 1.8; text-align: left; }
                
                /* Body */
                .cert-body {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                .cert-text {
                    font-size: 18px;
                    color: #4b5563;
                    margin: 10px 0;
                }
                .cert-name {
                    font-size: 42px;
                    font-weight: 800;
                    color: var(--primary);
                    font-family: 'Amiri', serif;
                    border-bottom: 2px solid var(--gold);
                    padding: 0 40px 10px;
                    margin: 10px 0 20px;
                    min-width: 60%;
                }
                .cert-course {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text);
                    margin: 5px 0;
                    padding: 10px 30px;
                    background: rgba(30, 58, 138, 0.05);
                    border-radius: 50px;
                    border: 1px solid rgba(30, 58, 138, 0.1);
                }
                .cert-grade { color: var(--gold); font-size: 24px; margin: 0 5px; }

                /* Footer */
                .cert-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 20px;
                    padding: 0 20px;
                }
                .footer-block { width: 30%; }
                .contact-info { font-size: 12px; color: #6b7280; line-height: 1.6; text-align: right; }
                
                .stamp-block { display: flex; justify-content: center; align-items: center; }
                .stamp-circle {
                    width: 100px;
                    height: 100px;
                    border: 3px solid rgba(184, 134, 11, 0.5);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-shadow: 0 0 15px rgba(184, 134, 11, 0.1);
                }
                .stamp-inner {
                    width: 84px;
                    height: 84px;
                    border: 1px dashed rgba(184, 134, 11, 0.8);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    color: rgba(184, 134, 11, 0.8);
                    font-weight: 800;
                    font-size: 16px;
                    transform: rotate(-10deg);
                }
                
                .sig-block { text-align: center; }
                .sig-line { width: 80%; margin: 0 auto 10px; border-bottom: 2px solid var(--text); }
                .sig-text { font-size: 14px; color: var(--text); line-height: 1.4; }
            </style>
        </head>
        <body>
            ${certContent}
            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Hook into navigation clicks to refresh certificate form
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-links a');
        if (link && link.getAttribute('data-target') === 'certificates') {
            setTimeout(populateCertificateForm, 100);
        }
    });
});
