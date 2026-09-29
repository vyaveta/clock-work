import { AlertTriangleIcon, Loader2Icon, MoreVerticalIcon, PackageOpenIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"
import { Input } from "../ui/input"

import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
                    disabled={page === 1 || disabled || totalPages == 0}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || disabled || totalPages == 0}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}

interface StateViewProps {
    message?: string
}

export const LoadingView = ({ message }: StateViewProps) => {
    return (
        <div className="flex items-center justify-center h-full flex-1 flex-col gap-y-4">
            <Loader2Icon className="size-6 md:size-8 animate-spin text-primary" />
            {
                !!message && <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            }
        </div>
    )
}



export const ErrorView = ({ message }: StateViewProps) => {
    return (
        <div className="flex items-center justify-center h-full flex-1 flex-col gap-y-4">
            <AlertTriangleIcon className="size-6 md:size-8 text-destructive" />
            {
                !!message && <p className="text-sm text-muted-foreground">
                    {message}
                </p>
            }
        </div>
    )
}

interface EmptyViewProps extends StateViewProps {
    onNew?: () => void
    newButtonLabel?: string
}

export const EmptyView = ({ message, onNew, newButtonLabel }: EmptyViewProps) => {
    return (
        <Empty className="border border-dashed bg-accent">
            <EmptyHeader>
                <EmptyMedia variant={"icon"}>
                    <PackageOpenIcon className="size-6 md:size-8" />
                </EmptyMedia>
            </EmptyHeader>
            <EmptyTitle>{"No Items"}</EmptyTitle>
            {!!message && <EmptyDescription>{message}</EmptyDescription>}
            {!!onNew && <EmptyContent>
                <Button onClick={onNew} variant={"outline"}>
                    {newButtonLabel || "Add Item"}
                </Button>
            </EmptyContent>}
        </Empty>
    )
}

interface EntityListProps<T> {
    items: T[]
    renderItem: (item: T, index: number) => React.ReactNode
    getKey?: (item: T, index: number) => string | number
    emptyView?: React.ReactNode
    className?: string
}

export const EntityList = <T,>({ items, renderItem, getKey, emptyView, className }: EntityListProps<T>) => {
    if (items.length == 0 && emptyView)
        return (
            <div className="flex-1 flex justify-center items-center">
                <div className="max-w-sm mx-auto">
                    {emptyView}
                </div>
            </div>
        )


    return (
        <div className={cn(
            "flex flex-col gap-y-4",
            className
        )} >
            {items.map((item, index) => (
                <div key={getKey ? getKey(item, index) : index}>
                    {renderItem(item, index)}
                </div>
            ))}
        </div>
    )
}

interface EntityItemProps {
    href: string
    title: string
    subtitle?: React.ReactNode
    image?: React.ReactNode
    actions?: React.ReactNode
    onRemove?: () => void | Promise<void>
    isRemoving?: boolean
    className?: string
}

export const EntityItem = ({ href, title, subtitle, image, actions, onRemove, isRemoving, className }: EntityItemProps) => {

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isRemoving) return

        if (onRemove) {
            await onRemove()
        }
    }

    return (
        <Link
            href={href}
            prefetch
        >
            <Card
                className={cn(
                    "p-4 shadow-none hover:shadow cursor-pointer",
                    isRemoving && "opacity-50 cursor-not-allowed",
                    className,
                )}
            >
                <CardContent className="flex flex-row items-center justify-between p-0">
                    <div className="flex items-center gap-3">
                        {image}
                        <div>
                            <CardTitle className="text-base font-medium">
                                {title}
                            </CardTitle>
                            {!!subtitle && (
                                <CardDescription className="text-xs line-clamp-1">
                                    {subtitle}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    {(actions || onRemove) && (
                        <div className="flex gap-x-4 items-center">
                            {actions}
                            {onRemove && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size={"icon"}
                                            variant={"ghost"}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVerticalIcon className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DropdownMenuItem onClick={handleRemove} >
                                            <TrashIcon className="size-4" />
                                            delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>

    )
}