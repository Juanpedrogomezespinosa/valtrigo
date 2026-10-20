import { expect, test as base } from '@playwright/test';

// `test` de Playwright con una comprobación automática: si la página lanza un error de JavaScript
// durante el test, el test falla. Así un fallo interno no pasa desapercibido aunque el juego siga en pantalla.
export const test = base.extend<{ failOnPageErrors: void }>({
  failOnPageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'Errores de JavaScript en la página').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
