import {
    AbstractWalletPlugin,
    Checksum256,
    ChainDefinition,
    LoginContext,
    PermissionLevel,
    ResolvedSigningRequest,
    Signature,
    TransactContext,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'

import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'

import { ScatterIdentity, ScatterAccount } from './types'

ScatterJS.plugins(new ScatterEOS())

export class WalletPluginScatter extends AbstractWalletPlugin implements WalletPlugin {
    id = 'scatter'

    translations = {}

    /**
     * The logic configuration for the wallet plugin.
     */
    readonly config: WalletPluginConfig = {
        // Should the user interface display a chain selector?
        requiresChainSelect: false,

        // Should the user interface display a permission selector?
        requiresPermissionSelect: false,
    }
    /**
     * The metadata for the wallet plugin to be displayed in the user interface.
     */
    readonly metadata: WalletPluginMetadata = WalletPluginMetadata.from({
        name: 'Scatter',
        description: '',
        logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iMjAwLjAwMDAwMHB0IiBoZWlnaHQ9IjIwMC4wMDAwMDBwdCIgdmlld0JveD0iMCAwIDIwMC4wMDAwMDAgMjAwLjAwMDAwMCIKIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMjAwLjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIKZmlsbD0iIzAwMDAwMCIgc3Ryb2tlPSJub25lIj4KPC9nPgo8L3N2Zz4K',
        homepage: 'https://github.com/GetScatter',
        download: 'https://github.com/GetScatter/ScatterDesktop/releases',
    })
    /**
     * Performs the wallet logic required to login and return the chain and permission level to use.
     *
     * @param options WalletPluginLoginOptions
     * @returns Promise<WalletPluginLoginResponse>
     */
    login(context: LoginContext): Promise<WalletPluginLoginResponse> {
        return new Promise((resolve, reject) => {
            this.handleLogin(context)
                .then((response) => {
                    resolve(response)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    async handleLogin(context: LoginContext): Promise<WalletPluginLoginResponse> {
        if (!context.ui) {
            throw new Error('No UI available')
        }

        // Retrieve translation helper from the UI, passing the app ID
        const t = context.ui.getTranslate(this.id)

        let chains: ChainDefinition[] = []
        if (context.chain) {
            chains = [context.chain]
        } else {
            chains = context.chains
        }
        const networks: ScatterJS.Network[] = []
        chains.forEach((chain) => {
            const url = new URL(chain.url)
            networks.push(
                ScatterJS.Network.fromJson({
                    blockchain: chain.name,
                    chainId: chain.id,
                    host: url.hostname,
                    port: url.port,
                    protocol: url.protocol,
                })
            )
        })

        const connected: boolean = await ScatterJS.connect(context.appName);
        if (!connected) {
            throw new Error('No Scatter Wallet')
        }

        const scatterIdentity: ScatterIdentity = await ScatterJS.login({ accounts: networks })
        if (!scatterIdentity || !scatterIdentity.accounts) {
            throw new Error('Failed to login in scatter')
        }
        const account: ScatterAccount = scatterIdentity.accounts[0];
        return {
            chain: Checksum256.from(
                account.chainId
            ),
            permissionLevel: PermissionLevel.from(`${account.name}@${account.authority}`),
        }
    }

    /**
     * Performs the wallet logic required to sign a transaction and return the signature.
     *
     * @param chain ChainDefinition
     * @param resolved ResolvedSigningRequest
     * @returns Promise<Signature>
     */
    sign(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {

        return this.handleSignatureRequest(resolved, context)
    }

    private async handleSignatureRequest(
        resolved: ResolvedSigningRequest,
        context: TransactContext
    ): Promise<WalletPluginSignResponse> {
        if (!context.ui) {
            throw new Error('No UI available')
        }

        // Retrieve translation helper from the UI, passing the app ID
        const t = context.ui.getTranslate(this.id)

        const scatterAccount: ScatterAccount = ScatterJS.identity.accounts[0];
        if (!scatterAccount) {
            throw new Error('Need to login first')
        }
        const permissionLevel = resolved.signer;
        if (permissionLevel.actor.toString() !== scatterAccount.name ||
            permissionLevel.permission.toString() !== scatterAccount.authority) {
            throw new Error('Need to login first')
        }

        const abis = await resolved.request.fetchAbis(context.abiCache)
        console.log(JSON.stringify(abis))
        const transaction = {
            abis,
            chainId: resolved.chainId.toString(),
            requiredKeys: [scatterAccount.publicKey],
            serializedTransaction: Buffer.from(resolved.serializedTransaction).toString('hex'),
        }

        const signatures = await ScatterJS.requestSignature(transaction);

        // Return the new request and the signatures from the wallet
        return {
            signatures: signatures.signatures,
            resolved,
        }
    }
}
