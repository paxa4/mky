import assert from "node:assert/strict";
import {
  canAccessAdmin,
  canAccessDomuAdmin,
  canAccessTpmpkAdmin,
  getRoleLabel,
} from "../src/auth.js";

assert.equal(canAccessAdmin({ role: "user" }), false);
assert.equal(canAccessAdmin({ role: "methodist" }), true);
assert.equal(canAccessAdmin({ role: "admin" }), true);

assert.equal(canAccessTpmpkAdmin({ role: "operator" }), true);
assert.equal(canAccessTpmpkAdmin({ role: "methodist" }), false);
assert.equal(canAccessTpmpkAdmin({ role: { role_name: "admin" } }), true);

assert.equal(canAccessDomuAdmin({ role: "domu_editor" }), true);
assert.equal(canAccessDomuAdmin({ role: "methodist" }), true);
assert.equal(canAccessDomuAdmin({ role: "user" }), false);

assert.equal(getRoleLabel("user"), "Пользователь");
assert.equal(getRoleLabel("methodist"), "Методист");
assert.equal(getRoleLabel("admin"), "Администратор");

console.log("auth tests passed");
