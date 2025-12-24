import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
        .from('bills')
        .select('*, bill_items(*)')
        .order('date', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { items, ...billData } = body

    // 1. Create Bill
    const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert(keysToSnake(billData))
        .select()
        .single()

    if (billError) {
        return NextResponse.json({ error: billError.message }, { status: 500 })
    }

    // 2. Create Bill Items
    if (items && items.length > 0) {
        const itemsWithBillId = items.map((item: any) => ({
            ...keysToSnake(item),
            bill_id: bill.id
        }))

        const { error: itemsError } = await supabase
            .from('bill_items')
            .insert(itemsWithBillId)

        if (itemsError) {
            return NextResponse.json({ error: itemsError.message }, { status: 500 })
        }
    }

    return NextResponse.json({ data: keysToCamel(bill) })
}
