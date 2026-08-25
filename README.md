# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Deploy to GitHub Pages

This project is configured to deploy automatically to **GitHub Pages** via GitHub Actions whenever you push to the `main` branch.

### First-time setup

1. Go to your repository on GitHub → **Settings** → **Pages**.
2. Under **Source**, select **GitHub Actions**.
3. Push a commit to `main` (or trigger the workflow manually from **Actions → Deploy to GitHub Pages → Run workflow**).

The site will be published at `https://<your-username>.github.io/<repo-name>/`.

> **Note:** If the app uses client-side routing (React Router), add a `base` in `vite.config.ts` matching the repository name:
>
> ```ts
> export default defineConfig({
>   base: '/<repo-name>/',
>   // ...
> })
> ```

### Manual / local build

```bash
npm ci
npm run build   # output goes to dist/
npm run preview # serve the production build locally
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
