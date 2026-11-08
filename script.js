// =====================================
// CIVITAS — MAIN JAVASCRIPT
// =====================================

const DB = {
    users: "civitas_users",
    posts: "civitas_posts",
    current: "civitas_current",
    saved: "civitas_saved",
    theme: "civitas_theme"
};

function getData(key, fallback = []) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

let users = getData(DB.users);
let posts = getData(DB.posts);
let currentUser = localStorage.getItem(DB.current);
let saved = getData(DB.saved);
let currentPost = null;

// Защита отображаемого текста от HTML-вставок
function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getUser() {
    return users.find(u => u.email === currentUser) || null;
}

function sync() {
    setData(DB.users, users);
    setData(DB.posts, posts);
    setData(DB.saved, saved);
}

function id() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function dateNow() {
    return new Date().toLocaleString("ru-RU");
}

// =====================================
// ДЕМОНСТРАЦИОННЫЕ ПУБЛИКАЦИИ
// =====================================

if (posts.length === 0) {
    posts = [
        {
            id: id(),
            title: "Как технологии меняют современное общество?",
            text: "Современные технологии оказывают влияние практически на все сферы нашей жизни. Искусственный интеллект, интернет и цифровые платформы открывают новые возможности для образования и общения.",
            category: "Технологии",
            author: "Администрация",
            email: "admin@civitas.local",
            date: "08.11.2026",
            likes: [],
            comments: []
        },
        {
            id: id(),
            title: "Будущее городского транспорта",
            text: "Электрический транспорт, общественные пространства и новые инфраструктурные проекты могут сделать города удобнее для жителей.",
            category: "Общество",
            author: "Администрация",
            email: "admin@civitas.local",
            date: "08.11.2026",
            likes: [],
            comments: []
        },
        {
            id: id(),
            title: "Почему важно финансовое образование?",
            text: "Понимание бюджета, накоплений и экономики помогает людям принимать более обдуманные решения.",
            category: "Экономика",
            author: "Администрация",
            email: "admin@civitas.local",
            date: "08.11.2026",
            likes: [],
            comments: []
        }
    ];
    sync();
}

// =====================================
// НАВИГАЦИЯ
// =====================================

function navigate(page) {
    document.querySelectorAll(".page").forEach(p => {
        p.classList.remove("active");
    });

    const target = document.getElementById(page);

    if (!target) return;

    target.classList.add("active");

    if (page === "profile") renderProfile();
    if (page === "users") renderUsers();
    if (page === "home") renderHome();
    if (page === "news") renderPosts();
    if (page === "politics") renderCategory("Политика");
    if (page === "economy") renderCategory("Экономика");
    if (page === "society") renderCategory("Общество");
    if (page === "saved") renderSaved();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// =====================================
// РЕГИСТРАЦИЯ
// =====================================

function showRegister() {
    navigate("register");
}

function showAuth() {
    navigate("auth");
}

function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (name.length < 2) {
        alert("Имя должно содержать минимум 2 символа.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Введите корректную электронную почту.");
        return;
    }

    if (password.length < 8) {
        alert("Пароль должен содержать минимум 8 символов.");
        return;
    }

    if (users.some(u => u.email === email)) {
        alert("Этот аккаунт уже существует.");
        return;
    }

    const user = {
        id: id(),
        name,
        email,
        password,
        bio: "Новый участник CIVITAS",
        avatar: "",
        followers: [],
        following: [],
        joined: dateNow()
    };

    users.push(user);
    currentUser = email;

    localStorage.setItem(DB.current, email);
    sync();

    alert("Добро пожаловать в CIVITAS!");
    updateHeader();
    navigate("profile");
}

// =====================================
// АВТОРИЗАЦИЯ
// =====================================

function login() {
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = users.find(u =>
        u.email === email && u.password === password
    );

    if (!user) {
        alert("Неправильная почта или пароль.");
        return;
    }

    currentUser = user.email;
    localStorage.setItem(DB.current, currentUser);

    updateHeader();
    alert("Вы успешно вошли!");
    navigate("profile");
}

// =====================================
// ВЫХОД
// =====================================

function logout() {
    currentUser = null;
    localStorage.removeItem(DB.current);

    updateHeader();
    navigate("home");

    alert("Вы вышли из аккаунта.");
}

// =====================================
// ШАПКА САЙТА
// =====================================

function updateHeader() {
    const user = getUser();

    const buttons = document.querySelector(".header-right");

    if (!buttons) return;

    if (user) {
        buttons.innerHTML = `
            <button onclick="toggleTheme()" id="themeBtn">☀</button>
            <button onclick="navigate('profile')">
                👤 ${safe(user.name)}
            </button>
            <button onclick="logout()">Выйти</button>
        `;
    } else {
        buttons.innerHTML = `
            <button onclick="toggleTheme()">☀</button>
            <button onclick="showAuth()">Войти</button>
            <button class="primary" onclick="showRegister()">Регистрация</button>
        `;
    }
}

