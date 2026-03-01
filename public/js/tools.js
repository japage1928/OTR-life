document.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest(".copy-btn");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const targetId = button.dataset.copyTarget;
  if (!targetId) {
    return;
  }

  const source = document.getElementById(targetId);
  if (!(source instanceof HTMLTextAreaElement)) {
    return;
  }

  try {
    await navigator.clipboard.writeText(source.value);
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous || "Copy";
    }, 1200);
  } catch {
    source.focus();
    source.select();
  }
});
