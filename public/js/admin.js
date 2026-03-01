// OTR Life - Admin Dashboard JavaScript

// Confirmation dialogs for destructive actions
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const message = form.getAttribute("data-confirm") || "Are you sure?";
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});

// Auto-generate slug from title
const titleInput = document.getElementById("title-input");
const slugInput = document.getElementById("slug-input");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

if (titleInput && slugInput) {
  let manuallyEdited = Boolean(slugInput.value);

  slugInput.addEventListener("input", () => {
    manuallyEdited = true;
  });

  titleInput.addEventListener("input", () => {
    if (!manuallyEdited) {
      slugInput.value = slugify(titleInput.value);
    }
  });
}

// Auto-focus on search input if present
const searchInput = document.querySelector('input[name="q"]');
if (searchInput && !searchInput.value) {
  searchInput.focus();
}

// Block accidental navigation with unsaved changes (if needed)
let hasUnsavedChanges = false;

document.querySelectorAll('form[data-track-changes]').forEach(form => {
  form.addEventListener('change', () => {
    hasUnsavedChanges = true;
  });
  
  form.addEventListener('submit', () => {
    hasUnsavedChanges = false;
  });
});

window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