// =====================================
// СОЗДАНИЕ ПУБЛИКАЦИЙ
// =====================================

function createPost() {
    const user = getUser();

    if (!user) {
        alert("Чтобы публиковать записи, войдите в аккаунт.");
        navigate("auth");
        return;
    }

    const title = document.getElementById("postTitle").value.trim();
    const text = document.getElementById("postText").value.trim();
    const category = document.getElementById("postCategory").value;

    if (title.length < 3) {
        alert("Заголовок слишком короткий.");
        return;
    }

    if (text.length < 5) {
        alert("Добавьте текст публикации.");
        return;
    }

    const post = {
        id: id(),
        title,
        text,
        category,
        author: user.name,
        email: user.email,
        date: dateNow(),
        likes: [],
        comments: []
    };

    posts.unshift(post);
    sync();

    document.getElementById("postTitle").value = "";
    document.getElementById("postText").value = "";

    renderPosts();

    alert("Публикация создана!");
}

// =====================================
// КАРТОЧКА ПУБЛИКАЦИИ
// =====================================

function postCard(post) {
    const user = getUser();
    const liked = user && post.likes.includes(user.email);
    const isSaved = saved.includes(post.id);

    return `
        <article class="post-card">
            <div class="post-meta">
                ${safe(post.author)} · ${safe(post.date)}
            </div>

            <span class="post-category">
                ${safe(post.category)}
            </span>

            <h3>${safe(post.title)}</h3>

            <p>${safe(post.text)}</p>

            <div class="post-actions">
                <button onclick="likePost('${post.id}')">
                    ${liked ? "❤️" : "🤍"} ${post.likes.length}
                </button>

                <button onclick="openPost('${post.id}')">
                    💬 ${post.comments.length}
                </button>

                <button onclick="toggleSave('${post.id}')">
                    ${isSaved ? "🔖 Сохранено" : "☆ Сохранить"}
                </button>

                <button onclick="openPost('${post.id}')">
                    Читать →
                </button>
            </div>
        </article>
    `;
}

// =====================================
// ОТОБРАЖЕНИЕ ЛЕНТЫ
// =====================================

function renderHome() {
    const container = document.getElementById("homePosts");

    if (!container) return;

    container.innerHTML = posts.slice(0, 4).map(postCard).join("");
}

function renderPosts() {
    const container = document.getElementById("allPosts");

    if (!container) return;

    const query = document.getElementById("searchPosts")?.value
        .toLowerCase() || "";

    const filtered = posts.filter(p =>
        (p.title + " " + p.text + " " + p.author + " " + p.category)
        .toLowerCase().includes(query)
    );

    container.innerHTML = filtered.length
        ? filtered.map(postCard).join("")
        : "<p class='muted'>Публикаций не найдено.</p>";
}

function renderCategory(category) {
    const container = document.getElementById(category === "Политика"
        ? "politicsPosts"
        : category === "Экономика"
        ? "economyPosts"
        : "societyPosts");

    if (!container) return;

    const filtered = posts.filter(p => p.category === category);

    container.innerHTML = filtered.length
        ? filtered.map(postCard).join("")
        : "<p class='muted'>Пока публикаций нет.</p>";
}

// =====================================
// ЛАЙКИ
// =====================================

function likePost(postId) {
    const user = getUser();

    if (!user) {
        alert("Сначала войдите в аккаунт.");
        navigate("auth");
        return;
    }

    const post = posts.find(p => p.id === postId);

    if (!post) return;

    if (post.likes.includes(user.email)) {
        post.likes = post.likes.filter(x => x !== user.email);
    } else {
        post.likes.push(user.email);
    }

    sync();
    refreshPages();
}

// =====================================
// СОХРАНЕНИЕ
// =====================================

function toggleSave(postId) {
    if (!getUser()) {
        alert("Войдите в аккаунт.");
        navigate("auth");
        return;
    }

    if (saved.includes(postId)) {
        saved = saved.filter(id => id !== postId);
    } else {
        saved.push(postId);
    }

    sync();
    refreshPages();
}

function renderSaved() {
    const container = document.getElementById("savedPosts");

    if (!container) return;

    const list = posts.filter(p => saved.includes(p.id));

    container.innerHTML = list.length
        ? list.map(postCard).join("")
        : "<p class='muted'>У вас пока нет сохранённых публикаций.</p>";
}

// =====================================
// ОТКРЫТИЕ ПУБЛИКАЦИИ
// =====================================

