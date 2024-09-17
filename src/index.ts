import {
    AbstractWalletPlugin,
    LoginContext,
    LogoutContext,
    ResolvedSigningRequest,
    TransactContext,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'

export class WalletPluginWombat extends AbstractWalletPlugin implements WalletPlugin {
    id = 'wombat'

    translations = {}

    /**
     * The logic configuration for the wallet plugin.
     */
    readonly config: WalletPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: true,

        // Should the user interface display a permission selector?
        requiresPermissionSelect: false,
    }

    constructor() {
        super()
    }

    /**
     * The metadata for the wallet plugin to be displayed in the user interface.
     */
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'Wombat',
        description: '',
        logo: 'data:image/png;base64,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',
        homepage: 'https://www.wombat.app/',
        download: 'https://www.wombat.app/the-app',
    })

    private async loadScatterProtocol() {
        if (typeof window !== 'undefined') {
            return import('@wharfkit/protocol-scatter')
        }
        return null
    }

    /**
     * Performs the wallet logic required to login and return the chain and permission level to use.
     *
     * @param context LoginContext
     * @returns Promise<WalletPluginLoginResponse>
     */
    async login(context: LoginContext): Promise<WalletPluginLoginResponse> {
        const scatterProtocol = await this.loadScatterProtocol()
        if (!scatterProtocol) {
            throw new Error('Scatter protocol is not available in this environment')
        }
        return scatterProtocol.handleLogin(context)
    }

    /**
     * Performs the wallet logic required to logout.
     *
     * @param context: LogoutContext
     * @returns Promise<void>
     */
    async logout(context: LogoutContext): Promise<void> {
        const scatterProtocol = await this.loadScatterProtocol()
        if (!scatterProtocol) {
            throw new Error('Scatter protocol is not available in this environment')
        }
        return scatterProtocol.handleLogout(context)
    }

    /**
     * Performs the wallet logic required to sign a transaction and return the signature.
     *
     * @param chain ChainDefinition
     * @param resolved ResolvedSigningRequest
     * @returns Promise<Signature>
     */
    async sign(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {
        const scatterProtocol = await this.loadScatterProtocol()
        if (!scatterProtocol) {
            throw new Error('Scatter protocol is not available in this environment')
        }
        return scatterProtocol.handleSignatureRequest(resolved, context)
    }
}
