// js/layout.js
// Navigasi, smooth scroll internal di halaman, footer, floating buttons

function initNavbar(activeRoute) {
  const navToggle = document.getElementById("nav-toggle");
  const navMobile = document.getElementById("nav-menu-mobile");

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      navMobile.classList.toggle("hidden");
    });

    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMobile.classList.add("hidden");
      });
    });
  }

  // Highlight link aktif
  const allLinks = document.querySelectorAll("[data-route]");
  allLinks.forEach((link) => {
    if (link.dataset.route === activeRoute) {
      link.classList.add("text-primary-700");
    }
  });
}

function initFooterYear() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function initFloatingButtons() {
  const forumBtn = document.getElementById("forum-toggle");
  const chatbotBtn = document.getElementById("chatbot-toggle");

  if (forumBtn) {
    forumBtn.addEventListener("click", () => {
      toggleForumPanel(true);
    });
  }

  if (chatbotBtn) {
    chatbotBtn.addEventListener("click", () => {
      window.open(DIFY_CHATBOT_URL, "_blank", "noopener");
    });
  }
}
