import bcrypt from 'bcrypt';

const hash = '$2b$10$IC/ygKAFm7Nz5tSK0g15mulnmQ/LzQSX3ZJYqpbgpTPCrPFLJvMba';
const password = 'admin123';

bcrypt.compare(password, hash).then(result => {
  console.log(`Password matches: ${result}`);
});
