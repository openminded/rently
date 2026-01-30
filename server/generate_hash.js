// Generate bcrypt hash for password 'zzzz'
import bcrypt from 'bcrypt';

const password = 'zzzz';
const saltRounds = 10;

const hash = await bcrypt.hash(password, saltRounds);
console.log('Password: zzzz');
console.log('Hash:', hash);
console.log('\nUpdate seed_dummy_data.sql with this hash');
