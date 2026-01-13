/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Nota: Usar --webpack flag en npm run dev para compatibilidad con @xenova/transformers
  webpack: (config, { isServer }) => {
    // Configuración para @xenova/transformers
    if (!isServer) {
      // Resolver fallbacks para Node.js modules en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Configuración para archivos WASM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // Ignorar advertencias de webpack sobre módulos no encontrados
    config.ignoreWarnings = [
      { module: /node_modules\/@xenova\/transformers/ },
    ]

    return config
  },
  // Headers para permitir WASM
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
