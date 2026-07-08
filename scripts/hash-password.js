// Uso: node scripts/hash-password.js "tu_contraseña"
// Copia el resultado en ADMIN_PASSWORD_HASH dentro de .env.local
const crypto = require("crypto");

const plain = process.argv[2];
if (!plain) {
  console.error("Uso: node scripts/hash-password.js <contraseña>");
  process.exit(1);
}

console.log(crypto.createHash("sha256").update(plain).digest("hex"));
