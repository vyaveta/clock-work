"use client"

import { NodeSelector } from "@/components/layout/node-selector"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { memo, useState } from "react"





export const AddNodeButton = memo(() => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const handleOpen = () => setIsPopoverOpen(true)
    const handleClose = () => setIsPopoverOpen(false)

    return (
        <NodeSelector open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <Button
                onClick={handleOpen}
                size={"icon-lg"}
                variant={"outline"}
                className="bg-background p-6"
            >
                <PlusIcon className="size-6" />
            </Button>
        </NodeSelector>
    )
})

AddNodeButton.displayName = "AddNodeButton"