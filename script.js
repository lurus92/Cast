const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('#sidebar button, #mobile-tabs button');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-section');
    sections.forEach(sec => {
      if (sec.id === target) sec.classList.add('active');
      else sec.classList.remove('active');
    });
  });
});
