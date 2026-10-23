# Portfólio | Diego Gonçalves

Portfólio pessoal com a interface de um editor de código, inspirado no tema Dark Modern do VS Code. Cada seção é um "arquivo": `README.md`, `experiencia.ts`, `projetos.json`, `stack.json`, `formacao.yml` e `contato.sh`.

## Destaques

- Explorador de arquivos, abas que abrem e fecham, breadcrumb e barra de status.
- Syntax highlight próprio (TypeScript, JSON, YAML e Shell), com colchetes coloridos por profundidade e guias de indentação.
- `Ctrl+P` abre a busca rápida de arquivos; `Ctrl+B` mostra ou oculta o explorador.
- Terminal integrado (`` Ctrl+` ``) com comandos como `help`, `ls`, `open`, `contato` e `whoami`.
- Cada arquivo tem sua própria URL (`#projetos`, `#contato`...), e o botão voltar do navegador funciona.
- Todo o conteúdo está no HTML: sem JavaScript, as seções aparecem em sequência.
- No celular, o explorador vira uma gaveta e o layout se adapta.

## Tecnologias

- HTML5
- CSS3, sem frameworks
- JavaScript puro (`app.js`)

## Como rodar

Não há build: basta abrir o `index.html` no navegador, ou servir a pasta com qualquer servidor estático:

```bash
npx serve .
```

## Estrutura

```
.
├── index.html      # conteúdo de todos os "arquivos"
├── app.js          # abas, highlight, busca rápida, terminal e relógio
├── css/
│   ├── tema.css       # cores, fontes e base
│   ├── workbench.css  # barra de título, atividades, explorador e status
│   ├── editor.css     # abas, linhas de código e cores de sintaxe
│   ├── preview.css    # preview do README.md
│   └── terminal.css   # painel do terminal
└── img/            # foto e ícones
```
