// Initialize Lucide icons
if (window.lucide) {
  lucide.createIcons();
}

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Header scroll effect
const header = document.getElementById('header');
const onScroll = () => {
  if (window.scrollY > 10) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
menuBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});
// Close on link click
mobileMenu?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => mobileMenu.classList.add('hidden'))
);
