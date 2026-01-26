document.addEventListener("DOMContentLoaded", () => {
  const btnTopo = document.querySelector(".btn-topo");

  if (!btnTopo) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 700) {
      btnTopo.classList.add("mostrar");
    } else {
      btnTopo.classList.remove("mostrar");
    }
  });
});
