import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { BootstrapError } from '../src/auth/bootstrap-admin';
async function hiddenPassword(prompt: string) {
  stdout.write(prompt);
  emitKeypressEvents(stdin);
  const previousRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  let listener: (text: string, key: { name?: string; ctrl?: boolean }) => void;
  let ended: () => void;
  try {
    return await new Promise<string>((resolve, reject) => {
      let value = '';
      ended = () => reject(new BootstrapError('Cancelado. No se creó ningún usuario.'));
      listener = (text, key) => {
        if (key.ctrl && ['c', 'd'].includes(key.name || '')) ended();
        else if (key.name === 'return' || key.name === 'enter') resolve(value);
        else if (key.name === 'backspace') value = Array.from(value).slice(0, -1).join('');
        else if (
          !key.ctrl &&
          text &&
          Array.from(text).every((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127)
        )
          value += text;
      };
      stdin.on('keypress', listener);
      stdin.once('end', ended);
    });
  } finally {
    stdin.off('keypress', listener!);
    stdin.off('end', ended!);
    stdin.setRawMode(previousRaw);
    stdin.pause();
    stdout.write('\n');
  }
}

export async function adminInput() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new BootstrapError('Ejecuta este comando en una terminal interactiva.');
  const rl = createInterface({ input: stdin, output: stdout });
  let email: string;
  let name: string;
  try {
    email = await rl.question('Correo del administrador: ');
    name = await rl.question('Nombre: ');
  } finally {
    rl.close();
  }
  const password = await hiddenPassword('Contraseña (12–128 caracteres; entrada oculta): ');
  const confirmation = await hiddenPassword('Repite la contraseña (entrada oculta): ');
  if (password !== confirmation)
    throw new BootstrapError('Las contraseñas no coinciden. No se creó ningún usuario.');
  return { email, name, password };
}
