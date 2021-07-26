import { createNodeRedisClient, WrappedNodeRedisClient } from "handy-redis";
import { createClient } from "redis-mock"
import { User } from "../../lib/interfaces";
import { SRPRedisRepo } from "../../lib/repo/srp_redis_repo";
import { generateRandomEmail, generateRandomString, uuidRegex } from "../../lib/utils";

describe("SRPRedisRepo: Store SRP session information", () => {
    let client: WrappedNodeRedisClient;
    let srpRedisRepo: SRPRedisRepo;

    beforeAll(async () => {
        let _client = createClient();
        client = createNodeRedisClient(_client);
        srpRedisRepo = new SRPRedisRepo(_client);
    });

    it("SRPRedisRepo: has all functions", async () => {
        expect(typeof srpRedisRepo.createServerSecretEphemeralStoreSession).toBe("function");
    })

    it("SRPRedisRepo: createServerSecretEphemeralStoreSession() stores ServerSecretEphemeral for SRP session", async () => {
        let user: User = {
            email: generateRandomEmail(),
            id: generateRandomString(25),
            verified: true,
            customAttributes: {
                bio: generateRandomString(100)
            },
            passwordPayload: {
                salt: "salt",
                verifier: "",
            }
        };
        let serverSecretEphemeral: string = generateRandomString(25)

        let sessionInfo = await srpRedisRepo.createServerSecretEphemeralStoreSession(user, serverSecretEphemeral);
        expect(typeof sessionInfo).toBe("string");
        expect(sessionInfo).toMatch(uuidRegex);

        let srpSessionInfo = JSON.parse(await client.get(sessionInfo) ?? "{}")
        expect(srpSessionInfo.user).toStrictEqual(user)
        expect(srpSessionInfo.serverSecretEphemeral).toMatch(serverSecretEphemeral)

        expect(await client.ttl(sessionInfo) <= SRPRedisRepo.expiry);
    })

    it("SRPRedisRepo: getServerSecretEphemeralFromSession() get session info from session key", async () => {
        let user: User = {
            email: generateRandomEmail(),
            id: generateRandomString(25),
            verified: true,
            customAttributes: {
                bio: generateRandomString(100)
            },
            passwordPayload: {
                salt: "salt",
                verifier: "",
            }
        };
        let serverSecretEphemeral = generateRandomString(25);

        let sessionId = await srpRedisRepo.createServerSecretEphemeralStoreSession(user, serverSecretEphemeral);
        let sessionInfo = await srpRedisRepo.getServerSecretEphemeralFromSession(sessionId);

        await expect(srpRedisRepo.getServerSecretEphemeralFromSession(generateRandomString(25))).rejects.toThrow(new Error('Error: Session does not exist or session expired!'));

        expect(sessionInfo.user).toStrictEqual(user);
        expect(sessionInfo.serverSecretEphemeral).toStrictEqual(serverSecretEphemeral);
    })

    afterAll(async () => {
        await client.flushdb();
        client.end();
    });
})