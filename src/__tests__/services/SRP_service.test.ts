import { SRPService } from "../../lib/services/srp_service";
import { generateRandomEmail, generateRandomString, uuidRegex } from "../../lib/utils";
import { derivePrivateKey, deriveSession, deriveVerifier, generateEphemeral, generateSalt } from "secure-remote-password/client";

import { SRPRedisRepo } from '../../lib/repo/srp_redis_repo';
import { createNodeRedisClient, WrappedNodeRedisClient } from "handy-redis";
import { createClient } from "redis";
import { User } from "../../lib/interfaces";


describe("SRP password exchange service", () => {
    let client: WrappedNodeRedisClient;
    let srpRedisRepo: SRPRedisRepo;
    let srpService: SRPService;

    beforeEach(() => {
        let _client = createClient();
        client = createNodeRedisClient(_client);
        srpRedisRepo = new SRPRedisRepo(_client);
        srpService = new SRPService(srpRedisRepo);
    })

    it("initialExchange(): Sign in Initial Exchange", async () => {
        let identity = generateRandomEmail();
        let password = generateRandomString(20);
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

        user.passwordPayload.salt = generateSalt()
        const privateKey = derivePrivateKey(user.passwordPayload.salt, identity, password)
        user.passwordPayload.verifier = deriveVerifier(privateKey)

        const response = await srpService.initialExchange(user)
        expect(response.sessionId).toMatch(uuidRegex)
        expect(await client.get(response.sessionId)).not.toBeUndefined()
    });

    it("finalValidation(): Sign in Validation phrase", async () => {
        let identity = generateRandomEmail();
        let password = generateRandomString(20);
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

        user.passwordPayload.salt = generateSalt()
        const privateKey = derivePrivateKey(user.passwordPayload.salt, identity, password)
        user.passwordPayload.verifier = deriveVerifier(privateKey)

        const response = await srpService.initialExchange(user)
        const clientEphemeral = generateEphemeral()

        const clientSession = deriveSession(clientEphemeral.secret, response.publicServerEphemeral, user.passwordPayload.salt, user.email, privateKey)
        const final = await srpService.finalValidation(response.sessionId, clientEphemeral.public, clientSession.proof);

        expect(final.user).toStrictEqual(user);
        await expect(srpService.finalValidation(
            response.sessionId,
            clientEphemeral.public,
            clientSession.proof,
        )).rejects.toThrow(new Error("Error: User doesn't exist, session expired or session completed!"))

        user.passwordPayload.salt = generateSalt()
        const privateKeyError = derivePrivateKey(user.passwordPayload.salt, identity, generateRandomString(20))
        user.passwordPayload.verifier = deriveVerifier(privateKey)

        const responseError = await srpService.initialExchange(user)
        const clientEphemeralError = generateEphemeral()

        const clientSessionError = deriveSession(
            clientEphemeralError.secret,
            responseError.publicServerEphemeral,
            user.passwordPayload.salt,
            user.email,
            privateKeyError,
        )
        const finalError = srpService.finalValidation(responseError.sessionId, clientEphemeralError.public, clientSessionError.proof);

        await expect(finalError).rejects.toThrow(new Error("Client provided session proof is invalid"));
    });

    it("fakeInitialExchange(): fake initial exchange for invalid user", async () => {
        const fakeInitialExchange = await srpService.fakeInitialExchange();

        expect(typeof fakeInitialExchange.publicServerEphemeral).toEqual("string")
        expect(fakeInitialExchange.sessionId).toMatch(uuidRegex)
    });

    afterAll(async () => {
        await client.flushdb();
        client.end();
    });
});