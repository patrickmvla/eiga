// components/films/Paginator.tsx
import { ButtonLink } from "@/components/ui/ButtonLink";
import { buildQuery } from "./utils";

export const Paginator = ({
  page,
  total,
  perPage,
  basePath = "/films",
  params,
}: {
  page: number;
  total: number;
  perPage: number;
  basePath?: string;
  params: Record<string, string | undefined>;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-xs text-neutral-400">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <ButtonLink
          href={`${basePath}${buildQuery({
            ...params,
            page: prev ? String(prev) : undefined,
          })}`}
          variant="outline"
          size="sm"
          ariaLabel="Previous page"
          className={prev ? "" : "pointer-events-none opacity-40"}
        >
          Prev
        </ButtonLink>
        <ButtonLink
          href={`${basePath}${buildQuery({
            ...params,
            page: next ? String(next) : undefined,
          })}`}
          variant="outline"
          size="sm"
          ariaLabel="Next page"
          className={next ? "" : "pointer-events-none opacity-40"}
        >
          Next
        </ButtonLink>
      </div>
    </div>
  );
};
