// Чита лозинка од терминалот без да ја прикажува на екранот (никогаш како аргумент на команда).

/** @param {string} question @returns {Promise<string>} */
export function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      console.error("Потребен е интерактивен терминал за внес на лозинка.");
      process.exit(1);
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n" || c === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (c === "\u0003") process.exit(130);
        if (c === "\u007f") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

/** Лозинка двапати, со иста проверка како при регистрација (8 до 128 знаци). Фрла грешка ако не е валидна. */
export async function askNewPassword(label) {
  const password = await askHidden(`Лозинка за ${label} (најмалку 8 знаци): `);
  if (password.length < 8 || password.length > 128) throw new Error("Лозинката мора да има 8 до 128 знаци.");
  if (password !== (await askHidden("Повторете ја лозинката: "))) throw new Error("Лозинките не се исти.");
  return password;
}
