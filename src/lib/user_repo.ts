import { MongoClient, Db, ObjectId } from 'mongodb';
import { CustomAttributes, PasswordPayload, User, UserSimple } from './interfaces';

export abstract class UserRepo {
    static async createMongoUserRepo(): Promise<UserRepo | null> {
        return null;
    }

    abstract doesUserExists(email: string): Promise<boolean>;

    abstract createUser(email: string, passwordPayload: PasswordPayload, customAttributes?: CustomAttributes): Promise<UserSimple>;

    abstract setUserAsVerified(email: string): Promise<boolean>;

    abstract setPasswordAfterRecovery(email: string, passwordPayload: PasswordPayload): Promise<boolean>;

    abstract getUserByEmail(email: string): Promise<User>;

    abstract getUserByID(id: string): Promise<User>;
}

export class UserRepoMongoDB extends UserRepo {
    db: Db;

    constructor(db: Db) {
        super();
        this.db = db;
        this.db.collection<User>("users").createIndex({
            email: 1,
        }, { unique: true });
    }

    async createUser(email: string, passwordPayload: PasswordPayload, customAttributes: CustomAttributes = {}): Promise<UserSimple> {
        if (await this.doesUserExists(email)) {
            throw new Error("Error: User already exists!");
        }

        const response = await this.db.collection("users").insertOne({
            email,
            passwordPayload,
            verified: false,
            customAttributes,
        });

        return {
            id: response.insertedId.toHexString(),
            email,
            verified: false,
        };
    }

    async doesUserExists(email: string): Promise<boolean> {
        const counts = await this.db.collection("users").count({
            email,
        });
        return counts == 1;
    }

    async setUserAsVerified(email: string): Promise<boolean> {
        let userDocument = await this.db.collection("users").findOne({ email });

        if (userDocument === undefined) {
            throw new Error("Error: User does not exists!");
        }

        if (userDocument?.verified) {
            throw new Error("Error: Already verified!");
        }

        await this.db.collection("users").updateOne({ email }, { $set: { verified: true } });
        return true;
    }

    async setPasswordAfterRecovery(email: string, passwordPayload: PasswordPayload): Promise<boolean> {
        if (!(await this.doesUserExists(email))) {
            throw new Error("Error: User does not exists!");
        }

        await this.db.collection("users").updateOne({ email }, { $set: { passwordPayload } });

        return true;
    }

    async getUserByEmail(email: string): Promise<User> {
        let userDocument = await this.db.collection("users").findOne({ email });

        if (userDocument === undefined) {
            throw new Error("Error: User does not exists!")
        }

        return {
            id: userDocument.id,
            email: userDocument.email,
            customAttributes: userDocument.customAttributes,
            passwordPayload: userDocument.passwordPayload,
            verified: userDocument.verified,
        };
    }

    async getUserByID(id: string): Promise<User> {
        let userDocument;

        try {
            userDocument = await this.db.collection<User>("users").findOne({ _id: new ObjectId(id) });
        } catch (e) {
            throw new Error("Error: User does not exists!");
        }

        if (userDocument === undefined) {
            throw new Error("Error: User does not exists!")
        }

        return {
            id: userDocument.id,
            email: userDocument.email,
            customAttributes: userDocument.customAttributes,
            passwordPayload: userDocument.passwordPayload,
            verified: userDocument.verified,
        };
    }
}