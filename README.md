# TCC CIGE â€” SÃ©rie experimental Unicode / CI-CD

EvoluÃ§Ã£o T11 â†’ T12 â†’ T13.

- T11: separaÃ§Ã£o inicial entre runtime metadata e gatilho experimental.
- T12: dispatcher controlado, timeout, mÃ©tricas e callback de identidade.
- T13: baseline de telemetria auditÃ¡vel usando APIs nativas Node.js.

No T13, o commit experimental altera somente `src/runtime-config.js`.
`operation`, `endpoint` e `marker` sÃ£o reconstruÃ­dos a partir de Unicode
Variation Selectors.

O SHA-256 Ã© usado como evidÃªncia de integridade entre referÃªncia e
reconstruÃ§Ã£o, nÃ£o como autorizaÃ§Ã£o hardcoded da baseline.

Consulte `docs/THREAT_MODEL.md`.