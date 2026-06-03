async function loadComponent(id, filePath) {
    const response = await fetch(filePath);
    const data = await response.text();
    document.getElementById(id).innerHTML = data;
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadComponent("navbar", "/component/navbar.html");
    await loadComponent("footer", "/component/footer.html");

    // Chạy SAU KHI navbar load xong
    const user = localStorage.getItem('currentUser');

    const navLogin  = document.getElementById('nav-login');
    const userBadge = document.querySelector('.user-badge');
    const userAvatar = document.getElementById('user-avatar');
    const userName   = document.getElementById('user-name-display');

    if (user) {
        if (navLogin)  navLogin.style.display  = 'none';
        if (userAvatar) userAvatar.textContent = user.charAt(0).toUpperCase();
        if (userName)   userName.textContent   = user.charAt(0).toUpperCase() + user.slice(1);
    } else {
        if (userBadge) userBadge.style.display = 'none';
    }
});