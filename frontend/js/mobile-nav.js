document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const sideNav = document.getElementById("sideNav");
  const navOverlay = document.getElementById("navOverlay");

  if (!menuToggle || !sideNav || !navOverlay) return;

  const openNav = () => {
    sideNav.classList.add("is-open");
    navOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  const closeNav = () => {
    sideNav.classList.remove("is-open");
    navOverlay.classList.remove("show");
    document.body.style.overflow = "";
  };

  menuToggle.addEventListener("click", () => {
    if (sideNav.classList.contains("is-open")) {
      closeNav();
    } else {
      openNav();
    }
  });

  navOverlay.addEventListener("click", closeNav);

  sideNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeNav);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      closeNav();
    }
  });
});