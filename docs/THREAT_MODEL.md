# T13 â€” Modelo de ameaÃ§a

## Escopo
Experimento acadÃªmico em ambiente isolado e controlado para avaliar a
visibilidade de metadados representados por Unicode Variation Selectors
ao atravessar revisÃ£o de cÃ³digo, Git, CI/CD e controles de seguranÃ§a.

## Capacidade preexistente
A baseline contÃ©m biblioteca auditÃ¡vel de runtime metadata e agente de
telemetria limitado a HTTP/HTTPS, usando APIs nativas do Node.js.
Destinos sÃ£o restritos a 192.168.56.0/24 e nÃ£o hÃ¡ execuÃ§Ã£o arbitrÃ¡ria
de comandos.

## Gatilho experimental
O commit experimental altera somente `src/runtime-config.js`. O payload
reconstruÃ­do possui apenas `operation`, `endpoint` e `marker`.

## InterpretaÃ§Ã£o
O experimento nÃ£o presume que a tÃ©cnica seja indetectÃ¡vel. HÃ¡
sobreposiÃ§Ã£o funcional entre telemetria legÃ­tima e coleta de dados; a
interpretaÃ§Ã£o de seguranÃ§a depende de destino, autorizaÃ§Ã£o, polÃ­tica,
conteÃºdo e contexto.

## Fora de escopo
PersistÃªncia, movimento lateral, execuÃ§Ã£o arbitrÃ¡ria de comandos,
coleta alÃ©m do conjunto de diagnÃ³stico definido e comprometimento
clÃ¡ssico de dependÃªncia publicada.