import { test, expect, type Locator, type Page } from '@playwright/test';
3
const POSITION_ID = 1;

const phaseColumnTestId = (phaseName: string) =>
  `phase-column-${phaseName.toLowerCase().replace(/\s+/g, '-')}`;

// Matches backend/prisma/seed.ts for position 1 (Senior Full-Stack Engineer)
const positionName = 'Senior Full-Stack Engineer';
const phases = ['Initial Screening', 'Technical Interview', 'Manager Interview'] as const;
const candidates = [
  { candidateId: 1, fullName: 'John Doe', currentInterviewStep: 'Technical Interview', averageScore: 5 },
  { candidateId: 2, fullName: 'Jane Smith', currentInterviewStep: 'Technical Interview', averageScore: 4 },
  { candidateId: 3, fullName: 'Carlos García', currentInterviewStep: 'Initial Screening', averageScore: 0 },
];

async function mockCandidateStageUpdate(page: Page) {
  await page.route('**/candidates/**', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Candidate stage updated successfully' }),
    });
  });
}

async function dragByMouse(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error('Could not measure source or target for drag and drop');
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + Math.min(targetBox.height - 12, 140);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // react-beautiful-dnd ignores a click until the pointer moves past its threshold
  await page.mouse.move(startX, startY + 12, { steps: 8 });
  await page.mouse.move(endX, endY, { steps: 30 });
  await page.mouse.up();
}

async function mockPositionApis(page: Page) {
  await page.route(`**/positions/${POSITION_ID}/interviewFlow`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        interviewFlow: {
          positionName,
          interviewFlow: {
            id: 1,
            description: 'Standard development interview process',
            interviewSteps: phases.map((name, index) => ({
              id: index + 1,
              interviewFlowId: 1,
              interviewTypeId: index + 1,
              name,
              orderIndex: index + 1,
            })),
          },
        },
      }),
    });
  });

  await page.route(`**/positions/${POSITION_ID}/candidates`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        candidates.map((candidate) => ({
          ...candidate,
          applicationId: candidate.candidateId,
        }))
      ),
    });
  });
}

test.describe('Position page', () => {
  test('loads title, phase columns and candidates in the correct column', async ({ page }) => {
    // Given I am on /positions/1
    await mockPositionApis(page);
    const boardLoaded = Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/positions/${POSITION_ID}/interviewFlow`) && response.ok()
      ),
      page.waitForResponse(
        (response) =>
          response.url().includes(`/positions/${POSITION_ID}/candidates`) && response.ok()
      ),
    ]);

    // When the Position page finishes loading
    await page.goto(`/positions/${POSITION_ID}`);
    await boardLoaded;

    // Then I see the correct position title
    const title = page.getByTestId('position-title');
    await expect(title).toHaveText(positionName);
    await expect(page.getByRole('heading', { name: positionName, level: 2 })).toBeVisible();

    // And a column for each real hiring phase
    for (const phase of phases) {
      const column = page.getByTestId(phaseColumnTestId(phase));
      await expect(column).toBeVisible();
      await expect(page.getByRole('region', { name: phase })).toBeVisible();
      await expect(column.getByRole('heading', { name: phase, level: 3 })).toBeVisible();
    }

    // And each candidate card in the column of their current phase
    for (const candidate of candidates) {
      const column = page.getByTestId(phaseColumnTestId(candidate.currentInterviewStep));
      const card = column.getByTestId(`candidate-card-${candidate.candidateId}`);
      await expect(card).toBeVisible();
      await expect(card.getByRole('heading', { name: candidate.fullName, level: 4 })).toBeVisible();
    }
  });

  test('moves a candidate to another phase and updates the backend', async ({ page }) => {
    const carlos = candidates.find((candidate) => candidate.fullName === 'Carlos García');
    if (!carlos) {
      throw new Error('Seed candidate Carlos García is missing from the fixture');
    }
    const applicationId = carlos.candidateId;
    const technicalInterviewStepId = phases.indexOf('Technical Interview') + 1;
    const sourceColumn = page.getByTestId(phaseColumnTestId('Initial Screening'));
    const destinationColumn = page.getByTestId(phaseColumnTestId('Technical Interview'));
    const carlosCard = page.getByTestId(`candidate-card-${carlos.candidateId}`);

    // Given I am on /positions/1 and Carlos García is in Initial Screening
    await mockPositionApis(page);
    await mockCandidateStageUpdate(page);
    await page.goto(`/positions/${POSITION_ID}`);
    await expect(sourceColumn.getByTestId(`candidate-card-${carlos.candidateId}`)).toBeVisible();
    await expect(carlosCard.getByRole('heading', { name: carlos.fullName, level: 4 })).toBeVisible();

    // When I drag his card to Technical Interview
    const putResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        new URL(response.url()).pathname === `/candidates/${carlos.candidateId}`
    );
    await dragByMouse(page, carlosCard, destinationColumn);

    // Then the card appears in Technical Interview
    await expect(destinationColumn.getByTestId(`candidate-card-${carlos.candidateId}`)).toBeVisible();
    await expect(sourceColumn.getByTestId(`candidate-card-${carlos.candidateId}`)).toHaveCount(0);

    // And PUT /candidates/:id is fired with the moved candidate, the new phase id, and a 200
    const putResponse = await putResponsePromise;
    const putRequest = putResponse.request();
    expect(putRequest.url()).toBe(`http://localhost:3010/candidates/${carlos.candidateId}`);
    expect(putRequest.postDataJSON()).toEqual({
      applicationId,
      currentInterviewStep: technicalInterviewStepId,
    });
    expect(putResponse.status()).toBe(200);
  });
});
