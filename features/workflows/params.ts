import { PAGINATION } from "@/config/constants";
import {
    createParser,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";

const pageSizeParser = createParser({
    parse(value) {
        const parsed = parseAsInteger.parse(value);

        if (parsed === null) {
            return null;
        }

        return Math.min(
            PAGINATION.MAX_PAGE_SIZE,
            Math.max(PAGINATION.MIN_PAGE_SIZE, parsed)
        );
    },

    serialize(value) {
        return String(value);
    },
});

export const workflowsParams = {
    page: parseAsInteger
        .withDefault(PAGINATION.DEFAULT_PAGE)
        .withOptions({ clearOnDefault: true }),

    pageSize: pageSizeParser
        .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
        .withOptions({ clearOnDefault: true }),

    search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
};


export const workflowsSearchParams = {
    page: parseAsInteger.withDefault(PAGINATION.DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    pageSize: parseAsInteger.withDefault(PAGINATION.DEFAULT_PAGE_SIZE).withOptions({ clearOnDefault: true }),
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}