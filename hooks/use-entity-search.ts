import { PAGINATION } from "@/config/constants";
import { useEffect, useRef, useState } from "react";

interface UseEntitySearchProps<T extends { search: string; page: number }> {
    params: T
    setParams: (params: T) => void
    debounceMs?: number
}


export function useEntitySearch<T extends { search: string; page: number }>({
    params,
    setParams,
    debounceMs = 500,
}: UseEntitySearchProps<T>) {
    const [localSearch, setLocalSearch] = useState(params.search);
    const isUserChange = useRef(false);

    useEffect(() => {
        if (isUserChange.current && localSearch === "" && params.search !== "") {
            isUserChange.current = false;

            setParams({
                ...params,
                search: "",
                page: PAGINATION.DEFAULT_PAGE,
            });

            return;
        }

        const timer = setTimeout(() => {
            if (isUserChange.current && localSearch !== params.search) {
                isUserChange.current = false;

                setParams({
                    ...params,
                    search: localSearch,
                    page: PAGINATION.DEFAULT_PAGE,
                });
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localSearch, debounceMs, setParams, params]);

    useEffect(() => {
        setLocalSearch(params.search || "");
        isUserChange.current = false;
    }, [params.search]);

    const setSearchChange = (value: string) => {
        isUserChange.current = true;
        setLocalSearch(value);
    };

    return {
        searchValue: localSearch,
        setSearchChange,
    };
}
