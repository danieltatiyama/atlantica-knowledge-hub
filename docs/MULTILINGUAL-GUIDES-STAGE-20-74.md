### Stage 20.74 — Base multilíngue e piloto Sistema VIP

- O usuário aprovou a expansão para francês, alemão, espanhol, coreano, chinês simplificado e japonês, além do inglês e PT-BR já existentes. Inglês continua sendo a fonte editorial. A primeira entrega é **Home + Game Guides**, não tradução integral de toda a Wiki.
- Registro canônico em `src/i18n/locales.mjs`: `en`, `pt-br`, `fr`, `de`, `es`, `ko`, `zh-hans`, `ja`; nomes nativos, tags BCP 47, rotas e fallback. `additional-ui.ts` contém 312 mensagens (52 chaves × seis idiomas). A navegação, schema, `hreflang`, data, taxonomia e busca de guias foram generalizados.
- Rotas Home, listagem e artigo dos seis novos idiomas foram criadas; módulos ainda não traduzidos usam rotas inglesas e a página inicial avisa sobre essa limitação. O seletor procura a tradução pelo mesmo `translationKey`; se não houver, abre a listagem localizada. Tipografia CJK usa fallback de sistema.
- **Sistema VIP** foi traduzido para os seis idiomas como piloto, conservando texto-fonte, dados, nomes de jogo e 16 imagens compartilhadas, inclusive o menu sem dados do jogador da Stage 20.73. Traduções produzidas por IA, não revisadas por falantes nativos. O texto dentro das capturas permanece em inglês.
- `tests/guide-eight-locales.test.mjs` verifica registro, completude de dicionários, rotas e referências/termos do piloto; CI executa o build completo. A interface compartilhada fora de Home/Guides (busca, lightbox, rodapé e ferramentas) ainda possui textos EN/PT-BR; não declarar internacionalização completa.
- A próxima Stage 20.75 implementará motor de tradução por provedor configurável e validação de Markdown/termos; Stage 20.76 integrará sincronização por hash e PR de publicação. Nenhuma API paga foi chamada e nenhuma chave foi criada nesta etapa.


### Scope and QA

This initial release localizes home and guide routes, with explicit English fallback to existing modules. The English article is the source of truth; manually prepared AI-assisted pilot translations share the same original images. Do not automatically overwrite existing Portuguese or human-corrected translations. The automated engine and CMS integration will be built separately. Test in all eight locales, including mobile, CJK glyph rendering, guide filter/search, translated article switching, sitemap and canonical/alternate URLs. The GitHub build is not browser QA.
