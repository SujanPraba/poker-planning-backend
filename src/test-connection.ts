import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB.');
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await client.close();
  }
}

testConnection();