-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    balance DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table (for Accounts Payable)
CREATE TABLE IF NOT EXISTS bills (
    id BIGSERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id BIGINT REFERENCES vendors(id),
    vendor_name VARCHAR(255),
    vendor_email VARCHAR(255),
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT REFERENCES bills(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 2) NOT NULL,
    rate DECIMAL(15, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add customer_id to invoices if the column doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'customer_id'
        ) THEN
            ALTER TABLE invoices ADD COLUMN customer_id BIGINT REFERENCES customers(id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'customer_name'
        ) THEN
            ALTER TABLE invoices ADD COLUMN customer_name VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'customer_email'
        ) THEN
            ALTER TABLE invoices ADD COLUMN customer_email VARCHAR(255);
        END IF;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- Only create index on invoices if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
    END IF;
END $$;

-- Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, credit_limit, balance) VALUES
    ('ABC Corporation', 'billing@abccorp.com', '555-0201', '100 Corporate Blvd', 50000, 0),
    ('XYZ Industries', 'accounts@xyz.com', '555-0202', '200 Industrial Way', 75000, 0),
    ('Global Services LLC', 'finance@globalservices.com', '555-0203', '300 Service Center', 25000, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample vendors
INSERT INTO vendors (name, email, phone, address, balance) VALUES
    ('Office Supplies Co', 'contact@officesupplies.com', '555-0101', '123 Business Ave', 0),
    ('Tech Solutions Inc', 'sales@techsolutions.com', '555-0102', '456 Tech Park', 0),
    ('Maintenance Pro', 'info@maintenancepro.com', '555-0103', '789 Service Rd', 0)
ON CONFLICT (id) DO NOTHING;
