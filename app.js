/* ==========================================================================
   EDUSPHERE CORE CLIENT ENGINE (SPA Router, REST Client & Storage Sync)
   ========================================================================== */

// --- Global Application State ---
let state = {
    courses: [],
    enrolledCourses: {}, // Format: { "course-id": { courseId, enrolledAt, progressPct, completedLessons: [] } }
    currentUser: {
        username: "Guest",
        fullname: "Guest Explorer",
        role: "Student",
        xp: 150
    },
    activeView: "dashboard",
    activeCourseId: null,
    activeLessonId: null
};

const BACKEND_URL = "/api/courses";

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadLocalSettings();
    initializeEventListeners();
    fetchCourses();
});

// --- Local Storage Syncing ---
function loadLocalSettings() {
    const savedUser = localStorage.getItem("edusphere_user");
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
    }
    
    const savedEnrolls = localStorage.getItem(`edusphere_enrolls_${state.currentUser.username}`);
    if (savedEnrolls) {
        state.enrolledCourses = JSON.parse(savedEnrolls);
    } else {
        state.enrolledCourses = {};
    }
    
    updateHeaderProfileUI();
}

function saveLocalSettings() {
    localStorage.setItem("edusphere_user", JSON.stringify(state.currentUser));
    localStorage.setItem(`edusphere_enrolls_${state.currentUser.username}`, JSON.stringify(state.enrolledCourses));
}

// --- Event Listeners Hooking ---
function initializeEventListeners() {
    // Sidebar navigation clicks
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            navigateToView(view);
        });
    });

    // Profile Click to Auth Modal
    document.getElementById("sidebar-profile-btn").addEventListener("click", () => {
        openAuthModal();
    });
    
    document.getElementById("auth-btn").addEventListener("click", () => {
        openAuthModal();
    });
    
    document.getElementById("auth-modal-close").addEventListener("click", () => {
        closeModal("modal-auth");
    });

    document.getElementById("cert-modal-close").addEventListener("click", () => {
        closeModal("modal-certificate");
    });
    
    document.getElementById("btn-close-cert-modal").addEventListener("click", () => {
        closeModal("modal-certificate");
    });

    // Search Bar Input listener
    document.getElementById("search-input").addEventListener("input", (e) => {
        handleSearch(e.target.value);
    });

    // Banner CTA Click
    document.getElementById("banner-action-btn").addEventListener("click", () => {
        navigateToView("catalog");
    });

    // Category pills filter triggers
    document.querySelectorAll(".filter-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            filterCatalog(pill.getAttribute("data-category"));
        });
    });

    // Back Buttons
    document.getElementById("detail-back-btn").addEventListener("click", () => {
        navigateToView("catalog");
    });

    document.getElementById("player-back-btn").addEventListener("click", () => {
        navigateToCourseDetails(state.activeCourseId);
    });

    // Lesson player check action
    document.getElementById("btn-toggle-lesson-status").addEventListener("click", () => {
        toggleActiveLessonCompletion();
    });

    // Authentication Forms
    document.getElementById("auth-form").addEventListener("submit", handleAuthSubmit);
    document.getElementById("btn-switch-auth").addEventListener("click", toggleAuthMode);
    
    // Auth Log out button check
    document.getElementById("auth-action-icon").addEventListener("click", (e) => {
        e.stopPropagation();
        if (state.currentUser.username !== "Guest") {
            handleLogout();
        } else {
            openAuthModal();
        }
    });

    // Admin Suite Triggers
    document.getElementById("admin-add-btn").addEventListener("click", () => {
        openAdminForm();
    });
    
    document.getElementById("btn-cancel-admin-form").addEventListener("click", () => {
        closeAdminForm();
    });
    
    document.getElementById("btn-add-lesson-input").addEventListener("click", () => {
        addLessonInputRow("", "", "");
    });
    
    document.getElementById("tab-admin-list").addEventListener("click", () => {
        closeAdminForm();
    });

    // Certificate Click inside Syllabus Details Page
    document.getElementById("detail-cert-btn").addEventListener("click", () => {
        triggerCertificateModal(state.activeCourseId);
    });
}

// --- REST API Server Syncing ---
async function fetchCourses() {
    try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error("HTTP error fetching courses");
        state.courses = await response.ok ? await response.json() : getFallbackCourses();
        
        renderCatalog();
        renderDashboard();
        renderMyCourses();
        renderAdminCatalog();
    } catch (error) {
        console.error("Could not sync with Spring Boot backend API. Using local pre-loads.", error);
        showToast("Backend Server Offline. Running in client-side persistence mode.", "error");
        state.courses = getFallbackCourses();
        
        renderCatalog();
        renderDashboard();
        renderMyCourses();
        renderAdminCatalog();
    }
}

