import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json()
    const { data, error } = await supabase
        .from('assets')
        .update(keysToSnake(body))
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
