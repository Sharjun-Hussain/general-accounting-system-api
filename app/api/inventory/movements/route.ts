import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const type = searchParams.get('type')

    let query = supabase
        .from('stock_movements')
        .select('*, inventory_items(name, sku)')
        .order('created_at', { ascending: false })

    if (itemId) query = query.eq('item_id', itemId)
    if (type) query = query.eq('type', type)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function POST(request: Request) {
    const body = await request.json()

    // Start a transaction (Supabase doesn't support multi-statement transactions in client directly easily without RPC, 
    // but we will do optimistic updates or sequential operations for now. 
    // Ideally this should be a Postgres function for atomicity).

    // 1. Record Movement
    const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert(body)
        .select()
        .single()

    if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 500 })
    }

    // 2. Update Inventory Quantity
    // Calculate adjustment
    let adjustment = body.quantity
    if (body.type === 'out') adjustment = -body.quantity
    // For 'adjustment' type, we assume the quantity passed IS the adjustment amount (positive or negative)
    // If 'adjustment' means "set to specific value", logic would differ. 
    // Based on frontend code: "const actualQty = movementForm.type === 'out' ? -qty : qty;"
    // So we just add the signed quantity.

    // Fetch current item
    const { data: item } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', body.item_id)
        .single()

    if (item) {
        const newQty = (item.quantity || 0) + adjustment
        await supabase
            .from('inventory_items')
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq('id', body.item_id)
    }

    return NextResponse.json({ data: movement })
}
