import {Struct} from '@wharfkit/antelope'

@Struct.type('scatter_account')
export class ScatterAccount extends Struct {
    @Struct.field('authority') authority!: string
    @Struct.field('blockchain') blockchain!: string
    @Struct.field('chainId') chainId!: string
    @Struct.field('isHardware') isHardware!: boolean
    @Struct.field('name') name!: string
    @Struct.field('publicKey') publicKey!: string
}
@Struct.type('scatter_identity')
export class ScatterIdentity extends Struct {
    @Struct.field('accounts') accounts!: ScatterAccount[]
    @Struct.field('hash') hash!: string
    @Struct.field('name') name!: string
    @Struct.field('publicKey') publicKey!: string
}
