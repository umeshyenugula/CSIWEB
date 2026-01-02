(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const sidebarClose = document.getElementById('sidebarClose');
    const main = document.getElementById('main-content');
    const navLinks = Array.from(document.querySelectorAll('.nav-link[data-page]'));

    // Open sidebar function
    function openSidebar() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      sidebar.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    // Close sidebar function
    function closeSidebar() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      sidebar.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Event listeners for sidebar open/close
    if (hamburger) hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar(); });

    // Admin SPA loader function
    async function loadAdminSection(page, clickedLink = null, pushUrl = true) {
      page = page || 'dashboard'; // Default to 'dashboard' if no page specified
      try {
        // Fetch the admin partial (Flask route: /admin/<page>)
        const res = await fetch(`/admin/${page}`);
        if (!res.ok) throw new Error('Not found');
        const html = await res.text();
        main.innerHTML = html;
        if (page === "updateevent") {
    initEventsPage();
}

const heroForm = document.getElementById("heroForm");

if (heroForm) {
  heroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(heroForm);

    const res = await fetch("/admin/update-hero", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    if (data.hero_image_url) {
      const preview = document.getElementById("heroBannerPreview");
      if (preview) preview.src = data.hero_image_url;
    }
  });
}

        // Mark active nav items
        navLinks.forEach(l => l.classList.remove('active'));
        if (clickedLink) clickedLink.classList.add('active');

        // Update URL (friendly path)
        if (pushUrl) {
          history.pushState({ page }, '', `/admin/pages/${page}`);
        }

        // Close sidebar on mobile if open
        if (sidebar.classList.contains('open')) closeSidebar();
      } catch (err) {
        main.innerHTML = `<div class="placeholder"><h3>Page Not Found</h3></div>`;
        console.warn(err);
      }
    }

    // Wire nav links (data-page)
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        loadAdminSection(page, link, true);
      });
    });

    // Popstate handling (back/forward buttons)
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || (window.location.pathname.replace('/admin/pages/', '') || 'dashboard');
      loadAdminSection(page, null, false);
    });

    // Initial page — read from URL else default to 'dashboard'
    let initial = window.location.pathname.replace('/admin/pages/', '').replace('/', '');
    if (!initial || initial === '') initial = 'dashboard'; // Set to 'dashboard' if no page
    loadAdminSection(initial, null, false);
  });
})();

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Parallax on admin-hero and ongoing-event blobs
    const hero = document.querySelector('.admin-page .admin-hero');
    const heroBlobs = document.querySelectorAll('.admin-page .admin-hero .f-blob');
    const overview = document.querySelector('.admin-page .ongoing-event');
    const overviewBlobs = document.querySelectorAll('.admin-page .ongoing-event .f-blob');

    // Parallax effect
    function applyParallax(e, blobs, intensity = 12) {
      if (!blobs || blobs.length === 0) return;
      const rect = (e.currentTarget || e.target).getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      blobs.forEach((b, i) => {
        const depth = (i + 1) * intensity;
        b.style.transform = `translate3d(${cx * depth}px, ${cy * depth}px, 0)`;
      });
    }

    // Hero parallax event listeners
    if (hero && heroBlobs.length) {
      hero.addEventListener('mousemove', e => applyParallax(e, heroBlobs, 8));
      hero.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) applyParallax(e.touches[0], heroBlobs, 8);
      }, { passive: true });
      hero.addEventListener('mouseleave', () => heroBlobs.forEach(b => b.style.transform = 'translate3d(0,0,0)'));
    }

    // Overview parallax event listeners
    if (overview && overviewBlobs.length) {
      overview.addEventListener('mousemove', e => applyParallax(e, overviewBlobs, 6));
      overview.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) applyParallax(e.touches[0], overviewBlobs, 6);
      }, { passive: true });
      overview.addEventListener('mouseleave', () => overviewBlobs.forEach(b => b.style.transform = 'translate3d(0,0,0)'));
    }

    // Fade-in animation for admin page elements
    requestAnimationFrame(() => {
      document.querySelectorAll('.admin-page .stat-card, .admin-page .event-info, .admin-page .announcement').forEach((el, i) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(10px)';
        setTimeout(() => {
          el.style.transition = 'opacity .48s ease, transform .48s cubic-bezier(.2,.9,.2,1)';
          el.style.opacity = 1;
          el.style.transform = 'translateY(0)';
        }, 80 + (i * 80));
      });
    });
  });
})();
function initEventsPage() {
    const main = document.getElementById("main-content");
loadEventsList();
    // -------- Add Event --------
    const addForm = main.querySelector(".add-event-form");
    if (addForm) {
        addForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const formData = new FormData(addForm);

            const res = await fetch("/admin/add-event", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            alert(data.message);
            loadAdminSection("updateevent");
        });
    }

    // -------- Open Edit Modal --------
    main.addEventListener("click", async function (e) {
        if (e.target.classList.contains("btn-update-event")) {
            e.preventDefault();

            const eventId = e.target.dataset.id;

            const res = await fetch(`/admin/get-event/${eventId}`);
            const data = await res.json();

            if (data.status === "success") {
                const ev = data.data;

                main.querySelector("#editEventId").value = eventId;
                main.querySelector("#editTitle").value = ev.title;
                main.querySelector("#editDate").value = ev.date;
                main.querySelector("#editDescription").value = ev.description;
                main.querySelector("#editParticipants").value = ev.participants;

                main.querySelector("#editEventModal").style.display = "block";
            }
        }
    });

    // -------- Close Modal --------
    const closeBtn = main.querySelector("#closeModal");
    if (closeBtn) {
        closeBtn.onclick = () => {
            main.querySelector("#editEventModal").style.display = "none";
        };
    }

    // -------- Update Event --------
    const editForm = main.querySelector("#editEventForm");
    if (editForm) {
        editForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const eventId = main.querySelector("#editEventId").value;
            const formData = new FormData();

            formData.append("title", main.querySelector("#editTitle").value);
            formData.append("date", main.querySelector("#editDate").value);
            formData.append("description", main.querySelector("#editDescription").value);
            formData.append("participants", main.querySelector("#editParticipants").value);

            const file = main.querySelector("#editImage").files[0];
            if (file) {
                formData.append("image", file);
            }

            const res = await fetch(`/admin/update-event/${eventId}`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            alert(data.message);
            loadAdminSection("updateevent");
        });
    }
}
async function loadEventsList() {
    const res = await fetch("/admin/list-events");
    const data = await res.json();

    const container = document.getElementById("eventsContainer");
    container.innerHTML = "";

    data.events.forEach(ev => {
        container.innerHTML += `
            <div class="event-card">
                <h3>${ev.title}</h3>
                <p><strong>Date:</strong> ${ev.date}</p>
                <p>${ev.description}</p>
            </div>
        `;
    });
}
