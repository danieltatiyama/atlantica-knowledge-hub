# Atlantica Online Knowledge Hub — Contexto para Continuidade

**Última atualização:** 23/11/2026  
**Projeto:** Atlantica Online Knowledge Hub  
**Repositório:** https://github.com/danieltatiyama/atlantica-knowledge-hub  
**Branch principal:** `main`  
**Última etapa concluída:** Stage 20.49  
**Último PR integrado:** [PR #67](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/67)

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

## 7. Histórico das etapas recentes

| Etapa | PR | Entrega |
|---|---|---|
| 20.45 | [#63](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/63) | Drops apresentados de maneira orientada ao jogador |
| 20.46 | [#64](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/64) | Navegação flutuante, seções recolhíveis e separação entre Equipment e All Items |
| 20.47 | [#65](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/65) | Correção dos drops por faixas de nível e links reversos |
| 20.48 | [#66](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/66) | Seletor global de seis temas |
| 20.49 | [#67](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/67) | Alinhamento do cabeçalho e correções de contraste |

Todos esses PRs foram integrados à `main`.

**Último commit de integração conhecido no momento da elaboração do documento:**

`17dfda96ab678af080e8b4f37c345be6d65ad9d8`

O pipeline do GitHub Actions da Stage 20.49 foi concluído com sucesso, incluindo testes automatizados, validações de dados e build do Astro.

Não havia, ao final da etapa 20.49, uma alteração funcional pendente especificamente solicitada pelo usuário.

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

**Novas funcionalidades:** ferramentas, calculadoras e sistemas interativos relacionados ao jogo, incluindo funcionalidades para gerenciamento de Nation Dungeons e nações.

Esses são possíveis caminhos, não tarefas já autorizadas para implementação. A próxima atividade deve ser determinada pela continuação da conversa.

## 10. Orientação final para o próximo ChatGPT

Este é um projeto real e em desenvolvimento ativo.

**Não começar do zero. Não propor reconstruir a Wiki. Não presumir que recursos existentes ainda precisam ser implementados.**

Consultar o repositório, entender sua arquitetura atual e dar continuidade ao desenvolvimento a partir do último estado validado.

As informações extraídas do cliente representam uma vantagem importante do projeto e devem ser tratadas como uma base técnica auditável.

A Wiki, porém, deve continuar priorizando aquilo que o jogador deseja saber: o que é um item, como fabricá-lo, onde encontrá-lo, quais monstros podem fornecê-lo e quais informações são efetivamente confiáveis.

Sempre que uma nova funcionalidade for implementada, avaliar seu impacto nas demais partes da Wiki, especialmente nos links de receitas, drops e páginas relacionadas.

**Estado documentado: Stage 20.49 concluída, PR #67 integrado à `main`, validações aprovadas e nenhuma nova tarefa funcional pendente nesse momento.**
