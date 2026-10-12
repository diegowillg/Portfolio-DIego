# Portfólio – Diego William

Site pessoal de apresentação profissional, com experiência, ferramentas, formação e contato.

## Destaques

- Página única com navegação por seções e destaque do link ativo durante a rolagem.
- Barra de progresso de leitura e botão "voltar ao topo".
- Animações de entrada (reveal) ao rolar a página.
- Layout responsivo, com estilos organizados por seção.

## Tecnologias

- HTML5
- CSS3 (um arquivo por seção em `css/`)
- JavaScript puro (`botao.js`)

## Como rodar

Não há build: basta abrir o `index.html` no navegador, ou servir a pasta com qualquer servidor estático:

```bash
npx serve .
```

## Estrutura

```
.
├── index.html
├── botao.js        # navegação, progresso de rolagem e animações
├── css/            # estilos por seção (header, experiência, ferramentas...)
└── img/            # imagens e ícones
```