function openPost(postId) {
    const post = posts.find(p => p.id === postId);

    if (!post) return;

    currentPost = postId;

    navigate("postDetails");

    const container = document.getElementById("postDetailContent");

    container.innerHTML = `
        <button onclick="navigate('news')">← Назад</button>

        <div class="post-card">
            <span class="post-category">${safe(post.category)}</span>
            <h1>${safe(post.title)}</h1>
            <div class="post-meta">
                Автор: ${safe(post.author)} · ${safe(post.date)}
            </div>
            <p style="margin-top:20px;white-space:pre-wrap">
                ${safe(post.text)}
            </p>
            <div class="post-actions">
                <button onclick="likePost('${post.id}')">
                    ❤️ ${post.likes.length}
                </button>
            </div>
        </div>

        <div class="create-box">
            <h3>Комментарии</h3>
            <div id="comments"></div>
            <textarea id="commentInput"
                placeholder="Напишите комментарий..."></textarea>
            <button class="primary" onclick="addComment()">
                Отправить комментарий
            </button>
        </div>
    `;

    renderComments();
}

// =====================================
// КОММЕНТАРИИ
// =====================================

function renderComments() {
    const post = posts.find(p => p.id === currentPost);
    const container = document.getElementById("comments");

    if (!post || !container) return;

    container.innerHTML = post.comments.length
        ? post.comments.map(c => `
            <div class="comment">
                <b>${safe(c.author)}</b>
                <p>${safe(c.text)}</p>
                <span class="post-meta">${safe(c.date)}</span>
            </div>
        `).join("")
        : "<p class='muted'>Комментариев пока нет.</p>";
}

function addComment() {
    const user = getUser();

    if (!user) {
        alert("Войдите, чтобы комментировать.");
        navigate("auth");
        return;
    }

    const input = document.getElementById("commentInput");
    const text = input.value.trim();

    if (!text) {
        alert("Напишите комментарий.");
        return;
    }

    const post = posts.find(p => p.id === currentPost);

    if (!post) return;

    post.comments.push({
        author: user.name,
        email: user.email,
        text,
        date: dateNow()
    });

    sync();

    openPost(currentPost);
}

// =====================================
// ПРОФИЛЬ
// =====================================

function renderProfile() {
    const container = document.getElementById("profileContent");
    const user = getUser();

    if (!container) return;

    if (!user) {
        container.innerHTML = `
            <div class="create-box">
                <h3>Вы не авторизованы</h3>
                <button class="primary" onclick="navigate('auth')">
                    Войти в аккаунт
                </button>
            </div>
        `;
        return;
    }

    const avatar = user.avatar ||
        "https://api.dicebear.com/9.x/initials/svg?seed=" +
        encodeURIComponent(user.name);

    const userPosts = posts.filter(p => p.email === user.email);

    container.innerHTML = `
        <div class="profile-header">
            <img class="avatar" src="${safe(avatar)}"
                onerror="this.src='https://api.dicebear.com/9.x/initials/svg?seed=User'">

            <h1>${safe(user.name)}</h1>
            <p class="muted">${safe(user.email)}</p>
            <p style="margin:15px 0">${safe(user.bio)}</p>

            <p>👥 Подписчики: ${user.followers.length}</p>
            <p>➕ Подписки: ${user.following.length}</p>
            <p>📝 Публикации: ${userPosts.length}</p>
            <p class="muted">Участник с ${safe(user.joined)}</p>

            <button class="primary" onclick="editProfile()">
                ✏️ Редактировать профиль
            </button>

            <button onclick="logout()">Выйти</button>
        </div>

        <h2>Мои публикации</h2>

        <div class="posts">
            ${userPosts.length
                ? userPosts.map(postCard).join("")
                : "<p class='muted'>Вы ещё ничего не публиковали.</p>"
            }
        </div>
    `;
}

// =====================================
// РЕДАКТИРОВАНИЕ ПРОФИЛЯ
// =====================================

function editProfile() {
    const user = getUser();

    if (!user) return;

    document.getElementById("modalContent").innerHTML = `
        <h2>Редактировать профиль</h2>

        <label>Имя</label>
        <input id="editName" value="${safe(user.name)}">

        <label>Описание</label>
        <textarea id="editBio">${safe(user.bio)}</textarea>

        <label>Ссылка на аватарку</label>
        <input id="editAvatar" value="${safe(user.avatar)}"
            placeholder="https://...">

        <button class="primary full" onclick="saveProfile()">
            Сохранить изменения
        </button>
    `;

    openModal();
}

