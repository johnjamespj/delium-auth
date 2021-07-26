import { v4 as uuidv4 } from 'uuid';
import { RedisClient } from "redis";
import { SRPSessionInfo, User } from "../interfaces";
import { createNodeRedisClient, WrappedNodeRedisClient } from 'handy-redis';

export class SRPRedisRepo {
    static mockClear() {
        throw new Error("Method not implemented.");
    }
    static expiry: number = 60 * 60;

    redisClient: WrappedNodeRedisClient;

    constructor(redisClient: RedisClient){
        this.redisClient = createNodeRedisClient(redisClient);
    }

    async createServerSecretEphemeralStoreSession(user: User, serverSecretEphemeral: String) : Promise<string> {
        let id: string = uuidv4();

        this.redisClient.set(id, JSON.stringify({
            serverSecretEphemeral,
            user,
        }))
        this.redisClient.expire(id, SRPRedisRepo.expiry)

        return id;
    }

    async getServerSecretEphemeralFromSession(sessionId: string): Promise<SRPSessionInfo>{
        let storedObjectRaw = await this.redisClient.get(sessionId);

        if (storedObjectRaw === null){
            throw new Error('Error: Session does not exist or session expired!');
        }

        let storedObject = JSON.parse(storedObjectRaw);
        return {
            user: storedObject.user,
            serverSecretEphemeral: storedObject.serverSecretEphemeral,
        };
    }
}