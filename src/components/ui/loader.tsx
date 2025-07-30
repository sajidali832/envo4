
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Loader({ className, ...props }: LoaderProps) {
    return (
        <div 
            className={cn("h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent", className)}
            role="status"
            aria-label="loading"
            {...props}
        >
            <span className="sr-only">Loading...</span>
        </div>
    )
}
