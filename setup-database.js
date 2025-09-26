#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🔍 Reading database schema...');
    const sqlContent = fs.readFileSync(path.join(__dirname, 'src/lib/database.sql'), 'utf8');

    console.log('🚀 Applying database schema to Supabase...');

    // Split the SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.warn(`Warning for statement: ${error.message}`);
          // Continue with other statements even if some fail
        }
      }
    }

    console.log('✅ Database setup completed!');

    // Test the setup by checking if tables exist
    console.log('🧪 Testing database connection...');
    const { data, error } = await supabase.from('events').select('count', { count: 'exact' });

    if (error) {
      console.error('❌ Database test failed:', error.message);
    } else {
      console.log('✅ Database test successful!');
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();