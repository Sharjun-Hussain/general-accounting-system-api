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

    // Convert to flat array format expected by frontend
    const balanceSheetData = []

    // Add asset accounts
    const assetAccounts = accounts.filter(a => a.type === 'asset')
    assetAccounts.forEach(acc => {
        balanceSheetData.push({
            account: acc.name,
            amount: Number(acc.balance || 0),
            type: 'asset'
        })
    })

    // Add fixed assets
    if (assets && assets.length > 0) {
        const totalFixedAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0)
        balanceSheetData.push({
            account: 'Fixed Assets',
            amount: totalFixedAssets,
            type: 'asset'
        })
    }

    // Add liability accounts
    const liabilityAccounts = accounts.filter(a => a.type === 'liability')
    liabilityAccounts.forEach(acc => {
        balanceSheetData.push({
            account: acc.name,
            amount: -Math.abs(Number(acc.balance || 0)), // Negative for liabilities
            type: 'liability'
        })
    })

    // Add equity accounts
    const equityAccounts = accounts.filter(a => a.type === 'equity')
    equityAccounts.forEach(acc => {
        balanceSheetData.push({
            account: acc.name,
            amount: Number(acc.balance || 0),
            type: 'equity'
        })
    })

    return NextResponse.json({ data: balanceSheetData })
}
