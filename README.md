# TCC CIGE — Série experimental Unicode / CI-CD

Evolução T11 → T12 → T13.

- T11: separação inicial entre runtime metadata e gatilho experimental.
- T12: dispatcher controlado, timeout, métricas e callback de identidade.
- T13: baseline de telemetria auditável usando APIs nativas Node.js.

No T13, o commit experimental altera somente `src/runtime-config.js`.
`operation`, `endpoint` e `marker` são reconstruídos a partir de Unicode
Variation Selectors.

O SHA-256 é usado como evidência de integridade entre referência e
reconstrução, não como autorização hardcoded da baseline.

Consulte `docs/THREAT_MODEL.md`.
## T14 experimental boundary

T14 preserves the T13 runtime architecture but moves the Unicode
encoder completely outside the application repository.
