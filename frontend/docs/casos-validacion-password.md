# Casos de validación de contraseña (manual)

Fuente de verdad: `src/features/auth/validators/validation.ts` (`getPasswordIssues` / `validatePassword` / `validateLoginPassword`).

## Registro / cambio (política completa)
| Caso | Valor | Resultado esperado | Motivo |
|---|---|---|---|
| Vacía | `""` | Inválida | Requerida |
| Solo espacios | `"        "` (8 espacios) | Inválida | Solo espacios |
| Solo tabs | `"\t\t\t\t\t\t\t\t"` | Inválida | Solo whitespace |
| Solo NBSP | 8 × `U+00A0` | Inválida | Solo whitespace Unicode |
| Espacio inicial | `" Abcdef12"` | Inválida | Espacio al inicio |
| Espacio final | `"Abcdef12 "` | Inválida | Espacio al final |
| Sin número | `"abcdefgh"` | Inválida | Falta número |
| Sin letra | `"12345678"` | Inválida | Falta letra |
| Muy corta | `"Abcdef1"` (7) | Inválida | < 8 caracteres |
| Válida básica | `"Abcdef12"` | Válida | Cumple reglas |
| Válida con espacios internos | `"mi clave 2026"` | Válida | Passphrase permitida |
| > 72 bytes UTF-8 | `"ñ".repeat(37) + "a1"` | Inválida | Supera 72 bytes |
| ≤ 72 bytes UTF-8 | `"ñ".repeat(30) + "a1"` | Válida | 62 bytes, cumple reglas |
| Emoji repetido largo | varios emojis hasta > 72 bytes | Inválida | Supera 72 bytes |
| 200 caracteres | 200 chars válidos | Inválida (input recortado a 128 y/o por bytes) | Límite duro/bytes |

## Login
| Caso | Valor | Resultado esperado |
|---|---|---|
| Vacía | `""` | Inválida (requerida) |
| Solo espacios | `"        "` | Inválida (solo espacios) |
| > 72 bytes | > 72 bytes | Inválida (límite bytes) |
| Cualquier otra no vacía | `"usuario-antiguo"` | Válida en cliente (sin comprobar complejidad) |

## Notas
- El valor enviado al servidor **no se modifica** con `trim()`.
- Confirmación compara igualdad estricta con la contraseña original.
- El contador de contraseña muestra **bytes** con tope 72.