// --- SPA Router Engine ---
function navigateToView(viewName) {
    state.activeView = viewName;
    
    // Toggle active sidebar highlight
    document.querySelectorAll(".nav-item").forEach(item => {
        if (item.getAttribute("data-view") === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Hide all view elements, show requested
    document.querySelectorAll(".content-view").forEach(view => {
        view.classList.remove("active");
        setTimeout(() => {
            if (view.id === `view-${viewName}`) {
                view.classList.add("active");
            }
        }, 50);
    });

    // Sync views data refreshes
    if (viewName === "dashboard") {
        renderDashboard();
    } else if (viewName === "catalog") {
        renderCatalog();
    } else if (viewName === "my-courses") {
        renderMyCourses();
    } else if (viewName === "admin") {
        renderAdminCatalog();
    }
}

// --- View: Dashboard Renderer ---
function renderDashboard() {
    document.getElementById("banner-username").innerText = state.currentUser.fullname;
    
    const enrolledArray = Object.values(state.enrolledCourses);
    const completedCount = enrolledArray.filter(c => c.progressPct === 100).length;
    
    // Calc average progress
    let avgProgress = 0;
    if (enrolledArray.length > 0) {
        const sum = enrolledArray.reduce((acc, curr) => acc + curr.progressPct, 0);
        avgProgress = Math.round(sum / enrolledArray.length);
    }
    
    // Update Stat Cards
    document.getElementById("stat-enrolled").innerText = enrolledArray.length;
    document.getElementById("stat-completed").innerText = completedCount;
    document.getElementById("stat-progress").innerText = `${avgProgress}%`;
    document.getElementById("stat-certificates").innerText = completedCount;
    
    // In-Progress Grid
    const progressList = document.getElementById("dashboard-in-progress");
    progressList.innerHTML = "";
    
    const inProgressEnrolls = enrolledArray.filter(e => e.progressPct < 100);
    
    if (inProgressEnrolls.length === 0) {
        progressList.innerHTML = `
            <div class="no-courses-placeholder">
                <i class="fa-solid fa-folder-open"></i>
                <p>No active courses currently in progress.</p>
                <button class="btn btn-secondary btn-sm" onclick="navigateToView('catalog')">Find a Course</button>
            </div>
        `;
        return;
    }
    
    inProgressEnrolls.forEach(enroll => {
        const course = state.courses.find(c => c.id === enroll.courseId);
        if (course) {
            progressList.appendChild(createCourseProgressCard(course, enroll));
        }
    });
}

// --- View: Catalog Renderer ---
function renderCatalog(coursesToShow = state.courses) {
    const list = document.getElementById("catalog-list");
    list.innerHTML = "";
    
    if (coursesToShow.length === 0) {
        list.innerHTML = `
            <div class="no-courses-placeholder">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No courses found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    coursesToShow.forEach(course => {
        list.appendChild(createCatalogCard(course));
    });
}

function filterCatalog(category) {
    if (category === "All") {
        renderCatalog();
    } else {
        const filtered = state.courses.filter(c => c.category === category);
        renderCatalog(filtered);
    }
}

function handleSearch(query) {
    if (!query || query.trim() === "") {
        renderCatalog();
        return;
    }
    const q = query.toLowerCase();
    const filtered = state.courses.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q)
    );
    navigateToView("catalog");
    renderCatalog(filtered);
}

// --- View: My Courses Renderer ---
function renderMyCourses() {
    const list = document.getElementById("my-courses-list");
    list.innerHTML = "";
    
    const enrolls = Object.values(state.enrolledCourses);
    
    // Check tabs
    const activeTab = document.querySelector(".my-courses-header-tabs .tab-pill.active").getAttribute("data-tab");
    
    let filteredEnrolls = enrolls;
    if (activeTab === "completed") {
        filteredEnrolls = enrolls.filter(e => e.progressPct === 100);
    }
    
    if (filteredEnrolls.length === 0) {
        list.innerHTML = `
            <div class="no-courses-placeholder">
                <i class="fa-solid fa-graduation-cap"></i>
                <p>${activeTab === "completed" ? "You haven't completed any courses yet." : "You are not enrolled in any pathways."}</p>
                <button class="btn btn-secondary btn-sm" onclick="navigateToView('catalog')">Find a Course</button>
            </div>
        `;
        return;
    }
    
    filteredEnrolls.forEach(enroll => {
        const course = state.courses.find(c => c.id === enroll.courseId);
        if (course) {
            list.appendChild(createCourseProgressCard(course, enroll));
        }
    });
    
    // Bind Tab Pillar Clicks
    document.querySelectorAll(".my-courses-header-tabs .tab-pill").forEach(pill => {
        pill.replaceWith(pill.cloneNode(true)); // remove old listeners
    });
    
    document.querySelectorAll(".my-courses-header-tabs .tab-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            document.querySelectorAll(".my-courses-header-tabs .tab-pill").forEach(t => t.classList.remove("active"));
            pill.classList.add("active");
            renderMyCourses();
        });
    });
}

// --- Card Creators ---
function createCatalogCard(course) {
    const isEnrolled = !!state.enrolledCourses[course.id];
    const enrollRecord = state.enrolledCourses[course.id];
    
    const card = document.createElement("div");
    card.className = `course-card ${isEnrolled ? 'enrolled' : ''}`;
    
    // Choose dynamic UI icons
    let categoryIcon = "fa-code";
    if (course.category.includes("Design")) categoryIcon = "fa-palette";
    else if (course.category.includes("Data")) categoryIcon = "fa-brain";

    card.innerHTML = `
        <div class="course-card-header">
            <span class="category-badge">${course.category}</span>
            <div class="course-card-icon"><i class="fa-solid ${categoryIcon}"></i></div>
        </div>
        <div class="course-card-body">
            <h3 class="course-card-title">${course.title}</h3>
            <p class="course-card-desc">${course.description}</p>
            <div class="course-card-meta">
                <span><i class="fa-regular fa-clock"></i> ${course.duration}</span>
                <span><i class="fa-solid fa-chart-simple"></i> ${course.level}</span>
            </div>
            ${isEnrolled ? `
                <div class="course-progress-container">
                    <div class="progress-info">
                        <span>Progress</span>
                        <span>${enrollRecord.progressPct}%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${enrollRecord.progressPct}%"></div>
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="course-card-actions">
            <button class="btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'} btn-block" onclick="navigateToCourseDetails('${course.id}')">
                ${isEnrolled ? '<i class="fa-solid fa-book-open"></i> Resume Study' : 'View Syllabus'}
            </button>
        </div>
    `;
    return card;
}

function createCourseProgressCard(course, enroll) {
    const isCompleted = enroll.progressPct === 100;
    const card = document.createElement("div");
    card.className = `course-card enrolled ${isCompleted ? 'completed' : ''}`;
    
    let categoryIcon = "fa-code";
    if (course.category.includes("Design")) categoryIcon = "fa-palette";
    else if (course.category.includes("Data")) categoryIcon = "fa-brain";

    card.innerHTML = `
        <div class="course-card-header">
            <span class="category-badge">${course.category}</span>
            <div class="course-card-icon"><i class="fa-solid ${categoryIcon}"></i></div>
        </div>
        <div class="course-card-body">
            <h3 class="course-card-title">${course.title}</h3>
            <p class="course-card-desc">${course.description}</p>
            
            <div class="course-progress-container">
                <div class="progress-info">
                    <span>${isCompleted ? 'Finished 🎉' : 'Progress'}</span>
                    <span>${enroll.progressPct}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${enroll.progressPct}%"></div>
                </div>
            </div>
        </div>
        <div class="course-card-actions" style="display:flex; gap:10px;">
            <button class="btn btn-secondary" style="flex-grow:1;" onclick="navigateToCourseDetails('${course.id}')">
                <i class="fa-solid fa-list-check"></i> Syllabus
            </button>
            ${isCompleted ? `
                <button class="btn btn-success" onclick="triggerCertificateModal('${course.id}')" title="Claim Certificate">
                    <i class="fa-solid fa-award"></i> Certificate
                </button>
            ` : `
                <button class="btn btn-primary" onclick="launchLessonPlayer('${course.id}')" title="Play Lectures">
                    <i class="fa-solid fa-circle-play"></i> Play
                </button>
            `}
        </div>
    `;
    return card;
}

// --- View: Course Details Router ---
function navigateToCourseDetails(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    
    state.activeCourseId = courseId;
    navigateToView("detail");
    
    const isEnrolled = !!state.enrolledCourses[courseId];
    const enroll = state.enrolledCourses[courseId];
    
    // Render Hero Panel
    const hero = document.getElementById("detail-hero");
    hero.innerHTML = `
        <div class="hero-info">
            <div class="hero-meta">
                <span class="hero-badge">${course.category}</span>
                <span class="hero-badge badge-accent">${course.level}</span>
            </div>
            <h1 class="hero-title">${course.title}</h1>
            <p class="hero-desc">${course.description}</p>
            <div class="hero-actions">
                ${isEnrolled ? `
                    <button class="btn btn-success btn-banner" onclick="launchLessonPlayer('${course.id}')">
                        <i class="fa-solid fa-play"></i> Resume Classroom
                    </button>
                ` : `
                    <button class="btn btn-primary btn-banner" onclick="enrollInCourse('${course.id}')">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Enroll Now
                    </button>
                `}
            </div>
        </div>
        <div class="banner-graphic">
            <i class="fa-solid fa-graduation-cap"></i>
        </div>
    `;
    
    // Fill Features Table
    document.getElementById("detail-duration").innerText = course.duration;
    document.getElementById("detail-level").innerText = course.level;
    document.getElementById("detail-category").innerText = course.category;
    document.getElementById("detail-lessons-count").innerText = course.lessons.length;
    
    // Render Syllabus items
    const syllabusList = document.getElementById("detail-lessons-list");
    syllabusList.innerHTML = "";
    
    course.lessons.forEach((lesson, index) => {
        const item = document.createElement("div");
        item.className = `lesson-item ${isEnrolled ? 'clickable' : ''}`;
        
        let statusHtml = '<i class="fa-solid fa-lock"></i> Locked';
        if (isEnrolled) {
            const isDone = enroll.completedLessons.includes(lesson.id);
            statusHtml = isDone 
                ? '<span class="lesson-status completed"><i class="fa-solid fa-circle-check"></i> Finished</span>' 
                : '<span class="lesson-status"><i class="fa-regular fa-circle-play"></i> Enrolled</span>';
            
            item.addEventListener("click", () => {
                launchLessonPlayer(courseId, lesson.id);
            });
        }
        
        item.innerHTML = `
            <div class="lesson-item-left">
                <div class="lesson-number">${index + 1}</div>
                <span class="lesson-title">${lesson.title}</span>
            </div>
            <div class="lesson-status">${statusHtml}</div>
        `;
        syllabusList.appendChild(item);
    });
    
    // Show certificate badge if 100% complete
    const certCard = document.getElementById("detail-cert-card");
    if (isEnrolled && enroll.progressPct === 100) {
        certCard.classList.remove("hidden");
    } else {
        certCard.classList.add("hidden");
    }
}

// --- View: Lesson Player Engine ---
function launchLessonPlayer(courseId, lessonId = null) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    
    const enroll = state.enrolledCourses[courseId];
    if (!enroll) {
        enrollInCourse(courseId);
    }
    
    state.activeCourseId = courseId;
    navigateToView("player");
    
    // Set first lesson as default if none specified
    if (!lessonId && course.lessons.length > 0) {
        lessonId = course.lessons[0].id;
    }
    
    state.activeLessonId = lessonId;
    
    // Render Course headers
    document.getElementById("player-course-title").innerText = course.title;
    
    // Re-draw right syllabus list
    renderPlayerLessonsNav(course, enroll);
    
    // Render targeted lesson content
    loadLessonInPlayer(course, lessonId);
}

function renderPlayerLessonsNav(course, enroll) {
    const container = document.getElementById("player-lessons-list");
    container.innerHTML = "";
    
    course.lessons.forEach((l, index) => {
        const isDone = enroll.completedLessons.includes(l.id);
        const isActive = l.id === state.activeLessonId;
        
        const row = document.createElement("div");
        row.className = `player-lesson-row ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`;
        row.innerHTML = `
            <i class="fa-solid ${isDone ? 'fa-square-check' : 'fa-regular fa-square'}"></i>
            <span>${index + 1}. ${l.title}</span>
        `;
        
        row.addEventListener("click", () => {
            launchLessonPlayer(course.id, l.id);
        });
        
        container.appendChild(row);
    });
    
    // Sync progress stats
    document.getElementById("player-progress-pct").innerText = `${enroll.progressPct}%`;
    document.getElementById("player-progress-fill").style.width = `${enroll.progressPct}%`;
}

function loadLessonInPlayer(course, lessonId) {
    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    document.getElementById("player-lesson-title").innerText = lesson.title;
    
    // Set Video streaming
    const video = document.getElementById("lesson-video");
    const source = document.getElementById("video-source");
    source.src = lesson.videoUrl;
    video.load();
    
    // Load text transcripts
    document.getElementById("lesson-text-content").innerHTML = `
        <p style="margin-bottom:16px;">${lesson.content}</p>
        <div style="background:var(--bg-input); border:1px solid var(--glass-border); border-radius:10px; padding:16px; margin-top:20px;">
            <h5 style="color:var(--accent-secondary); margin-bottom:8px; font-weight:700;"><i class="fa-regular fa-lightbulb"></i> Self-paced Lab Challenge</h5>
            <p style="font-size:0.85rem; line-height:1.5;">To lock in this concept, try to draft a brief local prototype modeling the concept discussed in the transcript above. When you feel comfortable, click the checkbox below to update your average course progress!</p>
        </div>
    `;
    
    // Update Button state
    const enroll = state.enrolledCourses[course.id];
    const isDone = enroll.completedLessons.includes(lessonId);
    
    const btn = document.getElementById("btn-toggle-lesson-status");
    const btnText = document.getElementById("btn-toggle-text");
    
    if (isDone) {
        btn.className = "btn btn-secondary btn-block";
        btnText.innerText = "Completed (Click to undo)";
        btn.querySelector("i").className = "fa-solid fa-rotate-left";
    } else {
        btn.className = "btn btn-success btn-block";
        btnText.innerText = "Mark Completed";
        btn.querySelector("i").className = "fa-solid fa-square-check";
    }
}

// --- Action: Enroll ---
function enrollInCourse(courseId) {
    if (state.enrolledCourses[courseId]) return;
    
    state.enrolledCourses[courseId] = {
        courseId: courseId,
        enrolledAt: new Date().toLocaleDateString(),
        progressPct: 0,
        completedLessons: []
    };
    
    saveLocalSettings();
    showToast("Successfully enrolled! Welcome to the classroom.", "success");
    
    // Trigger dynamic sidebar stat updates
    state.currentUser.xp += 50; // enrollment bonus
    document.getElementById("user-xp").innerText = `${state.currentUser.xp} XP`;
    saveLocalSettings();
    
    navigateToCourseDetails(courseId);
}

// --- Action: Toggle Lesson Checkbox ---
function toggleActiveLessonCompletion() {
    const courseId = state.activeCourseId;
    const lessonId = state.activeLessonId;
    
    const course = state.courses.find(c => c.id === courseId);
    const enroll = state.enrolledCourses[courseId];
    if (!course || !enroll) return;
    
    const index = enroll.completedLessons.indexOf(lessonId);
    let doneNow = false;
    
    if (index > -1) {
        // Undo completion
        enroll.completedLessons.splice(index, 1);
        showToast("Lesson progress unmarked.", "info");
    } else {
        // Mark done
        enroll.completedLessons.push(lessonId);
        doneNow = true;
        state.currentUser.xp += 100; // Lesson finish reward
        document.getElementById("user-xp").innerText = `${state.currentUser.xp} XP`;
        showToast("Great work! Lesson completed +100 XP", "success");
    }
    
    // Recalc percentage
    const total = course.lessons.length;
    const done = enroll.completedLessons.length;
    enroll.progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    // Check if course 100% complete
    if (enroll.progressPct === 100 && doneNow) {
        state.currentUser.xp += 500; // Big bonus
        document.getElementById("user-xp").innerText = `${state.currentUser.xp} XP`;
        showToast("Congratulations! You've finished this pathway! 🏆 +500 XP", "success");
        setTimeout(() => {
            triggerCertificateModal(courseId);
        }, 1000);
    }
    
    saveLocalSettings();
    
    // Reload player views
    renderPlayerLessonsNav(course, enroll);
    loadLessonInPlayer(course, lessonId);
}

// --- Modal Controls ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// --- Certificate Engine ---
function triggerCertificateModal(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    
    document.getElementById("cert-user-name").innerText = state.currentUser.fullname;
    document.getElementById("cert-course-title").innerText = course.title;
    document.getElementById("cert-date").innerText = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    openModal("modal-certificate");
}

// --- Mock Authentication Handlers ---
let authMode = "login"; // "login" or "signup"

function openAuthModal() {
    openModal("modal-auth");
}

function toggleAuthMode() {
    const title = document.getElementById("auth-modal-title");
    const submitBtn = document.getElementById("btn-auth-submit");
    const nameGroup = document.getElementById("group-fullname");
    const switchPrompt = document.getElementById("auth-switch-prompt");
    
    if (authMode === "login") {
        authMode = "signup";
        title.innerText = "Create EduSphere Account";
        submitBtn.innerText = "Register Now";
        nameGroup.style.display = "flex";
        switchPrompt.innerHTML = 'Already have an account? <span id="btn-switch-auth">Sign In</span>';
    } else {
        authMode = "login";
        title.innerText = "Sign in to EduSphere";
        submitBtn.innerText = "Sign In";
        nameGroup.style.display = "none";
        switchPrompt.innerHTML = 'Don\'t have an account? <span id="btn-switch-auth">Sign Up</span>';
    }
    
    document.getElementById("btn-switch-auth").addEventListener("click", toggleAuthMode);
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById("auth-username").value.trim();
    const fullnameInput = document.getElementById("auth-fullname").value.trim();
    
    if (!username) return;
    
    if (authMode === "signup") {
        state.currentUser.username = username;
        state.currentUser.fullname = fullnameInput || username;
        state.currentUser.xp = 200; // fresh register bonus
        showToast("Registration successful! Welcome aboard.", "success");
    } else {
        state.currentUser.username = username;
        state.currentUser.fullname = username.charAt(0).toUpperCase() + username.slice(1);
        showToast(`Welcome back, ${state.currentUser.fullname}!`, "success");
    }
    
    // Sync Enrolled Courses for this specific user
    const savedEnrolls = localStorage.getItem(`edusphere_enrolls_${state.currentUser.username}`);
    if (savedEnrolls) {
        state.enrolledCourses = JSON.parse(savedEnrolls);
    } else {
        state.enrolledCourses = {};
    }
    
    saveLocalSettings();
    updateHeaderProfileUI();
    closeModal("modal-auth");
    navigateToView("dashboard");
}

function handleLogout() {
    state.currentUser = {
        username: "Guest",
        fullname: "Guest Explorer",
        role: "Student",
        xp: 150
    };
    state.enrolledCourses = {};
    saveLocalSettings();
    updateHeaderProfileUI();
    showToast("Signed out successfully.", "info");
    navigateToView("dashboard");
}

function updateHeaderProfileUI() {
    document.getElementById("sidebar-username").innerText = state.currentUser.fullname;
    document.getElementById("banner-username").innerText = state.currentUser.fullname;
    document.getElementById("user-xp").innerText = `${state.currentUser.xp} XP`;
    
    const authBtn = document.getElementById("auth-btn");
    const authBtnText = document.getElementById("auth-btn-text");
    const authIcon = document.getElementById("auth-action-icon");
    const avatar = document.getElementById("sidebar-avatar");
    
    avatar.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${state.currentUser.fullname}`;

    if (state.currentUser.username === "Guest") {
        authBtnText.innerText = "Sign In";
        authIcon.className = "fa-solid fa-right-to-bracket profile-logout";
        authIcon.title = "Sign In";
    } else {
        authBtnText.innerText = "Profile";
        authIcon.className = "fa-solid fa-right-from-bracket profile-logout";
        authIcon.title = "Sign Out";
    }
}

// --- View: Admin Dashboard Renderers ---
function renderAdminCatalog() {
    const tbody = document.getElementById("admin-courses-table");
    tbody.innerHTML = "";
    
    state.courses.forEach(course => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="admin-course-info">
                    <span class="admin-title">${course.title}</span>
                    <span class="admin-id">ID: ${course.id}</span>
                </div>
            </td>
            <td><span class="category-badge">${course.category}</span></td>
            <td>${course.duration}</td>
            <td>${course.level}</td>
            <td><strong>${course.lessons.length}</strong> modules</td>
            <td class="align-right">
                <div class="admin-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editCourseInForm('${course.id}')" title="Edit Course"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCourseFromServer('${course.id}')" title="Delete Course"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAdminForm() {
    document.getElementById("admin-courses-section").classList.add("hidden");
    document.getElementById("admin-form-section").classList.remove("hidden");
    document.getElementById("tab-admin-form").style.display = "inline-block";
    document.getElementById("tab-admin-form").classList.add("active");
    document.getElementById("tab-admin-list").classList.remove("active");
    
    // Clear Form inputs
    document.getElementById("course-form").reset();
    document.getElementById("form-course-id").value = "";
    document.getElementById("form-action-title").innerText = "Create Dynamic Pathway";
    document.getElementById("lessons-inputs-container").innerHTML = "";
    
    // Pre-populate with 2 empty lesson forms
    addLessonInputRow("", "", "");
    addLessonInputRow("", "", "");
}

function closeAdminForm() {
    document.getElementById("admin-courses-section").classList.remove("hidden");
    document.getElementById("admin-form-section").classList.add("hidden");
    document.getElementById("tab-admin-form").style.display = "none";
    document.getElementById("tab-admin-list").classList.add("active");
}

function addLessonInputRow(title = "", video = "", content = "") {
    const container = document.getElementById("lessons-inputs-container");
    const count = container.children.length + 1;
    
    const div = document.createElement("div");
    div.className = "lesson-input-block";
    div.innerHTML = `
        <button type="button" class="btn-remove-lesson-input" onclick="this.parentElement.remove()" title="Delete Section"><i class="fa-solid fa-circle-minus"></i></button>
        <h5 style="margin-bottom:8px; color:var(--accent-primary); font-weight:700;">Module #${count}</h5>
        <div class="form-group" style="margin-bottom:12px;">
            <label>Module Title</label>
            <input type="text" class="lesson-input-title" required placeholder="e.g. Setting up the Dev Environment" value="${title}">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Streaming Video Target (URL)</label>
                <input type="url" class="lesson-input-video" placeholder="e.g. https://www.w3schools.com/html/movie.mp4" value="${video}">
            </div>
            <div class="form-group">
                <label>Lecture Transcripts & Resources</label>
                <textarea class="lesson-input-content" required rows="2" placeholder="Rich details regarding this module's objectives...">${content}</textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
}

// --- Admin: API Actions (CRUD) ---
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const courseId = document.getElementById("form-course-id").value;
    const title = document.getElementById("form-title").value.trim();
    const category = document.getElementById("form-category").value;
    const duration = document.getElementById("form-duration").value.trim();
    const level = document.getElementById("form-level").value;
    const description = document.getElementById("form-description").value.trim();
    
    // Construct lessons list
    const lessons = [];
    const container = document.getElementById("lessons-inputs-container");
    
    if (container.children.length === 0) {
        showToast("Curriculum must contain at least 1 module.", "error");
        return;
    }
    
    Array.from(container.children).forEach((block, index) => {
        const lTitle = block.querySelector(".lesson-input-title").value.trim();
        let lVideo = block.querySelector(".lesson-input-video").value.trim();
        const lContent = block.querySelector(".lesson-input-content").value.trim();
        
        if (!lVideo) lVideo = "https://www.w3schools.com/html/mov_bbb.mp4"; // default
        
        lessons.push({
            id: `l-dyn-${index + 1}`,
            title: lTitle,
            videoUrl: lVideo,
            content: lContent
        });
    });
    
    const payload = {
        title,
        category,
        duration,
        level,
        description,
        lessons
    };
    
    try {
        let response;
        if (courseId) {
            // PUT /api/courses/{id}
            payload.id = courseId;
            response = await fetch(`${BACKEND_URL}/${courseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            showToast("Course successfully updated!", "success");
        } else {
            // POST /api/courses
            response = await fetch(BACKEND_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            showToast("New dynamic pathway established!", "success");
        }
        
        if (!response.ok) throw new Error("Backend save failed");
        
        fetchCourses(); // refresh state
        closeAdminForm();
    } catch (err) {
        console.warn("Backend unsynced. Saving to local state.", err);
        // Save locally if backend offline
        if (courseId) {
            const index = state.courses.findIndex(c => c.id === courseId);
            if (index > -1) {
                payload.id = courseId;
                state.courses[index] = payload;
            }
            showToast("Local pathway updated successfully.", "success");
        } else {
            payload.id = `c-dyn-${Date.now()}`;
            state.courses.push(payload);
            showToast("Local dynamic pathway established.", "success");
        }
        
        renderCatalog();
        renderDashboard();
        renderMyCourses();
        renderAdminCatalog();
        closeAdminForm();
    }
}

function editCourseInForm(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    
    openAdminForm();
    document.getElementById("form-action-title").innerText = `Configure Pathway: ${course.title}`;
    document.getElementById("form-course-id").value = course.id;
    document.getElementById("form-title").value = course.title;
    document.getElementById("form-category").value = course.category;
    document.getElementById("form-duration").value = course.duration;
    document.getElementById("form-level").value = course.level;
    document.getElementById("form-description").value = course.description;
    
    const container = document.getElementById("lessons-inputs-container");
    container.innerHTML = ""; // clear preloaded empty rows
    
    course.lessons.forEach(l => {
        addLessonInputRow(l.title, l.videoUrl, l.content);
    });
}

async function deleteCourseFromServer(courseId) {
    if (!confirm("Are you sure you want to permanently delete this pathway?")) return;
    
    try {
        const response = await fetch(`${BACKEND_URL}/${courseId}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Delete failed");
        showToast("Pathway successfully deleted.", "success");
        
        // Cleanup enrollment if deleted
        if (state.enrolledCourses[courseId]) {
            delete state.enrolledCourses[courseId];
            saveLocalSettings();
        }
        
        fetchCourses();
    } catch (err) {
        console.warn("Could not delete from backend. Removing locally.", err);
        state.courses = state.courses.filter(c => c.id !== courseId);
        
        if (state.enrolledCourses[courseId]) {
            delete state.enrolledCourses[courseId];
            saveLocalSettings();
        }
        
        showToast("Pathway successfully removed locally.", "success");
        renderCatalog();
        renderDashboard();
        renderMyCourses();
        renderAdminCatalog();
    }
}

// --- Core Helper: Toast Notification ---
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    else if (type === "error") icon = "fa-triangle-exclamation";
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// --- Fallback Static Mock Data (Fallback if REST Server Offline) ---
function getFallbackCourses() {
    return [
        {
            id: "c-java",
            title: "Mastering Full-Stack Java & Spring Boot",
            description: "Learn to build production-grade web applications using Java 17+, Spring Boot, Spring MVC, JPA, and secure API layers. Perfect for aspiring backend architects.",
            category: "Backend Development",
            duration: "32 Hours",
            level: "Advanced",
            lessons: [
                {
                    id: "j1",
                    title: "Spring Framework & Dependency Injection",
                    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                    content: "Welcome to Spring Framework! Dependency Injection (DI) is a technique where one object supplies the dependencies of another object. In Spring, the IoC (Inversion of Control) container manages application components and injects their dependencies automatically using annotations like @Autowired, @Component, and @Service. This promotes loose coupling, making your Java applications highly modular, testable, and easier to scale."
                },
                {
                    id: "j2",
                    title: "RESTful APIs with Spring MVC",
                    videoUrl: "https://www.w3schools.com/html/movie.mp4",
                    content: "REST (Representational State Transfer) is an architectural style for designing networked applications. Spring MVC makes it simple to build RESTful web services. By annotating classes with @RestController and mapping requests with @GetMapping, @PostMapping, @PutMapping, or @DeleteMapping, you can easily handle HTTP requests, parse incoming JSON, and return clean JSON responses."
                },
                {
                    id: "j3",
                    title: "Database Integration with Spring Data JPA",
                    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                    content: "Spring Data JPA simplifies database access by eliminating boilerplates of traditional JDBC. By defining an interface that extends JpaRepository, Spring automatically generates CRUD implementation at runtime. We use Object-Relational Mapping (ORM) through Hibernate under the hood to map Java entities directly to MySQL database tables, enabling rapid and robust data querying."
                },
                {
                    id: "j4",
                    title: "Securing APIs with Spring Security & JWT",
                    videoUrl: "https://www.w3schools.com/html/movie.mp4",
                    content: "Security is a vital aspect of enterprise web apps. Spring Security provides comprehensive authentication and authorization support. When paired with JSON Web Tokens (JWT), you can establish a stateless security architecture. The server verifies user credentials, generates a cryptographically signed token, and the client attaches this token in the Authorization header for all subsequent API requests."
                }
            ]
        },
        {
            id: "c-css",
            title: "Modern UI/UX Design & CSS Artistry",
            description: "Master the art of creating breathtaking user interfaces. Learn advanced CSS, glassmorphism, responsive grids, custom HSL color systems, and modern micro-animations.",
            category: "Design & Frontend",
            duration: "18 Hours",
            level: "Intermediate",
            lessons: [
                {
                    id: "u1",
                    title: "Design Principles & Layout Hierarchy",
                    videoUrl: "https://www.w3schools.com/html/movie.mp4",
                    content: "Visual design is the foundation of user engagement. Great designers rely on fundamental principles like contrast, proximity, alignment, and repetition. Establishing a clear visual hierarchy guides users naturally through your website, highlighting calls-to-action (CTAs) and organizing content structure efficiently. Typography and proper whitespace are critical elements to elevate interface readability."
                },
                {
                    id: "u2",
                    title: "Harmonious HSL Colors & Dark Themes",
                    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                    content: "The HSL (Hue, Saturation, Lightness) color model makes adjusting color pallets intuitive. Unlike Hex or RGB, modifying the lightness or saturation of an HSL color allows for effortless creation of secondary shades, hover states, and gorgeous dark/light mode toggles. Dark themes benefit from deep gray backgrounds (rather than pure black) combined with sleek, high-contrast neon accents."
                },
                {
                    id: "u3",
                    title: "Glassmorphism & Frosted Glass Styling",
                    videoUrl: "https://www.w3schools.com/html/movie.mp4",
                    content: "Glassmorphism has taken modern UI design by storm. It mimics the look of frosted glass, giving layers a depth of field. To implement this in CSS, we use a semi-transparent background color (`rgba(255, 255, 255, 0.05)`), a thin translucent border, and the powerful `backdrop-filter: blur(12px)` property. Adding subtle box shadows creates a realistic 3D floating effect."
                },
                {
                    id: "u4",
                    title: "Micro-Animations with CSS Transitions",
                    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
                    content: "Micro-animations are subtle visual feedback cues that trigger upon interaction, like button hovers, page loads, and active tab transitions. Using CSS transforms (`scale()`, `translate()`) paired with smooth transition ease-curves (`cubic-bezier`), you can make your user interfaces feel responsive, interactive, and alive without degrading browser rendering performance."
                }
            ]
        }
    ];
}
