
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedAccounts() {
    console.log('Checking for Cash account...')

    const { data: existingCash } = await supabase
        .from('accounts')
        .select('*')
        .ilike('name', '%Cash%')
        .eq('type', 'asset')
        .single()

    if (existingCash) {
        console.log('Cash account already exists:', existingCash.name)
        return
    }

    console.log('Creating Cash account...')
    const { data, error } = await supabase
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

    if (error) {
        console.error('Error creating account:', error)
    } else {
        console.log('Successfully created Cash account:', data.name)
    }
}

seedAccounts()
