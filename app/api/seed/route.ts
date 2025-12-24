import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
    try {
        const { data: existingCash, error: fetchError } = await supabase
            .from('accounts')
            .select('*')
            .ilike('name', '%Cash%')
            .eq('type', 'asset')
            .maybeSingle()

        if (fetchError) throw fetchError

        if (existingCash) {
            return NextResponse.json({ message: 'Cash account already exists', account: existingCash })
        }

        const { data: newAccount, error: insertError } = await supabase
            .from('accounts')
            .insert({
                name: 'Cash on Hand',
                code: '1000',
                type: 'asset',
                description: 'Main cash account',
                is_active: true,
                balance: 0
            })
            .select()
            .single()

        if (insertError) throw insertError

        return NextResponse.json({ message: 'Cash account created successfully', account: newAccount })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
