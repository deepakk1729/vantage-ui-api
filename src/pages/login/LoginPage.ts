import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class LoginPage extends BasePage {

  readonly cancelAndTakeToSignIn;

  readonly usernameInput;
  readonly nextButton;
  
  readonly passwordOption;

  readonly passwordInput;
  readonly signInButton;

  readonly backToSignIn;

  constructor(page: Page) {
    super(page);

    this.cancelAndTakeToSignIn = page.getByRole('link', { name: 'Cancel and take me to sign in' });

    this.usernameInput = page.getByRole('textbox', {name: 'Email Address'});
    this.nextButton = page.getByRole('button', {name: 'Next'});

    this.passwordOption = page.getByRole('link', { name: 'Select Password.' });

    this.passwordInput = page.getByRole('textbox', {name: 'Password'});
    this.signInButton = page.getByRole('button', {name: 'Verify'});

    this.backToSignIn = page.getByRole('link', { name: 'Back to sign in' });
  }

  async login(username: string, password: string) {

    // Pre condition — IWA-only screen (BCG Windows); not present in CI (Linux).
    await this.cancelAndTakeToSignIn.click({ timeout: 5000 }).catch(() => undefined);


    // CASE 1:
    // username screen appears

    let state = true;
    
    const isUsernameVisible =
      await this.usernameInput
        .waitFor({
          state: 'visible',
          timeout: 10000
        })
      .then(() => true)
      .catch(() => false);
        
    const enterUsername = async (username: string) => {

        await this.usernameInput.fill(username);
        await this.nextButton.click();
        state = false;
    }

    if (isUsernameVisible && state) {
      await enterUsername(username);
    }


    // CASE 2:
    // password option screen appears
    const isPasswordOptionVisible =
      await this.passwordOption
        .waitFor({
          state: 'visible',
          timeout: 5000
        })
        .then(() => true)
        .catch(() => false);

    if (isPasswordOptionVisible) {

      // if username screen didn't appear,
      // then go back
      if (!isUsernameVisible) {
        await this.backToSignIn.click();
        await enterUsername(username);

      } else {
        await this.passwordOption.click();
      }

    }

    // CASE 3:
    // password screen
    const isPasswordVisible =
      await this.passwordInput
        .waitFor({
          state: 'visible',
          timeout: 5000
        })
        .then(() => true)
        .catch(() => false);

    if (isPasswordVisible) {
      await this.passwordInput.fill(password);

      await this.signInButton.click();
    }

    return;


  }
}
