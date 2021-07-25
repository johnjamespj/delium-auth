import { MongoClient, Db } from 'mongodb';

describe('insert', () => {
  let connection: MongoClient;
  let db: Db;

  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_URL ?? "");
    db = await connection.db();
  });

  it('should insert a doc into collection', async () => {
    const users = db.collection('users');

    const mockUser = { name: 'John' };
    await users.insertOne(mockUser);

    const insertedUser = await users.findOne({ name: 'John' });
    expect(insertedUser).toEqual(mockUser);
  });

  afterAll(async () => {
    await connection.close();
  });
});