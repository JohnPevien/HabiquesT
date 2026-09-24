const config = {
  "**/*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "**/*.{json,css,md,mdx,yml,yaml}": "prettier --write",
};

export default config;
