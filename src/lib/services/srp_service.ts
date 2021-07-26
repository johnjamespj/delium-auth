import { v4 as uuidv4 } from 'uuid';
import { SRPRedisRepo } from "../repo/srp_redis_repo";
import { deriveSession, generateEphemeral } from "secure-remote-password/server";
import { User } from "../interfaces";
import { generateRandomEmail, generateRandomString } from "../utils";
import { derivePrivateKey, deriveVerifier } from "secure-remote-password/client";

interface InitialExchangeResponse {
    sessionId: string;
    publicServerEphemeral: string;
}

interface ValidationResponse {
    user: User,
    serverSessionProof: string,
    key: string,
}

export class SRPService {
    sessionStore: SRPRedisRepo;

    constructor(sessionStore: SRPRedisRepo) {
        this.sessionStore = sessionStore;
    }

    async initialExchange(user: User): Promise<InitialExchangeResponse> {
        const serverEphemeral = generateEphemeral(user.passwordPayload.verifier)
        const sessionID = await this.sessionStore.createServerSecretEphemeralStoreSession(user, serverEphemeral.secret)

        return {
            sessionId: sessionID,
            publicServerEphemeral: serverEphemeral.public,
        }
    }

    async finalValidation(sesssionID: string, clientPublicEphemeral: string, clientSessionProof: string): Promise<ValidationResponse> {
        let sessionStoredValue;

        try {
            sessionStoredValue = await this.sessionStore.getServerSecretEphemeralFromSession(sesssionID);
        } catch (e) {
            throw new Error("Error: User doesn't exist, session expired or session completed!");
        }

        const serverSession = deriveSession(sessionStoredValue.serverSecretEphemeral,
            clientPublicEphemeral,
            sessionStoredValue.user.passwordPayload.salt,
            sessionStoredValue.user.email,
            sessionStoredValue.user.passwordPayload.verifier,
            clientSessionProof,
        )

        return {
            user: sessionStoredValue.user,
            serverSessionProof: serverSession.proof,
            key: serverSession.key,
        }
    }

    async fakeInitialExchange(): Promise<InitialExchangeResponse> {
        const identity = generateRandomEmail()
        const password = generateRandomString(10)

        const privateKey = derivePrivateKey(generateRandomString(10), identity, password)
        const verifier = deriveVerifier(privateKey)
        const serverEphemeral = generateEphemeral(verifier)

        return {
            publicServerEphemeral: serverEphemeral.public,
            sessionId: uuidv4(),
        };
    }
}