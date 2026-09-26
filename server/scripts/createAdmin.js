'use strict';

require('dotenv').config();
const readline = require('readline');
const { connectDB, syncDB, sequelize } = require('../config/database');
const { User, UserPreferences } = require('../models');
const logger = require('../utils/logger');

// Helper to parse CLI arguments (e.g., --email=admin@example.com or --email admin@example.com)
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      if (val !== undefined) {
        result[key] = val;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1];
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

// Prompt utility for interactive input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function run() {
  try {
    const cliArgs = parseArgs();

    let email = cliArgs.email;
    let password = cliArgs.password;
    let name = cliArgs.name;

    console.log('==========================================');
    console.log('       ReWearX Admin Creator Utility      ');
    console.log('==========================================\n');

    if (!email) {
      email = await askQuestion('Enter Admin Email [default: 0349ansari@gmail.com]: ');
      if (!email) email = '0349ansari@gmail.com';
    }

    // Connect to database and ensure tables exist
    await connectDB();
    await syncDB();

    // Check if user already exists
    let existingUser = await User.scope('withSecrets').findOne({ where: { email } });

    if (existingUser) {
      console.log(`\nUser with email "${email}" already exists (Current role: ${existingUser.role}).`);
      
      if (!password && !cliArgs.password) {
        const updatePass = await askQuestion('Do you want to update the password? (y/N): ');
        if (updatePass.toLowerCase() === 'y' || updatePass.toLowerCase() === 'yes') {
          password = await askQuestion('Enter new password: ');
        }
      }

      existingUser.role = 'admin';
      existingUser.status = 'active';
      existingUser.isVerified = true;
      if (password) {
        existingUser.password = password;
      }

      await existingUser.save();
      logger.info(`Successfully promoted user "${email}" to Admin!`);
      console.log('\n SUCCESS: User account updated to Admin role.');
      console.log(` Email:    ${email}`);
      console.log(` Role:     ${existingUser.role}`);
      console.log(` Status:   ${existingUser.status}\n`);
    } else {
      if (!name) {
        name = await askQuestion('Enter Admin Name [default: ReWearX Admin]: ');
        if (!name) name = 'ReWearX Admin';
      }

      if (!password) {
        password = await askQuestion('Enter Admin Password [default: Arsu123@]: ');
        if (!password) password = 'Arsu123@';
      }

      const newAdmin = await User.create({
        name,
        email,
        password,
        gender: 'other',
        role: 'admin',
        status: 'active',
        isVerified: true,
      });

      await UserPreferences.findOrCreate({
        where: { userId: newAdmin.id },
        defaults: { userId: newAdmin.id },
      });

      logger.info(`Created new Admin user: ${email}`);
      console.log('\n SUCCESS: Created new Admin user successfully.');
      console.log(` Name:     ${name}`);
      console.log(` Email:    ${email}`);
      console.log(` Password: ${password}`);
      console.log(` Role:     admin\n`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create/promote admin user:', error);
    console.error('\n ERROR:', error.message);
    process.exit(1);
  }
}

run();
