/**
 * Create a test editor account for development/testing.
 * Email: editor@sanaathrumylens.co.ke
 * Password: Editor254!
 */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/editor-auth";

async function main() {
  const email = "editor@sanaathrumylens.co.ke";
  const name = "Test Editor";
  const password = "Editor254!";

  const existing = await db.editor.findUnique({ where: { email } });

  if (existing) {
    // Update existing — reset password and activate
    const passwordHash = await hashPassword(password);
    await db.editor.update({
      where: { id: existing.id },
      data: {
        name,
        passwordHash,
        status: "ACTIVE",
        inviteToken: null,
        inviteExpires: null,
      },
    });
    console.log(`✓ Updated existing editor: ${email}`);
  } else {
    // Create new
    const passwordHash = await hashPassword(password);
    await db.editor.create({
      data: {
        email,
        name,
        passwordHash,
        status: "ACTIVE",
        role: "EDITOR",
      },
    });
    console.log(`✓ Created test editor: ${email}`);
  }

  // Verify
  const editor = await db.editor.findUnique({ where: { email } });
  console.log(`  Name: ${editor?.name}`);
  console.log(`  Status: ${editor?.status}`);
  console.log(`  Password set: ${!!editor?.passwordHash}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
