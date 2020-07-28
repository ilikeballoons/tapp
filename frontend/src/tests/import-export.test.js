/**
 * @jest-environment node
 */
import { describe, it, expect } from "./utils";
import {
    validate,
    SpreadsheetRowMapper,
    dataToFile,
    normalizeImport,
} from "../libs/importExportUtils";
import { diffImport } from "../libs/diffUtils";

// Run the actual tests for both the API and the Mock API
describe("Import/export library functionality", () => {
    const instructorSchema = {
        keys: ["first_name", "last_name", "utorid", "email"],
        keyMap: {
            "First Name": "first_name",
            "Given Name": "first_name",
            First: "first_name",
            "Last Name": "last_name",
            Surname: "last_name",
            "Family Name": "last_name",
            Last: "last_name",
        },
        requiredKeys: ["utorid"],
        primaryKey: "utorid",
    };

    const instructorData = [
        {
            id: 2,
            first_name: "Gordon",
            last_name: "Smith",
            email: "a@a.com",
            utorid: "booger",
        },
        {
            id: 3,
            first_name: "Tommy",
            last_name: "Smith",
            email: "a@b.com",
            utorid: "food",
        },
        {
            first_name: "Grandpa",
            last_name: "Boobie",
            email: "a@d.com",
            utorid: "fooc",
        },
    ];

    it("Validate data according to a schema", () => {
        // Should not throw
        expect(() => validate(instructorData, instructorSchema)).not.toThrow(
            Error
        );
        // Should throw
        expect(() =>
            validate(
                [
                    ...instructorData,
                    { first_name: "You", last_name: "Me", email: "t@b.com" },
                ],
                instructorSchema
            )
        ).toThrow(Error);
    });

    it("Fuzzy matching of spreadsheet column names based on schema", () => {
        let rowMapper;
        const targetData = { first_name: "Joe", last_name: "Smith" };

        // Matches keys specified in the schema
        // `rowMapper` needs to be redefined each time it is used with different column names because of the way it caches lookups
        rowMapper = new SpreadsheetRowMapper(instructorSchema);
        expect(
            rowMapper.formatRow(
                { first_name: "Joe", last_name: "Smith" },
                false
            )
        ).toEqual(targetData);

        // Matches keys specified in the keyMap
        rowMapper = new SpreadsheetRowMapper(instructorSchema);
        expect(
            rowMapper.formatRow(
                { "First Name": "Joe", "Last Name": "Smith" },
                false
            )
        ).toEqual(targetData);

        // Fuzzy matches
        rowMapper = new SpreadsheetRowMapper(instructorSchema);
        expect(
            rowMapper.formatRow(
                { "First  Name": "Joe", LastName: "Smith" },
                false
            )
        ).toEqual(targetData);
        rowMapper = new SpreadsheetRowMapper(instructorSchema);
        expect(
            rowMapper.formatRow(
                { firstname: "Joe", "LAST NAMEE": "Smith" },
                false
            )
        ).toEqual(targetData);

        // Fails to match column names that are too far different from the original
        rowMapper = new SpreadsheetRowMapper(instructorSchema);
        expect(
            rowMapper.formatRow({ name: "Joe", "LAST NAME": "Smith" }, false)
        ).not.toEqual(targetData);
    });

    it.todo("Export data to a JSON");
    it.todo("Export data to a CSV");
    it.todo("Export data to a XLSX");
    it.todo("Import data from a JSON/CSV/XLSX");
});

describe("Diff library functionality", () => {
    const original = [
        {
            id: 2,
            first_name: "Princess",
            last_name: "Peach",
            email: "sorry@inaothercastle.com",
            utorid: "IBakedACakeForYou",
        },
        {
            id: 3,
            first_name: "Mario",
            last_name: "Mario",
            email: "m@mushroomkingdom.com",
            utorid: "itasmeM",
        },
        {
            id: 4,
            first_name: "Luigi",
            last_name: "Mario",
            email: "l@mushromkingdom.com",
            utorid: "ohIMissedL",
        },
    ];

    const diff = [...original];
    diff[0] = {
        id: 2,
        first_name: "Princess",
        last_name: "Daisy",
        email: "sorry@inaothercastle.com",
        utorid: "IBakedACakeForYou",
    };

    it("Generate correct DiffSpecs for Instructors", () => {
        const instructorSchema = {
            keys: ["first_name", "last_name", "utorid", "email"],
            keyMap: {
                "First Name": "first_name",
                "Given Name": "first_name",
                First: "first_name",
                "Last Name": "last_name",
                Surname: "last_name",
                "Family Name": "last_name",
                Last: "last_name",
            },
            requiredKeys: ["utorid"],
            primaryKey: "utorid",
            dateColumns: [],
            baseName: "instructors",
        };

        const instructors = normalizeImport(
            { data: original, fileType: "json" },
            instructorSchema
        );

        const diffed = diffImport.instructors(diff, { instructors });
        const [modified, ...same] = diffed;
        expect(modified.status).toEqual("modified");
        expect(modified.changes).toEqual({ last_name: '"Peach" → "Daisy"' });
        expect(modified.obj).toEqual(diff[0]);
        expect(same[0].status).toEqual("duplicate");
        expect(same[0].changes).toEqual({});
        expect(same[0].obj).toEqual(original[1]);
    });
});
