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
        expect(typeof srpRedisRepo.createBValueStoreSession).toBe("function");
    })

    it("SRPRedisRepo: createBValueStoreSession() stores B value for SRP session", async () => {
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
        let bValue: string = generateRandomString(25)

        let sessionInfo = await srpRedisRepo.createBValueStoreSession(user, bValue);
        expect(typeof sessionInfo).toBe("string");
        expect(sessionInfo).toMatch(uuidRegex);

        let srpSessionInfo = JSON.parse(await client.get(sessionInfo) ?? "{}")
        expect(srpSessionInfo.user).toStrictEqual(user)
        expect(srpSessionInfo.bValue).toMatch(bValue)

        expect(await client.ttl(sessionInfo) <= SRPRedisRepo.expiry);
    })

    it("SRPRedisRepo: getBValueFromSession() get session info from session key", async () => {
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
        let bValue = generateRandomString(25);

        let sessionId = await srpRedisRepo.createBValueStoreSession(user, bValue);
        let sessionInfo = await srpRedisRepo.getBValueFromSession(sessionId);

        await expect(srpRedisRepo.getBValueFromSession(generateRandomString(25))).rejects.toThrow(new Error('Error: Session does not exist or session expired!'));

        expect(sessionInfo.user).toStrictEqual(user);
        expect(sessionInfo.bValue).toStrictEqual(bValue);
    })

    afterAll(async () => {
        client.end();
    });
})