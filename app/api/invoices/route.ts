import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('date', { ascending: false })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { items, ...invoiceData } = body

    // 1. Create Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(keysToSnake(invoiceData))
        .select()
        .single()

    if (invoiceError) {
        return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    // 2. Create Invoice Items
    if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map((item: any) => ({
            ...keysToSnake(item),
            invoice_id: invoice.id
        }))

        const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(itemsWithInvoiceId)

        if (itemsError) {
            // Ideally rollback invoice creation here
            return NextResponse.json({ error: itemsError.message }, { status: 500 })
        }
    }

    return NextResponse.json({ data: keysToCamel(invoice) })
}
