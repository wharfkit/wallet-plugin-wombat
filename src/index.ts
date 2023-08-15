import {
    AbstractWalletPlugin,
    Checksum256,
    LoginContext,
    PermissionLevel,
    ResolvedSigningRequest,
    Serializer,
    SigningRequest,
    TransactContext,
    Transaction,
    WalletPlugin,
    WalletPluginConfig,
    WalletPluginLoginResponse,
    WalletPluginMetadata,
    WalletPluginSignResponse,
} from '@wharfkit/session'

import {Api, JsonRpc} from 'eosjs'
import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'

import {ScatterAccount} from './types'

ScatterJS.plugins(new ScatterEOS())

export class WalletPluginScatter extends AbstractWalletPlugin implements WalletPlugin {
    id = 'scatter'

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
        // const t = context.ui.getTranslate(this.id)

        const {account} = await this.getScatter(context)

        return {
            chain: Checksum256.from(account.chainId),
            permissionLevel: PermissionLevel.from(`${account.name}@${account.authority}`),
        }
    }

    async getScatter(context): Promise<{account: ScatterAccount; connector: any}> {
        // Ensure connected
        const connected: boolean = await ScatterJS.connect(context.appName)
        if (!connected) {
            throw new Error('No Scatter Wallet')
        }

        // Setup network
        const url = new URL(context.chain.url)
        const network = ScatterJS.Network.fromJson({
            blockchain: 'default',
            chainId: String(context.chain.id),
            host: url.hostname,
            port: url.port,
            protocol: url.protocol.replace(':', ''),
        })

        // Ensure connection and get identity
        const scatterIdentity = await ScatterJS.login({accounts: [network]})
        if (!scatterIdentity || !scatterIdentity.accounts) {
            throw new Error('Failed to login in scatter')
        }
        const account: ScatterAccount = scatterIdentity.accounts[0]

        // Establish connector
        const rpc = new JsonRpc(network.fullhost())
        rpc.getRequiredKeys = async () => [] // Hacky way to get around getRequiredKeys
        const connector = ScatterJS.eos(network, Api, {rpc})

        return {
            account,
            connector,
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
        // const t = context.ui.getTranslate(this.id)

        // Get the connector from Scatter
        const {connector} = await this.getScatter(context)

        // Convert the transaction to plain JS
        const plainTransaction = JSON.parse(JSON.stringify(resolved.resolvedTransaction))

        // Call transact on the connector
        const response = await connector.transact(plainTransaction, {
            broadcast: false,
        })

        // Get the response back (since the wallet may have modified the transaction)
        const modified = Serializer.decode({
            data: response.serializedTransaction,
            type: Transaction,
        })

        // Create the new request and resolve it
        const modifiedRequest = await SigningRequest.create(
            {
                transaction: modified,
            },
            context.esrOptions
        )
        const abis = await modifiedRequest.fetchAbis(context.abiCache)
        const modifiedResolved = modifiedRequest.resolve(abis, context.permissionLevel)

        // Return the modified request and the signatures from the wallet
        return {
            signatures: response.signatures,
            resolved: modifiedResolved,
        }
    }
}
