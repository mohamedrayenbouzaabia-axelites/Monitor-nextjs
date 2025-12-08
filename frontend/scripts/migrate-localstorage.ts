#!/usr/bin/env ts-node

/**
 * Migration script to transfer data from localStorage to PostgreSQL database
 * This script should be run once during the database setup process
 */

import { db } from '../lib/db'

interface LocalStorageTarget {
  id: string
  address?: string
  url?: string
  description?: string
  created_at: string
  updated_at: string
}

interface LocalStorageData {
  ipAddresses: LocalStorageTarget[]
  endpoints: LocalStorageTarget[]
  adminToken?: string
}

function getLocalStorageData(): LocalStorageData {
  // This would normally be run in a browser environment
  // For migration purposes, we'll simulate the localStorage data structure
  return {
    ipAddresses: [],
    endpoints: [],
  }
}

async function migrateTargets() {
  console.log('Starting migration from localStorage to PostgreSQL...')

  try {
    // Create default admin user if doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    let adminUser = await db.findUserByEmail(adminEmail)

    if (!adminUser) {
      console.log('Creating default admin user...')
      adminUser = await db.createUser(adminEmail, adminPassword, 'ADMIN')
      console.log(`Created admin user: ${adminUser.email}`)
    } else {
      console.log(`Using existing admin user: ${adminUser.email}`)
    }

    // Get localStorage data (this would need to be provided manually for migration)
    const localStorageData = getLocalStorageData()

    // Migrate IP addresses
    console.log(`Migrating ${localStorageData.ipAddresses.length} IP addresses...`)
    for (const ipData of localStorageData.ipAddresses) {
      try {
        await db.createTarget(
          'IP',
          ipData.address || '',
          ipData.description || null,
          adminUser.id
        )
        console.log(`✓ Migrated IP: ${ipData.address}`)
      } catch (error) {
        console.error(`✗ Failed to migrate IP ${ipData.address}:`, error)
      }
    }

    // Migrate endpoints
    console.log(`Migrating ${localStorageData.endpoints.length} endpoints...`)
    for (const endpointData of localStorageData.endpoints) {
      try {
        await db.createTarget(
          'ENDPOINT',
          endpointData.url || '',
          endpointData.description || null,
          adminUser.id
        )
        console.log(`✓ Migrated endpoint: ${endpointData.url}`)
      } catch (error) {
        console.error(`✗ Failed to migrate endpoint ${endpointData.url}:`, error)
      }
    }

    console.log('Migration completed successfully!')

    // Summary
    const totalTargets = await db.getTargetsByUserId(adminUser.id)
    console.log(`Total targets in database: ${totalTargets.length}`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Function to migrate data from a JSON file (exported from browser localStorage)
async function migrateFromJsonFile(jsonFilePath: string) {
  console.log(`Reading localStorage data from: ${jsonFilePath}`)

  try {
    const fs = require('fs')
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'))

    // Create default admin user if doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    let adminUser = await db.findUserByEmail(adminEmail)

    if (!adminUser) {
      console.log('Creating default admin user...')
      adminUser = await db.createUser(adminEmail, adminPassword, 'ADMIN')
      console.log(`Created admin user: ${adminUser.email}`)
    }

    // Migrate IP addresses
    if (data.ipAddresses && Array.isArray(data.ipAddresses)) {
      console.log(`Migrating ${data.ipAddresses.length} IP addresses...`)
      for (const ipData of data.ipAddresses) {
        try {
          await db.createTarget(
            'IP',
            ipData.address || '',
            ipData.description || null,
            adminUser.id
          )
          console.log(`✓ Migrated IP: ${ipData.address}`)
        } catch (error) {
          console.error(`✗ Failed to migrate IP ${ipData.address}:`, error)
        }
      }
    }

    // Migrate endpoints
    if (data.endpoints && Array.isArray(data.endpoints)) {
      console.log(`Migrating ${data.endpoints.length} endpoints...`)
      for (const endpointData of data.endpoints) {
        try {
          await db.createTarget(
            'ENDPOINT',
            endpointData.url || '',
            endpointData.description || null,
            adminUser.id
          )
          console.log(`✓ Migrated endpoint: ${endpointData.url}`)
        } catch (error) {
          console.error(`✗ Failed to migrate endpoint ${endpointData.url}:`, error)
        }
      }
    }

    console.log('Migration from JSON file completed successfully!')

    // Summary
    const totalTargets = await db.getTargetsByUserId(adminUser.id)
    console.log(`Total targets in database: ${totalTargets.length}`)

  } catch (error) {
    console.error('Migration from JSON file failed:', error)
    process.exit(1)
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage:')
    console.log('  npm run migrate                     # Interactive migration')
    console.log('  npm run migrate -- --file <path>   # Migrate from JSON file')
    console.log('')
    console.log('To export localStorage data from browser:')
    console.log('1. Open browser DevTools')
    console.log('2. Run: JSON.stringify({')
    console.log('    ipAddresses: JSON.parse(localStorage.getItem(\'ipAddresses\') || \'[]\'),')
    console.log('    endpoints: JSON.parse(localStorage.getItem(\'endpoints\') || \'[]\')')
    console.log('  })')
    console.log('3. Save the output to a file')
    console.log('4. Run: npm run migrate -- --file <file-path>')
    return
  }

  if (args[0] === '--file' && args[1]) {
    await migrateFromJsonFile(args[1])
  } else {
    await migrateTargets()
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { migrateTargets, migrateFromJsonFile }