function saveProfile() {
    const user = getUser();

    if (!user) return;

    const name = document.getElementById("editName").value.trim();
    const bio = document.getElementById("editBio").value.trim();
    const avatar = document.getElementById("editAvatar").value.trim();

    if (name.length < 2) {
        alert("Имя слишком короткое.");
        return;
    }

    if (avatar && !/^https:\/\//i.test(avatar)) {
        alert("Ссылка на аватар должна начинаться с https://");
        return;
    }

    user.name = name;
    user.bio = bio;
    user.avatar = avatar;

    // Обновляем имя автора в публикациях
    posts.forEach(p => {
        if (p.email === user.email) p.author = name;
    });

    sync();
    closeModal();
    updateHeader();
    renderProfile();
}

// =====================================
// ПОЛЬЗОВАТЕЛИ
// =====================================

function renderUsers() {
    const container = document.getElementById("usersList");

    if (!container) return;

    const query = document.getElementById("userSearch")?.value
        .toLowerCase() || "";

    const list = users.filter(u =>
        u.name.toLowerCase().includes(query)
    );

    container.innerHTML = list.map(user => `
        <div class="user-card">
            <img class="avatar"
                src="${safe(user.avatar ||
                "https://api.dicebear.com/9.x/initials/svg?seed=" +
                encodeURIComponent(user.name))}">
            <h3>${safe(user.name)}</h3>
            <p class="muted">${safe(user.bio)}</p>
            <p class="small">
                Подписчики: ${user.followers.length}
            </p>
            <button class="primary"
                onclick="viewUser('${user.id}')">
                Открыть профиль
            </button>
        </div>
    `).join("");
}

// =====================================
// ПРОСМОТР ЧУЖОГО ПРОФИЛЯ
// =====================================

function viewUser(userId) {
    const user = users.find(u => u.id === userId);

    if (!user) return;

    const me = getUser();

    if (me && me.id === user.id) {
        navigate("profile");
        return;
    }

    const isFollowing = me && user.followers.includes(me.email);

    document.getElementById("modalContent").innerHTML = `
        <img class="avatar"
            src="${safe(user.avatar ||
            "https://api.dicebear.com/9.x/initials/svg?seed=" +
            encodeURIComponent(user.name))}">

        <h2>${safe(user.name)}</h2>
        <p>${safe(user.bio)}</p>

        <p>Подписчики: ${user.followers.length}</p>

        ${me ? `
            <button class="primary full"
                onclick="followUser('${user.id}')">
                ${isFollowing ? "Отписаться" : "Подписаться"}
            </button>
        ` : `
            <p>Войдите, чтобы подписываться.</p>
        `}

        <h3>Публикации</h3>

        ${posts.filter(p => p.email === user.email)
            .map(post => `
                <div class="comment">
                    <b>${safe(post.title)}</b>
                    <p>${safe(post.text)}</p>
                </div>
            `).join("") || "<p>Публикаций нет.</p>"}
    `;

    openModal();
}

// =====================================
// ПОДПИСКИ
// =====================================

function followUser(userId) {
    const me = getUser();
    const target = users.find(u => u.id === userId);

    if (!me || !target || me.id === target.id) return;

    if (target.followers.includes(me.email)) {
        target.followers = target.followers.filter(x => x !== me.email);
        me.following = me.following.filter(x => x !== target.email);
    } else {
        target.followers.push(me.email);
        me.following.push(target.email);
    }

    sync();

    viewUser(userId);
    renderUsers();
}

// =====================================
// МОДАЛЬНОЕ ОКНО
// =====================================

function openModal() {
    document.getElementById("modal").classList.add("show");
}

function closeModal() {
    document.getElementById("modal").classList.remove("show");
}

document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") closeModal();
});

// =====================================
// ТЕМЫ
// =====================================

function toggleTheme() {
    document.body.classList.toggle("light");

    localStorage.setItem(
        DB.theme,
        document.body.classList.contains("light")
            ? "light"
            : "dark"
    );
}

// =====================================
// ОБНОВЛЕНИЕ СТРАНИЦ
// =====================================

function refreshPages() {
    renderHome();
    renderPosts();
    renderProfile();
    renderSaved();
    renderUsers();

    if (currentPost) {
        const post = posts.find(p => p.id === currentPost);
        if (post) renderComments();
    }

    const active = document.querySelector(".page.active");

    if (active) {
        if (active.id === "politics") renderCategory("Политика");
        if (active.id === "economy") renderCategory("Экономика");
        if (active.id === "society") renderCategory("Общество");
    }
}

// =====================================
// ЗАПУСК ПЛАТФОРМЫ
// =====================================

function init() {
    if (localStorage.getItem(DB.theme) === "light") {
        document.body.classList.add("light");
    }

    if (currentUser && !getUser()) {
        currentUser = null;
        localStorage.removeItem(DB.current);
    }

    updateHeader();
    renderHome();
    renderPosts();
    renderUsers();
}

init();
