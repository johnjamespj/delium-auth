import { MongoClient, Db, ObjectId } from 'mongodb';
import { PasswordPayload } from '../../lib/interfaces';

import { UserRepoMongoDB } from '../../lib/repo/user_repo'
import { generateRandomEmail } from '../../lib/utils';

describe('UserRepo : UserRepoMongoDB', () => {
  let connection: MongoClient;
  let db: Db;
  let userRepo: UserRepoMongoDB;

  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_URL ?? "");
    db = await connection.db();

    userRepo = new UserRepoMongoDB(db);
  });

  it('UserRepoMongoDB: implemented all "User Repo" abstract class functions', async () => {
    expect(typeof userRepo.doesUserExists).toBe("function");
    expect(typeof userRepo.createUser).toBe("function");
    expect(typeof userRepo.setUserAsVerified).toBe("function");
    expect(typeof userRepo.setPasswordAfterRecovery).toBe("function");
    expect(typeof userRepo.getUserByEmail).toBe("function");
    expect(typeof userRepo.getUserByID).toBe("function");
    expect(typeof userRepo.deleteUser).toBe("function");
  })

  it("UserRepoMongoDB: createUser() creates a new user", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };
    let customAttributes = { test: "test" };

    expect(typeof userRepo.createUser).toBe("function");

    // creates a "users" collections
    email = generateRandomEmail();
    let r1 = await userRepo.createUser(email, passwordPayload, customAttributes);
    const collectionNames = (await db.listCollections().toArray()).map(x => x.name);
    expect(collectionNames.indexOf("users")).not.toBe(-1);

    // adds the user to the colllection
    let u1 = await collection.findOne({ _id: new ObjectId(r1.id) });
    expect(u1).not.toBeUndefined();
    expect(u1?.email).toMatch(email);
    expect(u1?.passwordPayload).toStrictEqual(passwordPayload);
    expect(u1?.customAttributes).toStrictEqual(customAttributes);
    expect(!u1?.verified);

    await collection.deleteMany({});

    // throws error if a user already exists
    email = generateRandomEmail();
    let r2 = await userRepo.createUser(email, passwordPayload);

    await expect(userRepo.createUser(email, passwordPayload)).rejects.toThrow(new Error("Error: User already exists!"))

    await collection.deleteMany({});
  })

  it("UserRepoMongoDB: doesUserExists() checks if a user exists", async () => {
    const collection = db.collection("users");
    const email = generateRandomEmail();
    const passwordPayload: PasswordPayload = { salt: "", verifier: ""  };

    expect(typeof userRepo.doesUserExists).toBe("function");

    let r1 = await userRepo.createUser(email, passwordPayload);
    expect(await userRepo.doesUserExists(email));

    expect(await userRepo.doesUserExists(generateRandomEmail())).toBeFalsy();
    await collection.deleteMany({});
  })

  it("UserRepoMongoDB: setUserAsVerified() set user as verifed", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };

    expect(typeof userRepo.setUserAsVerified).toBe("function");

    let r1 = await userRepo.createUser(email, passwordPayload);
    let u1 = await collection.findOne({ _id: new ObjectId(r1.id) });

    expect(!u1?.verified);

    await expect(userRepo.setUserAsVerified(generateRandomEmail())).rejects.toThrow(new Error("Error: User does not exists!"))

    await userRepo.setUserAsVerified(email)
    u1 = await collection.findOne({ _id: new ObjectId(r1.id) });
    expect(u1?.verified);

    try {
      await userRepo.setUserAsVerified(email)
    } catch (e) {
      expect(e.message).toMatch("Error: Already verified!");
    }
    await collection.deleteMany({});

  });

  it("UserRepoMongoDB: getUserByID() get a user from its id", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };
    let customAttributes = { test: "test" };

    expect(typeof userRepo.getUserByID).toBe("function");

    let result = await collection.insertOne({
      email,
      passwordPayload,
      customAttributes,
      verified: false,
    })

    let u1 = await userRepo.getUserByID(result.insertedId.toHexString())

    expect(u1).not.toBeUndefined();
    expect(u1?.email).toMatch(email);
    expect(u1?.passwordPayload).toStrictEqual(passwordPayload);
    expect(u1?.customAttributes).toStrictEqual(customAttributes);
    expect(!u1?.verified);

    await expect(userRepo.getUserByID(generateRandomEmail())).rejects.toThrow(new Error("Error: User does not exists!"))

    await collection.deleteMany({});

  })

  it("UserRepoMongoDB: getUserByEmail() get a user from its email", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };
    let customAttributes = { test: "test" };

    expect(typeof userRepo.getUserByEmail).toBe("function");

    await collection.insertOne({
      email,
      passwordPayload,
      customAttributes,
      verified: false,
    })

    let u1 = await userRepo.getUserByEmail(email)

    expect(u1).not.toBeUndefined();
    expect(u1?.email).toMatch(email);
    expect(u1?.passwordPayload).toStrictEqual(passwordPayload);
    expect(u1?.customAttributes).toStrictEqual(customAttributes);
    expect(!u1?.verified);

    await expect(userRepo.getUserByEmail(generateRandomEmail())).rejects.toThrow(new Error("Error: User does not exists!"))

    await collection.deleteMany({});

  })

  it("UserRepoMongoDB: setPasswordAfterRecovery() recover account from email", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };

    expect(typeof userRepo.setPasswordAfterRecovery).toBe("function");

    let r1 = await userRepo.createUser(email, passwordPayload);
    let u1 = await collection.findOne({ _id: new ObjectId(r1.id) });

    expect(u1?.passwordPayload).toStrictEqual(passwordPayload);

    await expect(userRepo.setPasswordAfterRecovery(generateRandomEmail(), passwordPayload)).rejects.toThrow(new Error("Error: User does not exists!"))

    passwordPayload = {salt : "salt", verifier: "" };
    await userRepo.setPasswordAfterRecovery(email, passwordPayload)
    u1 = await collection.findOne({ _id: new ObjectId(r1.id) });
    expect(u1?.passwordPayload).toStrictEqual(passwordPayload);

    await collection.deleteMany({});
  });

  it("UserRepoMongoDB: deleteUser() deletes a user using the email", async () => {
    const collection = db.collection("users");
    let email = generateRandomEmail();
    let passwordPayload: PasswordPayload = { salt: "", verifier: "" };

    let r1 = await userRepo.createUser(email, passwordPayload);

    await userRepo.deleteUser(email);
    let u1 = await collection.findOne({ _id: new ObjectId(r1.id) });

    expect(u1).toBeUndefined()

    await expect(userRepo.deleteUser(generateRandomEmail())).rejects.toThrow(new Error("Error: User does not exists!"))
  });

  afterAll(async () => {
    await connection.close();
  });
});