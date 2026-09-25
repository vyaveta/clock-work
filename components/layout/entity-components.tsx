import { PlusIcon, SearchIcon } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"
import { Input } from "../ui/input"

type EntityHeaderProps = {
    title: string
    description?: string
    newButtonLabel: string
    disabled?: boolean
    isCreating?: boolean
} & (
        | { onNew: () => void; newButtonHref?: never }
        | { newButtonHref: string; onNew?: never }
        | { onNew?: never; newButtonHref?: never }
    )

export const EntityHeader = ({ title, description, newButtonLabel, disabled, isCreating, onNew, newButtonHref }: EntityHeaderProps) => {
    return (
        <div className="flex flex-row items-center justify-between gap-x-4">
            <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-semibold">
                    {title}
                </h1>
                {
                    description && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                            {description}
                        </p>
                    )
                }
            </div>
            {onNew && !newButtonHref && (
                <Button onClick={onNew} disabled={disabled || isCreating} size={"lg"}>
                    <PlusIcon className="size-4 md:size-5" />
                    {newButtonLabel}
                </Button>
            )}

            {newButtonHref && !onNew && (
                <Button size={"sm"} asChild>
                    <Link href={newButtonHref}>
                        <PlusIcon className="size-4 md:size-5" />
                        {newButtonLabel}
                    </Link>
                </Button>
            )}
        </div>
    )
}


type EntityContainerProps = {
    children: React.ReactNode
    header?: React.ReactNode
    search?: React.ReactNode
    pagination?: React.ReactNode
}

export const EntityContainer = ({ children, header, search, pagination }: EntityContainerProps) => {
    return (
        <div className="p-4 md:px-10 md:py-6 h-full">
            <div className="mx-auto max-w-screen w-full flex flex-col gap-y-8 h-full">
                {header}

                <div className="flex flex-col gap-y-4 h-full">
                    {search}
                    {children}
                </div>
                {pagination}
            </div>
        </div>
    )
}

interface EntitySearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
};


export const EntitySearch = ({ value, onChange, placeholder }: EntitySearchProps) => {
    return (
        <div className="relative ml-auto">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="max-w-50 bg-background shadow-none border-border pl-8"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}


interface EntityPaginationProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    disabled?: boolean
}

export const EntityPagination = ({ page, totalPages, onPageChange, disabled }: EntityPaginationProps) => {
    return (
        <div className="flex flex-row items-center justify-between gap-x-2">
            <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                </p>
            </div>
            <div className="flex flex-row gap-x-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(page - 1, 1))}
                    disabled={page === 1 || disabled}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || disabled}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}