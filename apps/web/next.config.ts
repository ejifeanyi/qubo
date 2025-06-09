import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	swcMinify: true,
	images: {
		domains: ["lh3.googleusercontent.com"],
	},
};

export default nextConfig;
