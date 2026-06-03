$(".count").each(function () {
  $(this)
    .prop("Counter", 0)
    .animate(
      {
        Counter: $(this).text(),
      },
      {
        duration: 4000,
        easing: "swing",
        step: function (now) {
          now = Number(Math.ceil(now)).toLocaleString('en');
          $(this).text(now);
        },
      }
    );
});
// Tự động active nav-link theo URL hiện tại
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-link').forEach(link => {
  if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').replace('../', '').replace('./', ''))) {
    link.closest('.nav-item').classList.add('active');
  }
});
