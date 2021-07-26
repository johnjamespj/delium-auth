import { emailRegex, generateRandomEmail, generateRandomNumberFromRange, generateRandomString } from "../lib/utils";

describe("Utils : utility for testing", () => {
    it("generateRandomString(): generates a random string", () => {
        expect(typeof generateRandomString).toBe("function");
        expect(() => generateRandomString(-1)).toThrowError();
        expect(() => generateRandomString(10)).not.toThrowError();
        expect(generateRandomString(10).length).toBe(10);
        expect(typeof generateRandomString(10)).toBe("string");
        
        for(let x = 0; x < 10; x++){
            expect(generateRandomString(10)).not.toContain(generateRandomString(10));
        }
    });

    it("generateRandomEmail(): generates a random email", () => {
        expect(typeof generateRandomEmail).toBe("function");
        expect(() => generateRandomEmail()).not.toThrowError();
        expect(typeof generateRandomEmail()).toBe("string");
        expect(generateRandomEmail().length).toBe(25);
        expect(generateRandomEmail()).toMatch(emailRegex)
    })

    // TODO: generateRandomNumberFromRange
    it.todo("generateRandomNumberFromRange(): generates a random number from a range");
});