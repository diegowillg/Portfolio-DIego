document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const workbench = document.querySelector(".workbench");
  const tabsEl = document.querySelector(".tabs");
  const breadcrumb = document.querySelector(".breadcrumb");
  const corpo = document.querySelector(".editor-corpo");
  const statusLinguagem = document.querySelector('[data-status="linguagem"]');
  const statusCursor = document.querySelector('[data-status="cursor"]');
  const fundoSidebar = document.querySelector(".sidebar-fundo");
  const botaoMenu = document.querySelector(".titlebar-menu");
  const celular = window.matchMedia("(max-width: 760px)");

  const ICONES = {
    md: ["ic-md", "M↓"],
    ts: ["ic-ts", "TS"],
    json: ["ic-json", "{}"],
    yml: ["ic-yml", "≡"],
    sh: ["ic-sh", "$"],
  };

  const arquivos = [...document.querySelectorAll(".arquivo-conteudo")].map((el) => ({
    id: el.id,
    nome: el.dataset.nome,
    tipo: el.dataset.tipo,
    linguagem: el.dataset.linguagem,
    el,
  }));
  const porId = Object.fromEntries(arquivos.map((a) => [a.id, a]));

  const icone = (tipo) => {
    const [classe, texto] = ICONES[tipo];
    return `<span class="ic ${classe}" aria-hidden="true">${texto}</span>`;
  };

  /* ---------- Syntax highlight ---------- */

  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Transforma e-mails, telefones e URLs dentro de strings em links
  function linkar(texto) {
    let href = null;
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(texto)) href = `mailto:${texto}`;
    else if (/^\+\d[\d\s-]+$/.test(texto)) href = `tel:${texto.replace(/[\s-]/g, "")}`;
    else if (/^(github\.com|linkedin\.com|www\.)/.test(texto)) href = `https://${texto}`;
    if (!href) return esc(texto);
    const externo = href.startsWith("https") ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a class="c-link" href="${href}"${externo}>${esc(texto)}</a>`;
  }

  const stringHtml = (s) =>
    `<span class="c-string">"${linkar(s.slice(1, -1))}"</span>`;

  const REGRAS = {
    ts: [
      [/\/\/.*/y, "c-comentario"],
      [/"[^"]*"/y, "string"],
      [/\b(?:export|const|let|type|interface|import|from)\b/y, "c-keyword"],
      [/\b(?:return|if|else)\b/y, "c-controle"],
      [/\b(?:string|number|boolean)\b/y, "c-tipo"],
      [/\d+/y, "c-numero"],
      [/[A-Z][A-Za-z]*/y, "c-tipo"],
      [/[A-Za-zÀ-ÿ_$][\wÀ-ÿ$]*/y, "c-prop"],
    ],
    json: [
      [/"[^"]*"(?=\s*:)/y, "c-prop"],
      [/"[^"]*"/y, "string"],
      [/\b(?:true|false|null)\b/y, "c-keyword"],
      [/-?\d+(?:\.\d+)?/y, "c-numero"],
    ],
  };

  // Colchetes coloridos por profundidade, como no VS Code
  function colchete(ch, estado) {
    if ("{[(".includes(ch)) {
      const html = `<span class="c-b${(estado.prof % 3) + 1}">${ch}</span>`;
      estado.prof++;
      return html;
    }
    estado.prof = Math.max(0, estado.prof - 1);
    return `<span class="c-b${(estado.prof % 3) + 1}">${ch}</span>`;
  }

  function destacarGenerico(texto, regras, estado) {
    let i = 0;
    let html = "";
    while (i < texto.length) {
      const ch = texto[i];
      if ("{}[]()".includes(ch)) {
        html += colchete(ch, estado);
        i++;
        continue;
      }
      let casou = false;
      for (const [re, classe] of regras) {
        re.lastIndex = i;
        const m = re.exec(texto);
        if (m && m[0].length) {
          html += classe === "string" ? stringHtml(m[0]) : `<span class="${classe}">${esc(m[0])}</span>`;
          i += m[0].length;
          casou = true;
          break;
        }
      }
      if (!casou) {
        html += esc(ch);
        i++;
      }
    }
    return html;
  }

  function valorYml(v) {
    const t = v.trim();
    if (!t) return esc(v);
    const espaco = v.slice(0, v.length - v.trimStart().length);
    if (/^".*"$/.test(t)) return espaco + stringHtml(t);
    if (/^\d+$/.test(t)) return `${espaco}<span class="c-numero">${t}</span>`;
    return `${espaco}<span class="c-string">${linkar(t)}</span>`;
  }

  function destacarYml(texto) {
    if (/^#/.test(texto)) return `<span class="c-comentario">${esc(texto)}</span>`;
    const chave = texto.match(/^(- )?([^:#"]+?):(.*)$/);
    if (chave) {
      const [, traco = "", nome, valor] = chave;
      return `${esc(traco)}<span class="c-yml-chave">${esc(nome)}</span>:${valorYml(valor)}`;
    }
    const item = texto.match(/^- (.*)$/);
    if (item) return `- ${valorYml(item[1])}`;
    return esc(texto);
  }

  function destacarSh(texto) {
    if (/^#/.test(texto)) return `<span class="c-comentario">${esc(texto)}</span>`;
    const atrib = texto.match(/^(\w+)=(".*")$/);
    if (atrib) return `<span class="c-prop">${atrib[1]}</span>=${stringHtml(atrib[2])}`;
    const echo = texto.match(/^(echo)\s+(".*")$/);
    if (echo) return `<span class="c-funcao">echo</span> ${stringHtml(echo[2])}`;
    return esc(texto);
  }

  function destacar(pre) {
    const lang = pre.dataset.lang;
    const linhas = pre.textContent.replace(/\n$/, "").split("\n");
    const estado = { prof: 0 };

    const html = linhas
      .map((linha, n) => {
        const recuo = linha.length - linha.trimStart().length;
        const texto = linha.slice(recuo);
        let conteudo;
        if (lang === "yml") conteudo = destacarYml(texto);
        else if (lang === "sh") conteudo = destacarSh(texto);
        else conteudo = destacarGenerico(texto, REGRAS[lang], estado);
        return `<div class="linha" style="--i:${recuo}"><span class="linha-n">${n + 1}</span><span class="linha-c">${conteudo}</span></div>`;
      })
      .join("");

    const codigo = document.createElement("div");
    codigo.className = "codigo";
    codigo.dataset.lang = lang;
    codigo.innerHTML = html;
    pre.replaceWith(codigo);
  }

  document.querySelectorAll("pre.fonte").forEach(destacar);

  /* ---------- Abas e navegação ---------- */

  let abertas = [];
  let ativo = null;

  // No celular todos os arquivos ficam sempre visíveis como abas, para navegar sem abrir o menu
  function renderizarAbas() {
    const lista = celular.matches ? arquivos.map((a) => a.id) : abertas;
    tabsEl.innerHTML = lista
      .map((id) => {
        const a = porId[id];
        const sel = id === ativo;
        return `<div class="tab${sel ? " ativo" : ""}" role="tab" aria-selected="${sel}" tabindex="${sel ? 0 : -1}" data-id="${id}" title="${a.nome}">
          ${icone(a.tipo)}<span class="tab-nome">${a.nome}</span>
          <button type="button" class="tab-fechar" aria-label="Fechar ${a.nome}" data-fechar="${id}">×</button>
        </div>`;
      })
      .join("");

    // Centraliza a aba ativa sem rolar o resto da página
    const atual = tabsEl.querySelector(".tab.ativo");
    if (atual) {
      tabsEl.scrollTo({
        left: atual.offsetLeft - (tabsEl.clientWidth - atual.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }

  function renderizarBreadcrumb(a) {
    let html = `<span>portfolio</span><span class="breadcrumb-sep">›</span>${icone(a.tipo)}<span>${a.nome}</span>`;
    breadcrumb.innerHTML = html;
    if (a.id === "contato") {
      breadcrumb.insertAdjacentHTML(
        "beforeend",
        `<button type="button" class="editor-acao" data-acao="executar" title="Executar contato.sh no terminal">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>Executar
        </button>`
      );
    }
  }

  function abrir(id, { historico = true } = {}) {
    const a = porId[id];
    if (!a) return;

    if (!abertas.includes(id)) abertas.push(id);
    ativo = id;

    arquivos.forEach((arq) => arq.el.classList.toggle("ativo", arq.id === id));
    document.querySelectorAll(".sidebar .arquivo[data-arquivo]").forEach((link) => {
      link.classList.toggle("ativo", link.dataset.arquivo === id);
    });

    renderizarAbas();
    renderizarBreadcrumb(a);
    statusLinguagem.textContent = a.linguagem;
    if (statusCursor) statusCursor.textContent = "Ln 1, Col 1";
    document.title = `${a.nome} · Diego Gonçalves`;
    corpo.scrollTop = 0;

    if (historico && location.hash !== `#${id}`) {
      history.pushState(null, "", `#${id}`);
    }
    if (celular.matches) alternarSidebar(false);
  }

  function fechar(id) {
    const indice = abertas.indexOf(id);
    if (indice === -1) return;
    abertas.splice(indice, 1);
    if (!abertas.length) {
      abrir("readme");
      return;
    }
    if (id === ativo) abrir(abertas[Math.max(0, indice - 1)]);
    else renderizarAbas();
  }

  tabsEl.addEventListener("click", (e) => {
    const fecharBtn = e.target.closest("[data-fechar]");
    if (fecharBtn) {
      fechar(fecharBtn.dataset.fechar);
      return;
    }
    const tab = e.target.closest(".tab");
    if (tab) abrir(tab.dataset.id);
  });

  tabsEl.addEventListener("auxclick", (e) => {
    const tab = e.target.closest(".tab");
    if (tab && e.button === 1) fechar(tab.dataset.id);
  });

  tabsEl.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const i = abertas.indexOf(ativo) + (e.key === "ArrowRight" ? 1 : -1);
    if (abertas[i]) {
      abrir(abertas[i]);
      tabsEl.querySelector(".tab.ativo")?.focus();
    }
  });

  // Links internos (explorador, README) abrem arquivos
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-arquivo], [data-abrir]");
    if (!link) return;
    e.preventDefault();
    abrir(link.dataset.arquivo || link.dataset.abrir);
  });

  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    abrir(porId[id] ? id : "readme", { historico: false });
  });

  // Linha atual e posição do cursor na barra de status
  corpo.addEventListener("click", (e) => {
    const linha = e.target.closest(".linha");
    if (!linha) return;
    corpo.querySelectorAll(".linha.atual").forEach((l) => l.classList.remove("atual"));
    linha.classList.add("atual");

    let coluna = 1;
    const sel = window.getSelection();
    const conteudo = linha.querySelector(".linha-c");
    if (sel.rangeCount && conteudo.contains(sel.focusNode)) {
      const range = document.createRange();
      range.setStart(conteudo, 0);
      range.setEnd(sel.focusNode, sel.focusOffset);
      coluna = range.toString().length + 1;
    }
    const recuo = Number(linha.style.getPropertyValue("--i")) || 0;
    const numero = linha.querySelector(".linha-n").textContent;
    if (statusCursor) statusCursor.textContent = `Ln ${numero}, Col ${coluna + recuo}`;
  });

  /* ---------- Explorador ---------- */

  function alternarSidebar(abrirSidebar) {
    if (celular.matches) {
      const aberta = abrirSidebar ?? !workbench.classList.contains("sidebar-aberta");
      workbench.classList.toggle("sidebar-aberta", aberta);
      fundoSidebar.hidden = !aberta;
      botaoMenu.setAttribute("aria-expanded", String(aberta));
    } else {
      const visivel = abrirSidebar ?? workbench.classList.contains("sem-sidebar");
      workbench.classList.toggle("sem-sidebar", !visivel);
      document.querySelector('.activity-item[data-acao="sidebar"]').classList.toggle("ativo", visivel);
    }
  }

  celular.addEventListener("change", () => {
    workbench.classList.remove("sidebar-aberta", "sem-sidebar");
    fundoSidebar.hidden = true;
    renderizarAbas();
  });

  /* ---------- Abrir arquivo rápido (Ctrl+P) ---------- */

  const quickOpen = document.querySelector(".quick-open");
  const quickEntrada = quickOpen.querySelector(".quick-open-entrada");
  const quickLista = quickOpen.querySelector(".quick-open-lista");
  let quickSelecionado = 0;
  let quickResultados = [];

  function filtrar(termo) {
    const t = termo.toLowerCase().replace(/\s/g, "");
    return arquivos
      .map((a) => {
        let j = 0;
        const marcas = new Set();
        const nome = a.nome.toLowerCase();
        for (let k = 0; k < nome.length && j < t.length; k++) {
          if (nome[k] === t[j]) {
            marcas.add(k);
            j++;
          }
        }
        return j === t.length ? { a, marcas } : null;
      })
      .filter(Boolean);
  }

  function renderizarQuick() {
    quickResultados = filtrar(quickEntrada.value);
    quickSelecionado = Math.min(quickSelecionado, Math.max(0, quickResultados.length - 1));
    quickLista.innerHTML = quickResultados.length
      ? quickResultados
          .map(({ a, marcas }, i) => {
            const nome = [...a.nome].map((c, k) => (marcas.has(k) ? `<mark>${c}</mark>` : c)).join("");
            return `<li role="option" aria-selected="${i === quickSelecionado}" data-id="${a.id}">${icone(a.tipo)}<span>${nome}</span><span>portfolio</span></li>`;
          })
          .join("")
      : `<li aria-disabled="true"><span>Nenhum arquivo encontrado</span></li>`;
  }

  function abrirQuick() {
    quickOpen.hidden = false;
    quickEntrada.value = "";
    quickSelecionado = 0;
    renderizarQuick();
    quickEntrada.focus();
  }

  function fecharQuick() {
    quickOpen.hidden = true;
  }

  quickEntrada.addEventListener("input", () => {
    quickSelecionado = 0;
    renderizarQuick();
  });

  quickEntrada.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const total = quickResultados.length;
      if (!total) return;
      quickSelecionado = (quickSelecionado + (e.key === "ArrowDown" ? 1 : -1) + total) % total;
      renderizarQuick();
    } else if (e.key === "Enter") {
      const r = quickResultados[quickSelecionado];
      if (r) {
        fecharQuick();
        abrir(r.a.id);
      }
    }
  });

  quickLista.addEventListener("click", (e) => {
    const item = e.target.closest("li[data-id]");
    if (!item) return;
    fecharQuick();
    abrir(item.dataset.id);
  });

  quickOpen.addEventListener("mousedown", (e) => {
    if (e.target === quickOpen) fecharQuick();
  });

  /* ---------- Terminal ---------- */

  const painel = document.querySelector(".painel");
  const saida = painel.querySelector(".terminal-saida");
  const formTerminal = painel.querySelector(".terminal-linha");
  const entrada = painel.querySelector(".terminal-entrada");
  const historicoCmd = [];
  let posHistorico = 0;

  const imprimir = (html = "", classe = "") => {
    saida.insertAdjacentHTML("beforeend", `<p${classe ? ` class="${classe}"` : ""}>${html}</p>`);
    painel.querySelector(".painel-corpo").scrollTop = 1e6;
  };

  // [comando, argumento, descrição] exibidos no help
  const AJUDA = [
    ["whoami", "", "quem sou eu"],
    ["ls", "", "lista os arquivos do portfólio"],
    ["open", "<arquivo>", "abre um arquivo no editor (ex.: open projetos)"],
    ["contato", "", "mostra como falar comigo"],
    ["github", "", "abre meu GitHub"],
    ["linkedin", "", "abre meu LinkedIn"],
    ["date", "", "data e hora em Uberaba"],
    ["clear", "", "limpa o terminal"],
    ["exit", "", "fecha o terminal"],
  ];

  const PROMPT = '<span class="t-verde">diego@portfolio</span>:<span class="t-azul">~</span>$';

  function imprimirContato() {
    imprimir(`<span class="t-fraco">Vamos conversar? Respondo rápido por e-mail ou LinkedIn.</span>`);
    imprimir(`e-mail    <a href="mailto:diegowilliam096@gmail.com">diegowilliam096@gmail.com</a>`);
    imprimir(`linkedin  <a href="https://www.linkedin.com/in/diegowilliam096/" target="_blank" rel="noopener noreferrer">linkedin.com/in/diegowilliam096</a>`);
    imprimir(`github    <a href="https://github.com/diegowillg" target="_blank" rel="noopener noreferrer">github.com/diegowillg</a>`);
    imprimir(`telefone  <a href="tel:+5534920002258">+55 34 92000-2258</a>`);
  }

  const COMANDOS = {
    help() {
      imprimir('<span class="t-titulo">Comandos disponíveis</span>');
      AJUDA.forEach(([cmd, arg, descricao]) => {
        const argumento = arg ? ` <span class="t-fraco">${esc(arg)}</span>` : "";
        imprimir(
          `<span><button type="button" class="t-comando" data-cmd="${cmd}" title="Executar ${cmd}">${cmd}</button>${argumento}</span><span>${descricao}</span>`,
          "t-ajuda"
        );
      });
      imprimir();
      imprimir('<span class="t-fraco">Clique num comando para executar · ↑ ↓ histórico · Tab completa</span>');
    },
    whoami() {
      imprimir("Diego Gonçalves, Desenvolvedor Full Stack na NTT DATA.");
      imprimir('<span class="t-fraco">React · Angular · Node.js · TypeScript · IA aplicada · Uberaba, MG</span>');
    },
    ls() {
      imprimir(arquivos.map((a) => `<span class="${a.tipo === "sh" ? "t-verde" : "t-azul"}">${a.nome}</span>`).join("  "));
    },
    open(arg) {
      const alvo = (arg || "").toLowerCase().replace(/^\.\//, "");
      const a = arquivos.find((x) => x.id === alvo || x.nome.toLowerCase() === alvo || x.nome.toLowerCase().startsWith(alvo));
      if (!alvo) imprimir("uso: open &lt;arquivo&gt;");
      else if (!a) imprimir(`<span class="t-vermelho">arquivo não encontrado: ${esc(alvo)}</span>`);
      else {
        abrir(a.id);
        imprimir(`<span class="t-fraco">abrindo ${a.nome}...</span>`);
      }
    },
    contato: imprimirContato,
    github() {
      window.open("https://github.com/diegowillg", "_blank", "noopener");
    },
    linkedin() {
      window.open("https://www.linkedin.com/in/diegowilliam096/", "_blank", "noopener");
    },
    clear() {
      saida.innerHTML = "";
    },
    exit() {
      alternarTerminal(false);
    },
    date() {
      imprimir(new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));
    },
  };
  COMANDOS.cat = COMANDOS.code = COMANDOS.open;
  COMANDOS["./contato.sh"] = COMANDOS.contato;

  function executar(linha) {
    imprimir(`${PROMPT} ${esc(linha)}`);
    const [cmd, ...args] = linha.trim().split(/\s+/);
    if (!cmd) return;
    if (cmd === "sudo") {
      imprimir("diego não está no arquivo sudoers. Mas pode me mandar um e-mail.");
      return;
    }
    if (cmd === "bash" && args[0]?.includes("contato")) {
      imprimirContato();
      return;
    }
    const fn = COMANDOS[cmd.toLowerCase()];
    if (fn) fn(args.join(" "));
    else imprimir(`bash: ${esc(cmd)}: comando não encontrado. Digite <span class="t-amarelo">help</span>.`);
  }

  formTerminal.addEventListener("submit", (e) => {
    e.preventDefault();
    const linha = entrada.value;
    if (linha.trim()) historicoCmd.push(linha);
    posHistorico = historicoCmd.length;
    entrada.value = "";
    executar(linha);
  });

  // Tab completa comandos e, depois de "open", nomes de arquivos
  function completar() {
    const valor = entrada.value;
    const arquivoMatch = valor.match(/^(open|cat|code)\s+(\S*)$/);
    const opcoes = arquivoMatch
      ? arquivos.map((a) => a.nome).filter((n) => n.startsWith(arquivoMatch[2]))
      : AJUDA.map(([c]) => c).filter((c) => c.startsWith(valor.trim()));
    if (opcoes.length === 1) {
      entrada.value = arquivoMatch ? `${arquivoMatch[1]} ${opcoes[0]}` : `${opcoes[0]} `;
    } else if (opcoes.length > 1) {
      imprimir(`${PROMPT} ${esc(valor)}`);
      imprimir(opcoes.map((o) => `<span class="t-azul">${o}</span>`).join("  "));
    }
  }

  // Comandos clicáveis do help e atalhos rápidos (úteis no celular)
  painel.querySelector(".painel-corpo").addEventListener("click", (e) => {
    const botao = e.target.closest("[data-cmd]");
    if (!botao) return;
    const cmd = botao.dataset.cmd;
    if (cmd === "open") {
      entrada.value = "open ";
      entrada.focus();
    } else {
      executar(cmd);
    }
  });

  entrada.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      completar();
    } else if (e.key === "ArrowUp" && posHistorico > 0) {
      e.preventDefault();
      entrada.value = historicoCmd[--posHistorico];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      posHistorico = Math.min(historicoCmd.length, posHistorico + 1);
      entrada.value = historicoCmd[posHistorico] ?? "";
    }
  });

  painel.querySelector(".painel-corpo").addEventListener("click", (e) => {
    if (e.target.closest("[data-cmd]")) return;
    if (!window.getSelection().toString()) entrada.focus();
  });

  function alternarTerminal(abrirTerminal) {
    const abrir = abrirTerminal ?? painel.hidden;
    painel.hidden = !abrir;
    if (abrir) {
      if (!saida.childElementCount) {
        imprimir('<span class="t-fraco">Bem-vindo ao terminal do portfólio.</span>');
        imprimir('Digite <span class="t-amarelo">help</span> para ver os comandos.');
        imprimir();
      }
      if (!celular.matches) entrada.focus();
    }
  }

  /* ---------- Ações e atalhos ---------- */

  document.addEventListener("click", (e) => {
    const alvo = e.target.closest("[data-acao]");
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === "sidebar") alternarSidebar();
    else if (acao === "sidebar-fechar") alternarSidebar(false);
    else if (acao === "quick-open") abrirQuick();
    else if (acao === "terminal") alternarTerminal();
    else if (acao === "executar") {
      alternarTerminal(true);
      executar("./contato.sh");
    }
  });

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "p") {
      e.preventDefault();
      abrirQuick();
    } else if (mod && e.code === "Backquote") {
      e.preventDefault();
      alternarTerminal();
    } else if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      alternarSidebar();
    } else if (e.key === "Escape") {
      if (!quickOpen.hidden) fecharQuick();
      else if (workbench.classList.contains("sidebar-aberta")) alternarSidebar(false);
    }
  });

  /* ---------- Notificação (canto inferior direito) ---------- */

  let timerNotificacao;
  function notificar(mensagem) {
    let aviso = document.querySelector(".notificacao");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.className = "notificacao";
      aviso.setAttribute("role", "status");
      document.body.append(aviso);
    }
    aviso.innerHTML = `<span class="notificacao-icone" aria-hidden="true">i</span>${esc(mensagem)}`;
    aviso.classList.add("visivel");
    clearTimeout(timerNotificacao);
    timerNotificacao = setTimeout(() => aviso.classList.remove("visivel"), 2600);
  }

  // Usa a API moderna e, se o navegador bloquear, o método clássico
  function copiarClassico(texto) {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(campo);
    campo.select();
    const ok = document.execCommand("copy");
    campo.remove();
    return ok;
  }

  async function copiar(texto, mensagem) {
    let ok = false;
    try {
      await navigator.clipboard.writeText(texto);
      ok = true;
    } catch {
      ok = copiarClassico(texto);
    }
    notificar(ok ? mensagem : `Não foi possível copiar: ${texto}`);
  }

  /* ---------- Menus da barra de título ---------- */

  let zoom = 0;
  function aplicarZoom(passo) {
    zoom = passo === 0 ? 0 : Math.max(-4, Math.min(8, zoom + passo));
    document.documentElement.style.setProperty("--zoom", `${zoom}px`);
  }

  function selecionarTudo() {
    const alvo = porId[ativo].el.querySelector(".codigo, .md");
    const range = document.createRange();
    range.selectNodeContents(alvo);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const MENUS = [
    {
      rotulo: "Arquivo",
      itens: [
        { rotulo: "Abrir arquivo...", atalho: "Ctrl+P", acao: abrirQuick },
        "-",
        ...arquivos.map((a) => ({ rotulo: a.nome, tipo: a.tipo, acao: () => abrir(a.id) })),
        "-",
        { rotulo: "Fechar editor", acao: () => fechar(ativo) },
        {
          rotulo: "Fechar todos os editores",
          acao: () => {
            abertas = [];
            abrir("readme");
          },
        },
      ],
    },
    {
      rotulo: "Editar",
      itens: [
        { rotulo: "Copiar e-mail", acao: () => copiar("diegowilliam096@gmail.com", "E-mail copiado para a área de transferência.") },
        { rotulo: "Copiar telefone", acao: () => copiar("+55 34 92000-2258", "Telefone copiado para a área de transferência.") },
        { rotulo: "Copiar link deste arquivo", acao: () => copiar(location.href, "Link copiado para a área de transferência.") },
      ],
    },
    {
      rotulo: "Seleção",
      itens: [
        { rotulo: "Selecionar tudo", atalho: "Ctrl+A", acao: selecionarTudo },
        "-",
        { rotulo: "Ir para o início do arquivo", acao: () => corpo.scrollTo({ top: 0, behavior: "smooth" }) },
        { rotulo: "Ir para o fim do arquivo", acao: () => corpo.scrollTo({ top: corpo.scrollHeight, behavior: "smooth" }) },
      ],
    },
    {
      rotulo: "Ver",
      itens: [
        { rotulo: "Explorador", atalho: "Ctrl+B", acao: () => alternarSidebar() },
        { rotulo: "Terminal", atalho: "Ctrl+`", acao: () => alternarTerminal() },
        { rotulo: "Abrir arquivo rápido", atalho: "Ctrl+P", acao: abrirQuick },
        "-",
        { rotulo: "Aumentar fonte do editor", acao: () => aplicarZoom(1) },
        { rotulo: "Diminuir fonte do editor", acao: () => aplicarZoom(-1) },
        { rotulo: "Restaurar fonte do editor", acao: () => aplicarZoom(0) },
        "-",
        { rotulo: "Tela cheia", atalho: "F11", acao: telaCheia },
      ],
    },
    {
      rotulo: "Terminal",
      itens: [
        {
          rotulo: "Novo terminal",
          atalho: "Ctrl+`",
          acao: () => {
            COMANDOS.clear();
            alternarTerminal(true);
          },
        },
        {
          rotulo: "Executar contato.sh",
          acao: () => {
            abrir("contato");
            alternarTerminal(true);
            executar("./contato.sh");
          },
        },
        { rotulo: "Limpar terminal", acao: () => COMANDOS.clear() },
        { rotulo: "Fechar terminal", acao: () => alternarTerminal(false) },
      ],
    },
    {
      rotulo: "Ajuda",
      itens: [
        { rotulo: "Boas-vindas", acao: () => abrir("readme") },
        {
          rotulo: "Atalhos de teclado",
          acao: () => {
            abrir("readme");
            porId.readme.el.querySelector(".md-tabela")?.scrollIntoView({ behavior: "smooth", block: "center" });
          },
        },
        {
          rotulo: "Comandos do terminal",
          acao: () => {
            alternarTerminal(true);
            executar("help");
          },
        },
        "-",
        { rotulo: "Ver o código deste portfólio", acao: () => window.open("https://github.com/diegowillg/Portfolio-DIego", "_blank", "noopener") },
        { rotulo: "Meu LinkedIn", acao: () => window.open("https://www.linkedin.com/in/diegowilliam096/", "_blank", "noopener") },
      ],
    },
  ];

  const barraMenu = document.querySelector(".titlebar-itens");
  barraMenu.innerHTML = MENUS.map(
    (menu, i) => `<div class="menu">
      <button type="button" class="menu-botao" role="menuitem" aria-haspopup="true" aria-expanded="false" data-menu="${i}">${menu.rotulo}</button>
      <div class="menu-lista" role="menu" aria-label="${menu.rotulo}" hidden>
        ${menu.itens
          .map((item, k) =>
            item === "-"
              ? '<div class="menu-sep" role="separator"></div>'
              : `<button type="button" class="menu-item" role="menuitem" tabindex="-1" data-menu="${i}" data-item="${k}">
                  <span class="menu-item-rotulo">${item.tipo ? icone(item.tipo) : ""}${item.rotulo}</span>
                  ${item.atalho ? `<span class="menu-atalho">${item.atalho}</span>` : ""}
                </button>`
          )
          .join("")}
      </div>
    </div>`
  ).join("");

  const botoesMenu = [...barraMenu.querySelectorAll(".menu-botao")];
  let menuAberto = null;

  function fecharMenu() {
    if (menuAberto === null) return;
    const botao = botoesMenu[menuAberto];
    botao.setAttribute("aria-expanded", "false");
    botao.nextElementSibling.hidden = true;
    menuAberto = null;
  }

  function abrirMenu(i, focarItem = false) {
    fecharMenu();
    const botao = botoesMenu[i];
    botao.setAttribute("aria-expanded", "true");
    botao.nextElementSibling.hidden = false;
    menuAberto = i;
    if (focarItem) botao.nextElementSibling.querySelector(".menu-item")?.focus();
  }

  barraMenu.addEventListener("click", (e) => {
    const botao = e.target.closest(".menu-botao");
    if (botao) {
      const i = Number(botao.dataset.menu);
      if (menuAberto === i) fecharMenu();
      else abrirMenu(i);
      return;
    }
    const item = e.target.closest(".menu-item");
    if (item) {
      const { acao } = MENUS[item.dataset.menu].itens[item.dataset.item];
      fecharMenu();
      acao();
    }
  });

  // Com um menu aberto, passar o mouse em outro troca de menu
  barraMenu.addEventListener("mouseover", (e) => {
    const botao = e.target.closest(".menu-botao");
    if (botao && menuAberto !== null && Number(botao.dataset.menu) !== menuAberto) {
      abrirMenu(Number(botao.dataset.menu));
    }
    const item = e.target.closest(".menu-item");
    if (item) item.focus({ preventScroll: true });
  });

  barraMenu.addEventListener("keydown", (e) => {
    const itemAtual = e.target.closest(".menu-item");
    const botao = e.target.closest(".menu-botao");
    const i = Number((itemAtual || botao)?.dataset.menu);
    if (Number.isNaN(i)) return;

    if (botao && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      abrirMenu(i, true);
    } else if (itemAtual && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const itens = [...itemAtual.parentElement.querySelectorAll(".menu-item")];
      const k = itens.indexOf(itemAtual) + (e.key === "ArrowDown" ? 1 : -1);
      itens[(k + itens.length) % itens.length].focus();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const proximo = (i + (e.key === "ArrowRight" ? 1 : -1) + MENUS.length) % MENUS.length;
      if (itemAtual) abrirMenu(proximo, true);
      else botoesMenu[proximo].focus();
    } else if (e.key === "Escape") {
      fecharMenu();
      botoesMenu[i].focus();
    } else if (e.key === "Tab") {
      fecharMenu();
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest(".titlebar-itens")) fecharMenu();
  });

  window.addEventListener("blur", fecharMenu);

  /* ---------- Relógio ---------- */

  const relogio = document.querySelector(".relogio");
  if (relogio) {
    const formato = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const atualizar = () => (relogio.textContent = formato.format(new Date()));
    atualizar();
    setInterval(atualizar, 15000);
  }

  /* ---------- Início ---------- */

  const inicial = location.hash.slice(1);
  abrir("readme", { historico: false });
  if (porId[inicial] && inicial !== "readme") abrir(inicial, { historico: false });
});
