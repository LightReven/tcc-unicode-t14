# @tcc/runtime-metadata

Biblioteca de pesquisa para leitura, normalização e validação de metadados de runtime.

## Escopo

- leitura de metadados estruturados;
- representação por seletores de variação Unicode;
- normalização e validação;
- nenhuma execução dinâmica de código;
- nenhuma função de rede;
- API pública: `readRuntimeMetadata()` e `decodeRuntimeMetadata()`.

A implementação é deliberadamente auditável para separar a capacidade preexistente da baseline do conteúdo introduzido posteriormente no T11.
