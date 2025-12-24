import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

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

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    const snakeBody = keysToSnake(body)

    // 1. Record Movement
    const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert(snakeBody)
        .select()
        .single()

    if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 500 })
    }

    // 2. Update Inventory Quantity
    let adjustment = snakeBody.quantity
    if (snakeBody.type === 'out') adjustment = -snakeBody.quantity

    // Fetch current item
    const { data: item } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', snakeBody.item_id)
        .single()

    if (item) {
        const newQty = (item.quantity || 0) + adjustment
        await supabase
            .from('inventory_items')
            .update({ quantity: newQty, last_updated: new Date().toISOString() })
            .eq('id', snakeBody.item_id)
    }

    return NextResponse.json({ data: keysToCamel(movement) })
}
