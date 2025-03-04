import { defineConfig } from "tsup";

export default defineConfig((options) => ({
	clean: true,
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	minify: false,
	sourcemap: true,
	target: "es2020",
	outExtension({ options, format }) {
		const minPrefix = options.minify ? ".min" : "";

		return format === "esm"
			? { js: minPrefix + ".mjs" }
			: { js: minPrefix + ".cjs", dts: ".d.cts" };
	},
	outDir: `dist`,
}));
