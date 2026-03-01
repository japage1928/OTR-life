// OTR Life - Public Site JavaScript

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Add message auto-dismiss after 5 seconds
document.querySelectorAll('.alert.success').forEach(alert => {
  setTimeout(() => {
    alert.style.transition = 'opacity 0.3s ease-out';
    alert.style.opacity = '0';
    setTimeout(() => {
      alert.remove();
    }, 300);
  }, 5000);
});

// Keyboard shortcuts (if needed)
document.addEventListener('keydown', (e) => {
  // Alt + H = Home
  if (e.altKey && e.key === 'h') {
    window.location.href = '/';
  }
  // Alt + P = Posts
  if (e.altKey && e.key === 'p') {
    window.location.href = '/posts';
  }
  // Alt + C = Contact
  if (e.altKey && e.key === 'c') {
    window.location.href = '/contact';
  }
});
