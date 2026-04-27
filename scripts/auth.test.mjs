import assert from "node:assert/strict";
import {
  authenticate,
  canAccessAdmin,
  getRoleLabel,
  TEST_USERS,
} from "../src/auth.js";

assert.equal(authenticate("user@mky.test", "user123")?.role, "user");
assert.equal(authenticate("methodist@mky.test", "methodist123")?.role, "methodist");
assert.equal(authenticate("admin@mky.test", "admin123")?.role, "admin");
assert.equal(authenticate("admin@mky.test", "wrong"), null);

assert.equal(canAccessAdmin(TEST_USERS.user), false);
assert.equal(canAccessAdmin(TEST_USERS.methodist), true);
assert.equal(canAccessAdmin(TEST_USERS.admin), true);

assert.equal(getRoleLabel("user"), "Пользователь");
assert.equal(getRoleLabel("methodist"), "Методист");
assert.equal(getRoleLabel("admin"), "Администратор");

console.log("auth tests passed");
