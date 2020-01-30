import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const UpdateAccountMutation = importAsString("./UpdateAccountMutation.graphql");

jest.setTimeout(300000);

let testApp;
let updateAccount;
let mockAdminUserAccount;
let mockOtherUserAccount;
let adminAccountOpaqueId;
let otherAccountOpaqueId;

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  await testApp.insertPrimaryShop();
  updateAccount = testApp.mutate(UpdateAccountMutation);

  mockAdminUserAccount = Factory.Account.makeOne({ _id: "mockAdminUserId" });
  adminAccountOpaqueId = encodeOpaqueId("reaction/account", mockAdminUserAccount._id);
  await testApp.createUserAndAccount(mockAdminUserAccount, ["reaction:legacy:accounts/update"]);

  mockOtherUserAccount = Factory.Account.makeOne({ _id: "mockOtherUserId" });
  otherAccountOpaqueId = encodeOpaqueId("reaction/account", mockOtherUserAccount._id);
  await testApp.createUserAndAccount(mockOtherUserAccount);
});

// There is no need to delete any test data from collections because
// testApp.stop() will drop the entire test database. Each integration
// test file gets its own test database.
afterAll(() => testApp.stop());

afterEach(async () => {
  await testApp.clearLoggedInUser();
});

test("user can update their own account", async () => {
  await testApp.setLoggedInUser(mockOtherUserAccount);

  let result;
  try {
    result = await updateAccount({
      input: {
        accountId: otherAccountOpaqueId,
        currencyCode: "USD",
        language: "en",
        firstName: "FIRST",
        lastName: "LAST",
        name: "FIRST LAST",
        note: "This is a note",
        username: "emanresu",
        picture: "https://foo.bar.com/me.jpg",
        bio: "Test account"
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateAccount.account).toEqual({
    currency: { code: "USD" },
    language: "en",
    firstName: "FIRST",
    lastName: "LAST",
    name: "FIRST LAST",
    note: "This is a note",
    username: "emanresu",
    picture: "https://foo.bar.com/me.jpg",
    bio: "Test account"
  });
});

test("accounts admin can update any other account", async () => {
  await testApp.setLoggedInUser(mockAdminUserAccount);

  let result;
  try {
    result = await updateAccount({
      input: {
        accountId: otherAccountOpaqueId,
        currencyCode: "USD",
        language: "en",
        firstName: "FIRST",
        lastName: "LAST",
        name: "FIRST LAST",
        note: "This is a note",
        username: "emanresu",
        picture: "https://foo.bar.com/me.jpg",
        bio: "Test account"
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateAccount.account).toEqual({
    currency: { code: "USD" },
    language: "en",
    firstName: "FIRST",
    lastName: "LAST",
    name: "FIRST LAST",
    note: "This is a note",
    username: "emanresu",
    picture: "https://foo.bar.com/me.jpg",
    bio: "Test account"
  });
});

test("user cannot update an account if not logged in", async () => {
  try {
    await updateAccount({
      input: { accountId: otherAccountOpaqueId, currencyCode: "INR" }
    });
  } catch (errors) {
    expect(errors[0].message).toBe("Access Denied");
  }
});

test("user cannot update another account if they don't have permission", async () => {
  await testApp.setLoggedInUser(mockOtherUserAccount);

  try {
    await updateAccount({
      input: { accountId: adminAccountOpaqueId, currencyCode: "INR" }
    });
  } catch (errors) {
    expect(errors[0].message).toBe("Access Denied");
  }
});