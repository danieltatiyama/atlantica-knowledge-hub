# Stage 20.72 — Lightbox global de imagens nos artigos

## Motivação

Após a publicação do guia **Sistema VIP** em PT-BR, a captura do menu do jogo ficou pequena na visualização normal do artigo. O usuário aprovou um visualizador de imagens para os artigos da Wiki, sem alterar imagens originais.

## Implementação

- `src/components/ArticleImageLightbox.astro` é montado uma única vez em `src/layouts/BaseLayout.astro`, utilizando o idioma EN/PT-BR do layout.
- Somente elementos `img` dentro de `.article-body` se tornam acionáveis. Isso cobre artigos de **Guias** e artigos editoriais de **Eventos/Mercenários**. Elementos de navegação, logos e imagens em links ou controles existentes **não são capturados**.
- Clique, **Enter** ou **Espaço** abre a imagem em um diálogo modal acessível. A imagem original é usada diretamente por `currentSrc || src`; nenhum arquivo é duplicado, recompactado ou substituído.
- O visualizador ajusta automaticamente a imagem à janela, **inclusive ampliando screenshots pequenos e estreitos**. Zoom relativo de 100% (ajustar) a 500%, via botões `+`, `−`, `0`, clique duplo na imagem ou `Ctrl`/`Cmd` + roda do mouse.
- Durante zoom, imagem maior que o espaço disponível pode ser explorada com a rolagem nativa da área central, inclusive em touch.
- Setas `←`/`→` e botões de anterior/próxima percorrem apenas as imagens do **mesmo artigo**; contador de imagem exibido quando há mais de uma.
- `Esc`, botão de fechar ou clique fora da imagem fecha o modal. O scroll da página é restaurado, assim como o foco ao elemento de origem.
- O foco fica contido nos controles habilitados do diálogo enquanto ele está aberto. Rótulos e dicas em inglês ou português e estilo baseado nos tokens existentes atendem aos seis temas.
- `src/lib/article-image-lightbox.mjs` concentra as funções puras para cálculo de ajuste/zoom e navegação circular.

## Compatibilidade e integridade

As versões EN/PT-BR de `VIP System` reutilizam os mesmos **16 arquivos PNG**; a implementação não edita nenhum Markdown, imagem, preço, dado de cliente ou ferramenta. As rotas publicadas continuam inalteradas.

O visualizador não se aplica a imagens externas à área `.article-body`, imagens dentro de links/controles ou explicitamente marcadas com `data-wiki-lightbox-ignore`.

## Validação

```bash
node --test tests/wiki-article-image-lightbox.test.mjs
npm run build
```

A CI da PR executa a regressão de lightbox, testes existentes e build completo. Os testes verificam ajuste de screenshots estreitas e imagens largas, limites do zoom, navegação circular, montagem global, restrição ao corpo dos artigos, acessibilidade por teclado e preservação das 16 imagens do VIP.

**QA manual ainda necessário após deploy:** testar clique, duplo clique, zoom, scroll em zoom, múltiplas imagens, navegação `←`/`→`, `Esc`, restauração de foco, EN/PT-BR, seis temas, diferentes resoluções e Safari/Firefox/Chrome quando disponíveis. Os testes automatizados de contrato não equivalem a teste visual em navegador.
