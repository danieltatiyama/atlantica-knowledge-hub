# Atlantica Online Knowledge Hub — Contexto para Continuidade

**Última atualização:** 25/11/2026  
**Projeto:** Atlantica Online Knowledge Hub  
**Repositório:** https://github.com/danieltatiyama/atlantica-knowledge-hub  
**Branch principal:** `main`  
**Última etapa integrada:** Stage 20.85b — Skill comparison\
**Último PR integrado:** #155, commit 318b97852484d7251a7b922ea2430f6a10aab682; CI #319 aprovado, deployment a confirmar.

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
- Feature integrada na `main` pelo [PR #101](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/101), com testes e build Astro aprovados. Resta inspeção no navegador após o deploy.

### Stage 20.73 — Troca preventiva da primeira captura do Sistema VIP

- O usuário enviou outra captura do menu *Aca VIP* sem informações do jogador, solicitando substituir a **primeira imagem** compartilhada nos artigos VIP EN/PT-BR.
- Na `main`, os dois Markdown passam a apontar para `/images/guides/vip-system/vip-menu.png` e a antiga `public/images/guides/vip-system/image-1.png` é **retirada da árvore publicada** para não continuar sendo distribuída em novos builds nem ficar presa ao mesmo URL por cache.
- A substituta mantém as dimensões **129×399**, é um PNG indexado otimizado a partir da imagem fornecida e possui Git blob SHA `c0341bdaa2f9a4748ec8d26e7b7118f58363c96d`. As outras 15 capturas permanecem idênticas e inalteradas; testes foram ajustados para exatamente 16 referências compartilhadas.
- A `dev/i18n` usada pelo Pages CMS também precisa trocar a referência do guia para a nova imagem, disponibilizar o mesmo blob e excluir o antigo `public/images/guides/image-1.png` (referência genérica sem outros artigos dependentes), evitando uma republicação involuntária da captura antiga.
- A exclusão da árvore atual **não reescreve histórico Git**, versões já publicadas ou caches externos antigos; não afirmar eliminação retroativa de todos os vestígios. Para remoção retroativa desses locais seria necessário um procedimento separado de privacidade e purga do histórico/cache.
- Confirmar CI e integração do [PR #103](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/103) na main e do [PR #104](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/104) em dev/i18n, atualização do deploy Cloudflare e que a imagem segura aparece em EN/PT-BR no site; verificar se o URL antigo da imagem retorna 404 após a publicação.

### Stage 20.74 — Base de internacionalização para oito idiomas

- Implementação no [PR #107](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/107), branch `feat/stage-20-74-eight-guide-locales`. Consultar CI e integração no GitHub.
- Registro comum `src/i18n/locales.mjs`: inglês, PT-BR, francês, alemão, espanhol, coreano, chinês simplificado e japonês. Chinês tradicional não é tratado automaticamente como simplificado.
- Novas rotas estáticas reutilizáveis `/[locale]/`, `/[locale]/guides/` e `/[locale]/guides/[slug]/`; EN/PT-BR mantêm as URLs existentes. Schema de guias aceita os oito idiomas, sem mudar schemas editoriais de eventos e mercenários.
- Tradução das 52 mensagens compartilhadas de Home/Guides, controles principais do cabeçalho e taxonomia dos guias; seletor dinâmico, preferência de idioma do navegador, hreflang e fallback de fontes CJK.
- Ferramentas, bases de dados e módulos não traduzidos continuam disponíveis em inglês para novos idiomas. Alguns componentes compartilhados (busca global, índice flutuante, lightbox e rodapé) ainda conservam textos EN/PT-BR. Guias sem tradução remetem à listagem de destino e aos guias em inglês.
- Testes: `tests/wiki-eight-locales.test.mjs` e `scripts/check-built-guide-locales.mjs`, integrado à CI para conferir 16 páginas geradas (Home e listagem de guias), hreflang e rotas VIP existentes.
- **Limite de escopo:** nesta etapa não são gerados artigos traduzidos nem alterado o Pages CMS. Próxima etapa 20.75: pipeline de tradução a partir do inglês, proteção de Markdown e termos, glossário, geração de rascunhos e validação. Stage 20.76: versionamento, PRs e sincronização. Não configurar serviços pagos ou segredos sem decisão do usuário.

### Subcategoria Introduction / Introdução em Mercenaries

- A taxonomia de guias inclui `introduction` exclusivamente sob `mercenaries`, antes de Skills e Builds & Formations, com rótulos nos oito idiomas.
- O gerador de rascunhos e os quatro seletores do Pages CMS aceitam a nova opção; a branch editorial `dev/i18n` recebe atualização equivalente da taxonomia bilíngue, gerador e CMS.
- Teste de regressão: `tests/mercenaries-introduction-subcategory.test.mjs`. Nenhum artigo foi criado, publicado ou reclassificado automaticamente. Verificar PRs, CI e deploy antes de considerar a mudança disponível em produção.

### Stage 20.78 — Traduções complementares da interface compartilhada

- O seletor de idioma já disponibilizava os oito idiomas, mas a auditoria identificou textos exclusivamente EN/PT-BR na Home e nos componentes compartilhados. A captura do jogador também foi afetada pelo tradutor automático do navegador.
- `src/i18n/shared-ui.mjs` registra 67 mensagens em oito idiomas para cards da Home, busca global, rodapé, navegação flutuante, lightbox, breadcrumbs e acessibilidade. O layout entrega o idioma real aos controles e protege os nomes dos idiomas no seletor contra tradução automática.
- Testes de paridade, chamadas e controles dinâmicos em `tests/wiki-shared-localization.test.mjs`; verificação de textos no HTML gerado em `scripts/check-built-guide-locales.mjs`. Nomes de itens e monstros permanecem nos dados do cliente; módulos de catálogos e ferramentas ainda usam rotas EN/PT-BR, com fallback explícito.
- Não traduzir novamente os artigos existentes nem inventar nomes oficiais. Confirmar CI e deploy antes de declarar a mudança publicada.

### Stage 20.79 — Fluxo editorial e matriz de traduções

- O Pages CMS de `dev/i18n` não tinha os campos de aprovação que a ação de publicação exige. A configuração de guias EN/PT-BR agora contém os mesmos controles de Draft e Editorial Status da main, com status e translationKey visíveis nas listagens.
- Ação **Check guide translations (8 languages)** consulta a main via workflow `guide-translation-requests.yml`, somente leitura, sem API de tradução ou escrita de conteúdo. A matriz em `summary.md` também aparece no resumo do GitHub Actions; o artifact continua disponibilizando `status.json` e os pedidos.
- O relatório distingue cobertura publicada, sincronização por hash, tradução manual e candidatos de revisão. Rascunhos ingleses e mudanças não integradas do CMS ficam fora. Nenhuma tradução existente foi modificada.
- Testes: `tests/guide-editorial-status.test.mjs`, export real no CI. Conferir PRs, CI e a ação real no Pages CMS antes de declarar o fluxo validado visualmente.

### Stage 20.80a — Primeiras listagens de catálogos multilíngues

- Catálogo de equipamentos, eventos e mercenários possuem listagens para oito idiomas, com 58 mensagens em `src/i18n/catalog-ui.mjs`. Home, cabeçalho e seletor usam as rotas localizadas declaradas em `LOCALIZED_CATALOG_PATHS`.
- Preservados os 2.462 IDs, nomes em inglês, categorias brutas, valores, filtros e ordenação. Fichas de equipamentos, boxes, pesquisa lendária, banco completo de itens e monstros permanecem EN/PT-BR. As listagens avisam sobre páginas e nomes em inglês; eventos e mercenários exibem somente artigos aprovados e verificados, em inglês para idiomas adicionais.
- Testes de cobertura, rotas, fonte e HTML gerado em `tests/wiki-localized-catalogs.test.mjs` e `scripts/check-built-guide-locales.mjs`. Não declarar a Stage 20.80 integralmente concluída: próximos incrementos são banco completo de itens, monstros/drops, fichas e boxes. Nomes oficiais por idioma dependem de fonte de localização verificada.

### Stage 20.80b — Banco completo de itens multilíngue

- `FullClientItemDatabasePage.astro` oferece interface nos oito idiomas, incluindo busca, filtros, atributos, comparação, fichas carregadas por ID, receitas, materiais, batch, fontes de drops, dados originais e estados dinâmicos. Dicionário `item-db-ui.mjs` e suas duas partes: 215 mensagens/termos, com placeholders protegidos. Nomes de itens/monstros, categorias e códigos técnicos originais permanecem preservados.
- Seis rotas adicionais `/[locale]/items/database/`; Home, cabeçalho, catálogo de equipamentos e busca global direcionam à página localizada. Troca de idioma preserva `?id=`. Fichas individuais de equipamentos, monstros, ferramentas e boxes ainda usam fallback EN/PT-BR. CSV mantém esquema e delimitadores EN/PT-BR para compatibilidade; aviso explícito nos demais idiomas.
- Preservados 23.586 IDs, 22.702 nomes, 7.560 IDs com atributos numéricos e regras de crafting e drops; formatação de percentuais aceita locale sem alteração da inferência. Testes de mensagens, placeholders, rotas, dados e build. Não presumir revisão linguística nativa, nem publicação Cloudflare sem confirmação.
- Próxima etapa: 20.80c — banco de monstros e fontes de drops; depois fichas individuais e páginas complementares.

### Stage 20.80c — Bestiário e códice de drops multilíngues

- `MonsterDatabasePage.astro`, `MonsterDropItemSearch.astro` e `MonsterItemSources.astro` utilizam dicionários por escopo em `monster-ui.mjs` para oito idiomas. Rotas adicionais `/[locale]/monsters/`, Home, cabeçalho, pesquisa global e links do banco de itens preservam idioma e parâmetros `?id=` / `?item=`.
- Os 4.351 IDs, 9.959 drops diretos, 822 ItemIDs com drops por nível e 197 referências sem faixa correspondente continuam inalterados. Nomes, valores brutos, arquivos e regra BandKey permanecem originais. Traduções não revisadas por falantes nativos.
- CI: testes de completude, links e páginas geradas. Próximas etapas 20.80d/e: fichas de equipamentos e páginas complementares; não declarar o conjunto completo antes dessas etapas.

### Stage 20.80d — Fichas de equipamentos e limite de arquivos

- Dicionário `equipment-ui.mjs` reutiliza termos dos dicionários anteriores e acrescenta mensagens das fichas, painel de item, requisitos, dados originais, fabricação e projeções. Os componentes de ficha revisada e de origem foram adaptados sem modificar os dados.
- Seis idiomas adicionais recebem as 551 fichas revisadas estáticas. Os 1.911 equipamentos de origem continuam com fichas dedicadas EN/PT-BR e apontam para a ficha dinâmica localizada do banco completo nos demais idiomas. Todas as 2.462 identidades têm destino no idioma selecionado; a versão detalhada original permanece acessível. O cabeçalho usa alternates reais para fichas revisadas e preserva o ID no fallback.
- Gerar 2.462 × 8 = 19.696 páginas de equipamento, além dos demais assets, deixaria o deploy próximo ou acima do teto de 20.000 arquivos do Cloudflare Workers Free. Não assumir plano pago; CI verifica limite de 20.000 assets. Referência: https://developers.cloudflare.com/workers/platform/limits/#static-assets.
- Testes de tradução, rotas, contagem e HTML. Restam páginas de boxes e pesquisa lendária (20.80e), ferramentas (20.81) e nomes oficiais (20.82). As traduções não são revisão nativa. Conferir deploy Cloudflare.

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
| 20.73 | [#103](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/103) + [#104](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/104) | Substituição da primeira captura VIP por versão sem dados do jogador; atualização dos dois idiomas e da fonte do CMS |
| 20.74 | [#107](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/107) | Registro de oito idiomas, rotas de guias, interface principal e testes de build |
| 20.75–20.76 | [#108](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/108) | Motor de tradução, seis rascunhos VIP, status por hash, geração opcional e aprovação por PR |
| 20.77 | [#110](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/110) | Traduções dos dois guias públicos em oito idiomas, sem ativação de API externa |

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

### 8.1. Referências comunitárias permanentes e validação cruzada

Por orientação do usuário em 25/11/2026, utilizar regularmente Wikidot e Fandom como fontes complementares de pesquisa, comparação e interpretação dos arquivos do cliente Global, em todas as frentes da Wiki, não apenas mercenários e habilidades.

Referências:
- Atlantica Online Wiki (Wikidot): https://atlantica-online.wikidot.com/
- Wikidot histórico: https://atlanticaonline.wikidot.com/
- Atlantica Wiki (Fandom): https://atlantica.fandom.com/wiki/Atlantica_Wiki:Main

Diretrizes:
- Consultar páginas pertinentes ao investigar itens, equipamentos, receitas, monstros, drops, mercenários, habilidades, atributos, fórmulas e mecânicas. Usar as referências para reconhecer nomenclatura, relacionamentos, campos desconhecidos e casos de teste.
- Comparar com o snapshot identificado do cliente Global (NA), notas oficiais de atualização e evidências obtidas no jogo, quando disponíveis. Distinguir dados do cliente, comportamento observado no servidor, fontes comunitárias e hipóteses; dados locais não provam sozinhos o comportamento do servidor.
- Considerar data da página, versão, servidor e modo de combate (por exemplo PvE/PvP/TBS). Registrar divergências e lacunas; não sobrescrever dados brutos nem inferir IDs, valores ou relações ausentes como fatos.
- Informações comunitárias podem complementar conteúdo não presente no cliente, desde que atribuídas e qualificadas. Usar redação própria, citar a página específica e, quando possível, data/revisão; respeitar licenças e direitos de textos, imagens e outros materiais. Não copiar indiscriminadamente conteúdo ou assets.
- Não interpretar uma tradução comunitária como nome oficial de cliente regional sem evidência correspondente. Preservar o nome inglês original e a política de aliases não oficiais.
- Aplicar esta política também à investigação e revisão de dados futuros, registrando evidências e limitações relevantes na documentação de cada etapa.

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

**Estado documentado: Stage 20.73 integrada à `main` no PR #103, com CI e build aprovados, e à `dev/i18n` no PR #104. Os artigos VIP EN/PT-BR e a fonte do CMS apontam para `/images/guides/vip-system/vip-menu.png`; a captura antiga está ausente das árvores atuais dessas branches. As 15 imagens restantes não foram modificadas. Confirmar deploy e cache Cloudflare. A exclusão não reescreve histórico Git nem elimina cópias anteriores em caches externos.**

**Continuação:** Stages 20.74–20.76 integradas nos PRs #107–109. O usuário decidiu continuar com traduções no próprio ChatGPT, adiando a escolha de provedor externo. Stage 20.77 no PR #110: revisão assistida dos seis textos VIP e tradução dos seis textos de planejamento de dungeons; 16 páginas de guias em oito idiomas após publicação. EN/PT-BR existentes e imagens preservados; Avalon e teste continuam rascunhos. As traduções recebem provenance machine-assisted, hash da origem e revisão assistida, sem atestado de falante nativo. Antes de atualizar, consultar o original e o estado do PR, preservar alterações manuais, executar CI e confirmar o deploy. O provedor permanece desativado; não é necessário configurar API, credenciais ou orçamento neste momento. Consultar docs/GUIDE-TRANSLATION-PIPELINE.md.


### Stage 20.80e — complementary catalogs

- Equipment box listings, registry/detail templates, historical Legendary research and Dell'arte's Ambition evidence views now have eight locale routes and localized UI. Calculator formulas, IDs, source data, names and uncertainty remain unchanged.
- Approved English editorial box content is reused with an explicit fallback note until reviewed translations exist; no unapproved draft is published.
- Dedicated reviewed profiles (551) are localized; 1,911 source-only items remain available via localized dynamic database profiles. Standalone legacy detail articles remain EN/PT-BR. Static asset ceiling remains 20,000.
- Stage 20.81 (tools) and Stage 20.82 (verified official client names) are separate work; translations are editorial, not asserted official game terminology.


### Stage 20.81a — Hub de ferramentas e Nation Dungeon Planner

- Hub e calendário em oito idiomas; `tools-ui.mjs` traduz interface estática, mensagens de execução, legenda e controles. Dias da semana via Intl e locale selecionado. Rotas `/[locale]/tools/` e `/[locale]/tools/nation-dungeons/`, navegação Home/cabeçalho e alternates.
- Preservados motor do calendário, reset 06:00 America/Los_Angeles, DST, cooldowns editáveis, orientação, horizontes 7/14/30, storage keys, formato JSON e links. O seletor de idioma mantém a query `?plan=`. Erros técnicos do motor podem permanecer em inglês.
- Ferramentas ainda não localizadas continuam acessíveis em EN/PT-BR; hub explicita fallback inglês nos seis idiomas adicionais. Próximos incrementos: crafting (incluindo mensagens dinâmicas e XLSX), preços de mercado/pesquisa e auditoria de dados. Não declarar a Stage 20.81 completa antes de validá-los.
- Traduções sem revisão nativa; deploy Cloudflare precisa de confirmação.


### Stage 20.81b — Crafting Planner multilíngue

- Interface estática/dinâmica em oito idiomas, 139 mensagens dedicadas mais dicionário de ferramentas. Rotas localizadas e links a partir das fichas; seletor preserva `?id=`.
- Exportação XLSX: quatro abas, cabeçalhos, estados e proveniência traduzidos nos seis idiomas adicionais; fórmula OOXML, números, nomes, estrutura e versões EN/PT existentes preservados. CSV mantém cabeçalhos estáveis em inglês. Alguns erros internos do motor podem continuar em inglês.
- Sem alteração no motor de crafting, limites, hierarquia, arredondamento, estado de preços e chaves de armazenamento. Trocar idioma preserva ID e preços persistidos, não necessariamente o plano de trabalho em memória. Traduções sem revisão nativa. Verificar deploy.
- Restam 20.81c preços de mercado/pesquisa e 20.81d auditoria.


### Stage 20.81c/d — Preços e auditoria

- Market Price Catalog (421 preços), Market Price Research (128 candidatos) e Data Quality (auditoria gerada) com interface nos oito idiomas; avisos, estados dinâmicos, fontes e contagens traduzidos. Links de ItemID permanecem no idioma escolhido.
- Sem alteração de preços, evidência Jana4U (293), relato agregado do jogador (128), arquivos brutos, regra de drops ou 197 referências inconclusivas. Observações locais e JSON continuam no formato anterior; não são enviadas ao servidor.
- As seis rotas de ferramentas agora existem nos oito idiomas; removido aviso temporário do hub. Algumas mensagens de erro técnico internas podem permanecer em inglês. Traduções editoriais, não revisão nativa.
- CI verifica rotas, mensagens, relatórios e HTML gerado. Stage 20.82: adquirir e reconciliar localizações oficiais dos clientes por ID, sem inventar nomes ou substituir nomes ingleses.


### Stage 20.82a — Nomes não oficiais (novo escopo)

- O usuário informou que não teremos dados dos clientes regionais. Não será possível confirmar nomenclatura oficial nos sete idiomas adicionais; preservar sempre o inglês do cliente Global como referência.
- Início de um registro de traduções assistidas por IA e não oficiais, separadas dos dados brutos. `src/data/wiki-name-aliases.mjs`: 20 materiais e um monstro de identidade verificada no snapshot 1, sete traduções por identidade. Consulta exige tipo, ID e nome inglês exatamente igual ao original; sem aliases para IDs inconclusivos ou nomes alterados.
- Busca global e banco de itens permitem procurar traduções, mantendo nome inglês e indicação visível de tradução não oficial. CJK de um caractere é aceito na busca global para correspondência exata, sem reduzir o mínimo de dois caracteres em alfabetos latinos.
- Sem alteração dos dados extraídos, IDs, fórmulas, contagens ou rotas. Não confundir esta cobertura piloto com tradução integral de nomes. Não há revisão nativa. A expansão pode priorizar materiais, itens relevantes, monstros e, posteriormente, mercenários/habilidades com IDs estáveis. Avaliar integração nas demais ferramentas e catálogos antes de ampliar em massa.
- Testes confrontam o registro com os índices reais; entradas sem fonte correspondente são rejeitadas pelo CI. A obtenção de nomes regionais oficiais fica suspensa.


### Stage 20.82b/c — Integração e glossário inicial

- Aliases de nome inglês + tradução auxiliar não oficial integrados em nove componentes adicionais: bestiário, busca de drops por item, fontes de criaturas, crafting, catálogo/pesquisa de preços, catálogo de equipamentos e fichas revisadas/de origem. Busca mantém IDs/nomes ingleses e permite aliases no idioma selecionado.
- Valores, fórmulas, exportações CSV/XLSX, dados brutos, preços e registros do jogador permanecem iguais. Exportação continua com nomes originais. As páginas de boxes e demais referências específicas ainda não receberam integração individual; mercenários e habilidades dependem de índices de identidade próprios.
- Glossário editorial inicial de 36 termos em oito idiomas, em `src/i18n/wiki-name-glossary.mjs`. Política em `docs/WIKI-NAME-TRANSLATION-POLICY.md`. Não é tradução oficial, não faz substituição automática e não reescreve os dicionários de interface anteriores.
- Cobertura de nomes permanece piloto (21 IDs, 147 aliases); expansão de materiais e equipamentos é etapa 20.82d, seguida de monstros e mercenários/habilidades. Sem revisão nativa; confirmar deploy.


### Stage 20.82d1 — Materiais e consumíveis (primeiro lote ampliado)

- 145 materiais/alimentos e 75 consumíveis/itens de aprimoramento adicionais, conciliados com IDs e nomes ingleses exatos do snapshot 1. Total: 240 itens e 1 monstro, 1.687 aliases auxiliares nos sete idiomas adicionais. 175 dos 421 itens do catálogo de preços têm aliases.
- Famílias de poções, pergaminhos e pedras mantêm marcadores romanos; Enchant Stone e Enhance Stone permanecem distintos. Nenhum ID é inferido por sequência numérica. Arquivos brutos e exportações permanecem inalterados.
- Módulos separados de materiais e consumíveis. `node scripts/report-wiki-name-alias-coverage.mjs` mede cobertura por categoria. Testes de identidade usam índices em Map para suportar futuras expansões.
- Cobertura parcial, não revisão nativa e não nomes oficiais. Ainda faltam equipamentos e outras famílias de itens, monstros e índices estáveis de mercenários/habilidades. Deploy não verificado.


### Stage 20.82d2 — Equipamentos revisados e integração complementar

- 554 aliases descritivos de equipamento: 551 fichas revisadas + três referências adicionais do catálogo NPC (1300, 3762, 3763). Cada tipo de equipamento foi localizado nos sete idiomas; a família original inglesa é preservada (ex.: Espada — Twilight). Não é tradução integral de nome oficial.
- Total atual: 794 itens, 1 criatura; 5.565 aliases (incluindo famílias de equipamento). Busca aceita palavras em qualquer ordem no alias; nenhuma alteração de identidade, stats, preços, receitas ou exportações.
- Integração também em tabelas de boxes com IDs resolvidos, receitas e backlinks de fabricação. Nome bruto continua visível. Sem inferência de identidade a partir de texto de artigo.
- Cobertura ainda parcial do catálogo completo; nomes de famílias e nomes próprios permanecem em inglês nos aliases descritivos. Restam demais itens, monstros e a extração de índices de mercenários/habilidades. Sem revisão nativa; conferir deploy.


### Stage 20.82e1 — Monstros, primeiro lote

- 110 traduções adicionais de criaturas de níveis iniciais (CharID e nome inglês exato), selecionadas no índice original, sem inferir presença atual no servidor. Total: 111 criaturas de 4.350 nomes reconciliados, 794 itens de 22.702 nomes conciliados, 6.335 aliases nos sete idiomas adicionais; 272/421 referências NPC cobertas.
- Os módulos já integrados (bestiário, pesquisa global, drops, fontes) consomem o novo registro. Dados de combate, drops e IDs inalterados. Testes cobrem pesquisa por CharID/idioma e correspondência da identidade.
- A expansão de nomes ainda é parcial. Stage 20.82f não deve associar habilidades ou mercenários a IDs sem uma fonte atual: faltam índices explícitos desses tipos no repo. Para prosseguir com os perfis, obter exportação Miner do Global com identificadores/nomes ingleses de mercenários, Magic_Kind/MagicIDentyCode/nomes ingleses de skills e associação mercenário → habilidades quando disponível. Não é necessário cliente regional. Arquivos antigos podem auxiliar, mas versão e correspondência devem ser verificadas.
- Sem revisão nativa e sem confirmação de deploy.


### Stage 20.82f0 — Investigação da fonte de habilidades e tipos de personagem

- Em 25/11/2026 o usuário enviou seis arquivos Global, convertidos localmente para UTF-8. Por decisão expressa, o decoder fica fora do repositório. Apenas o exportador de candidatos `scripts/export-client-skill-candidate.py` é versionado.
- `SkillInfoIndex.ndt`: seções SKILL_INDEX e SKILLINFO_INDEX permitem ligar SkillIndexName → SkillIndex → MagicName, TxtIndex (nome), ExpUnique (descrição). Os 1.336 registros têm correspondência exata para MagicCode, nome e descrição. Existem 1.234 nomes ingleses distintos; não deduplicar por nome.
- `MagicIndex.ndt`: 1.339 códigos únicos, incluindo três chaves TBS. `Magic.ndt`: 9.537 linhas válidas, 99 campos e 1.310 chaves com grades dentro de <Data>/<End>. A chave composta Magic_Kind + Grade é única; MagicIDentyCode não equivale a MagicCode. 26 skills sem grades (incluindo 1343 Arrow of Swiftness); preservar ausência. Dez linhas incompletas após <End> não são registros válidos.
- `CharKindInfo.ndt`: 7.216 códigos de tipo únicos e dois nomes internos repetidos. `TextMgr_CharInfo_ENG.ntx`: 6.864 textos. Não juntar por igualdade numérica CharKindCode = TextID: pertencem a namespaces diferentes. Não chamar todos os tipos de mercenários. Ainda faltam identidade de classe, atributos, vínculo com skills e distinções de modo.
- TextMgr Magic contém 2.813 textos, revisão 26634; CharInfo revisão 26650. Ambos declaram exportação de 19/11/2026, sem confirmar a data dos demais arquivos.
- Validação local dos seis arquivos: integridade de chaves, nomes e descrições, formato de 99 campos, unicidade de grade, casos Silence (SkillIndex 2, MagicCode 1), Freezing Axe (7, 6), Swift Arrow (1343, sem grade). Wikidot e Fandom corroboram nomes e efeitos gerais de Silence e Freezing Axe; não são prova de vínculo numérico.
- Candidato local gerado em JSON, não incluído em public/ nem publicado. Executar `py scripts/export-client-skill-candidate.py "D:\path\to\decoded" "D:\path\to\candidate"` com diretório de destino inexistente. Exporta skills.json, magic-grades.json, character-kinds.json e audit.json (hashes dos seis inputs). Dados de texto/atributos originais mantidos apenas no pacote privado de revisão; não há interface pública nesta etapa.
- Próximo passo: investigar CharInfo/CharEtcInfo.ndt, LGCLASSINFO.NDT, LANG/ENG/CharInfo/LGClassInfo_ENG.ndt, ONELEVELSOLINFO.NDT e OneLevelSolInfo_ENG.ndt, além dos arquivos de personagem binários ou exportação Miner que comprovem CharID/Kind/texto/skills. Verificar origem de Magic.ndt (raiz vs LANG/ENG) e comparar MagicPVP.ndt, MagicPVPBattleGround.ndt, BF_Magic.ndt, BF_MagicPvP.ndt e BF_MagicPvPLeague.ndt antes de interpretar modos. Não inferir escalas, fórmulas, ownership ou versão ativa no servidor.


### Stage 20.82f — Tabelas de magia por modo e habilidades auxiliares (investigação)

- Nove arquivos adicionais enviados em 25/11/2026. Decoder continua fora do Git. Exportador privado `scripts/export-client-mode-candidate.py`, executado localmente contra os arquivos reais: 42.602 registros de 99 campos em seis tabelas. Magic 9.537 / 1.310 kinds; MagicPVP 6.538 / 754; MagicPVPBattleGround 6.148 / 717; BF_Magic 8.413 / 1.154; BF_MagicPvP 6.097 / 706; BF_MagicPvPLeague 5.869 / 694.
- Hipótese de modos na mesma ordem: Normal (PvE), League (FL), Colosseum (CL), TBS, TBSPvP, TBSLeague. Comentários do AWKLevelSkill explicitam os seis grupos (TBSPvP menciona batalha da torre mágica). Não provam seleção de arquivo pelo servidor. Wikidot https://atlantica-online.wikidot.com/magic%3Afreezing-axe e https://atlantica-online.wikidot.com/class%3Areaver e Fandom https://atlantica.fandom.com/wiki/Main_Character_Specialization corroboram distinções de modo; preservar nomes e valores do cliente.
- Chave de comparação Magic_Kind + Grade dentro de cada arquivo. 86 grupos duplicados, 48 conflitantes: MagicPVP 14/0; MagicPVPBattleGround 9/1; BF_Magic 3/2; BF_MagicPvP 31/30; BF_MagicPvPLeague 29/15 (duplicados/conflitantes). Não selecionar primeira/última linha para conflitos. Cópias exatas contam uma vez em comparação, permanecem preservadas na extração.
- Campos de posição 7, 53 e 81 (1-based) podem diferir nos cabeçalhos: MtTotalSkillLevel vs MtMaxTotalSkillLevel, EndowedAmount_ImmuneInc vs EndowedAmount_ImmuneInc*10, IncSkillLevel vs IncSkill. Comparar apenas nomes iguais; não normalizar a escala por posição. Ausência de grade em outro modo não autoriza fallback. Cada uma das seis tabelas tem dez linhas não vazias após <End>, mantidas para auditoria, não como linhas ativas.
- Freezing Axe grade 6: EndowedAmount_HP = -175/-102/-102/-200/-115/-115 e EndowedAmountInc_HP = -15/-7/-7/-16/-8/-8 na ordem dos seis arquivos; duração 3/3/3/3/3/2. Não interpretar como dano final sem fórmula validada.
- HeroSpecialization: 198 SkillKind únicos, 35 campos, 594/594 referências de texto resolvidas pelo TextMgr_Magic_ENG anterior. AWKLevelSkill: 32 NewSkillKind únicos, 36 campos, 96/96 referências Magic resolvidas. Quatro abas de despertar declaradas (base, ataque, defesa, suporte); IDs do grupo Interface precisam de TextMgr_Interface_ENG.ntx. Exemplo AWK_HP, MaxLevel 100, custo 1, ValueNormal1 200000, ValueLeague1 2000, ValueColosseum1 0, ValueTBS1 200000, ValueTBSPvP1 2000, ValueTBSLeague1 2000. Escalas e fórmula por nível ainda não confirmadas.
- MagicEtcInfo: 164 linhas / 143 chaves Magic distintas, cinco cabeçalhos vazios preservados por posição. ComboMagicCheck: 28 triplas contíguas AddMagicName + OrgMagicCode → ChangedMagicName, todos os tokens presentes em Magic.ndt. Comentário explica ordem (aplicar B sobre A resulta C). Uma linha MAGIC_PAINCOMBO pós <End> e uma tripla MAGIC_PAINSEED isolada após rodapé de ComboMagicCheck são mantidas como evidência inconclusiva, não publicadas como regra.
- Exportação local: `python scripts/export-client-mode-candidate.py <decoded-directory> <new-destination>`. Entrada inclui as seis tabelas de magia, quatro auxiliares e TextMgr_Magic_ENG.ntx.txt; saídas JSON com nomes originais de campos, números de linha, hashes dos inputs decodificados, audit.json e conflicts.json. Candidato local não publicado. Verificações reais: 42.602 linhas, 48 grupos conflitantes, 690/690 referências de texto. Nenhuma mudança nas fórmulas, banco público ou UI.
- Próxima frente: arquivos de personagem já solicitados (CharEtcInfo, LGCLASSINFO, ONELEVELSOLINFO, versões ENG). Para Awakening e talentos, TextMgr_Interface_ENG.ntx e AWKLevelSkillSpend.ndt, se disponível. Antes da calculadora, validar fórmulas por nível e escala contra evidências no jogo; não inferir vínculos de mercenários.


### Stage 20.82f1 — Evoluções, especializações do Arthur e Awakening

- Em 25/11/2026 o usuário esclareceu: Arthur evolui para Dark King Arthur ou Sage King Arthur, cada um com uma magia exclusiva; habilidades não disponíveis antes da especialização não devem ser apresentadas como utilizáveis. A grade armazenada no cliente não equivale à grade disponível ao jogador. As seis tabelas contêm grades baixas para MAGIC_ARTHURBLACK e MAGIC_ARTHURWHITE; isso não prova disponibilidade. A colisão de três registros de grade 9 no MagicPVPBattleGround permanece inconclusiva.
- SkillIndex 991 Sage Sword Excalibur e 992 King's Command (comuns); 993 Guardian Sheath (comum pós-evolução); 994 Sage King's Dignity (Sage exclusiva), 995 Dark Legacy (Dark exclusiva). Os comentários ingleses do TextMgr_Magic corroboram o usuário, assim como https://atlantica-online.wikidot.com/class%3Adark-king-arthur, https://atlantica-online.wikidot.com/class%3Asage-king-arthur e https://atlantica.fandom.com/wiki/Knight_%28Mercenary%29. Não assumir associação completa para skills recentes.
- Sete novos arquivos: seis NCR v3 decodificados; ONELEVELSOLINFO.NDT raiz é NCR v1, não decodificado. Não confundir com OneLevelSolInfo_ENG.ndt, NCR v3, cuja tabela possui 789 registros, 96 BaseGrade distintos, 695 transições NextGrade explícitas, sem ciclos ou destinos ausentes. Todos os 789 nomes Char correspondem exatamente a KIND_ + Char em CharKindInfo (um único registro cada) e Char em CharEtcInfo (um único registro cada). CharKindCode não é CharID ou ID de tradução. CharEtcInfo inteiro: 1.878 registros, duas chaves duplicadas conflitantes fora dos 789 reconciliados (ALKACAT/LISA3); Explain não foi conciliado com namespace textual.
- Sete registros não-base sem predecessor explícito: DEFENCEKRISTINE, DEFENCEJEONWOOCHI, DEFENCEJESSICA, DEFENCECARMILLA, DEFENCEVALKYRIE, WHITEARTHUR1, BLACKARTHUR1. Nove transições GBTAIWHEGONG cruzam BaseGrade; não reclassificar automaticamente. Arthur tem 13 registros na família ARTHUR1: ARTHUR1–7, WHITEARTHUR1–3 e BLACKARTHUR1–3. ARTHUR7 tem NextGrade NULL; a ramificação é evidência do jogador e comunidade, não aresta explícita. CharKindInfo possui outros tipos Arthur não presentes na tabela de evolução; não inferir novas etapas.
- LGCLASSINFO.NDT e LGClassInfo_ENG.ndt são classificação de liga, não classes de mercenários. 27 IDs cada, 19 divergências de registros (limites de nível e contagens de vitórias/derrotas). Preservar ambos, não declarar regras ativas. TextIndex de liga não reconciliado.
- AWKLevelSkillSpend: SkillPoint=1, UseMOney=0, ResetItemUnique=21559, NeedNum=10; Tap1/2/3/4bonusmax=650/650/650/250. Comentários especificam pontos adicionais por itens de Awakening, não teto total de pontos. Não inferir fórmula de consumo/reset ou de atributos. TextMgr_Interface_ENG (8.482 IDs, revisão 26669, exportação 19/11/2026) resolve 64/64 referências de interface das 32 habilidades: Default/Attack/Defense/Support (9/9/9/5 atributos).
- Exportador local testado: scripts/export-client-evolution-candidate.py, entrada de oito arquivos UTF-8 com extensão .txt (incluindo CharKindInfo e AWKLevelSkill anteriores), destino inexistente. Quatro JSON privados: evolution, league, awakening, audit (hashes, divergências, arestas, referências, limitações). Sem decoder, publicação de textos originais, alterações de UI ou fórmulas. Próximo: localizar fonte CharKind/CharID -> nome e habilidades (dados de classe/personagem ou restrições de livros de magia); comparar com wikis sem inferir IDs. Aguardar evidências para grades desbloqueadas e cálculo por nível.


### Stage 20.82f2 — Candidatos livro/habilidade e evidência de propriedade

- PR #132 (evoluções/Awakening) aprovado no Validate Pull Request e integrado em 25/11/2026. Foram examinados os seis shards de item da snapshot 1 (23.586 IDs); 1.990 entradas Book com nome reconciliado. 1.576 possuem um padrão conservador de Book / Magic Book / Spellbook, rank romano ou Lv. explicitamente delimitado e sufixos Event/No Trade reconhecidos; 272 nomes-base distintos. 414 formatos não reconhecidos permanecem para revisão (incluindo livros sem relação com habilidades). Não confundir rank do livro, grade de magia e evolução.
- Comparar nome inglês exato sem fuzzy matching, sem normalizar apóstrofos, sem escolher um único SkillIndex se houver homônimos, sem inferir propriedade por proximidade numérica. Candidatos de nome não provam restrições ou aprendizado.
- Lote piloto de 20 identidades conferidas no skills.json privado (todas com nome único no conjunto completo) e 148 ItemIDs no índice público: Gigas 547/548/549 (27); Sylvie 763/764/765 (24); Jessica 792/793/794 (21); Dryad 914/915/916 (24); Grim Reaper 987/988/989 (24); Arthur 991–995 (28). Nomes de habilidades e comentários originais Magic corroborados pelas páginas abaixo. Estas associações não são chaves explícitas de aprendizado nem prova de disponibilidade em cada evolução. No Grim Reaper, deixar magias de combinação e invocações separadas. Comentários de tradução podem ser reaproveitados incorretamente: exemplo textos de habilidades de Forgotten City e Cube Channeling apontam para comentário de Gigas apesar de não serem as três habilidades do mercenário. Não usar comentário isolado como propriedade.
- Referências de validação cruzada: https://atlantica-online.wikidot.com/class%3Aautomaton ; https://atlantica.fandom.com/wiki/Demeian_Guardian ; https://atlantica-online.wikidot.com/class%3Abounty-hunter ; https://atlantica.fandom.com/wiki/Introducing_the_Dryad ; https://atlantica.fandom.com/wiki/April_21%2C_2022_Update ; https://atlantica-online.wikidot.com/class%3Adark-king-arthur ; https://atlantica-online.wikidot.com/class%3Asage-king-arthur ; https://atlantica-online.wikidot.com/item%3Aking-arthur-s-holy-trophy . São fontes históricas, não verificação do servidor atual.
- Arthur: Dark Legacy (995, MagicCode 987) corresponde por nome aos itens 10818, 11376, 21059, 21226–21229. Sage King's Dignity (994, MagicCode 986) mantém associação à outra especialização. Não concluir aprendizado ou requisito com base no livro nem inferir IDs entre sequências.
- `node scripts/audit-client-skill-books.mjs <skills.json-privado> public/data/client-items <relatorio-privado.json>` percorre os seis shards, preserva nomes e ranks originais, separa candidatos únicos, ambíguos, sem correspondência e não interpretados; registra hashes dos shards e skills.json. Teste CI usa 20 identidades verificadas e snapshot real; execução completa depende de disponibilizar o skills.json privado junto aos shards, não foi executada no mesmo ambiente nesta investigação. Sem decoder, publicação de dados originais, novas páginas ou mudança de fórmulas.
- Bloqueio: exportação pública de itens e Miner_ClientFacts_Private_20_23 expõem identidade/receitas, não campos de uso/aprendizado. Solicitar Item/Data/ItemTypeBook.ndt, LANG/ENG/LimitInfo/ItemLimitInfo_ENG.ndt e CHARLIMITINFO_ENG.NDT; opcionalmente TextMgr_Item_ENG.ntx se texto auxiliar for necessário. Inventário NDT anterior confirma esses caminhos. A fonte de atributos de personagem ainda precisa ser localizada; solicitar listagem completa de arquivos .dat (e nomes de arquivos de personagem) se necessário em vez de assumir o formato. Não inventar propriedade numérica nem preencher grades ausentes.


### Stage 20.82f3 — Chaves explícitas de aprendizado de livros e classes

- PR #133 integrado após CI aprovado. Novos inputs de 25/11/2026: ItemTypeBook.ndt, CHARLIMITINFO_ENG.NDT, TextMgr_Item_ENG.ntx (NCR v3), ItemLimitInfo_ENG.ndt (NCR v1, não decodificado) e inventário de 316 arquivos .dat. Decoder continua fora do Git.
- ItemTypeBook: 2.093 linhas de 50 campos, 1.990 ItemIDs (exatamente uma definição Nation=ALL por ID), 83 IDs com variantes regionais (52 linhas GER, 39 JPN, 12 RUS). Preservar variantes e diferenças inclusive NeedSkill/NeedSkillLevel, Level e IsShow; não presumir seleção ativa do servidor. TextMgr_Item contém 31.245 IDs únicos e resolve todos os NameTextNum dos livros.
- SkillKind do livro corresponde exatamente a SkillName (campo 4, índice 3, de SKILLINFO_INDEX). As 1.336 chaves SkillName são únicas. 1.883 linhas com SkillKind, 1.783 ItemIDs, 320 habilidades distintas, todas reconciliadas por chave explícita, não por nome. NeedSkill e DownSkillCode não NULL também resolvidos. Os 104 tokens Class1–Class8 não vazios são restrições de classe; não confundir com CharKindCode ou afirmar propriedade completa. Quatro linhas Hippolyte 24424–24427 têm Class2 vazio; preservar.
- SkillLimit 1/20/40/60/80: 14/478/418/494/479 linhas. É limite de livro, não grade de magia. Todos os registros com SkillKind possuem AllClass=0; respeitar HeroSolOnly, classes, demais campos e variantes. A presença de livro não prova que uma habilidade esteja disponível em todas as evoluções ou ativa no servidor.
- Arthur: livros 21210, 21214 incluem CLS1_ARTHUR/CLS1_WHITEARTHUR/CLS1_BLACKARTHUR; 21218 Guardian Sheath só White/Black; 21222 Sage King's Dignity só White; 21226 Dark Legacy só Black. Dark Legacy 21226–21229 limites 20/40/60/80. Confirma a explicação do usuário, Wikidot https://atlantica-online.wikidot.com/class%3Adark-king-arthur e https://atlantica-online.wikidot.com/class%3Asage-king-arthur, Fandom https://atlantica.fandom.com/wiki/Guardian_Sheath e https://atlantica.fandom.com/wiki/Knight_%28Mercenary%29. Não resolve a colisão de grade 9 na tabela de magia Colosseum.
- CHARLIMITINFO_ENG: 369 linhas de dados, todas LimitATB=ALL/bValid=0, não apresenta relação de aprendizado. ItemLimitInfo_ENG NCR v1 não interpretado; não presumir conteúdo.
- Exportador scripts/export-client-book-class-candidate.py testado localmente com os arquivos reais: `python scripts/export-client-book-class-candidate.py <ItemTypeBook.ndt.txt> <TextMgr_Item_ENG.ntx.txt> <skills.json> <novo-diretorio>`; exporta book-restrictions, regional-variants e audit JSON com hashes e proveniência de linha. Não publicar candidato nem originais automaticamente. A comparação por nome da 20.82f2 passa a ser verificação complementar.
- Próximo bloqueio: mapear os 104 tokens CLS/CLS1 à identidade de personagem e atributos. Inventário DAT aponta CharInfo/CharItemInfo.dat (5.236.000 bytes), LANG/ENG/CharInfo/CharItemInfo_ENG.dat (4.928.000), CharInfo/EVENTCHAR.DAT (2.816.804); solicitar os dois CharItemInfo e CharInfo/ClassTypeIndex.ndt (candidato já encontrado no inventário NDT), sem pedir arquivos de configuração locais. EVENTCHAR fica opcional. Não afirmar formato ou relação antes de examinar.


### Stage 20.82f4 — Índice de classes e auditoria binária DAT

- PR #134 integrado após Validate Pull Request aprovado. Quatro arquivos recebidos em 25/11/2026: ClassTypeIndex.ndt (NCR v3), CharItemInfo.dat, CharItemInfo_ENG.dat e EVENTCHAR.DAT (binários sem NCR). Decoder mantido fora do Git.
- ClassTypeIndex: 108 tokens distintos, NameTxtKey distintos, todos os códigos são máscaras de um único bit. 104/104 tokens dos livros com SkillKind resolvidos por chave textual exata. Quatro sem referência nesses livros: CLS_DEFENCEBOW, CLS_DEFENCESTF, CLS_DEFENCESWD, CLS_MOOSUN. 45 valores hexadecimais aparecem em ambos os namespaces CLS e CLS1; chave segura é o token completo ou par namespace/máscara, nunca máscara isolada. SolType bruto 0/1/2/3: 38/29/17/24, sem interpretação automática de rank.
- NameTxtKey NÃO é ID do TextMgr_CharInfo_ENG ou TextMgr_Interface_ENG: por exemplo CLS_FENCER, key 15, retorna Devil Tree ou Revive Selected, respectivamente. Namespace de tradução ainda não encontrado. 73 candidatos lexicais de evolução pela regra sufixo do token + 1 (não são vínculos explícitos). Arthur: CLS1_ARTHUR → ARTHUR1, CLS1_WHITEARTHUR → WHITEARTHUR1, CLS1_BLACKARTHUR → BLACKARTHUR1, corroborados pelo usuário, restrições de livros e https://atlantica-online.wikidot.com/class%3Adark-king-arthur ; https://atlantica-online.wikidot.com/class%3Asage-king-arthur ; https://atlantica.fandom.com/wiki/Knight_%28Mercenary%29 . Não generalizar regra lexical nem inferir disponibilidade de habilidades pela ausência de livros.
- CharItemInfo: registros de 616 bytes (154 inteiros little-endian de 32 bits), raiz 8.500 posições (4.351 preenchidas, 4.149 padrão); ENG 8.000 (4.094 preenchidas, 3.906 padrão). Todas as posições preenchidas têm primeiro inteiro igual ao índice zero-based. ENG tem 4.094 IDs compartilhados com raiz (606 registros idênticos, 3.488 diferentes); 257 exclusivos da raiz, zero exclusivos ENG. A raiz coincide em contagem, soma de IDs (15.736.971), soma dos quadrados (78.321.347.869) e IDs extremos com catálogo publicado snapshot 1. Amostra do ID 201: inteiros 3–5 = 20950/2500/1, 7–9 = 20900/2000/2, 125–128 = 2/2000/7/3500 (offsets zero-based), coerentes com drops diretos e referências de grupo no loot/00.json existente. Não afirmar igualdade completa sem comparação linha a linha, nem interpretar valores como probabilidades. Não substituir dados publicados, nem usar DAT como fonte de atributos base de mercenários.
- EVENTCHAR: cabeçalho uint32 little-endian 2012; 1.400 posições de 2012 bytes após cabeçalho; 1.023 registros com rótulos ASCII únicos iniciais e 377 zerados (BATTLE1, GUILDBATTLE1, TUTO_SWD, Event_Gigas2, Ruined_boss etc.). Parece tabela de eventos/cenas, não comprova mecânica, composição ou atributos. Não publicar rótulos em massa.
- Script scripts/audit-client-class-dat.py executado localmente com arquivos reais e candidatos privados anteriores. Entradas: ClassTypeIndex.ndt.txt, book-restrictions.json, evolution.json, CharItemInfo.dat, CharItemInfo_ENG.dat, EVENTCHAR.DAT, destino novo. Saídas privadas audit.json, class-candidates.json e event-labels.json com hashes e limites. Nenhum arquivo original, decoder, extração ou UI publicado.
- Próximos candidatos (inventário NDT/NTX anterior): CharInfo/CharMonsterInfo.ndt, CharInfo/CharAttackInfo.ndt, CharInfo/LOA_CharInfo.ndt, LANG/ENG/TextMgr/TextMgr_IndSol_ENG.ntx, TextMgr_TextMgr_ENG.ntx e TextMgr_TextmgrGlobal_ENG.ntx. Investigar se contêm nomes/classes/atributos; não afirmar previamente. Se insuficientes, verificar inventário de outros formatos na pasta CharInfo e LANG/ENG/CharInfo, sem arquivos de configuração pessoal; dados base podem depender do servidor. Wikidot/Fandom podem servir como fonte histórica de atributos com atribuição e revisão, não como valores atuais confirmados.


### Stage 20.82f5 — Atributos e reconciliação exata de personagens

- PR #135 integrado após CI aprovado. Seis arquivos NCR v3 recebidos e decodificados localmente (CharAttackInfo, CharMonsterInfo, LOA_CharInfo, TextMgr_IndSol, TextMgr_TextMgr, TextMgr_TextmgrGlobal) e inventário CharInfo completo. Decoder fora do Git.
- CharAttackInfo.ndt (inventário: modificado 19/11/2026): 7.219 linhas, 108 colunas, 6.540 Char distintos, 679 linhas Nation diferente de ALL (ENG 230, JPN 197, KOR 166, INA 44, GER 40, RUS 2). Há dois pares Char/Nation duplicados: SADANNA/ALL e Event_NPC_32/ALL, fora das evoluções. Não presumir seleção regional. 789/789 registros de OneLevelSolInfo_ENG conciliados por Char exato, um único registro cada, Nation ALL, 789/789 nomes pelo NameTextNum → TextMgr_CharInfo_ENG; 83 ClsType distintos, todos no índice de classes, 80 com referência de livros. Isso substitui correspondência lexical das etapas anteriores. Classe tem identidade explícita, mas NameTxtKey namespace ainda desconhecido; usar nomes de evolução sem declarar nome oficial da classe por NameTxtKey. Os três novos TextMgr não resolvem esse namespace (IndSol 64, TextMgr 1.697, TextmgrGlobal 221 IDs).
- Campos originais Str, Dex, Vit, Intl, MinDmg, MaxDmg, AC, MagicDef, CriticalRate, Min/MaxActivePower, Grade, Level, equipamento, ataque e parâmetros Mt/PvP/PvPBG. Não interpretar como total calculado nem Level=nível mínimo de evolução (usar NeedLevel separado). 789 slots Magic não NULL nas 789 evoluções, 55 Magic_Kind distintos, todos resolvidos no índice; manter todos SkillIndexes candidatos se compartilharem MagicKind. Separar magia configurada do personagem de permissão de livro por classe; não afirmar lista completa de habilidades ou disponibilidade por grade.
- Arthur: 13 evoluções com classes confirmadas via ClsType; Grade 0–6 Arthur, 7–9 nas duas ramificações. Comparação histórica com https://atlantica-online.wikidot.com/class:knight-merc , https://atlantica-online.wikidot.com/class:dark-king-arthur , https://atlantica-online.wikidot.com/class:sage-king-arthur : atributos Str/Dex/Vit/Intl, AC, CriticalRate, MinDmg/MaxDmg coincidem nos 13 registros. MagicDef bruto 30/35/55 vs exibido 230/235/255 (diferença +200); hipótese a verificar em outras classes e in-game, não fórmula universal. Fandom https://atlantica.fandom.com/wiki/Knight_(Mercenary) e https://atlantica.fandom.com/wiki/Sage_King_Arthur corroboram especialização e atributos de entrada.
- CharMonsterInfo: 2.729 linhas de 4 campos, 2.726 Kind distintos, MonsterIndex/PartyNum/Type, cinco categorias de dificuldade; não contém stats. LOA_CharInfo: seção <LOA_CharInfo>, 98 linhas de 64 campos (22 Group=0, 76 Group=1), configurações LOA específicas; não inferir aprendizado normal.
- Exportador scripts/export-client-character-candidate.py executado localmente com arquivos reais; entradas CharAttackInfo.ndt.txt, TextMgr_CharInfo_ENG.ntx.txt, evolution.json, class-candidates.json, skills.json, destino novo. Saídas audit.json e evolution-profiles.json privadas com 789 registros e hashes. Não exporta as demais linhas de personagem; originais intactos. Nenhuma UI ou dado público novo.
- Inventário revelou arquivos mais recentes que os NDT ingleses de 2023: LANG/ENG/CharInfo/SolInfo.vna (122.126 bytes), OneLevelSolInfo_ENG.vna (144.738), CharEtcInfo.vna (151.652), AWKLevelSolInfo_ENG.vna (5.274), todos 19/11/2026. Solicitar estes quatro, sem assumir formato/precedência. Verificar cobertura, diferenças e possibilidade de habilidades/atributos adicionais antes da publicação. Considerar VNA de magia se inventário mostrar arquivos equivalentes. Futuro: perfis piloto com dados brutos, links de livros, evolução, proveniência por campo, auditoria de grade/mode; fórmulas só após confirmação.


### Stage 20.82f6 — Reconciliação das tabelas VNA de mercenários

- PR #136 integrado após CI aprovado. Quatro VNA enviados: SolInfo, OneLevelSolInfo_ENG, CharEtcInfo e AWKLevelSolInfo_ENG. Todos decodificados localmente pelo método VNA NA v3 recuperado da investigação Miner anterior. Não versionar decoder ou arquivos originais.
- OneLevelSolInfo_ENG.vna: 936 registros únicos contra 789 NDT; 147 adicionados, nenhum removido, oito linhas antigas alteradas (sete transições e materiais; preço ARTHUR1 apenas representação numérica 1.00E+08 -> 100000000). 122 BaseGrade, 816 transições explícitas, destinos e bases existentes, sem ciclos. 936/936 correspondências únicas com CharAttackInfo e NameTextNum/TextMgr_CharInfo, todos Nation ALL; 94 classes conhecidas, 91 com referências de livros, 272 SkillIndexes distintos por permissão de classe. 936 slots Magic configurados, 68 chaves distintas, todos encontrados no índice. Não afirmar ownership completo.
- CharEtcInfo.vna: 2.098 linhas, 2.094 Char distintos; 230 chaves novas, 12 removidas e cinco grupos alterados frente ao NDT; quatro chaves duplicadas, nenhuma nos 947 perfis reconciliados. Comentário original indica usar somente a versão VNA na pasta LANG e não acrescentar ao NDT. Priorizar esta fonte para essa tabela; não generalizar a todos os VNA.
- SolInfo.vna: 918 registros únicos, Rank D/C/B/A/S, JobType, WpnType, EquipType, Region, Continent, Nation (país, distinto de Nation regional de CharAttackInfo), Tribe. Nomes internos coreanos, não usar como nomes ingleses. 907 interseção com evolução; 29 registros de evolução sem SolInfo (DEFENCE*), 11 Washington somente SolInfo. União 947 perfis únicos, todos com nome inglês, CharAttackInfo e CharEtcInfo VNA únicos. WpnType/EquipType coincidem nos 918; 60 JobType diferentes (ex. JT_RANGE vs JT_BOMB), preservar campos de ambas fontes. SolInfo Rank não é Grade ou ExpRank; 122 BaseGrade não equivalem a 122 mercenários jogáveis.
- Arthur agora 17 registros (7 comuns, 5 cada ramo), grades 10/11 T Lv.1/2, com STR Sage 1428/1713, Dark 1476/1771. NextGrade explícito entre White3–5 e Black3–5; ARTHUR7 continua sem NextGrade. Materiais de transcendência ItemIDs 10770/10771, nomes reconciliados no catálogo snapshot 1, quantidades brutas 2/4/6 em CrystalNum e AtlasNum, não somar automaticamente. Wikidot https://atlantica-online.wikidot.com/class:sage-king-arthur e https://atlantica-online.wikidot.com/class:dark-king-arthur terminam em grade II nas tabelas históricas; Fandom https://atlantica.fandom.com/wiki/Mercenary_Arthur_Specialization_(Quest) confirma ramificação, não novos atributos.
- AWKLevelSolInfo_ENG.vna: 90 Char únicos, todos presentes nas evoluções e terminais nas arestas explícitas; todos NeedLevel=200, NeedItemUnique=15046 (The Awakener Pendant, catálogo snapshot 1), NeedNum=200. Não inferir que demais 30 terminais são elegíveis ou inelegíveis no servidor. Distinguir requisito de ativação e distribuição de pontos.
- Exportador scripts/export-client-vna-mercenary-candidate.py testado localmente com oito entradas UTF-8 (.txt após extensão original), destino inexistente; gera profiles.json (947, colunas brutas e proveniência), differences.json e audit.json. Preservar valores sem aplicar fórmulas. Não publicar candidatos automaticamente.
- Próxima etapa: preparar piloto de publicação com atributos brutos, evoluções e links existentes de livros/itens, distinguir dados de classe, slots configurados e habilidades aprendíveis. Já há evidência suficiente para começar sem novos uploads. Conferir auditoria Miner VNA 9.2.11 antes de solicitar arquivos de magia adicionais: versões LANG/ENG/Magic/*.vna auditadas têm apenas cabeçalhos e poucas linhas; não presumir que substituem tabelas raiz. Verificar fórmulas e disponibilidade real posteriormente; não publicar como confirmado o que depende do servidor.


### Stage 20.83a — Piloto público de referência de mercenários e habilidades

- PR #137 integrado após CI aprovado. A partir dos candidatos locais realmente inspecionados, preparação de projeção allowlist (sem descrições longas ou assets originais): 947 perfis, 1.336 habilidades, 1.783 livros Nation ALL, 816 transições e 42.602 registros de magia em seis tabelas; 48 chaves conflitantes preservadas. Exportação ampliada fica em pacote local para revisão/importação; não está publicada neste PR.
- Piloto Arthur: 17 perfis, 5 SkillIndexes, 31 registros de livros ALL (a contagem de 28 anterior era somente heurística de nome), 14 arestas explícitas, 32 registros de grade 9 em seis tabelas. Não incluir aresta fictícia ARTHUR7 → ramos. Preservar os três registros conflitantes Dark Legacy na MagicPVPBattleGround. Valores originais selecionados por nome de campo, sem cálculos ou fallback. Dados em public/data/client-mercenaries/{mercenaries,skills,modes}.json; os três blobs coincidem byte a byte com a geração local (SHA-256 fixados em teste).
- Novas rotas /mercenaries/database/ e /mercenaries/skills/ nos oito idiomas, separadas de artigos editoriais aprovados; pesquisa, seleção de evolução, comparação de atributos, requisitos, família de evolução, slots configurados, livros por classe, links para catálogo de itens, seleção de grade armazenada, seis tabelas brutas com alerta de conflitos. Layout existente, seis temas, nomes ingleses e chaves de campos preservados. Não implica disponibilidade no servidor ou lista completa de habilidades. Não há calculadoras de atributos finais nesta etapa.
- Próximo: revisar o piloto, promover os três arquivos da projeção ampliada após validação dos hashes e da cobertura. Ambiente de geração local não alcança GitHub por rede e a API de conteúdo não recebe caminho de arquivo local: pacote de importação está preparado; transferência dos arquivos grandes exige uso do checkout local ou outro meio autorizado. Não reenviar arquivos brutos do jogo. Não declarar deploy até verificação.


### Stage 20.83b — Expansão integral dos catálogos de referência

- PR #138 integrado após correção da lista de rotas nos testes e aprovação dos dois workflows. A projeção ampliada foi transferida e os blobs Git conferidos byte a byte com a geração local: mercenaries e6b5d00e0f0fda239bf9dc777838d77df2218902, skills a36e26ab61fd8b06f6824cc0c77e8096b28fffab, modes d438f49dad0bc297c885a9881f88c45a4a8c5174. SHA-256 exatos fixados nos testes.
- Cobertura: 947 perfis, 936 evoluções, 11 apenas metadata; 122 BaseGrade, 816 arestas explícitas, 90 requisitos de Awakening, 1.336 identidades de skills, 1.783 livros ALL, 42.602 linhas de modos, 48 chaves conflitantes. Seleção de oito campos brutos por grade; não publicar descrições longas, arquivos originais, correções presumidas ou fórmulas. Ausência de livro não é ausência de habilidade.
- Lookup derivado dos seis shards de item snapshot 1: 1.827 ItemIDs de materiais, Awakening e livros, todos com nome inglês reconciliado. A pesquisa global passa a indexar 2.283 registros de mercenário/habilidade com links por ID, categorias próprias, sem aliases inventados. Filtros Rank/JobType/WpnType/BaseGrade, comparação, links de compartilhamento e carregamento de modos somente na página de habilidades. Manter metadados de JobType divergentes visíveis. Todos os oito locales; chaves de campos e nomes oficiais preservados.
- Próximos candidatos: integração com auditoria global e aliases revisados; planificadores de Awakening e especialização apenas com regras verificadas; para cálculos finais obter amostras in-game (nível, evolução, atributos sem bônus, skill level, modo e resultado). Não publicar valores de servidor inferidos. Decoder e candidatos privados não entram no Git.


- Continuação da Stage 20.83b: falha inicial do teste de busca global por BLACKARTHUR5 corrigida ao normalizar o ID textual, sem alterar identidade nem href. Incluídos filtro de presença de livros, links reversos de habilidades para os perfis das classes permitidas e aviso de que um perfil não equivale necessariamente a um mercenário recrutável. Testes adicionais: 122 famílias, 95 classes na união, 320 habilidades com livros, 1.783 ItemIDs distintos, 26 habilidades sem linhas na tabela Magic, Dark Legacy somente cinco perfis da classe CLS1_BLACKARTHUR. Validação local independente dos três JSON completos confirmou hashes e contagens. PR #140 redundante, substituído pelo #139, que contém os dados completos. Nenhum novo upload necessário para esta publicação.


### Stage 20.83c — Awakening Planner (orçamento manual)

- PR #139 integrado após CI aprovado, main e17ea3dd4c3cc2ca03b09b242f611492e40adab2. Catálogos ampliados, busca global, links bidirecionais, filtros e oito idiomas. Deploy ainda não conferido.
- Rota /tools/awakening/ nos oito idiomas, ligada ao hub Tools e aos catálogos de mercenários. AWKLevelSkill.ndt linhas 27–58: 32 chaves únicas, grupos 9/9/9/5, nomes ingleses recuperados de TextMgr_Magic_ENG, níveis máximos 100/50/25 com custo por nível 1/2/4 respectivamente. Capacidade matemática por grupo 900/900/900/500. AWKLevelSkillSpend.ndt linha 17: limites de pontos adicionais por itens 650/650/650/250; não são orçamento total. Reset ItemID 21559 quantidade 10, referência bruta, sem regra de consumo inferida.
- Orçamento informado separadamente pelo jogador; níveis inteiros 0–máximo, pontos gastos = nível × NewSkillPoint, sobras e excesso por categoria, URL compartilhável com validação, limpar plano. Não presume aquisição/transferência de pontos, fórmula dos atributos, orçamento por nível nem efeitos finais. Sem valores de bônus calculados e sem publicação de descrições integrais, decoder ou arquivos originais. Testes de identidade, custos, capacidade, validação, round-trip e localização em CI.
- Próximas etapas: Main Talent Planner com orçamento por nível/grupo informado pelo jogador enquanto regras de aquisição atuais não forem confirmadas; comparação de modos; validação de fórmulas. A evidência histórica de talentos do Wikidot/Fandom não é confirmação de mecânica vigente. Para calculadoras finais, solicitar capturas do jogo mostrando pontos, níveis e benefícios efetivos em mais de um nível de habilidade/awakening. Não inventar progressão.

### Stage 20.83d — Comparação legível de modos e evidência do jogador (25/11/2026)

- Usuário confirmou URL base https://atlantica-knowledge-hub.aocodex.workers.dev e enviou capturas do catálogo ampliado: 947/947 perfis, comparação Ann [Hero Lv.6]/[Hero Lv.5], SkillIndex 222 e Dark Legacy 995 grade 9 com conflito explícito. O deploy do catálogo ampliado está confirmado pelas capturas, não por verificação independente de rede. Awakening ainda não estava disponível na tela enviada.
- Diretriz explícita: priorizar legibilidade para quem quer aprender o jogo. Habilidades devem apresentar uma única matriz de atributos × modos (PvE/Normal, PvP/FL, PvP/Colosseum, TBS, TBS PvP, TBS League), não seis tabelas verticais. Dados de fonte em detalhes recolhíveis; nomes de modos são convencionais, despacho do servidor não confirmado. A matriz vem antes de livros e perfis relacionados. Traduções UI em oito idiomas. Ausência não é zero; conflitos preservam todos valores e linhas, sem seleção de vencedor.
- Natasha [VI] (NATASHA10, grade 9) tela Class: STR 1340, DEX 774, VIT 619, INT 505, DEF 1673, M.DEF 210. CharAttackInfo linha 6787 tem os mesmos cinco primeiros atributos, MagicDef bruto 10. Confirma diferença +200 observada em Arthur para uma família independente; ainda não promover regra universal sem amostras adicionais. Tela também mostra AP 80–97 e vacancy 12%, não inferir fórmula. A tela é ficha de classe, não atributos equipados.
- Awakening quatro abas na mesma tela de formação: unused 1/2/7/3. Níveis investidos: Water-type 53; Min Attack Power 1, Max Attack Power 1, Increased Magic 8; Physical Defense 5, Magic Damage 3, (Physical) Explosion 2; Quick Recovery 6. Usando NewSkillPoint da tabela: consumos 53/34/25/24; orçamentos reconstruídos 54/36/32/27. Limites 100/50/25 confirmados visualmente. Não inferir orçamento por ALv nem bônus efetivo; faltam tooltips. Os campos de Interface são rótulos curtos, nomes Magic são longos.
- Talentos: usuário confirma Mage Main. Tela mostra níveis requeridos 130/140/150/160/170/180 e três opções por linha; 1 ponto disponível. Fonte HeroSpecialization WPNTYPE_STF tem 18 entradas; 130–170 max 10, 180 max 20. Não inferir exclusividade, distribuição acumulada ou requisito de pontos anteriores pela imagem. As imagens não exibem tooltips nem regras.
- Blazing Earth SkillIndex 222 / MAGIC_BOILINGEARTH: tela mostra 80/80, Max Skill Level 110 incluindo charms, duração 2, cooldown 2, AP150, MP1790, Attack Power -8064, HP -[5250+78.3%]. Tabela raiz Magic.ndt tem grades 0–9, duração 3, MP100–1000, campos de AttackPowerDamageRate e incrementos não presentes na projeção piloto de oito campos. Não mapear a captura a uma grade/modo exato nem inferir fórmula. Investigar demais campos de efeito antes de publicar cálculos; solicitar segunda amostra do mesmo personagem/grade e modo, com nível efetivo e tooltip.
- PR #141 Awakening falhou em teste da contagem de rótulos (25, não 24); corrigido e adicionado exemplo acima como regressão no próprio PR. Não confundir o CI pendente com deploy. Sem arquivos originais ou capturas publicados no Git.


### Stage 20.83e — Main Character Talent Planner

- HeroSpecialization.ndt e TextMgr_Magic_ENG.ntx: 198 identidades, 11 famílias, três talentos por nível 130–180; custo 1, limites individuais 10/20, capacidade matemática 210 por família. Preservar linha e ID de texto.
- Bow Main (BOW) e Celestial Hunter (SHBOW) usam WPNTYPE_BOW mas possuem árvores distintas; Celestial Hunter atinge alvo principal e dois atrás, conforme esclarecimento do jogador. Não inferir pelo código da arma.
- /tools/talents/ em oito idiomas, orçamento manual, níveis, alertas, links versionados, fontes recolhíveis. Não presume exclusividade, pré-requisitos, aquisição de pontos ou cálculo de bônus. Trocar família limpa alocações e conserva orçamento e nível.
- Cinco testes locais do pacote aprovado; validar CI e deployment antes de declarar publicação. Regra de repositório teve timeout; não desabilitada. Stage 20.83f (39 campos extras, Proc Rate e progressão) permanece em pacote local separado, a integrar somente após esta etapa.

### Stage 20.83f — Proc Rate e progressão de habilidades

- Usuário solicita incluir chance de ativação (ex. Sage Sword Excalibur) e progressão por evolução/nível, referência https://atlantica-online.wikidot.com/magic:silence-of-the-grave. URL exata indisponível no fetch; referência acessível de Sage Sword Excalibur no Wikidot e páginas Fandom utilizadas, sem presumir tabelas do iframe indisponível.
- 39 campos complementares em 42.602 linhas das seis tabelas. Chave exata modo/Magic_Kind/Grade/linha/conflito; preserva 48 grupos conflitantes. Projeção suplementar `mode-progression.json`, SHA-256 `4c62ecdb8b45d3fd38ded2bcac3728512c79c643c08c0b25c83e73747591e5dc`. Não substitui `modes.json`. Probability e ProbabilityInc*10 separados de MotionProbability e MotionProbabilityInc*10; não converter todos os campos em porcentagem nem assumir chance de acerto. Valores raw de limite por livro e total por grade preservados.
- `MAGIC_ARTHUREX` MotionProbability=150, MotionProbabilityInc*10=30 em todas as grades; hipótese de taxa exibida 15+3*(L-1) reproduz quatro amostras históricas 15/72/102/192% em níveis 1/20/30/60 do Fandom. Cap bruto total 60 grades 0–6, 80 grades 7–11. Não limitar a 100% nem afirmar procs múltiplos. `MAGIC_REAPERSILENCE` grade 9 PvE: MDEF -120, incremento -30, fórmula candidata -120-3*(L-1) coincide com sete amostras Fandom de 20–80; MotionProbability 400/10, incremento 10/10, chega a 100 no nível 61, conforme relato histórico. Não generalizar para outras habilidades/modos, e não declarar validação atual; duração/MP divergentes. https://atlantica.fandom.com/wiki/Sage_Sword_Excalibur e https://atlantica.fandom.com/wiki/Silence_of_the_Grave.
- Pacote local Stage 20.83f: exportador, dados, módulo de progressão, rótulos, testes, script de integração após #142. UI: matriz única por modo, progressão por grade com campo selecionável, prévia de nível limitada às hipóteses corroboradas acima. 5/5 testes locais aprovados. Oito idiomas nos controles, rótulos adicionais EN/PT e fallback EN. Build Astro e CI remotos ainda não executados; PR #142 continuava aberto por regra do repositório com timeout. Não publicar originais ou decoder. Continuar a validar fórmulas com tooltips in-game sem gastar recursos.

### Stage 20.83g — Contexto de habilidades e combinações explícitas (candidato local)

- Usuário autorizou continuar localmente durante instabilidade do GitHub. Não realizar merge/push nem contornar proteções durante incidente. Stage 20.83e/f ainda pendentes de integração; 20.83g depende de f. O commit 80448f8ef1e72bcdb24217acf918e2cfbb2eecd8 é um objeto remoto de e, não confirmar branch ou integração sem consulta nova. O pacote local e é a referência revisada.
- Exportador `scripts/export-skill-context.py` reconcilia exatamente os 42.602 registros de seis modos com linhas dos candidatos privados; confere oito campos originais, preserva identidade/grade/linha/conflito. 14 campos selecionados adicionais, 1.114 tuplas de contexto únicas, 61 campos após extensão f (65 colunas com identidade). Arquivo `skill-context.json`, 1.579.595 bytes, SHA-256 b329542d56695a392edac72eccc12ea002f6062bfccbb2c782751bf021f65131. Sem modificar modos ou progressão existentes.
- Contexto inclui Category, EndowedObj, Reach, Grid, SelfMagicKind/Grade, CHANGEMAGIC/CHANGETURN, condições AP/HP, BF_GridMax, BF_MagicRange, Physical_Hit. Valores de alvo e área recebem rótulos transparentes EN/PT-BR; tokens desconhecidos preservados. Não inferir geometria, contagem, alcance ou efeitos reais. Nos seis modos, mover campos de contexto essenciais para início da matriz; preservar demais efeitos não zero, ausências e conflitos.
- ComboMagicCheck.ndt linhas 6–33: 28 combinações explícitas, 64 MagicKinds distintos, todos resolvem exatamente um SkillIndex. Comentário da fonte descreve A existente + B adicionada → C transformada/ativada. Não incluir linha 39 fora de <End>. Exemplo linha 23: Silence of the Grave (989) + Blood Curse (629) → Sundered Soul (990). A interface mostra links nas três posições; disponibilidade e condições reais não confirmadas.
- Cinco testes reais aprovados; reexecutados também cinco testes e e cinco f. Aplicação sequencial f/g testada com fixture de âncoras, não checkout Astro completo. Build/CI/deploy e traduções completas dos novos rótulos técnicos ainda pendentes. Sem upload de decoder, originais ou capturas.

### Stage 20.83h — Skill Level Simulator

- Macro VBA fornecida pelo jogador: Base + Inc × (Level − 1), divisores 1/10/100 conforme campos. Exibir grupos de atributos, ocultar zeros, remover Probability/ProbabilityInc*10 da apresentação (preservar dados). Proc /10 e ATK scaling em % (incremento /100), sem limitar proc a 100%. Nível digitável e grade independente, conflitos por linha e modos ausentes preservados; acima do cap sinalizado.
- Cinco campos adicionais por linha de origem; 42.602 registros, 70 colunas incluindo quatro de identidade. Magic.ndt tem EndowedAmount_ImmuneInc, outros cinco têm EndowedAmount_ImmuneInc*10: não inferir divisor em PvE, não calcular total quando incremento não zero. MP drain permanece parâmetro bruto. Hash dos runs verificado contra a extração original.
- Print do Sage Sword Excalibur grade 11 nível 80: MP 432, scaling 50,9% (sinal de dano), HP 8248 e duração 1 no jogo; projeção de fonte HP -3496, scaling -50,92%, MP 432, duração bruta 0. Não inferir HP final, duração mínima ou chance efetiva do servidor. Fonte preservada e previsão claramente rotulada.

### Stage 20.83i — Skill table navigation

- Slider de nível ao lado do campo textual, sincronização em ambos os sentidos e URL preservada. Limite inicial conforme maior MaxTotalSkillLevel do grade selecionado; simulação acima do limite digitada expande o slider, sem eliminar avisos anteriores. Faixa de entrada permanece 1–1000.
- Espaço visual de 8px entre grupos, cabeçalho sticky no scroll da página quando a largura disponível comporta a matriz de 860px; em telas estreitas, scroll interno horizontal/vertical com cabeçalho fixo. Primeira coluna permanece congelada. Apenas tabela de habilidades alterada.
- Cabeçalho e contêiner permanecem montados ao recalcular níveis; preservar posição do scroll. Dois testes adicionais de faixa e contrato de interface, sem alteração de dados ou fórmulas.

### Stage 20.83j — Intelligence and skill caps

- Três valores de INT (9950/8739/6669) e 13 tooltips do Arthur grade 11 reproduzidos exatamente por HP = base + incremento × (nível − 1 + floor(INT/75)). Terceira amostra: Dark Legacy -6519, Excalibur -6664, Guardian Sheath +1459. King's Command e Blessing of Avalon sem HP visível na terceira amostra. Fórmula experimental, extrapolação para outras skills, apenas PvE Normal; preservar HP sem INT, demais modos/atributos intactos. Campo opcional INT, zero desativa, URL int.
- Betting (1292): seis modos com MaxBookSkillLevel/MaxTotalSkillLevel 60/90 grades 0–4, 70/100 grades 5–6, 80/110 grades 7–11. Dados existentes corretos; causa do relato de 80 no slider não reproduzida. Exibir ambos os limites, botão Max Level, maior grade disponível como padrão quando não houver seleção; ao trocar skill usar máximo do novo grade, ao trocar grade mantendo nível manual preservar valor salvo se estava no cap anterior. Nenhuma alteração de dados, sem supor máximo igual para todas as skills.

### Stage 20.83k — Merlin INT evidence

- Player tooltip screenshots, 25/11/2026, Merlin [T Lv.2], source grade 11 matched by HP/MP cost and scaling. INT 18854/15507/13725 → floor(INT/75) = 251/206/183. Fourteen observed flat HP values match the unchanged formula, in addition to 13 Arthur samples (27 total, 10 skills, 2 mercenaries). No claim of universal or PvP/TBS applicability.
- Magic.ndt: Mystic Rune (1120, MAGIC_MERDARK, line 5049), level 61, base -571, inc -47, observed -15188 / not visible / -11992. The missing middle value -13073 is only a prediction.
- Gwendolen's Touch (1118, MAGIC_MERDESTROY, line 5073), level 2, base 1460, inc 30, observed 9020/7670/6980; distinct skill 1119 MAGIC_MERDESTROY2 has zero HP and is not substituted.
- Camelot's Grimoire (1117, MAGIC_MERAPPOINT, line 5037), level 60, base 828, inc 15, observed 5478/4803/4458.
- Omniscient Sanctuary (1121, MAGIC_MERGUARD, line 5097), level 62, base 300, inc 15, observed 4980/4305/3960.
- Dark Destiny (1131, MAGIC_MERDARKEX, line 5061), level 78, base -128, inc -12, observed -4064/-3524/-3248.
- Regression test checks exact source line, base, increment, observed values and preservation of all other effects/modes. UI notes updated in eight locales; no formula or source-data changes. Exact threshold and divisor remain empirical.

### Stage 20.83l — Wicked Bill INT evidence

- Tooltips enviados pelo jogador em 25/11/2026, Wicked Bill [T Lv.2]; grade 11 reconciliado com Magic.ndt, HP/MP/scaling. INT 9310/7893, níveis adicionais 124/105. Seis novas observações exatas, 33 no total (Arthur, Merlin, Wicked Bill; 13 habilidades, 8 valores de INT). Fórmula inalterada e ainda restrita à projeção experimental PvE Normal, não ao dano final.
- Betting (1292, MAGIC_BETTING, linha 9102), nível 62, HP base -746, inc -40, observado -8146/-7386, MP 850, scaling -41,06% (tooltip -41,1%); cap 110 incluindo charms.
- End of the Wasteland (1291, MAGIC_DEATHCOIN, linha 9090), nível 62, HP base -630, inc -54, observado -10620/-9594, MP 850, scaling -222,58% (tooltip -222,6%); cap 110.
- Duelist's Instinct (1289, MAGIC_INSTINCET, linha 9066), nível 80, HP base -1227, inc -49, observado -11174/-10243, MP 614, scaling -292,7%; cap 80.
- Betting tooltip mostra Ranged Damage 35%; interpretação específica de WeaponImmune_ATB e EndowedAmount_Immune/ImmuneInc ainda não confirmada. End of the Wasteland tooltip descreve ativação dependente do número de balas; não generalizar Proc Chance Total a probabilidade efetiva. Nenhuma alteração nessas regras.
- Testes verificam HP, linha, MP, scaling, caps, preservação dos demais campos e modos; avisos nos oito idiomas atualizados, dados e motor de cálculo intactos.


### Stage 20.84a — Monster Information / aggro investigation

- Reanálise local dos arquivos decodificados fornecidos pelo jogador; nenhum decoder ou arquivo bruto publicado. CharAttackInfo.ndt (inventário: 19/11/2026) contém Char, Nation, Aggressive, bAgrsiveWhenBattle, AiPoint, Atb; CharMonsterInfo.ndt (17/05/2025) contém Kind, MonsterIndex, PartyNum, Type. Join exato Kind = Char; nomes por NameTextNum → TextMgr_CharInfo_ENG. Não juntar por nome traduzido ou ID numérico de outro namespace.
- 4.351 Char distintos com Atb contendo token MONSTER e Nation=ALL, dos quais 2.705 presentes em CharMonsterInfo e 1.646 ausentes. CharMonsterInfo: 2.729 linhas, 2.726 Kind distintos (21 fora do conjunto MONSTER/ALL); duplicados HUMANSNAKEB1, AKPRISONERF3, AKFLYMANF1. Preservar múltiplas linhas e registros regionais.
- SHA-256 dos TXT decodificados locais: CharAttackInfo a242b853d71a0142c9f860217e5062f09a81672a18cea60691da5bc800923eeb; CharMonsterInfo 06aabee4d791c72e9fb55b622f3a2b28b6f59c8a130772898ecfd0e50afefd22; TextMgr_CharInfo_ENG f4116128114c4357ed0f764094fc0fb469f5f01b883b98197684e70071143d9d.
- Evidência do jogador (25/11/2026); ALL, linhas físicas dos TXT:

| Char / Nome | CharAttackInfo linha | Aggressive | bAgrsiveWhenBattle | CharMonsterInfo linha / índice | Monster Information in-game | Aggro espontâneo in-game |
|---|---:|---:|---:|---|---|---|
| AKPRISONERF1 / Mad Prisoner | 3784 | 0 | 1 | 2044 / 2243 | Sim | Desconhecido |
| AKPRISONERF4 / Awakened Prisoner | 3793 | 0 | 1 | Ausente | Não | Desconhecido |
| PYRAMID1 / Cursed Sphinx | 6038 | 4 | 1 | Ausente | Não | Desconhecido |
| EREMOS1MON1 / Flame Monster of Horror | 7011 | 6 | 1 | 2723 / 2986 | Sim | Sim |
| EREMOS1MON10 / Apocalyptic Dragon | 7210 | 0 | 0 | Ausente | Desconhecido | Desconhecido |

- Hipótese Monster Information = presença no CharMonsterInfo tem 4/4 observações concordantes (2 positivas, 2 negativas). Ausência em arquivo mais antigo não prova indisponibilidade atual. Não generalizar como confirmação individual para todos os monstros.
- Aggressive tem 1.516 zeros e 2.835 positivos (máximo 30) em MONSTER/ALL. bAgrsiveWhenBattle possui valores 0, 1 **e 2**; não tratar como booleano. Pares (Aggressive zero/positivo, bAgrsiveWhenBattle): zero/0 731, zero/1 783, zero/2 2, positivo/0 448, positivo/1 2356, positivo/2 31. Um positivo de aggro confirmado; zero ainda não testado. Não inferir unidade, distância, entrada em batalhas, efeito de AiPoint ou significado do valor 2.
- Próximo teste prioritário: um monstro de Aggressive=0 conhecido como não agressivo (ex.: Mad Prisoner), e, separadamente, observar se entra em combate próximo apesar de não iniciar combate. Testar positivo com bAgrsiveWhenBattle=0 e valor 2 posteriormente. Manter observação direta separada de parâmetros do cliente. Sem alteração de UI ou dados públicos nesta etapa.


### Stage 20.84b — Encyclopedia and Burning Outpost evidence

- Em 25/11/2026 o jogador relata possuir informação de 2.515 monstros; amarelo na lista significa Origin Info (quarto estágio). Branco continua sendo monstro listado; cor é progresso pessoal, não elegibilidade. Não interpretar 2515/2726 como conclusão comprovada, pois o total de entradas atualmente acessíveis no servidor é desconhecido.
- Três prints de 15 nomes cada foram reconciliados com os arquivos CharAttackInfo.ndt, CharMonsterInfo.ndt e TextMgr_CharInfo_ENG.ntx decodificados novamente localmente. Cada nome em inglês corresponde a exatamente um registro MONSTER/ALL e um Kind presente em CharMonsterInfo. 45/45 positivas adicionais; acumulado 49/49 observações de elegibilidade concordantes (47 positivas, 2 negativas). A ausência em um snapshot antigo continua não comprovando indisponibilidade no servidor.
- Identidades dos três prints, na ordem: UNICORNF1, UNICORNF2, HELSOLDIERF1, HELSOLDIERM1, EVILTREEM1, EVILTREEF1, TURTLER2, ELFFAIRYR1, ELFFAIRYM1, ELFFAIRYB1, HORNETF1, HORNETF2, SPIDERR1, SPIDERR2, SPIDERB1; WOLFF1, WOLFF2, BEARF1, BEARF2, DEERF1, DEERF3, FOXF1, FOXF2, FOXF4, BEEBABYF1, BEEBABYM1, GOLEMF1, GOLEMF2, GOLEMM1, ANTSOLF1; CRYSTALGUARDF2, ELIB1, DRACB1, KUFUKINGB1, MCOMB1, WILDBOARF1, CHIMPANZEEF1, PARRAKEETF1, FRILLEDLIZARDF1, SEAHORSER1, SEAHORSER2, SEAGUARDF1, SEAGUARDF2, CRABSOLDIERF1, CRABSOLDIERF2.
- Burning Outpost: jogador relata que os monstros da região não parecem mais dar aggro. Relato de região, não teste controlado de cada Kind. FIREOUTPOSTMON1–5 (Outpost, Basilisk / Lionman / Blazing Lizard / Gorilla / Brown Horse), nível 200, todos ALL, Aggressive=2 e bAgrsiveWhenBattle=1. Apenas FIREOUTPOSTMON1 presente em CharMonsterInfo. FIREEREMOSMON1–3 (Wasteland, Basilisk / Devil / Rakshasa) também 2/1 e ausentes na tabela. EREMOS1MON1–9 6/1 e presentes; EREMOS1MON10 0/0 e ausente. Não transformar Aggressive>0 em comportamento garantido; possíveis fatores de mapa, servidor ou condições do jogador ainda não confirmados.
- Próximo: identificar quais condições alteram aggro, testar exemplos 0/1/2/6 com nível do main e mapa registrados, buscar fonte de configuração de spawn/mapa; manter dado bruto e relato separados. Para UI, presença no índice de Monster Information como evidência de cliente, ausência como não encontrado, confirmação in-game separada. Nenhum dado público ou UI alterado.

### Stage 20.84c — Frozen Cave and low-level aggression

- Relato do jogador (25/11/2026): todos os monstros de Frozen Cave são agressivos; maioria dos monstros de level baixo não é agressiva. Relatos regionais/gerais, não testes individuais controlados. Referência histórica de localização: https://www.youtube.com/watch?v=mx0dVSyDlVc (Yeti e Wolf de nível 200); vínculo completo mapa/spawn ainda não confirmado.
- Nova leitura local de CharAttackInfo.ndt: ICEGOLEMF7 (Ice devil Golem, linha 6547), SNOWMANR3 (Snowhite Yeti, 6548), WOLFF16 (Ice devil Wolf, 6549), todos ALL, Level=200, Aggressive=6, bAgrsiveWhenBattle=1, ViewDistance=20, MoveDistance=10, AttackDistance_Min/Max=1/1, AiPoint=100. Candidatos de Frozen Cave. FIREOUTPOSTMON1–5 (linhas 6951–6955) têm Level=200, Aggressive=2, bAgrsiveWhenBattle=1, ViewDistance=12, MoveDistance=10, AttackDistance_Min/Max=2/7, AiPoint=100. EREMOS1MON1 (Flame Monster of Horror, linha 7011), confirmado agressivo anteriormente, tem Aggressive=6, bAgrsiveWhenBattle=1, ViewDistance=12 (não 20), demais parâmetros de distância iguais aos de Burning Outpost. ViewDistance não explica sozinho a diferença; Aggressive distingue esses exemplos, mas não inferir limiar universal, unidade ou alcance.
- Distribuição dos 4351 registros MONSTER/ALL por faixa de Level (total / Aggressive=0): 1–19: 781/497; 20–39: 136/110; 40–79: 670/260; 80–139: 1409/186; 140–179: 926/294; >=180: 429/169. Níveis 1–39: 607/917 (66,2%) zerados. Registros de cliente, não população ativa nem comportamento observado; nível bruto pode ser escalado. Nenhuma mudança em dados públicos.
- Próximo teste: observar o mesmo monstro com Aggressive positivo em dois personagens de níveis distintos, sem iniciar combate; registrar nível do main, mapa, nível exibido do monstro, distância aproximada e resultado. Buscar configuração de mapa/spawn no inventário completo do cliente. Separar aggro espontâneo de ingresso em batalha e evitar concluir que todos os valores 1–5 são passivos.

### Stage 20.85a — Skill table view controls

- Pausar investigação de Aggro conforme solicitado; retomar posteriormente sem concluir regra universal. Monster Information permanece candidato, não publicado.
- Skill Database: seis modos selecionáveis (pelo menos um), mostrar todos, modo completo padrão e opção Show totals only. Manter parâmetros fixos e componentes quando total indisponível; valores ausentes, alternativas conflitantes, INT experimental, fórmulas e dados originais preservados. Zeros ocultados nos modos selecionados. Preferências modes/totals na URL; grupos recolhíveis individualmente, expandir/recolher todos e estado preservado na sessão entre skills/grades. Oito idiomas. Largura mínima ajustada ao número de modos, sticky header e posição de scroll preservados. Três testes adicionais de seleção, fallback e UI. Não implementar representação 3×3 sem confirmar geometria.

### Stage 20.85b — Skill comparison

- Painel opcional na página Skill Database, duas skills pesquisáveis inclusive a mesma identidade com configurações diferentes, grade/nível/INT independentes, um modo de combate comum, totais por padrão ou visão detalhada. URLs compareSkillA/B, compareGradeA/B, compareLevelA/B, compareIntA/B, compareMode e compareTotals. A inicial usa skill selecionada; B vazio até seleção. Links individuais, limites de livros/charms, proveniência, oito idiomas.
- Motor compartilhado com opção retainZero apenas para comparação, distinguindo zero explícito de ausência. Não esconder componentes quando total indisponível; preservar conflitos por linha, não inferir valor ausente nem fallback entre modos. Diferença assinada B−A somente para valores numéricos únicos, sem conflito ou projeção acima do limite, não ranking. INT experimental só PvE. Nenhuma mudança nas fórmulas ou dados publicados. Três testes adicionais no CI existente.

### Stage 20.85c — Evolution family upgrade materials

- Usuário pediu adiar mecânicas dependentes de testes e pular Formation Builder; priorizar dados de evolução e custos já extraídos. Fonte OneLevelSolInfo_ENG.vna, candidato privado reconciliado e snapshot publicado mercenaries.json + item-names.json. CrystalUnique/CrystalNum e AtlasUnique/AtlasNum pertencem ao Char de origem da aresta NextGrade. Crosscheck histórico: https://atlantica-online.wikidot.com/class%3Aswordsman e https://atlantica-online.wikidot.com/class%3Aknight-merc (50/100 custos dos grades iniciais); https://atlantica.fandom.com/wiki/Spelltower_Siege_Patch explica Atlas como substituição. Não afirmar disponibilidade atual no servidor.
- 816 arestas explícitas, 816 origens distintas, todas com dois pares positivos. AtlasUnique=21559 (Atlas Ore) em 721, 21560 (Atlas Ore Fragment) em 73, 11045 (Unknown Transcendence Stone) em 10; 12 pares id/quantidade idênticos (não duplicar). SWORDMAN1→2 50 Ashen Crystal OU 1 Atlas Ore Fragment; SWORDMAN2→3 100/1; SWORDMAN10→11 2 Gyebaek: Condensed Transcendence Power OU 2 Unknown Transcendence Stone. MERLIN10→11 2 Merlin: Condensed Power of Transcendence (mesmo par alternativo), MERLIN11→12 4; MERLIN12 sem aresta não atribuir 6 como upgrade confirmado. ARTHUR7 sem aresta explícita para especialização; não inferir custo por grade/nome. Nove arestas GBTAIWHEGONG cruzam famílias, preservar links. Não usar NeedLevel como nível mínimo de upgrade (sem semântica confirmada).
- Evolution Family ganha colunas Upgrade material e Alternative (Atlas / other), quantidades formatadas, links de itens e perfis, aviso de origem em oito idiomas. Preservar tabela Requirements (raw) e todos os dados/arestas. Teste de cobertura de 816 custos e distribuição dos alternativos; nenhum custo cumulativo nem combinação obrigatória inferida.
