document.addEventListener("DOMContentLoaded", async () => {
  const updateHeroSection = async () => {
    try {
      const response = await fetch('/api/hero-section');
      const data = await response.json();

      if (data.status === "success") {
        // Update the Hero Section with the fetched data
        const heroTitle = document.getElementById("heroTitle");
        const heroImage = document.getElementById("heroImage");
        const heroBtn1 = document.querySelector(".hero-ctas .btn");
        const heroBtn2 = document.querySelector(".hero-ctas .btn.ghost");

        heroTitle.textContent = data.hero_title || "Default Hero Title";
        heroImage.src = data.hero_image_url || "default-image-url.jpg";
        heroImage.alt = data.hero_title || "Hero Image";

        // Update Button 1
        heroBtn1.textContent = data.btn1_label || "Register Now";
        heroBtn1.setAttribute("href", data.btn1_link || "#");

        // Update Button 2
        heroBtn2.textContent = data.btn2_label || "View Schedule";
        heroBtn2.setAttribute("href", data.btn2_link || "#");
      } else {
        console.error("Error fetching hero section data:", data.message);
      }
    } catch (error) {
      console.error("Failed to fetch hero section:", error);
    }
  };

  // Call the function to update Hero Section
  await updateHeroSection();

  // Your other existing functionality...
  // For example, handling navigation or page load (SPA)
  const main = document.querySelector("#main-content");
  const links = document.querySelectorAll(".nav-link, .sidebar nav a");

  async function loadSection(page, clickedLink = null, pushUrl = true) {
    try {
      if (page === "home") page = "main";
      const res = await fetch(`/partials/${page}`);
      if (!res.ok) throw new Error("Page not found");

      const html = await res.text();
      main.innerHTML = html;

      // Call admin login JS AFTER content loads
      if (page === "admin-login") bindAdminLogin();

      if (page === "main" && typeof initPreviousYearAnimations === "function") {
        initPreviousYearAnimations();
      }

      if (typeof gsap !== "undefined") {
        gsap.from(main, { opacity: 0, y: 20, duration: 0.5 });
      }

      links.forEach(l => l.classList.remove("active"));
      if (clickedLink) clickedLink.classList.add("active");

      if (pushUrl) {
        const sessionKey = sessionStorage.getItem("sessionKey") || "guest";
        history.pushState(
          { page },
          "",
          `/pages/${page}?session=${sessionKey}`
        );
      }

    } catch (err) {
      main.innerHTML = `
        <section style="padding:60px;text-align:center;">
          <h2>⚠️ Page not found</h2>
          <p>The section you're trying to open doesn't exist yet.</p>
        </section>`;
    }
  }

  loadSection("main");
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const page = e.target.textContent.trim().toLowerCase().replace(/['& ]+/g, "-");
      loadSection(page, e.target, true);
      if (typeof closeSidebar === "function") closeSidebar();
    });
  });
});
