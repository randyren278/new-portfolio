import createMDX from '@next/mdx';
const withMDX = createMDX({ extension: /\.mdx?$/, options: { remarkPlugins: [], rehypePlugins: [] } });
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, pageExtensions: ['ts', 'tsx', 'md', 'mdx'] };
export default withMDX(nextConfig);
