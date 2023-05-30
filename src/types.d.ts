export type PartytownConfig = Partial<{
  debug: boolean
  forward: string[]
  lib: string
  loadScriptsOnMainThread: string[]
  resolveUrl(url: URL, location: URL, method: string): void
}>

interface Integration {
  name?: string

  /** 
   * An array of strings representing function calls on the main thread to forward to the web worker.
   * [See Forwarding Events and Triggers](https://partytown.builder.io/forwarding-events) for more info. 
   * */
  forward: string[]

  /** Script inner content */
  content: string
}

export interface PluginConfig {
  moduleBase?: string

  /** Partytown config */
  config?: PartytownConfig

  integrations?: Integration[]
}
