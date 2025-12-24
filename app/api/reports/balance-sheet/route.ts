import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString()

    // Fetch all accounts with their current balances
    const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)

    if (accountsError) {
        return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    // Fetch all assets
    const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'Active')

    if (assetsError) {
        return NextResponse.json({ error: assetsError.message }, { status: 500 })
    }

    // Group accounts by type
    const assetAccounts = accounts.filter(a => a.type === 'asset')
    const liabilityAccounts = accounts.filter(a => a.type === 'liability')
    const equityAccounts = accounts.filter(a => a.type === 'equity')

    const totalAssets = assetAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0) +
        (assets?.reduce((sum, a) => sum + Number(a.current_value || 0), 0) || 0)

    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)
    const totalEquity = equityAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)

    return NextResponse.json({
        data: {
            asOfDate: date,
            assets: {
                accounts: assetAccounts,
                fixedAssets: assets || [],
                total: totalAssets
            },
            liabilities: {
                accounts: liabilityAccounts,
                total: totalLiabilities
            },
            equity: {
                accounts: equityAccounts,
                total: totalEquity
            },
            summary: {
                totalAssets,
                totalLiabilities,
                totalEquity,
                balance: totalAssets - (totalLiabilities + totalEquity)
            }
        }
    })
}
