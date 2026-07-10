document.addEventListener("DOMContentLoaded", () => {
  const btnTopo = document.querySelector(".btn-topo");
  const header = document.querySelector(".header");
  const progressBar = document.querySelector(".scroll-progress");
  const navLinks = document.querySelectorAll(".header-link[data-section]");
  const revealElements = document.querySelectorAll(".reveal");

  const navSecoes = [
    { id: "experiencia", el: document.querySelector("#experiencia") },
    { id: "ferramentas", el: document.querySelector("#ferramentas") },
    { id: "formacao", el: document.querySelector("#formacao") },
    { id: "contato", el: document.querySelector("#contato") },
  ].filter((s) => s.el);

  const secoesEscuras = ["formacao", "contato"];

  function atualizarScroll() {
    const scrollY = window.scrollY;

    if (header) {
      header.classList.toggle("scrolled", scrollY > 40);
    }

    if (btnTopo) {
      btnTopo.classList.toggle("mostrar", scrollY > 400);
    }

    if (progressBar) {
      const altura = document.documentElement.scrollHeight - window.innerHeight;
      const progresso = altura > 0 ? (scrollY / altura) * 100 : 0;
      progressBar.style.width = `${progresso}%`;
    }
  }

  function atualizarNavAtiva() {
    const scrollY = window.scrollY;
    const noFinalDaPagina =
      scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20;

    let secaoAtual = navSecoes[0]?.id;

    if (noFinalDaPagina) {
      secaoAtual = "contato";
    } else {
      const referencia = scrollY + window.innerHeight * 0.35;

      navSecoes.forEach(({ id, el }) => {
        const topo = el.getBoundingClientRect().top + scrollY;
        if (referencia >= topo) {
          secaoAtual = id;
        }
      });
    }

    navLinks.forEach((link) => {
      const secao = link.dataset.section;
      link.classList.toggle("ativo", secao === secaoAtual);
    });

    if (header) {
      header.classList.toggle("header-dark", secoesEscuras.includes(secaoAtual));
    }
  }

  function aoRolar() {
    atualizarScroll();
    atualizarNavAtiva();
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  if (btnTopo) {
    btnTopo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visivel");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const alvo = document.querySelector(link.getAttribute("href"));
      if (alvo) {
        e.preventDefault();
        alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
