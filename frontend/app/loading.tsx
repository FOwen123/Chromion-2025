import { CircularLoader } from "@/components/ui/loader";

export default function Loading() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <CircularLoader />
        </div>
    )
}
