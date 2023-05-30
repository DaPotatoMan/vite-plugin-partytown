import { resolve } from 'node:path'
import fs from 'node:fs'
import type { Plugin } from 'vite'
import { partytownSnippet } from '@builder.io/partytown/integration'
import type { PartytownConfig, PluginConfig } from './types'

function buildHTML(context: PluginConfig) {
  const { config, integrations } = context

  const partytown: PartytownConfig = {
    ...config,
    forward: [
      ...(config?.forward || []),
      ...(integrations ? integrations.flatMap(i => i.forward) : []),
    ],
  }

  const mainScript = `<script>${partytownSnippet()}</script>`
  const integrationScripts = integrations?.map(
    entry => `<script type="text/partytown">${entry.content}</script>`)
    .join('\n')

  return `
    <!-- Partytown config -->
    <script>partytown = ${JSON.stringify(partytown ?? '{}')}</script>

    <!-- Partytown integrations -->
    ${integrationScripts ?? ''}

    <!-- Partytown worker -->
    ${mainScript}
  `
}

function getModulePaths(context: PluginConfig) {
  const base = resolve(context.moduleBase ?? __dirname, 'node_modules/@builder.io/partytown')
  const lib = `${base}/lib/`

  return { base, lib }
}

export default function partytown(config: PluginConfig = {}): Plugin {
  const templateSnippet = buildHTML(config)
  const paths = getModulePaths(config)

  return {
    name: 'PartytownPlugin',

    // Add import alias if different moduleBase is provided
    config: !config.moduleBase
      ? undefined
      : () => ({
          resolve: {
            alias: {
              '@builder.io/partytown': paths.base,
            },
          },
        }),

    // Redirect ~partytown calls
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.includes('~partytown'))
          req.url = req.url.replace(/\~partytown\//g, paths.lib)

        next()
      })
    },

    transformIndexHtml(html) {
      return html.replace('</head>', `${templateSnippet}</head>`)
    },

    // Copy ~partytown lib
    buildEnd() {
      setTimeout(() => {
        fs.cpSync(paths.lib, 'dist/~partytown', { recursive: true, force: true })
      }, 2000)
    },
  }
}
