
import {LoginPage} from '../pages/LoginPage'
import {credentials} from '../test-data/testData'
import {test} from '../fixtures/pages.fixture'


// ════════════════════════════════════════════════════════════════════
// 2. POSITIVE TEST — SUCCESSFUL LOGIN
// ════════════════════════════════════════════════════════════════════
test("TC01-Login with valid username and password",{tag :['@smoke','@regression']}, async ({ loginPage,page }) =>
{
 await loginPage.FillLoginForm(credentials.valid);
});
//***************************// */
test("TC02-Login with Empty username and password",{tag :['@smoke']}, async ({ loginPage,page }) =>
{
    await loginPage.EmptyLoginForm(credentials.empty);
    await page.getByText('Required').first().isVisible;
});
//***************************// */
test("TC03-Login with  username and invalid password",{tag :['@smoke']}, async ({ loginPage,page }) =>
{
    await loginPage.FillLoginForm(credentials.invalidpassword);
     await page.getByText('Invalid credentials').isVisible;
});
//****************** */
//***************************// */
test("TC04-Forget Pawword link in Login Form",{tag :['@smoke','@regression']}, async ({ loginPage,page }) =>
{
    await loginPage.ForgetPasswordlink();
    await page.getByText('Reset Password').isVisible;
});