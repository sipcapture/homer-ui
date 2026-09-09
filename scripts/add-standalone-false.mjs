import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const files = execSync("find src -name '*.ts' -type f", { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const decorators = ['Component', 'Directive', 'Pipe'];

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  if (content.includes('standalone:')) {
    continue;
  }

  let updated = content;
  for (const kind of decorators) {
    const pattern = new RegExp(`@${kind}\\(\\{`, 'g');
    updated = updated.replace(pattern, `@${kind}({\n    standalone: false,`);
  }

  if (updated !== content) {
    writeFileSync(file, updated);
    console.log(file);
  }
}
