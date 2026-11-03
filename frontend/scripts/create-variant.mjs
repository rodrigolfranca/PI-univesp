import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./variants.mjs";

const id = process.argv[2];

if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
  throw new Error(
    "Informe um ID com letras minúsculas, números e hífens. Ex.: npm run variant:create -- oficina",
  );

const dir = path.join(projectRoot, "src/variants", id),
  assets = path.join(projectRoot, "public/variants", id);

if (fs.existsSync(dir) || fs.existsSync(assets))
  throw new Error(`A variante ou pasta de assets ${id} já existe; nenhum arquivo foi sobrescrito.`);

fs.mkdirSync(dir, { recursive: true });
fs.mkdirSync(assets, { recursive: true });

const manifest = { id, domains: [`${id}.example.com`] };
const config = {
  identity: {
    name: id,
    tagline: "Atendimento de serviços",
    description: "Conheça nossos serviços e agende seu atendimento.",
  },
};

fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(config, null, 2) + "\n");
fs.writeFileSync(path.join(assets, ".gitkeep"), "");
console.log(
  `Variante ${id} criada. Edite ${path.relative(projectRoot, dir)}/manifest.json e config.json. Use VITE_CLIENTE=${id} npm run dev.`,
);
