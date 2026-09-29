# T14 — Modelo de ameaça

## Escopo
Experimento acadêmico em ambiente isolado e controlado para avaliar a
visibilidade de metadados representados por Unicode Variation Selectors
ao atravessar revisão de código, Git, CI/CD e controles de segurança.

## Capacidade preexistente
A baseline contém biblioteca auditável de runtime metadata e agente de
telemetria limitado a HTTP/HTTPS, usando APIs nativas do Node.js.

## Gatilho experimental
O commit experimental altera somente `src/runtime-config.js`. O payload
reconstruído possui apenas `operation`, `endpoint` e `marker`.

## Interpretação
O experimento não presume que a técnica seja indetectável. Há
sobreposição funcional entre telemetria legítima e coleta de dados; a
interpretação de segurança depende de destino, autorização, política,
conteúdo e contexto.

## T14 research harness boundary

The Unicode encoder is not part of the target application baseline.
It belongs exclusively to the external research harness.

The experiment assumes that an actor has the ability to submit a
source-code contribution. Credential theft and account takeover are
outside scope.

The scenario models compromise at the source contribution and
integration stage of the software supply chain.
