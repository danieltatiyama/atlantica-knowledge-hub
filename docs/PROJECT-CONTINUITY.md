# Atlantica Online Knowledge Hub — Contexto para Continuidade

**Última atualização:** 24/11/2026  
**Projeto:** Atlantica Online Knowledge Hub  
**Repositório:** https://github.com/danieltatiyama/atlantica-knowledge-hub  
**Branch principal:** `main`  
**Última etapa implementada:** Stage 20.72 (visualizador de imagens global em artigos, zoom, teclado, galeria por artigo e EN/PT-BR)  
**Último PR de funcionalidade integrado:** [#99](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/99) — guia Sistema VIP em PT-BR, 16 imagens compartilhadas, CI aprovado. O guia inglês continua no [#93](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/93); o fluxo CMS é o dos PRs [#94](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/94) e [#95](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/95). Conferir deploy Cloudflare.

> Este documento registra um estado conhecido do projeto, não substitui a consulta à versão mais recente do repositório. Em novas conversas, verificar a `main`, os PRs e os testes antes de iniciar mudanças.

---

## 1. Objetivo do projeto

Estamos desenvolvendo uma Wiki comunitária, pública e multilíngue para o MMORPG **Atlantica Online Global (NA)**.

O objetivo é construir uma base de conhecimento abrangente, acessível, pesquisável e tecnicamente confiável, utilizando principalmente informações extraídas dos arquivos originais do cliente do jogo.

A Wiki deverá oferecer, progressivamente:

- Informações de itens, equipamentos, consumíveis e materiais.
- Receitas de fabricação, ingredientes e relações entre itens.
- Informações de monstros, níveis e possíveis drops.
- Informações sobre mercenários e suas habilidades.
- Guias sobre sistemas do jogo, eventos e Nation Dungeons.
- Ferramentas e calculadoras interativas.
- Eventualmente, funcionalidades para gerenciamento de nações, incluindo calendários de dungeons.

**Princípio fundamental:** a Wiki deve ser pensada para os jogadores, não para desenvolvedores ou pesquisadores dos arquivos do cliente.

Informações técnicas continuam disponíveis para auditoria, mas não devem dominar a interface pública.

## 2. Tecnologias e infraestrutura

O projeto utiliza:

- **Framework:** Astro + TypeScript.
- **Repositório e versionamento:** GitHub.
- **Hospedagem:** Cloudflare Workers.
- **Validação automatizada:** GitHub Actions.
- **Idiomas:** inglês (`en`) e português brasileiro (`pt-br`).
- **Ambiente local:** Windows, VS Code, Node.js e npm.
- **CMS:** Pages CMS, utilizado para gerenciamento de conteúdos editoriais.

O projeto possui componentes Astro, estilos globais, dados estruturados em JSON, scripts de geração de índices e uma suíte de testes automatizados.

Arquivos importantes:

| Arquivo | Responsabilidade |
|---|---|
| `src/layouts/BaseLayout.astro` | Layout global |
| `src/components/Header.astro` | Navegação, idioma e temas |
| `src/styles/global.css` | Estilos originais |
| `src/styles/themes.css` | Temas alternativos |
| `src/components/FloatingWikiNavigator.astro` | Navegação flutuante e seções recolhíveis |
| `src/components/MonsterDatabasePage.astro` | Bestiário e detalhes dos monstros |
| `src/components/MonsterDropItemSearch.astro` | Pesquisa de itens por fonte de drop |
| `src/components/MonsterItemSources.astro` | Links reversos de drops |
| `src/components/FullClientItemDatabasePage.astro` | Banco completo de itens |
| `src/components/ItemCatalogPage.astro` | Catálogo de equipamentos |
| `src/data/client-monster-drop-resolver.mjs` | Resolução dos drops por nível |
| `scripts/generate-monster-level-resolved.mjs` | Geração de índices de drops |
| `scripts/generate-client-craft-links.mjs` | Geração das relações de fabricação |

Antes de modificar qualquer arquivo, consultar sua versão atual no GitHub.

## 3. Estado atual da base de dados

Uma investigação dos arquivos originais do cliente do jogo já foi realizada em conversas anteriores.

Os dados extraídos foram processados, estruturados e parcialmente integrados à Wiki.

### Itens

- **23.586 ItemIDs** catalogados.
- 22.702 IDs com nomes identificados.
- 2.462 IDs classificados como semelhantes a equipamentos.
- 551 perfis de equipamentos previamente revisados.
- 1.911 perfis adicionais derivados dos arquivos originais.

A Wiki possui navegação separada entre:

- **Equipment:** `/items/`
- **All Items:** `/items/database/`

O catálogo completo permite consultar informações, atributos, receitas, materiais necessários, relações de fabricação e possíveis fontes de obtenção.

### Monstros e drops

Os dados originais publicados incluem:

- 4.351 IDs de personagens/criaturas.
- 9.959 registros de drops diretos.
- 5.784 referências a grupos de drops.
- 53 arquivos JSON de origem, protegidos por verificações de integridade.
- 893 IDs de itens presentes na auditoria bruta de drops.

Após a aplicação da resolução por faixas de nível:

- 23.905 relações de drops por grupo são compatíveis com os níveis registrados.
- 822 IDs de itens possuem referências elegíveis de drops.
- 197 referências a grupos permanecem inconclusivas porque o nível da criatura é inferior à primeira faixa disponível.

Essas referências inconclusivas **não devem ser preenchidas por suposição**.

Os arquivos originais devem ser mantidos imutáveis. Índices derivados podem ser regenerados, mas nunca devem substituir os dados de origem.

## 4. Descoberta importante: sistema de drops por faixas de nível

Um problema significativo foi identificado e corrigido na **Stage 20.47 — PR #65**.

Anteriormente, a Wiki podia relacionar monstros a todos os itens de um grupo, independentemente da faixa de nível.

Isso produzia drops incorretos.

### Funcionamento inferido e validado com o jogo

Cada grupo de drops possui registros `GroupBands`, com faixas indicadas por `BandKey`.

A resolução adotada consiste em:

1. Obter o nível original registrado da criatura.
2. Identificar os grupos de drops vinculados a ela.
3. Para cada grupo, selecionar o maior `BandKey` menor ou igual ao nível da criatura.
4. Considerar apenas os registros `GroupDrops` associados à faixa selecionada.
5. Combinar esses itens elegíveis com os drops diretos.
6. Utilizar exatamente esse conjunto de registros nas consultas e nos links reversos.

### Caso de referência: Huge Crocodile

- **CharID:** 289.
- **Nível registrado:** 71.
- **Quantidade de grupos originais:** 4.
- **Quantidade de itens identificados:** 6.

Esses seis itens foram confirmados com capturas de tela da interface do jogo:

| Item | ItemID | Drop estimado |
|---|---:|---:|
| Silver Thread | 7080 | 30% |
| Thick Animal Bone | 8002 | 14% |
| Large Animal Bone | 8003 | 6% |
| Slab of Lumber | 6002 | 10% |
| Pine | 6050 | 10% |
| Secret Material Chest | 20996 | 0,1% |

**Gold Thread (ItemID 7070) NÃO deve aparecer como drop do Huge Crocodile.**

Esse item pertence à faixa de nível 80 de um dos grupos, enquanto o Huge Crocodile possui nível 71.

A correção foi incorporada ao sistema de resolução dos drops e aos índices de obtenção reversa.

### Fórmula de percentual

Para drops provenientes dos grupos, a Wiki utiliza a estimativa:

`Drop (%) = (RawRate do grupo × RawRate do item) / 1.000.000`

Os valores são derivados dos arquivos do cliente.

**Importante:** os resultados são estimativas técnicas, não probabilidades comprovadas do servidor atual.

Não extrapolar automaticamente as classificações qualitativas High, Low e Very Low mostradas no jogo. O usuário decidiu priorizar os percentuais derivados dos arquivos do cliente.

## 5. Integridade dos links de receitas e drops

A Wiki deve manter consistência entre a apresentação dos itens e suas relações reversas.

Exemplos:

- Se um monstro possui um item entre seus drops elegíveis, a página do item deve apontar para esse monstro.
- Se o item pertence a outra faixa de nível, o monstro não deve ser apresentado como sua fonte de obtenção.
- Os links de fabricação devem distinguir corretamente ingredientes, produtos e receitas relacionadas.

A Stage 20.47 implementou índices derivados compartilhados para que o bestiário e as consultas reversas utilizem a mesma resolução de drops.

Os arquivos derivados ficam em:

`public/data/client-monster-discovery/`

A geração é executada automaticamente durante os processos `predev` e `prebuild`.

Evitar implementações paralelas da lógica de drops. **Uma única regra de resolução deve alimentar todos os componentes que apresentam as relações de obtenção.**

## 6. Interface e experiência de utilização

A interface segue uma abordagem comunitária e orientada ao jogador.

Diretrizes já estabelecidas:

- Apresentar informações relevantes primeiro.
- Manter campos internos e metadados técnicos em seções opcionais.
- Utilizar tabelas pesquisáveis e legíveis.
- Evitar páginas excessivamente longas ou visualmente densas.
- Organizar informações em seções recolhíveis quando fizer sentido.
- Preservar compatibilidade com dispositivos móveis.
- Manter idiomas e temas consistentes em todas as páginas.

### Navegação flutuante

Implementada na Stage 20.46 — PR #64.

Funcionalidades:

- Índice flutuante das seções da página.
- Posicionamento à esquerda ou à direita.
- Possibilidade de ocultar e reabrir.
- Preferência persistida no navegador.
- Navegação contextual para perfis abertos dinamicamente.
- Seções recolhíveis e expansíveis.
- Compatibilidade com páginas de guias, monstros e itens.

O índice não deve interferir com a leitura nem ocupar desnecessariamente a área central.

### Temas visuais

Implementados na Stage 20.48 — PR #66.

A Wiki possui seis opções:

1. **Atlantica:** tema original inspirado no jogo, utilizado como padrão.
2. **Dark:** escuro neutro.
3. **Light:** claro.
4. **Parchment:** pergaminho, com tonalidades quentes.
5. **Midnight Blue:** escuro azulado.
6. **High Contrast:** preto, branco e amarelo.

O tema escolhido é salvo em `localStorage` usando a chave `atlantica.theme`.

A preferência deve ser restaurada antes da renderização visual inicial, evitando mudanças perceptíveis de cor durante o carregamento.

O tema Atlantica deve continuar sendo o padrão quando nenhuma preferência estiver armazenada.

### Cabeçalho e contraste

A Stage 20.49 — PR #67 corrigiu:

- Alinhamento dos seletores Theme e Language.
- Labels visíveis em ambos os idiomas.
- Controles com alturas consistentes.
- Organização responsiva em três regiões: logo, navegação e preferências.
- Contraste de tabelas nos temas Light e Parchment.
- Cores de links especiais nos temas alternativos.

O usuário revisou visualmente os temas e confirmou que a interface estava funcionando corretamente antes da última correção de alinhamento. Posteriormente, informou que estava tudo certo.

### Funcionalidades adicionadas nas Stages 20.50–20.54

**Busca global (20.50):** pesquisa unificada de ItemIDs, CharIDs e guias publicados, acessível no cabeçalho e na Home, com filtros por categoria, atalhos `Ctrl/Cmd+K` e `/`, carregamento sob demanda dos índices originais e links para perfis já existentes. Arquivos: `src/components/GlobalSearch.astro` e `src/data/wiki-unified-search.mjs`.

**Perfis (20.51):** atalhos para visão geral, fabricação, itens usados em receitas, monstros e registros técnicos nas páginas do catálogo completo; no bestiário, ações diretas para drops e evidências originais. Preservadas as mesmas regras de drops e receitas.

**Auditoria (20.52):** script `scripts/audit-wiki-data.mjs`, verificador `src/data/wiki-source-audit.mjs` e relatório derivado `public/data/audits/source-quality.json`. O relatório compara índices diretos e reversos por CharID/ItemID, mantém as 197 referências inconclusivas e confere o Huge Crocodile. A interface fica em `/tools/data-quality/`. O relatório é gerado nos scripts `prebuild` e `predev`, após a geração dos índices necessários.

**Calculadora de crafting (20.53):** `/tools/crafting/`, com entrada por nome ou ItemID, expansão recursiva de receitas do cliente, agregação de materiais intermediários antes do arredondamento por batch, limite de 10.000 unidades por operação, escolha explícita entre receitas alternativas, batch manual quando o cliente não possui valor seguro e preços informados pelo usuário. Arquivos: `src/data/client-crafting-planner.mjs` e `src/components/CraftingPlannerPage.astro`. Não converter receitas sem evidência em fatos do servidor.

**Nation Dungeon Planner (20.54):** `/tools/nation-dungeons/`, calendário de 7, 14 e 30 dias com vistas Horas×Dias / Dias×Horas, runs individuais e fixas semanais editáveis, cooldowns configuráveis, armazenamento local, exportação/importação JSON e links compartilháveis. Utiliza `America/Los_Angeles` com reset de 06:00 e conversão IANA para horário local, PST/PDT, UTC, São Paulo, Paris e Tóquio. Os valores iniciais configuráveis são: Avalon 60h, Babel 20h, Yggdrasil 40h, Alcatraz 40h, Pirate 20h. A interface não deve interpretar uma run em cooldown como executada. Arquivos: `src/data/nation-dungeon-calendar.mjs` e `src/components/NationDungeonCalendarPage.astro`.

**Navegação:** hub de ferramentas em `/tools/` e variantes `/pt-br/tools/`, `/pt-br/tools/data-quality/`, `/pt-br/tools/crafting/` e `/pt-br/tools/nation-dungeons/`. Mudanças de idioma e tema devem continuar compatíveis com as novas páginas.

**Testes principais adicionados:** `tests/wiki-unified-search.test.mjs`, `tests/wiki-profile-navigation.test.mjs`, `tests/wiki-source-audit.test.mjs`, `tests/client-crafting-planner.test.mjs` e `tests/nation-dungeon-calendar.test.mjs`.

### Limitações a não esquecer

- Dados extraídos do cliente e cálculos sobre eles não são prova de que o recurso esteja ativo no servidor atual.
- A calculadora não escolhe automaticamente variantes conflitantes e não atribui batch fictício quando a fonte é inconclusiva.
- O calendário considera horários cadastrados pelo usuário, não eventos sincronizados com o servidor. A persistência padrão é local ao navegador; o compartilhamento exige envio manual do JSON ou link.
- Fusos IANA fazem transições de horário de verão; a interface indica horas inexistentes e usa a primeira ocorrência de horas repetidas no fim da DST.
- Testes automatizados aprovados não equivalem a teste visual cross-browser em produção.

### Stage 20.55 — Correções e evolução da calculadora de crafting

A Stage 20.55 corrige a distinção entre informação original do cliente e regra de gameplay confirmada:

- **Todo equipamento:** batch de **1 unidade** e **máximo de 20 unidades por operação** (regra confirmada pelo usuário).
- **Demais itens:** batch do campo original `Unit` quando confiável; quando ausente, pedir valor explicitamente. Preservar o limite geral de 10.000 por operação informado anteriormente.
- Aplicar a mesma regra às páginas de equipamentos e à calculadora. Nunca sobrescrever os valores `Unit` brutos no arquivo, inclusive se nulos.
- Exemplos: Judgment Heavy Armor #645, Unit específico 1, 41 itens resultam em 3 operações; Apocalyptic Heavy Armor #18801, Unit ausente, deve ser calculado com batch 1 e sem pedir input.
- A interface da calculadora passa a oferecer árvore de dependências expansível, distinção entre fabricar e comprar intermediários, lista de compras, preços informados manualmente e persistidos apenas no navegador, CSV, cópia, resumo de etapas e excedentes. Materiais compartilhados são contabilizados uma única vez por ItemID.
- Inspiração de experiência na calculadora de Jana4U (projetos MIT), com implementação original baseada no nosso cliente; não reproduzir experiência, tempo ou skills sem fórmulas e fontes verificadas.
- Código principal: `src/data/client-crafting-gameplay-policy.mjs`, `src/data/client-crafting-planner.mjs`, `src/data/client-craft-batch.mjs`, `src/components/CraftingPlannerPage.astro` e `src/components/ClientCraftingSummary.astro`.
- Documentação detalhada, referências e checklist: `docs/CRAFTING-CALCULATOR-STAGE-20-55.md`.
- Testes específicos: `tests/client-crafting-gameplay-tree.test.mjs` e suites históricas de batches/crafting.

### Stage 20.56 — Controle de quantidade e seleção de receitas

- O jogador confirmou que **não existe fabricação fracionada**. A quantidade solicitada deve ser um múltiplo inteiro do batch.
- Autocomplete restringido a nomes reconciliados com indicação de ingredientes nos registros originais do cliente (`hasMaterials = 1` no índice), com segunda validação da receita interpretada no detalhe. Não equivale a verificação de que a receita está ativa no servidor.
- Slider exibido **depois de escolher o item**, com `min=batch`, `step=batch` e `max=floor(10000/batch)*batch`, sincronizado ao campo `Desired Output` que usa as mesmas restrições.
- Exemplos: batch 50 admite 50, 100, 150...10000; batch 300 admite até 9900; batch 500 admite até 10000.
- Equipamento: batch de 1, quantidade planejada até 10000 e até 20 por operação, podendo distribuir o planejamento em várias operações.
- Dados ausentes: versão alternativa de receita requer escolha; batch de produto não-equipamento ausente requer entrada manual antes de ativar slider.
- O motor `planClientCrafting` mantém arredondamento **somente de intermediários** e rejeita quantidade fracionada para o produto-alvo no modo `strictTargetBatch` usado pela interface.
- Arquivos: `src/data/client-crafting-quantity.mjs`, `src/data/client-crafting-planner.mjs`, `src/components/CraftingPlannerPage.astro` e `tests/client-crafting-quantity.test.mjs`.
- Documentação técnica e limites estão em `docs/CRAFTING-CALCULATOR-STAGE-20-55.md`. Check no GitHub Actions e inspeção visual em produção após integração.

### Stage 20.58 — Árvore e batches de produtos intermediários

- A árvore de crafting usa **oito cores por profundidade**, respeitando os temas Atlantica, Dark, Light, Parchment, Midnight e High Contrast.
- A antiga área de números à direita foi substituída por **uma tabela alinhada** com necessidade no ramo, necessidade total agregada, produção real, unidades por batch, número de batches, total de operações e divisão agrupada das operações (`3 × 10.000 + 1 × 5.000`). Mantidos expandir/recolher e Comprar/Fabricar.
- Todos os itens intermediários aplicam os mesmos limites: batch sempre inteiro; equipamentos no máximo 20 unidades por operação, demais itens no máximo 10.000 unidades por operação. Intermediários acima de 10.000 podem ser produzidos em várias operações, independentemente do limite de 10.000 do slider do produto principal.
- Se um produto intermediário precisar de 250 unidades e o batch for 20, produzir **260 em 13 batches**, manter **10 de sobra** e consumir ingredientes referentes aos **13 batches completos**. Nunca calcular material para apenas 250 unidades.
- As necessidades de um mesmo ItemID que aparece em vários ramos são **somadas antes do arredondamento**, evitando dupla contagem e batches desnecessários.
- Verificação com dados reais do cliente: 10.000 Albert's Special Bait #2319 exigem 35.000 Dumpling #3305 e 35.000 Grilled Pork #3310, com batch 10 e quatro operações para cada subproduto. Pork é compartilhado e totaliza 42.000.
- Motor `splitCraftOperations` em `src/data/client-crafting-planner.mjs`, interface `src/components/CraftingPlannerPage.astro`, regressão `tests/client-crafting-tree-operations.test.mjs`, documentação `docs/CRAFTING-TREE-STAGE-20-58.md`.
- A etapa 20.57 foi reservada para uma checagem de print antigo e não foi integrada como mudança funcional. Verificar sempre os PRs reais em vez de assumir etapas sequenciais.

### Stage 20.59 — Visual de Craft e exportação Excel

- `Craft Schedule` e `Shopping List` recebem painéis mais claros visualmente, tabelas com números alinhados, linhas alternadas e destaque para produção final, operações e preços manuais; permanecem responsivos e compatíveis com os seis temas.
- A árvore exibe **Consumption breakdown** ao lado de **Operation breakdown**, usando a quantidade original do ingrediente **por batch da receita pai** multiplicada pela quantidade de batches realmente produzidos do pai. Cada linha mantém `parentItemId`, `unitsPerParentBatch`, `parentBatches` e `branchQuantity`. Esse cálculo é diferente do `totalRequired` compartilhado de um ItemID.
- Exemplo: 10.000 Albert's Special Bait exigem 35.000 Dumpling `350 × 100`; 21.000 Wheat para Dumpling `6 × 3500`; Pork compartilhado aparece como 14.000 no ramo Dumpling e 28.000 no ramo Grilled Pork, total agregado 42.000.
- Botão **Export spreadsheet (.xlsx)** dentro da árvore gera um Excel real no navegador, sem dependências adicionais. Quatro abas: `Crafting Tree`, `Craft Schedule`, `Shopping List` e `Leftovers`. Inclui toda a hierarquia, mesmo se recolhida visualmente, dados do cliente, lotes/operações, fórmulas de custo sobre preços editáveis, estilos, filtros e cabeçalhos congelados.
- O exportador `src/data/client-crafting-xlsx.mjs` utiliza OOXML/ZIP STORE para evitar chamadas externas, preservar texto contra injeção de fórmula e não arredondar inteiros que ultrapassam a precisão do Excel.
- Documentação técnica: `docs/CRAFTING-STAGE-20-59-EXPORT-UI.md`. Testes: `tests/client-crafting-xlsx-and-ui.test.mjs`; CI foi configurado em `.github/workflows/validate-pr.yml`.
- Após CI, conferir no navegador temas, alinhamento em mobile e a abertura do arquivo Excel; dados brutos do cliente e regras anteriores de crafting continuam intactos.

### Stage 20.60 — Scroll snap nas colunas da Crafting Tree

- A tabela `Crafting Tree` aplica **`scroll-snap-type: x proximity`** no contêiner de rolagem horizontal, com pontos de encaixe alinhados aos cabeçalhos de cada coluna de dados.
- Em telas maiores que 860px, `Item / Recipe` permanece **visível/fixa à esquerda** ao rolar horizontalmente; seu cabeçalho também permanece acima das outras células.
- `ResizeObserver` acompanha a largura real da primeira coluna e ajusta `scroll-padding-inline-start`, evitando que o conteúdo da coluna seguinte fique escondido sob a coluna fixa.
- Em telas de até 860px, a primeira coluna **não fica fixa** para não ocupar a área útil de leitura; o scroll snap continua funcionando.
- Fundo da coluna fixa usa as cores e o nível de profundidade do tema; nenhuma mudança foi feita nos batches, receitas, consumo nem na exportação Excel.
- Código: `src/components/CraftingPlannerPage.astro`. Testes: `tests/client-crafting-column-snap.test.mjs`, executados no GitHub Actions.
- A verificação visual deve incluir Firefox e Chrome, modo claro/escuro/contraste e larguras abaixo/acima de 860px.

### Stage 20.61 — Crafting Tree compacta, consumo por operação e legibilidade do calendário

- **Crafting Tree:** substituição da largura mínima fixa de 1.460px e das larguras percentuais por colunas de largura orientada ao conteúdo e mínimos compactos. Mantidos scroll snap horizontal e Item/Recipe fixa no desktop, sem grandes espaços vazios entre valores.
- **Consumption breakdown por operação pai:** cada linha de ingrediente agora representa grupos de **operações de fabricação da receita pai**, não apenas quantidade por batch × total de batches. A fórmula original continua preservada como informação de origem no tooltip e nos campos brutos.
- Exemplos reais: para 20 Judgment Heavy Armors #645, operação `1 × 20`, Anarchy Stone `1 × 5000`. Para 142 armors, operação `7 × 20 + 1 × 2`, consumo de Anarchy Stone `7 × 5000 + 1 × 500`. Para 10.000 Albert's Special Bait, Dumpling `1 × 35000`, Wheat `3 × 6000 + 1 × 3000`.
- O cálculo agrega material compartilhado e respeita batches inteiros, mesmo quando um intermediário é produzido em múltiplas operações. O XLSX usa a mesma coluna de consumo por operação da Wiki.
- **Nation Dungeon Calendar:** identificada falha de escopo no Astro: células e controles criados em JavaScript não recebiam as regras de CSS dos elementos originais. Estilos `<style is:global>` limitados a `#nation-calendar` corrigem a renderização dinâmica da grade: largura de células, cores ready/cooldown, cabeçalhos fixos, fins de semana, legenda, cooldown inputs e runs cadastradas. Dias/horas e a acessibilidade do scroll foram aprimorados.
- Arquivos centrais: `src/data/client-crafting-planner.mjs`, `src/data/client-crafting-xlsx.mjs`, `src/components/CraftingPlannerPage.astro`, `src/components/NationDungeonCalendarPage.astro`.
- Testes: `tests/crafting-operation-consumption-calendar-readability.test.mjs` e suíte XLSX ajustada; executar build/CI e conferir no browser, inclusive modos claros/escuros e 7/14/30 dias.

### Stage 20.62 — Limite por ingrediente, conclusão reversível e alinhamento

- O jogador confirmou que cada **operação** aceita no máximo **10.000 unidades de cada ingrediente**, além do limite anterior de itens produzidos (20 para equipamentos e 10.000 para outros itens). A quantidade por batch e os materiais usados em um batch continuam sendo os valores exatos dos arquivos do cliente.
- O limite de batches por operação agora é o menor entre `floor(limite de output / quantidade produzida por batch)` e os `floor(10000 / ingrediente necessário por batch)` de **todos** os ingredientes da receita selecionada.
- **Strong Fishing Line #2320:** 200 Colorful Thread por batch de 20, portanto no máximo **50 batches, 1.000 linhas por operação**. **Strong Fishhook #2321:** 100 Large Animal Bone por batch de 20, no máximo **100 batches, 2.000 anzóis por operação**. Para 10.000 Strong Fishing Line, 10 operações; para 10.000 Strong Fishhook, 5 operações.
- **Titanium Fishing Rod #2318:** máximo efetivo de 5.000 unidades produzidas por operação, devido aos ingredientes; suas partes craftadas seguem os próprios limites. **Albert's Special Bait #2319:** plano de 10.000 requer 4 operações (3 × 2.800 + 1 × 1.600), já que uma operação única excederia o limite de Dumpling e Grilled Pork. Total combinado com os dois intermediários = 12 operações.
- Se **um único batch** exigir mais de 10.000 de um ingrediente, a calculadora apresenta impedimento `ingredient-over-limit`, sem fabricar uma divisão impossível de batches.
- A árvore inclui botão **Feito / Done** por ItemID. Ao clicar, o item e seus descendentes deixam de constar do trabalho pendente, de sua lista de compras e de fabricação. Os materiais compartilhados com outras receitas continuam necessários nas quantidades correspondentes aos ramos não concluídos.
- Painel **Concluídos / Completed** permite **Desfazer** individualmente ou **Desfazer todos**. Estado de concluído é apenas da sessão/seleção atual (não altera arquivos brutos do jogo).
- Os valores numéricos das tabelas Crafting Tree, Craft Schedule e Shopping List são centralizados; títulos de itens ficam alinhados à esquerda. O limite exibido no Craft Schedule e XLSX é a capacidade efetiva por operação, inclusive quando limitado por ingrediente.
- Código `src/data/client-crafting-planner.mjs`, `src/components/CraftingPlannerPage.astro`, `src/data/client-crafting-xlsx.mjs`. Novos testes `tests/client-crafting-completion-ingredient-cap.test.mjs`; testes históricos de materiais, operações e consumo atualizados. Detalhes em `docs/CRAFTING-STAGE-20-62-COMPLETION-INGREDIENT-CAPS.md`.

### Stage 20.63 — Investigação de preços fixos do Market

- **Fonte histórica identificada:** projeto open-source `jana4u/atlantica_online_craft_calculator`, arquivo `data/items.yml`, campo `fixed_price`. Metadados `data/info.yml`: 14/11/2025, versão do jogo 462580, não confirmação de preços atuais no servidor Global 2026.
- **1.016 registros históricos** com `fixed_price`; correspondência por nome oficial inglês estritamente igual (case-insensitive) com os **23.586 ItemIDs** da nossa base extraída: **292 ItemIDs com correspondência única**, **724 nomes históricos sem correspondência exata**. Não tentar atribuir ID para nomes não conciliados por suposição.
- Exemplo do usuário adicional: **Rice #3000 = 100 gold** informado pelo jogador e ausente na fonte Jana4U; total do CSV = **1.017 registros**, com **293 registros ligados a ItemID**.
- Três âncoras presentes no `fixed_price` da fonte: **Gold Thread #7070 = 3.000**, **Colorful Thread #7081 = 10.000**, **Mana Potion [II] #2080 = 8.000**. Não confundir **Colorful Thread** (10.000) com **Colorful Fabric** (50.000).
- Dados em `research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv`; metodologia, atribuição MIT e limites em `research/market-fixed-prices/README.md`. Testes `tests/market-fixed-price-research.test.mjs`.
- Esta etapa é **de pesquisa apenas**: não aplica preços da fonte 2025 ao Crafting Calculator e não afirma que 100% dos itens com preço fixo atual estejam cobertos. Para ativar, preservar diferença entre preços do cliente/servidor atuais, referência histórica, informação do jogador e preço manual do usuário.

### Stage 20.64 — Fonte candidata de preços atuais e extrator local

- **Fonte técnica específica**: `LANG/ENG/NPCTRADEITEM/NPCTradeItem_ENG.ndt`. O projeto público `neuronet77/atlantica_online_codex`, módulo `etl/build-shop.mjs`, confirma que o arquivo de **cliente** codifica `Unique, Param, Name, Price`: `Param 0` catálogo geral e `Param 1` habitação. Pesquisa de fórum de 2017 relaciona o equivalente do servidor com a edição de preços fixos do Market. **A equivalência de preços de NPC e preços fixos atuais do Market não está comprovada**.
- Extrator somente leitura `scripts/export-client-trade-prices.py` aceita arquivo NDT v1/v3 (cliente instalado) ou texto já decodificado, usa apenas biblioteca padrão Python, não faz chamadas à internet, não altera cliente do jogo, não acessa contas.
- Execução local sugerida após `git pull origin main`: `py scripts/export-client-trade-prices.py --game-root "D:\\<PASTA_REAL_DO_JOGO>"` (substituir pelo caminho real da instalação com `LANG`).
- Resultados locais em `client-fixed-price-investigation/npc-trade-price-candidate.csv` e `npc-trade-price-audit.json`. Sempre marcar `market_fixed_price_verified=false` e distinguir `general/housing`.
- Benchmarks do jogador de 23/11/2026: **Gold Thread #7070 3.000**, **Colorful Thread #7081 10.000**, **Rice #3000 100**, **Mana Potion [II] #2080 8.000**. Cruzamento adicional com **293 ItemIDs** da fonte histórica de 2025 permite diagnosticar concordâncias, divergências e ausência, sem validar preço atual automaticamente.
- Documentação técnica e comandos: `research/market-fixed-prices/CLIENT-TRADE-STAGE-20-64.md`. Testes com dados sintéticos, sem ativos do jogo: `tests/test_export_client_trade_prices.py` (executados pelo CI Python já existente).
- **Dependência de usuário**: a origem real do cliente está na instalação Windows do usuário e não está disponível na integração GitHub. Para concluir a descoberta de quantos itens o cliente atual cobre, precisamos receber os 2 relatórios locais gerados (não os arquivos do jogo). **Não publicar nem autopreencher** os preços históricos ou NPC como preços fixos verificados do Market antes dessa revisão.

### Stage 20.65 — Resultados reais do cliente e preços de referência não verificados

- Usuário enviou os dois arquivos **reais** gerados pelo extrator Stage 20.64 em 23/11/2026: `npc-trade-price-candidate.csv` e `npc-trade-price-audit.json`. Arquivados como `research/market-fixed-prices/client-npc-trade-2026-11-23.csv` e `...-audit.json`.
- **652 registros NPCTradeItem** sem problemas de parsing, preço zero, repetição ou conflitos; **421 do catálogo geral**, todos com nome inglês reconciliado; **231 housing**, dos quais **227 IDs estão com identidade `collision`** e somente **4 têm nome confiável**.
- Todos os quatro exemplos do jogador conferidos no `general`: Gold Thread #7070 3.000, Colorful Thread #7081 10.000, Rice #3000 100, Mana Potion [II] #2080 8.000.
- **293/293 registros com ItemID reconciliado da fonte Jana4U 2025 coincidem em preço** com a tabela do cliente de 2026, sem diferença ou ausência. Foram identificados outros **128 ItemIDs `general`** além desse conjunto de 293.
- Resultado **não comprova** que o catálogo NPC de 2026 seja um índice exaustivo dos itens vendidos a preço fixo no Market do servidor. Separar `NPC trade reference`, `Market fixed price verified` e `manual prices`; a flag `marketFixedPriceVerified=false` permanece explícita.
- Snapshot de referência pública somente com os 421 itens gerais nomeados em `public/data/client-npc-trade-prices/general.json` e `manifest.json`; 231 housing permanecem somente na pesquisa arquivada.
- Na Crafting Calculator, **Show client references / Ver referências do cliente** consulta o catálogo NPC, exibindo dicas por ItemID, sem aplicar preço automaticamente. Cada item pode receber o preço pelo botão **Usar**, ou o jogador pode optar por **Preencher somente preços vazios**. Preços manuais existentes sempre têm prioridade. A origem NPC é salva separadamente e documentada na lista de compras do Excel.
- Implementação: `src/data/client-npc-price-reference.mjs`, `src/components/CraftingPlannerPage.astro`, `src/data/client-crafting-xlsx.mjs`. Testes e CI: `tests/client-npc-trade-prices-stage-20-65.test.mjs`. Metodologia: `research/market-fixed-prices/CLIENT-PRICE-STAGE-20-65.md`.
- Próximo passo: validar no jogo exemplos dos **128 registros novos** e investigar possível tabela **servidor** com outros preços fixos; não inferir que o Market possua somente 421 preços fixos.

### Stage 20.66 — Fila de verificação manual dos novos preços candidatos

- Dos **421 registros** gerais identificados no NPCTradeItem do cliente, **293** tinham ItemIDs e preços conciliados com o histórico de 2025. Os outros **128** agora formam uma fila reproduzível de revisão em `public/data/client-npc-trade-prices/review-queue.json`, gerada por `scripts/build-market-price-review-queue.mjs` a partir dos CSVs originais imutáveis.
- Novo workbench bilíngue em `/tools/market-prices/` e `/pt-br/tools/market-prices/`: consulta por nome/categoria/ItemID, filtro de revisados, observações de preço fixo igual/diferente, não encontrado ou inconclusivo, com data e descrição da evidência.
- As observações existem **somente no navegador do jogador** (`atlantica.marketPriceReview.v1`), com importação/exportação JSON estritamente validadas. Não viram dados oficiais nem alimentam automaticamente a calculadora; qualquer alegação de verificação por servidor é recusada pelo parser de referências do cliente.
- Pesquisa externa histórica encontrou o mesmo caminho `server/LANG/ENG/NPCTRADEITEM/npctradeitem_eng.ndt` em discussões de servidores privados antigos; **não** foi obtida uma segunda fonte confiável nem o arquivo do atual servidor Global. Não confundir tabela do cliente com disponibilidade atual ou cobertura exaustiva do Market.
- Novas rotas, validador `src/data/market-price-review.mjs`, testes `tests/market-price-review-stage-20-66.test.mjs` e pipeline de integridade. Consultar `docs/MARKET-PRICE-REVIEW-STAGE-20-66.md`.
- Atualização de 23/11/2026: o jogador informou que **todos os 128 preços pendentes correspondem ao Market**. Essa afirmação está registrada separadamente na Stage 20.67, sem pressupor capturas individuais nem auditoria independente.

### Stage 20.67 — Confirmação agregada dos 128 candidatos pelo jogador

- Após a Stage 20.66, o jogador afirmou: **“Todas pendencias estao corretas de acordo com o mercado do jogo”**, em 23/11/2026. Interpretação limitada à lista de **128** ItemIDs pendentes: o jogador informa que seus preços coincidem com o Market. **É um único relato agregado, não 128 capturas individuais, nem auditoria independente**.
- Registo de origem pública `public/data/client-npc-trade-prices/player-report-2026-11-23.json`: contém exatamente os 128 ItemIDs da fila e metadados claros (`sourceType=player-aggregate-statement`, `independentVerification=false`, `marketFixedPriceVerified=false`). Não duplica preços nem muda fontes imutáveis do cliente.
- `parsePlayerMarketAttestation` valida o conjunto exato de IDs, a data do relato e as flags de proveniência; a interface EN/PT-BR mostra **128/128 coincidências relatadas pelo jogador**, separadas das observações locais editáveis. A calculadora continua sem aplicar automaticamente preços NPC.
- Os **293** preços coincidentes com a fonte histórica continuam classificados como comparação entre fontes, **não** como verificação individual adicional pelo jogador. Os **421** registros gerais não comprovam cobertura exaustiva do Market; itens de housing e identidades ambíguas continuam fora.
- Próximo passo: não repetir a coleta da mesma confirmação agregada; investigar possíveis preços fixos fora dos 421 itens gerais e, quando necessária evidência mais forte, recolher capturas datadas ou outra fonte independente.
- Documentação: `docs/MARKET-PRICE-PLAYER-REPORT-STAGE-20-67.md`. Regressão: `tests/market-price-player-attestation-stage-20-67.test.mjs`.

### Stage 20.68 — Catálogo público dos 421 preços (experiência voltada ao jogador)

- Após a revisão visual da página Stage 20.67, o usuário aprovou torná-la um catálogo de preços com menos avisos técnicos. A rota padrão `/tools/market-prices/` e a variante PT-BR agora apresentam os **421 ItemIDs gerais nomeados** da tabela NPC do cliente, com busca, filtros de categoria/origem de evidência, ordenação por preço/nome/ID, 50 itens por página e links para `/items/database/?id=ItemID`.
- As **293** coincidências históricas e as **128** coincidências declaradas por jogador são identificadas de forma distinta, sem confundir o relato agregado com auditoria independente do servidor. Toda a lista mantém preços do cliente como referência; NÃO declarar que os 421 representam o Market completo ou disponibilidade atual.
- Pesquisa antiga, observações individuais locais e importação/exportação JSON continuam acessíveis, sem perda de dados, em `/tools/market-prices/research/` e `/pt-br/tools/market-prices/research/`.
- Novo `public/data/client-npc-trade-prices/catalog.json` derivado exclusivamente de fontes arquivadas e reconciliadas pelo script `scripts/build-market-price-catalog.mjs` (421 entradas = 293+128). Identidade, preços e linhas originais são checados por fonte; arquivos base imutáveis, 231 housing fora do catálogo geral.
- Implementação `src/components/MarketPriceCatalogPage.astro`, `src/data/market-price-catalog.mjs`, testes `tests/market-price-catalog-stage-20-68.test.mjs` e novo passo CI de integridade. Detalhes em `docs/MARKET-PRICE-CATALOG-STAGE-20-68.md`.
- Verificação visual pendente após o deploy: mobile, outros cinco temas, ambos idiomas, filtros, paginação e deep links para itens.

### Stage 20.69 — Subcategoria Others / Outros em Game Systems

- A categoria `game-systems` agora inclui a subcategoria `others` (`Others` em inglês e `Outros` em português), além de Crafting e Equipment & Enhancement.
- A definição canônica `src/data/guide-taxonomy.ts` alimenta os filtros de Guias e a validação do schema em `src/content.config.ts`, mantendo a associação obrigatória `others → game-systems`.
- Os quatro seletores pertinentes do Pages CMS em `.pages.yml` foram atualizados: ações de prévia/criação de guias e coleções editoriais EN e PT-BR.
- `scripts/create-guide.mjs` aceita `--subcategory others` apenas no template `game-systems`; o modo de prévia continua sem escrita de arquivos.
- A branch `dev/i18n` diverge muito da `main`; o [PR #91](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/91) aplica a atualização mínima do CMS/gerador naquela branch, sem mesclar as branches inteiras.
- Novos testes: `tests/game-systems-others-subcategory.test.mjs`. Nenhum artigo existente foi reclassificado nem publicado automaticamente.

### Stage 20.70 — Publicação do guia VIP System e fluxo aprovado do Pages CMS

- O usuário publicou o guia **VIP System** no Pages CMS, em `src/content/guides/en/vip-system.md` na `dev/i18n`. O arquivo tinha `draft: false`, mas faltava `reviewStatus: approved` e não havia integração na `main`. O site público, portanto, não podia mostrar o guia somente com a passagem do tempo.
- O [PR #93](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/93) integrou a publicação à `main`, mantendo o texto original, `game-systems → others`, adicionando a aprovação editorial e copiando **16 capturas originais** byte a byte para `public/images/guides/vip-system/` para evitar colisões com outros guias. CI incluindo SHA1 de Git blobs passou. Rota pública prevista: `/guides/vip-system/` (EN). Ainda conferir deploy real no Cloudflare.
- Para os próximos guias, o [PR #94](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/94) inclui a ação explícita do Pages CMS **Submit approved guide for publication (PR)** e workflow `.github/workflows/pages-cms-guide-submit.yml`, validando `draft:false`, `reviewStatus:approved`, idiomas/slugs e imagens referenciadas. O fluxo copia somente o artigo selecionado e seus arquivos para um PR originado da `main`, executa build e dispara a validação sem mesclar diretamente a branch de desenvolvimento.
- O [PR #95](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/95) incorpora o mesmo fluxo à `dev/i18n`, onde o Pages CMS opera, e registra `reviewStatus: approved` na cópia-fonte do VIP já publicado. Nenhum merge massivo entre as branches divergentes é necessário.
- O usuário ainda precisa **integrar o PR de cada guia** e confirmar o deploy Cloudflare. O workflow com `GITHUB_TOKEN` pode exigir habilitar no repositório a permissão de Actions para criar PRs. Informações e limites em `docs/GUIDE-PUBLISHING.md`.
- Testes: `tests/vip-system-guide-publication.test.mjs` e `tests/guide-publication-cms.test.mjs`. Aprovação editorial não é evidência independente de cada mecânica de jogo.

### Stage 20.71 — Tradução portuguesa do guia VIP System

- O usuário solicitou a tradução integral da versão inglesa já publicada `src/content/guides/en/vip-system.md` e autorização para **reutilizar as 16 imagens existentes**, sem duplicá-las.
- Novo guia `src/content/guides/pt-br/vip-system.md` com título **Sistema VIP**, `translationKey: vip-system`, `category: game-systems`, `subcategory: others`, `draft: false` e `reviewStatus: approved`. Mantidas a estrutura, os conceitos e as quantidades (22 XP diários gratuitos, níveis 0 a 12) da fonte inglesa, sem modificar seu conteúdo.
- As 16 referências usam exatamente os mesmos caminhos `/images/guides/vip-system/image-N.png` do artigo inglês; nenhuma imagem foi regenerada ou copiada, apenas reaproveitada. As imagens são capturas do jogo e podem conter textos em inglês.
- A rota prevista `/pt-br/guides/vip-system/` é gerada automaticamente pela estrutura atual `src/pages/pt-br/guides/[slug].astro`. O seletor EN/PT-BR do artigo reconhece o mesmo `translationKey` nas duas versões.
- Teste `tests/vip-system-pt-br-translation.test.mjs` valida metadados, 16 referências em ordem, imagens existentes, rotas e navegação bilíngue. Novo passo no workflow de validação de PR.
- O [PR #99](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/99) passou GitHub Actions e foi **integrado à `main` em 24/11/2026**, gerando `/pt-br/guides/vip-system/`. Resta confirmar a implantação e a aparência em produção pelo Cloudflare.

### Stage 20.72 — Lightbox global para screenshots de artigos

- Solicitado após a publicação e inspeção visual do guia **Sistema VIP** em PT-BR: capturas pequenas precisam poder ser ampliadas sem editar os arquivos originais.
- `src/components/ArticleImageLightbox.astro` foi integrado a `src/layouts/BaseLayout.astro`; imagens na área `.article-body` dos guias e dos artigos editoriais de eventos/mercenários podem ser abertas com clique, Enter ou Espaço.
- Visualizador modal bilíngue com **ajuste à janela** (inclusive amplia screenshots estreitos), zoom 100–500%, botões `+`/`−` e ajustar, navegação entre imagens do mesmo artigo por setas `←/→`, fechamento por Esc, botão ou clique no fundo. Imagens ampliadas permanecem roláveis, inclusive em telas pequenas.
- Contenção/restauração de foco, bloqueio/restauração de scroll da página, textos acessíveis, tratamento de clique em links existentes e estilos responsivos baseados nos tokens dos seis temas.
- Funções de dimensionamento e navegação em `src/lib/article-image-lightbox.mjs` e testes `tests/wiki-article-image-lightbox.test.mjs`. As **16** imagens compartilhadas VIP EN/PT-BR não foram modificadas ou duplicadas.
- Documento `docs/WIKI-ARTICLE-LIGHTBOX-STAGE-20-72.md`; validação: Node tests + Astro build na CI. **Conferir visualmente após o deploy**, especialmente zoom/fechamento/foco/mobile.
- Feature desenvolvida no [PR #101](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/101), base `main`, com CI e status de integração a verificar no GitHub.

## 7. Histórico das etapas recentes

| Etapa | PR | Entrega |
|---|---|---|
| 20.45 | [#63](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/63) | Drops apresentados de maneira orientada ao jogador |
| 20.46 | [#64](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/64) | Navegação flutuante, seções recolhíveis e separação entre Equipment e All Items |
| 20.47 | [#65](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/65) | Correção dos drops por faixas de nível e links reversos |
| 20.48 | [#66](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/66) | Seletor global de seis temas |
| 20.49 | [#67](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/67) | Alinhamento do cabeçalho e correções de contraste |
| 20.50 | [#69](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/69) | Busca global de itens, monstros e guias |
| 20.51 | [#70](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/70) | Navegação player-first entre seções dos perfis |
| 20.52 | [#71](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/71) | Auditoria de integridade dos índices e hub de ferramentas |
| 20.53 | [#72](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/72) | Calculadora de crafting multietapas e custos manuais |
| 20.54 | [#73](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/73) | Nation Dungeon Planner com DST e rotinas semanais |
| 20.55 | [#75](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/75) | Regra de equipamento 1×20, árvore de crafting, compras, excedentes e custos |
| 20.56 | [#76](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/76) | Autocomplete de receitas e quantidades estritamente múltiplas do batch (1 a 10.000) |
| 20.58 | [#77](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/77) | Árvore colorida por profundidade, tabela alinhada e operações de intermediários em batches completos |
| 20.59 | [#78](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/78) | Visual do Craft Schedule/Shopping List, consumption breakdown por receita pai e exportação XLSX de quatro abas |
| 20.60 | [#79](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/79) | Scroll snap horizontal e coluna Item/Recipe fixa na Crafting Tree, com tratamento para mobile |
| 20.61 | [#80](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/80) | Colunas compactas da árvore, consumo por operação da receita pai, correção visual da grade do calendário |
| 20.62 | [#81](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/81) | Conclusão reversível de produtos, valores centralizados e limite de 10.000 de cada ingrediente por operação |
| 20.63 | [#82](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/82) | Catálogo de pesquisa de 1.016 preços fixos históricos, 292 IDs conciliados, Rice reportado pelo jogador, sem modificar preços na interface |
| 20.64 | [#83](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/83) | Descoberta da fonte candidata NPCTradeItem_ENG.ndt e exportador offline de preços por ItemID/catálogo com 4 benchmarks de validação |
| 20.65 | [#84](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/84) | Extração real 652 preços NPC, 421 gerais nomeados, 293/293 históricos compatíveis; referência opt-in para calculadora |
| 20.66 | [#85](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/85) | Fila reproduzível de 128 candidatos, workbench bilíngue de observações locais e JSON auditável |
| 20.67 | [#86](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/86) | Confirmação relatada pelo jogador para os 128 candidatos, proveniência auditável e exibição separada da verificação independente |
| 20.68 | [#88](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/88) | Catálogo de 421 preços pesquisáveis, filtros e links para itens; ferramenta técnica preservada em /research/ |
| 20.69 | [#90](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/90) | Inclusão de Game Systems → Others/Outros na Wiki, CMS e gerador de guias; complemento `dev/i18n` no [#91](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/91) |
| 20.70 | [#93](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/93), [#94](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/94), [#95](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/95) | Guia VIP aprovado/publicado no código; Pages CMS com ação de envio por PR para main e imagens específicas por guia |
| 20.71 | [#99](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/99) | Tradução integral VIP System em PT-BR, sem duplicação das 16 imagens e com navegação EN/PT-BR |
| 20.72 | [#101](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/101) | Lightbox global para imagens de artigos, zoom, controles de teclado, navegação e temas |

Verificar no GitHub quais dos PRs listados já foram integrados à `main`; o último pode ainda estar em revisão.

**Commit atualizado:** consultar diretamente o HEAD da branch `main` no GitHub; hashes antigos não representam necessariamente a última integração.

Os pipelines do GitHub Actions das Stages 20.50 a 20.54 foram concluídos com sucesso, incluindo os testes novos, validações existentes e build do Astro.

As cinco frentes da rodada 20.50–20.54 foram implementadas e integradas. A verificação visual das novas interfaces em produção continua sendo recomendada, mesmo com os testes automatizados aprovados.

## 8. Como trabalhar nas próximas conversas

**O ChatGPT possui acesso ao repositório por meio da integração GitHub quando ela está conectada e autorizada. Deve utilizá-la quando disponível.**

O usuário prefere que as alterações sejam realizadas diretamente no repositório, em vez de receber códigos extensos para copiar manualmente.

O fluxo de trabalho recomendado é:

1. Consultar o estado atual do GitHub e da branch `main`.
2. Ler os arquivos relevantes antes de propor alterações.
3. Evitar refazer funcionalidades que já foram implementadas.
4. Criar uma branch específica para novas mudanças.
5. Realizar as alterações diretamente no código.
6. Criar ou atualizar testes de regressão.
7. Abrir um Pull Request para a `main`.
8. Conferir o resultado do GitHub Actions.
9. Se as verificações forem concluídas com sucesso e não houver restrições, integrar o PR conforme a autorização do usuário.
10. Informar o PR, o resultado das verificações e o que efetivamente foi alterado.

Se o acesso ao GitHub não estiver disponível na nova conversa, verificar a integração antes de solicitar operações manuais.

Não afirmar que um deploy terminou sem verificar o resultado.

### Requisitos de qualidade

- Priorizar implementações reutilizáveis.
- Evitar duplicação de lógica entre componentes.
- Preservar integridade e rastreabilidade dos dados originais.
- Evitar números ou informações inventadas.
- Separar fatos confirmados, evidências do cliente e hipóteses.
- Manter compatibilidade EN/PT-BR.
- Garantir que alterações nos estilos funcionem nos seis temas.
- Manter bom contraste, alinhamento e legibilidade.
- Considerar desempenho, especialmente nos catálogos com milhares de registros.
- Não alterar cálculos, relacionamentos de dados ou registros originais durante refatorações puramente visuais.
- Validar alterações de interface com testes e, quando possível, inspeção visual.

## 9. Direcionamento para a evolução do projeto

O desenvolvimento deve continuar de maneira incremental, preservando o que já está funcionando.

Possíveis frentes futuras incluem:

**Expansão da base de conhecimento:** novos arquivos extraídos do cliente, novos relacionamentos de itens, monstros, habilidades e demais sistemas do jogo.

**Melhoria de confiabilidade:** novas verificações de receitas, drops, atributos e relacionamentos, com uso de evidências obtidas diretamente no jogo quando disponíveis.

**Melhoria da experiência de uso:** evolução das páginas de itens e monstros, mecanismos de busca, filtros, navegação, responsividade e apresentação dos dados.

**Novas funcionalidades:** evolução das ferramentas existentes, compartilhamento colaborativo de calendários, futuras funcionalidades de nações e relatórios de revisão de fontes. O calendário de Nation Dungeons e a calculadora de crafting já possuem versões iniciais publicadas no código.

Esses são possíveis caminhos, não tarefas já autorizadas para implementação. A próxima atividade deve ser determinada pela continuação da conversa.

## 10. Orientação final para o próximo ChatGPT

Este é um projeto real e em desenvolvimento ativo.

**Não começar do zero. Não propor reconstruir a Wiki. Não presumir que recursos existentes ainda precisam ser implementados.**

Consultar o repositório, entender sua arquitetura atual e dar continuidade ao desenvolvimento a partir do último estado validado.

As informações extraídas do cliente representam uma vantagem importante do projeto e devem ser tratadas como uma base técnica auditável.

A Wiki, porém, deve continuar priorizando aquilo que o jogador deseja saber: o que é um item, como fabricá-lo, onde encontrá-lo, quais monstros podem fornecê-lo e quais informações são efetivamente confiáveis.

Sempre que uma nova funcionalidade for implementada, avaliar seu impacto nas demais partes da Wiki, especialmente nos links de receitas, drops e páginas relacionadas.

**Estado documentado: Stage 20.72 em desenvolvimento: lightbox global de imagens em artigos de Guias, Eventos e Mercenários, com zoom, teclado, navegação circular e EN/PT-BR. Implementação no PR #101, aguardando a validação e integração na main. Não foram alteradas as 16 imagens do VIP System. Após o deploy, validar a experiência visual no navegador, temas e mobile. A Stage 20.71 e o fluxo CMS (#94/#95) permanecem integrados.**
