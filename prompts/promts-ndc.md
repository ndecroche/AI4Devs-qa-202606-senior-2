# Prompts utilizados — NDC

1. "Actúa como QA. Genera un test E2E con Playwright para el Escenario 1: carga de la página de Position.

Given que estoy en /positions/1
When la página de Position termina de cargar
Then debo ver el título correcto de la posición
And debo ver una columna por cada fase real del proceso de contratación
And cada tarjeta de candidato debe estar en la columna de su fase actual

Usa getByRole, getByLabel y getByTestId. No uses selectores de clase ni IDs auto-generados.

Antes de escribir el test, inspecciona PositionDetails.js, StageColumn.js, CandidateCard.js y el seed: las fases exactas deben coincidir con la interfaz. No uses fases de ejemplo como \"Aplicado / Entrevista / Prueba Técnica / Oferta / Contratado / Rechazado\" si no existen. Si hace falta, añade data-testid en la UI sin cambiar la lógica.

Coloca el test en frontend/tests/e2e/position.spec.ts (Playwright ya está en frontend/playwright.config.ts). No implementes el Escenario 2 (drag and drop / PUT).

Genera el test, ejecútalo y arréglalo hasta que pase tres veces seguidas sin flakiness."

2. "Genera un test E2E con Playwright para el Escenario 1: carga de la página de Position.

Given que estoy en /positions/1
When la página de Position termina de cargar
Then debo ver el título correcto de la posición
And debo ver una columna por cada fase real del proceso de contratación
And cada tarjeta de candidato debe estar en la columna de su fase actual

Usa getByRole, getByLabel y getByTestId. No uses selectores de clase ni IDs auto-generados.

Antes de escribir el test, inspecciona PositionDetails.js, StageColumn.js, CandidateCard.js y el seed: las fases exactas deben coincidir con la interfaz. No uses fases de ejemplo como \"Aplicado / Entrevista / Prueba Técnica / Oferta / Contratado / Rechazado\" si no existen. Si hace falta, añade data-testid en la UI sin cambiar la lógica.

Coloca el test en frontend/tests/e2e/position.spec.ts (Playwright ya está en frontend/playwright.config.ts). No implementes el Escenario 2 (drag and drop / PUT).

Genera el test, ejecútalo y arréglalo hasta que pase tres veces seguidas sin flakiness."

3. "Ahora segui con escribir un nuevo promt, siguiendo las buenas practicas para esto:

Escenario 2: Cambio de fase de un candidato
Crear una prueba que simule el movimiento de un candidato de una fase a otra. La prueba debe verificar:

Que se puede arrastrar una tarjeta de candidato desde una columna hacia otra.

Que la tarjeta del candidato aparece visualmente en la nueva columna.

Que la fase del candidato se actualiza correctamente en el backend mediante el endpoint:

PUT /candidate/:id

La prueba debe validar que al mover el candidato:

Se dispara una petición PUT.

El id del candidato corresponde al candidato movido.

El body de la petición contiene la nueva fase.

La respuesta del backend es exitosa."

4. "Genera un test Playwright para el cambio de fase de un candidato en la página de Position.

Given que estoy en /positions/1 y veo a Carlos García en la columna Initial Screening
When arrastro su tarjeta a la columna Technical Interview
Then la tarjeta aparece en Technical Interview
And se dispara PUT http://localhost:3010/candidates/:id
And :id es el candidateId del candidato movido
And el body incluye applicationId y currentInterviewStep con el id numérico de Technical Interview
And la respuesta es exitosa (status 200).

Usa getByRole, getByLabel y getByTestId. No uses selectores de clase ni IDs auto-generados.
Reutiliza los data-testid ya existentes (position-title, phase-column-*, candidate-card-*). No reescribas el Escenario 1.

Inspecciona PositionDetails.js, StageColumn.js y CandidateCard.js antes de escribir el test:
- el drag and drop es react-beautiful-dnd
- el PUT real es /candidates/:id (plural), no /candidate/:id
- currentInterviewStep en el body es el id de la fase de destino, no el texto de la columna

Añade el test en frontend/tests/e2e/position.spec.ts.
Intercepta el PUT (page.waitForRequest o page.route) para afirmar URL, id, body y status.
Si el dragTo de Playwright falla con react-beautiful-dnd, usa mouse down/move/up con steps; no uses waitForTimeout fijo.

Genera el test, ejecútalo y arréglalo hasta que pase tres veces seguidas sin flakiness."
