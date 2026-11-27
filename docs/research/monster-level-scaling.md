# Monstros com nível adaptável — evidências de 27/11/2026

Foram conferidos os 4.351 registros do catálogo. Temos 41 identidades confirmadas pelo jogador: 18 de Bran Castle e 23 reconciliadas individualmente com os quatro prints de Field Info. Cada nome dos prints encontrou uma única identidade no catálogo.

Os 299 registros restantes em [CSV](monster-level-scaling-candidates.csv) e [JSON](monster-level-scaling-candidates.json) são candidatos não confirmados. O critério é nível bruto 1 e ao menos um grupo com múltiplos bands. Isso não prova adaptação e não encontra necessariamente todos os casos: a regra efetiva pode estar no spawn, mapa ou servidor. Não foi encontrado um marcador explícito de adaptação nas fontes usadas nesta etapa. O comportamento dos candidatos não foi alterado.

## Confirmados

| CharID | Nome | Código exato | Local | Seção / evidência |
|---|---|---|---|---|
| 8036 | Bran Castle Royal Palace Guard | BRANCASTLEEVT1 | Bran Castle | Player report |
| 8037 | Bran Castle Veteran Sniper | BRANCASTLEEVT2 | Bran Castle | Player report |
| 8038 | Bran Castle Heavy Armored Infantry | BRANCASTLEEVT3 | Bran Castle | Player report |
| 8039 | Bran Castle Laughing Clown | BRANCASTLEEVT4 | Bran Castle | Player report |
| 8040 | Bran Castle Thorn Clown | BRANCASTLEEVT5 | Bran Castle | Player report |
| 8041 | Bran Castle Sorrowful Clown | BRANCASTLEEVT6 | Bran Castle | Player report |
| 8042 | Bran Castle Old Grandfather Clock | BRANCASTLEEVT7 | Bran Castle | Player report |
| 8043 | Bran Castle Marble Grandfather Clock | BRANCASTLEEVT8 | Bran Castle | Player report |
| 8044 | Bran Castle Luxury Grandfather Clock | BRANCASTLEEVT9 | Bran Castle | Player report |
| 8045 | Bran Castle Mage’s Apprentice | BRANCASTLEEVT10 | Bran Castle | Player report |
| 8046 | Bran Castle Reclusive Mage | BRANCASTLEEVT11 | Bran Castle | Player report |
| 8047 | Bran Castle Archmage | BRANCASTLEEVT12 | Bran Castle | Player report |
| 8048 | Bran Castle Iron Knight | BRANCASTLEEVT13 | Bran Castle | Player report |
| 8049 | Bran Castle Pure White Knight | BRANCASTLEEVT14 | Bran Castle | Player report |
| 8050 | Bran Castle Swan Knight | BRANCASTLEEVT15 | Bran Castle | Player report |
| 8051 | Bran Castle Rock Beast | BRANCASTLEEVT16 | Bran Castle | Player report |
| 8052 | Bran Castle Pure Schvene | BRANCASTLEEVT17 | Bran Castle | Player report |
| 8053 | Bran Castle Mad Lord | BRANCASTLEEVT18 | Bran Castle | Player report |
| 1010 | Sandy Octopus | OCTOPUSR1 | Ghost Ship of the Caribbean | Pirate Ship’s Grave |
| 1011 | Green Octopus | OCTOPUSR2 | Ghost Ship of the Caribbean | Pirate Ship’s Grave |
| 3483 | Immortal Protector of Worlds | STONEGUARDF5 | Chaotic Tower of Babel | Twisted Pantheon |
| 3485 | Immortal Protector of Times | STONEGUARDF7 | Chaotic Tower of Babel | Twisted Pantheon |
| 3484 | Immortal Protector of Chaos | STONEGUARDF6 | Chaotic Tower of Babel | Twisted Pantheon |
| 3486 | Immortal Minister | FALLENPRIESTM4 | Chaotic Tower of Babel | Twisted Pantheon |
| 3487 | Immortal Priest | FALLENPRIESTM5 | Chaotic Tower of Babel | Twisted Pantheon |
| 3488 | Immortal Archbishop | FALLENPRIESTM6 | Chaotic Tower of Babel | Twisted Pantheon |
| 1012 | Forgotten Warrior | OBLIVIIONF1 | Ghost Ship of the Caribbean | Damp Cabin |
| 1014 | Ancient High Priest | OBLIVIIONM2 | Ghost Ship of the Caribbean | Damp Cabin |
| 1013 | Forgotten Wizard | OBLIVIIONM1 | Ghost Ship of the Caribbean | Damp Cabin |
| 1016 | Ancient Beast | ANCIENTBEASTF1 | Ghost Ship of the Caribbean | Damp Cabin |
| 1017 | Brutal Ancient Beast | ANCIENTBEASTF2 | Ghost Ship of the Caribbean | Damp Cabin |
| 1008 | Glittering Flying Fish | RAYR1 | Ghost Ship of the Caribbean | Damp Cabin |
| 1009 | Red Flying Fish | RAYR2 | Ghost Ship of the Caribbean | Damp Cabin |
| 1018 | Forgotten Monster | ANCIENTBEASTF3 | Ghost Ship of the Caribbean | Damp Cabin |
| 1007 | Flying Fish | RAYF1 | Ghost Ship of the Caribbean | Damp Cabin |
| 1116 | Stray Watchdog | DOGF1 | Alcatraz Prison | Central Block |
| 1117 | Trained Watchdog | DOGF2 | Alcatraz Prison | Central Block |
| 1112 | Apprehended Prisoner | PRISONERF1 | Alcatraz Prison | Central Block |
| 1113 | Bound Prisoner | PRISONERF2 | Alcatraz Prison | Central Block |
| 1124 | Awakening Pelican | PELICANMANF2 | Alcatraz Prison | Central Block |
| 1126 | Splendid Flyman | FLYMANF2 | Alcatraz Prison | Central Block |

## Tratamento dos drops

Para os confirmados, a página separa os drops por grupo, band e faixa de nível do main. Em cada grupo, só o band correspondente ao nível se aplica. Grupos diferentes continuam sendo fontes independentes; as probabilidades de bands alternativos não são somadas. As linhas diretas, incluindo Faust's Instrument Jackpot Box, são mantidas fora dessa seleção.

No grupo 53 de Bran Castle, main 200 corresponde ao band 9, a partir de 181. O band 8 cobre 161–180 e também contém parte dos itens relatados. O relato ao nível 200 concorda com as caixas Twilight, Judgment e Abyssal e as moedas Gold e Platinum do band 9. As demais linhas e taxas continuam como candidatos extraídos do cliente.

As capturas de Damp Cabin, Twisted Pantheon e Central Block exibem nível 200. Pirate Ship's Grave exibe Sandy Octopus e Green Octopus sem níveis visíveis; a confirmação de adaptação vem do relato explícito do jogador. Nenhum monstro não mostrado foi confirmado apenas por compartilhar a dungeon.

O exportador da auditoria é [audit-monster-level-scaling.mjs](../../scripts/audit-monster-level-scaling.mjs). Os arquivos originais de drops não foram alterados.
