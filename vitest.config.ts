import { configDefaults, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    fileParallelism: false,
    maxWorkers: 1,
    pool: "forks",
  },
});
