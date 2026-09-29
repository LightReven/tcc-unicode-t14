# T13 — Modelo de ameaça

## Escopo
Experimento acadêmico em ambiente isolado e controlado para avaliar a
visibilidade de metadados representados por Unicode Variation Selectors
ao atravessar revisão de código, Git, CI/CD e controles de segurança.

## Capacidade preexistente
A baseline contém biblioteca auditável de runtime metadata e agente de
telemetria limitado a HTTP/HTTPS, usando APIs nativas do Node.js.
Destinos são restritos a 192.168.56.0/24 e não há execução arbitrária
de comandos.

## Gatilho experimental
O commit experimental altera somente `src/runtime-config.js`. O payload
reconstruído possui apenas `operation`, `endpoint` e `marker`.

## Interpretação
O experimento não presume que a técnica seja indetectável. Há
sobreposição funcional entre telemetria legítima e coleta de dados; a
interpretação de segurança depende de destino, autorização, política,
conteúdo e contexto.

## Fora de escopo
Persistência, movimento lateral, execução arbitrária de comandos,
coleta além do conjunto de diagnóstico definido e comprometimento
clássico de dependência publicada.